<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Company;
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
     * Meta (Facebook / Instagram) webhook verification (GET).
     */
    public function verifyMeta(Request $request, string $companyUuid): Response|JsonResponse
    {
        $company = $this->findCompany($companyUuid);
        $config = $this->platformConfig($company, 'facebook_ads');

        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $expected = $config['verify_token'] ?? $config['webhook_secret'] ?? null;

        if ($mode === 'subscribe' && $expected && hash_equals((string) $expected, (string) $token)) {
            return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Verification failed'], 403);
    }

    /**
     * Meta Lead Ads webhook (POST) — stores leadgen notifications / field data.
     */
    public function meta(Request $request, string $companyUuid, LeadIngestService $ingest): JsonResponse
    {
        $company = $this->findCompany($companyUuid);
        $this->assertEnabled($company, 'facebook_ads');
        $this->assertSecret($request, $company, 'facebook_ads');

        $entries = $request->input('entry', []);
        $created = 0;

        foreach ($entries as $entry) {
            foreach (Arr::get($entry, 'changes', []) as $change) {
                if (($change['field'] ?? '') !== 'leadgen') {
                    continue;
                }

                $value = $change['value'] ?? [];
                $leadgenId = (string) ($value['leadgen_id'] ?? '');
                if ($leadgenId === '') {
                    continue;
                }

                $mapped = $this->fetchMetaLead($company, $leadgenId)
                    ?? [
                        'name' => 'Facebook Lead',
                        'email' => null,
                        'phone' => $value['phone_number'] ?? null,
                        'message' => 'Lead form submission from Facebook/Instagram',
                        'external_id' => $leadgenId,
                    ];

                $platform = str_contains(strtolower((string) ($value['partner_name'] ?? '')), 'instagram')
                    ? 'instagram'
                    : 'facebook_ads';

                if ($platform === 'instagram') {
                    $this->assertEnabled($company, 'instagram');
                }

                $ingest->ingest($company, $platform, $mapped, $request->all());
                $created++;
            }
        }

        // Also accept direct JSON lead posts (Zapier → Meta style)
        if ($created === 0 && ($request->filled('name') || $request->filled('email') || $request->filled('phone'))) {
            $ingest->ingest($company, 'facebook_ads', $this->normalizeGeneric($request->all()), $request->all());
            $created = 1;
        }

        return response()->json(['ok' => true, 'created' => $created]);
    }

    /**
     * Generic platform webhook: google_ads, website, zapier, whatsapp, instagram.
     */
    public function ingest(Request $request, string $companyUuid, string $platform, LeadIngestService $ingest): JsonResponse
    {
        if (! array_key_exists($platform, config('integrations.platforms', []))) {
            return response()->json(['error' => 'Unknown platform'], 404);
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
     * @return array{name?: string, email?: string|null, phone?: string|null, message?: string|null, external_id?: string|null}
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
    private function fetchMetaLead(Company $company, string $leadgenId): ?array
    {
        $token = $company->settings['integrations']['facebook_ads']['access_token']
            ?? $company->settings['providers']['whatsapp']['api_token']
            ?? null;

        if (! $token) {
            return [
                'name' => 'Facebook Lead',
                'email' => null,
                'phone' => null,
                'message' => 'Leadgen ID '.$leadgenId.' (add Meta access token to fetch full fields)',
                'external_id' => $leadgenId,
            ];
        }

        try {
            $response = Http::timeout(15)->get("https://graph.facebook.com/v19.0/{$leadgenId}", [
                'access_token' => $token,
                'fields' => 'created_time,field_data',
            ]);

            if (! $response->successful()) {
                Log::warning('Meta lead fetch failed', [
                    'leadgen_id' => $leadgenId,
                    'status' => $response->status(),
                ]);

                return null;
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
