<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\MetaPage;
use App\Services\Crm\LeadIngestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class LeadWebhookController extends Controller
{
    /**
     * Global Meta app webhook verification (one URL for all SaaS tenants).
     */
    public function verifyMetaApp(Request $request): Response|JsonResponse
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');
        $expected = config('services.meta.webhook_verify_token');

        if ($mode === 'subscribe' && $expected && hash_equals((string) $expected, (string) $token)) {
            return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Verification failed'], 403);
    }

    /**
     * Global Meta leadgen webhook — routes to the company that owns the Page.
     */
    public function metaApp(Request $request, LeadIngestService $ingest): JsonResponse
    {
        $created = 0;

        foreach ($request->input('entry', []) as $entry) {
            $pageId = (string) ($entry['id'] ?? '');

            foreach (Arr::get($entry, 'changes', []) as $change) {
                if (($change['field'] ?? '') !== 'leadgen') {
                    continue;
                }

                $value = $change['value'] ?? [];
                $pageId = (string) ($value['page_id'] ?? $pageId);
                $leadgenId = (string) ($value['leadgen_id'] ?? '');

                if ($pageId === '' || $leadgenId === '') {
                    continue;
                }

                $metaPage = MetaPage::query()
                    ->where('page_id', $pageId)
                    ->where('is_active', true)
                    ->with('company')
                    ->first();

                if (! $metaPage || ! $metaPage->company) {
                    Log::info('Meta leadgen for unknown page', ['page_id' => $pageId]);

                    continue;
                }

                $company = $metaPage->company;
                $mapped = $this->fetchMetaLead($metaPage, $leadgenId) ?? [
                    'name' => 'Facebook Lead',
                    'email' => null,
                    'phone' => null,
                    'message' => 'Lead form submission from Meta',
                    'external_id' => $leadgenId,
                ];

                $platform = $metaPage->instagram_business_id ? 'instagram' : 'facebook_ads';
                // Prefer facebook_ads source; Instagram forms still map via platform field
                if (! empty($value['partner_name']) && str_contains(strtolower((string) $value['partner_name']), 'instagram')) {
                    $platform = 'instagram';
                }

                $ingest->ingest($company, $platform, $mapped, [
                    'page_id' => $pageId,
                    'leadgen' => $value,
                ]);
                $created++;
            }
        }

        return response()->json(['ok' => true, 'created' => $created]);
    }

    /**
     * Legacy per-company Meta webhook (still supported).
     */
    public function verifyMeta(Request $request, string $companyUuid): Response|JsonResponse
    {
        $company = $this->findCompany($companyUuid);
        $config = $this->platformConfig($company, 'facebook_ads');

        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $expected = $config['verify_token']
            ?? config('services.meta.webhook_verify_token');

        if ($mode === 'subscribe' && $expected && hash_equals((string) $expected, (string) $token)) {
            return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Verification failed'], 403);
    }

    public function meta(Request $request, string $companyUuid, LeadIngestService $ingest): JsonResponse
    {
        // Prefer global routing; still accept posts to company URL
        return $this->metaApp($request, $ingest);
    }

    /**
     * Generic platform webhook: google_ads, website, zapier, whatsapp, etc.
     */
    public function ingest(Request $request, string $companyUuid, string $platform, LeadIngestService $ingest): JsonResponse
    {
        if (! array_key_exists($platform, config('integrations.platforms', []))) {
            return response()->json(['error' => 'Unknown platform'], 404);
        }

        // "meta" uses OAuth, not this generic webhook
        if ($platform === 'meta') {
            return response()->json(['error' => 'Use Meta OAuth connect + /webhooks/meta'], 400);
        }

        $company = $this->findCompany($companyUuid);
        $this->assertEnabled($company, $platform);
        $this->assertSecret($request, $company, $platform);

        $payload = $this->normalizeGeneric($request->all());
        $enquiry = $ingest->ingest($company, $platform, $payload, $request->all());

        return response()->json([
            'ok' => true,
            'enquiry_id' => $enquiry->id,
            'uuid' => $enquiry->uuid,
        ], 201);
    }

    private function findCompany(string $uuid): Company
    {
        return Company::query()->where('uuid', $uuid)->where('is_active', true)->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function platformConfig(Company $company, string $platform): array
    {
        return $company->settings['integrations'][$platform] ?? [];
    }

    private function assertEnabled(Company $company, string $platform): void
    {
        $config = $this->platformConfig($company, $platform);
        if (empty($config['enabled'])) {
            abort(403, 'Integration is disabled for this company.');
        }
    }

    private function assertSecret(Request $request, Company $company, string $platform): void
    {
        $config = $this->platformConfig($company, $platform);
        $secret = $config['webhook_secret'] ?? null;
        if (! $secret) {
            return;
        }

        $provided = $request->header('X-Webhook-Secret')
            ?? $request->query('secret')
            ?? $request->input('secret');

        if (! is_string($provided) || ! hash_equals($secret, $provided)) {
            abort(401, 'Invalid webhook secret.');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{name?: string|null, email?: string|null, phone?: string|null, message?: string|null, external_id?: string|null}
     */
    private function normalizeGeneric(array $data): array
    {
        $name = $data['name'] ?? $data['full_name'] ?? null;
        if (! $name) {
            $combined = trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));
            $name = $combined !== '' ? $combined : null;
        }

        return [
            'name' => $name ? trim((string) $name) : null,
            'email' => $data['email'] ?? $data['email_address'] ?? null,
            'phone' => $data['phone'] ?? $data['phone_number'] ?? $data['mobile'] ?? null,
            'message' => $data['message'] ?? $data['notes'] ?? $data['comment'] ?? null,
            'external_id' => isset($data['external_id'])
                ? (string) $data['external_id']
                : (isset($data['id']) ? (string) $data['id'] : (isset($data['lead_id']) ? (string) $data['lead_id'] : null)),
        ];
    }

    /**
     * @return array{name?: string, email?: string|null, phone?: string|null, message?: string|null, external_id: string}|null
     */
    private function fetchMetaLead(MetaPage $page, string $leadgenId): ?array
    {
        $version = config('services.meta.graph_version', 'v19.0');
        $token = $page->page_access_token;

        try {
            $response = Http::timeout(15)->get("https://graph.facebook.com/{$version}/{$leadgenId}", [
                'access_token' => $token,
                'fields' => 'created_time,field_data',
            ]);

            if (! $response->successful()) {
                Log::warning('Meta lead fetch failed', [
                    'leadgen_id' => $leadgenId,
                    'status' => $response->status(),
                ]);

                return [
                    'name' => 'Facebook Lead',
                    'email' => null,
                    'phone' => null,
                    'message' => 'Leadgen '.$leadgenId,
                    'external_id' => $leadgenId,
                ];
            }

            $fields = collect($response->json('field_data', []));
            $get = function (array $keys) use ($fields) {
                foreach ($keys as $key) {
                    $match = $fields->first(fn ($f) => strtolower((string) ($f['name'] ?? '')) === $key);
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
                'external_id' => $leadgenId,
            ];
        } catch (Throwable $e) {
            Log::warning('Meta lead fetch exception', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
