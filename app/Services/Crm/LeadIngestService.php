<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Enquiry;
use App\Models\LeadSource;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

class LeadIngestService
{
    public function __construct(
        private ActivityLogger $logger,
        private AutomationService $automation,
    ) {}

    /**
     * Ingest a normalized lead payload from an external platform.
     *
     * @param  array{name?: string, email?: string|null, phone?: string|null, message?: string|null, external_id?: string|null}  $payload
     */
    public function ingest(Company $company, string $platform, array $payload, array $raw = []): Enquiry
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        $name = trim((string) ($payload['name'] ?? ''));
        $email = isset($payload['email']) ? trim((string) $payload['email']) : null;
        $phone = isset($payload['phone']) ? trim((string) $payload['phone']) : null;
        $message = isset($payload['message']) ? trim((string) $payload['message']) : null;
        $externalId = isset($payload['external_id']) ? (string) $payload['external_id'] : null;

        if ($name === '' && ($email || $phone)) {
            $name = $email ?: $phone;
        }

        if ($name === '') {
            $name = 'Lead from '.str_replace('_', ' ', $platform);
        }

        if ($externalId) {
            $existing = Enquiry::query()
                ->where('company_id', $company->id)
                ->where('platform', $platform)
                ->where('external_id', $externalId)
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        $sourceSlug = config("integrations.platforms.{$platform}.source_slug", $platform);
        $source = $this->resolveSource($company, $sourceSlug, $platform);
        $actor = $this->resolveActor($company);

        return DB::transaction(function () use ($company, $platform, $name, $email, $phone, $message, $externalId, $raw, $source, $actor) {
            $enquiry = Enquiry::create([
                'company_id' => $company->id,
                'name' => $name,
                'email' => $email ?: null,
                'phone' => $phone ?: null,
                'lead_source_id' => $source?->id,
                'channel' => $platform,
                'platform' => $platform,
                'external_id' => $externalId,
                'raw_payload' => $raw ?: null,
                'message' => $message,
                'assigned_user_id' => $actor->id,
                'created_by' => $actor->id,
                'status' => Enquiry::STATUS_NEW,
            ]);

            $this->logger->log('enquiry.ingested', $enquiry, [
                'platform' => $platform,
                'external_id' => $externalId,
            ]);

            $this->automation->runForTrigger('enquiry.created', $company, $enquiry, $actor);

            return $enquiry;
        });
    }

    private function resolveSource(Company $company, string $slug, string $platform): ?LeadSource
    {
        $source = LeadSource::query()
            ->where('company_id', $company->id)
            ->where('slug', $slug)
            ->first();

        if ($source) {
            return $source;
        }

        $label = config("integrations.platforms.{$platform}.name")
            ?? config("industry_packs.source_catalog.{$slug}")
            ?? Str::title(str_replace('_', ' ', $slug));

        return LeadSource::create([
            'company_id' => $company->id,
            'name' => $label,
            'slug' => $slug,
            'is_active' => true,
            'sort_order' => 99,
        ]);
    }

    private function resolveActor(Company $company): User
    {
        $admin = User::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->orderBy('id')
            ->first();

        if (! $admin) {
            abort(422, 'Company has no active users to assign ingested leads.');
        }

        return $admin;
    }
}
