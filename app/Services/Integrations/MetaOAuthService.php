<?php

namespace App\Services\Integrations;

use App\Models\Company;
use App\Models\MetaPage;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class MetaOAuthService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    public function isConfigured(): bool
    {
        return filled(config('services.meta.app_id'))
            && filled(config('services.meta.app_secret'));
    }

    public function redirectUri(): string
    {
        return config('services.meta.redirect_uri')
            ?: url('/integrations/meta/callback');
    }

    /**
     * Build Facebook OAuth dialog URL for this company.
     */
    public function authorizationUrl(Company $company, string $state): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Meta app is not configured. Set META_APP_ID and META_APP_SECRET.');
        }

        $version = config('services.meta.graph_version', 'v19.0');
        $scopes = implode(',', config('services.meta.scopes', []));

        return 'https://www.facebook.com/'.$version.'/dialog/oauth?'.http_build_query([
            'client_id' => config('services.meta.app_id'),
            'redirect_uri' => $this->redirectUri(),
            'state' => $state,
            'scope' => $scopes,
            'response_type' => 'code',
        ]);
    }

    /**
     * Exchange code → long-lived user token → pages → store per company.
     *
     * @return list<MetaPage>
     */
    public function handleCallback(Company $company, string $code): array
    {
        $shortLived = $this->exchangeCode($code);
        $longLived = $this->exchangeLongLived($shortLived);
        $pages = $this->fetchPages($longLived);

        $settings = $company->settings ?? [];
        $settings['integrations']['meta'] = [
            'connected' => true,
            'connected_at' => now()->toIso8601String(),
            'enabled' => true,
        ];
        // Keep facebook_ads / instagram enabled flags for source mapping UX
        $settings['integrations']['facebook_ads'] = array_merge(
            $settings['integrations']['facebook_ads'] ?? [],
            ['enabled' => true, 'connected_at' => now()->toIso8601String()]
        );
        $settings['integrations']['instagram'] = array_merge(
            $settings['integrations']['instagram'] ?? [],
            ['enabled' => true, 'connected_at' => now()->toIso8601String()]
        );
        $company->update(['settings' => $settings]);

        $saved = [];
        foreach ($pages as $page) {
            $pageId = (string) ($page['id'] ?? '');
            if ($pageId === '') {
                continue;
            }

            // If another company owns this page, release it (last connect wins for SaaS demo;
            // production may prefer conflict error).
            MetaPage::query()->where('page_id', $pageId)->where('company_id', '!=', $company->id)->delete();

            $model = MetaPage::query()->updateOrCreate(
                [
                    'company_id' => $company->id,
                    'page_id' => $pageId,
                ],
                [
                    'page_name' => $page['name'] ?? 'Facebook Page',
                    'page_access_token' => $page['access_token'] ?? $longLived,
                    'instagram_business_id' => $page['instagram_business_account']['id'] ?? null,
                    'is_active' => true,
                ]
            );

            try {
                $this->subscribeLeadgen($model);
                $model->update(['subscribed_leadgen' => true]);
            } catch (Throwable $e) {
                Log::warning('Meta leadgen subscribe failed', [
                    'page_id' => $pageId,
                    'error' => $e->getMessage(),
                ]);
            }

            $saved[] = $model->fresh();
        }

        $this->logger->log('integrations.meta_connected', $company, [
            'pages' => count($saved),
        ]);

        return $saved;
    }

    public function disconnect(Company $company): void
    {
        MetaPage::query()->where('company_id', $company->id)->delete();

        $settings = $company->settings ?? [];
        $settings['integrations']['meta'] = [
            'connected' => false,
            'enabled' => false,
            'disconnected_at' => now()->toIso8601String(),
        ];
        $settings['integrations']['facebook_ads']['enabled'] = false;
        $settings['integrations']['instagram']['enabled'] = false;
        $company->update(['settings' => $settings]);

        $this->logger->log('integrations.meta_disconnected', $company);
    }

    public function subscribeLeadgen(MetaPage $page): void
    {
        $version = config('services.meta.graph_version', 'v19.0');

        $response = Http::asForm()->post(
            "https://graph.facebook.com/{$version}/{$page->page_id}/subscribed_apps",
            [
                'subscribed_fields' => 'leadgen',
                'access_token' => $page->page_access_token,
            ]
        );

        if (! $response->successful()) {
            throw new RuntimeException('Subscribe failed: '.$response->body());
        }
    }

    /**
     * @return array{access_token: string}
     */
    private function exchangeCode(string $code): string
    {
        $version = config('services.meta.graph_version', 'v19.0');
        $response = Http::get("https://graph.facebook.com/{$version}/oauth/access_token", [
            'client_id' => config('services.meta.app_id'),
            'client_secret' => config('services.meta.app_secret'),
            'redirect_uri' => $this->redirectUri(),
            'code' => $code,
        ]);

        if (! $response->successful() || ! $response->json('access_token')) {
            throw new RuntimeException('Meta token exchange failed: '.$response->body());
        }

        return (string) $response->json('access_token');
    }

    private function exchangeLongLived(string $shortLivedToken): string
    {
        $version = config('services.meta.graph_version', 'v19.0');
        $response = Http::get("https://graph.facebook.com/{$version}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => config('services.meta.app_id'),
            'client_secret' => config('services.meta.app_secret'),
            'fb_exchange_token' => $shortLivedToken,
        ]);

        if (! $response->successful() || ! $response->json('access_token')) {
            // Fall back to short-lived if exchange fails
            Log::warning('Meta long-lived exchange failed', ['body' => $response->body()]);

            return $shortLivedToken;
        }

        return (string) $response->json('access_token');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function fetchPages(string $userToken): array
    {
        $version = config('services.meta.graph_version', 'v19.0');
        $response = Http::get("https://graph.facebook.com/{$version}/me/accounts", [
            'access_token' => $userToken,
            'fields' => 'id,name,access_token,instagram_business_account',
            'limit' => 100,
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Failed to fetch Facebook Pages: '.$response->body());
        }

        return $response->json('data', []);
    }

    public function makeState(Company $company): string
    {
        return encrypt([
            'company_id' => $company->id,
            'nonce' => Str::random(16),
            'exp' => now()->addMinutes(15)->timestamp,
        ]);
    }

    public function parseState(string $state): int
    {
        try {
            $payload = decrypt($state);
        } catch (Throwable) {
            throw new RuntimeException('Invalid OAuth state.');
        }

        if (! is_array($payload)
            || empty($payload['company_id'])
            || empty($payload['exp'])
            || $payload['exp'] < now()->timestamp) {
            throw new RuntimeException('OAuth state expired. Try connecting again.');
        }

        return (int) $payload['company_id'];
    }
}
