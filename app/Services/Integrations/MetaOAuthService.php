<?php

namespace App\Services\Integrations;

use App\Models\Company;
use App\Models\MetaPage;
use App\Services\Crm\LeadIngestService;
use App\Services\Tenant\ActivityLogger;
use Carbon\Carbon;
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
     *
     * Prefer Facebook Login for Business via META_LOGIN_CONFIG_ID so lead/page
     * business permissions are valid. Classic scope-based Login rejects many of
     * those scopes with "Invalid Scopes" for developers.
     */
    public function authorizationUrl(Company $company, string $state): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Meta app is not configured. Set META_APP_ID and META_APP_SECRET.');
        }

        $version = config('services.meta.graph_version', 'v21.0');
        $configId = config('services.meta.login_config_id');

        $params = [
            'client_id' => config('services.meta.app_id'),
            'redirect_uri' => $this->redirectUri(),
            'state' => $state,
            'response_type' => 'code',
        ];

        if (filled($configId)) {
            $params['config_id'] = $configId;
            // Ensure authorization-code flow for Login for Business configs.
            $params['override_default_response_type'] = 'true';
        } else {
            $scopes = implode(',', config('services.meta.scopes', []));
            $params['scope'] = $scopes;
        }

        return 'https://www.facebook.com/'.$version.'/dialog/oauth?'.http_build_query($params);
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

            $missing = $this->missingLeadSyncScopes($model->page_access_token);
            if ($missing !== []) {
                Log::warning('Meta page token missing lead sync permissions', [
                    'page_id' => $pageId,
                    'missing' => $missing,
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

    /**
     * Permissions required to list lead forms and bulk-sync existing leads.
     *
     * @return list<string>
     */
    public function requiredLeadSyncScopes(): array
    {
        return ['pages_manage_ads', 'leads_retrieval'];
    }

    /**
     * @return list<string> Missing scope names (empty = OK).
     */
    public function missingLeadSyncScopes(string $accessToken): array
    {
        $granted = $this->tokenScopes($accessToken);

        if ($granted === []) {
            return [];
        }

        return array_values(array_diff($this->requiredLeadSyncScopes(), $granted));
    }

    public function leadSyncPermissionError(?array $missing = null): string
    {
        $missing = $missing ?? $this->requiredLeadSyncScopes();
        $list = implode(', ', $missing);

        return 'Missing Meta permission'.(count($missing) === 1 ? '' : 's').": {$list}. "
            .'Disconnect Meta in Integrations, then connect again with a Facebook user who is a Page admin '
            .'and can manage Lead Ads on that Page. In Meta App Dashboard → Facebook Login for Business → '
            .'Configurations, include pages_manage_ads and leads_retrieval, then complete App Review '
            .'(Advanced Access) for those permissions.';
    }

    public function syncExistingLeads(Company $company, LeadIngestService $ingest, int $days = 30): int
    {
        $created = 0;
        $since = now()->subDays(max(1, $days))->startOfDay();

        $pages = MetaPage::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->get();

        if ($pages->isEmpty()) {
            throw new RuntimeException('No connected Facebook Pages found. Connect Meta first.');
        }

        foreach ($pages as $page) {
            $missing = $this->missingLeadSyncScopes($page->page_access_token);
            if ($missing !== []) {
                throw new RuntimeException($this->leadSyncPermissionError($missing));
            }

            foreach ($this->fetchPageLeads($page, $since) as $lead) {
                $platform = $page->instagram_business_id ? 'instagram' : 'facebook_ads';
                $enquiry = $ingest->ingest($company, $platform, $lead, [
                    'page_id' => $page->page_id,
                    'synced_existing' => true,
                ]);

                if ($enquiry->wasRecentlyCreated) {
                    $created++;
                }
            }
        }

        $this->logger->log('integrations.meta_existing_synced', $company, [
            'created' => $created,
            'days' => $days,
        ]);

        return $created;
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

    /**
     * @return list<array{name: string, email?: string|null, phone?: string|null, message?: string|null, external_id: string}>
     */
    private function fetchPageLeads(MetaPage $page, Carbon $since): array
    {
        $version = config('services.meta.graph_version', 'v19.0');
        $response = Http::timeout(30)->get(
            "https://graph.facebook.com/{$version}/{$page->page_id}/leadgen_forms",
            [
                'access_token' => $page->page_access_token,
                'fields' => 'id,name,leads.limit(100){id,created_time,field_data}',
                'limit' => 100,
            ]
        );

        if (! $response->successful()) {
            $error = $response->json('error.message', '');
            if (is_string($error) && str_contains($error, 'pages_manage_ads')) {
                throw new RuntimeException($this->leadSyncPermissionError(['pages_manage_ads']));
            }

            throw new RuntimeException('Failed to fetch Meta lead forms: '.$response->body());
        }

        $forms = $response->json('data', []);
        $rows = [];

        foreach ($forms as $form) {
            foreach (($form['leads']['data'] ?? []) as $lead) {
                $createdAt = isset($lead['created_time']) ? Carbon::parse($lead['created_time']) : null;
                if ($createdAt && $createdAt->lt($since)) {
                    continue;
                }

                $mapped = $this->mapFieldDataToLead($lead['field_data'] ?? [], (string) ($lead['id'] ?? ''));
                if ($mapped !== null) {
                    $rows[] = $mapped;
                }
            }
        }

        return $rows;
    }

    /**
     * @param  list<array<string, mixed>>  $fields
     * @return array{name: string, email?: string|null, phone?: string|null, message?: string|null, external_id: string}|null
     */
    private function mapFieldDataToLead(array $fields, string $leadId): ?array
    {
        if ($leadId === '') {
            return null;
        }

        $collection = collect($fields);
        $get = function (array $keys) use ($collection) {
            foreach ($keys as $key) {
                $match = $collection->first(
                    fn ($f) => strtolower((string) ($f['name'] ?? '')) === $key
                );
                if ($match) {
                    return $match['values'][0] ?? null;
                }
            }

            return null;
        };

        $fullName = $get(['full_name', 'name'])
            ?: trim(($get(['first_name']) ?? '').' '.($get(['last_name']) ?? ''));

        return [
            'name' => $fullName ?: 'Facebook Lead',
            'email' => $get(['email', 'email_address']),
            'phone' => $get(['phone_number', 'phone', 'mobile']),
            'message' => $get(['message', 'notes', 'comments']),
            'external_id' => $leadId,
        ];
    }

    /**
     * @return list<string>
     */
    private function tokenScopes(string $accessToken): array
    {
        $version = config('services.meta.graph_version', 'v21.0');
        $appId = config('services.meta.app_id');
        $appSecret = config('services.meta.app_secret');

        if (! filled($appId) || ! filled($appSecret)) {
            return [];
        }

        $response = Http::timeout(15)->get("https://graph.facebook.com/{$version}/debug_token", [
            'input_token' => $accessToken,
            'access_token' => $appId.'|'.$appSecret,
        ]);

        if (! $response->successful()) {
            Log::warning('Meta debug_token failed', ['body' => $response->body()]);

            return [];
        }

        $data = $response->json('data', []);
        if (! is_array($data)) {
            return [];
        }

        if (! empty($data['granular_scopes']) && is_array($data['granular_scopes'])) {
            return collect($data['granular_scopes'])
                ->pluck('scope')
                ->filter(fn ($scope) => is_string($scope) && $scope !== '')
                ->unique()
                ->values()
                ->all();
        }

        $scopes = $data['scopes'] ?? [];

        return is_array($scopes)
            ? array_values(array_filter($scopes, fn ($scope) => is_string($scope) && $scope !== ''))
            : [];
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
