<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\CustomFieldDefinition;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Str;

class SettingsService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateCompany(Company $company, array $data): Company
    {
        $company->update([
            'name' => $data['name'] ?? $company->name,
            'email' => $data['email'] ?? $company->email,
            'phone' => $data['phone'] ?? $company->phone,
            'country' => $data['country'] ?? $company->country,
            'timezone' => $data['timezone'] ?? $company->timezone,
            'currency' => $data['currency'] ?? $company->currency,
            'industry_key' => $data['industry_key'] ?? $company->industry_key,
        ]);

        $this->logger->log('settings.company_updated', $company);

        return $company->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateProviders(Company $company, array $data): Company
    {
        $settings = $company->settings ?? [];
        $providers = $settings['providers'] ?? [];

        $providers['email'] = [
            'driver' => $data['email_driver'] ?? 'log',
            'host' => $data['email_host'] ?? null,
            'port' => $data['email_port'] ?? 587,
            'username' => $data['email_username'] ?? null,
            'password' => $data['email_password'] ?: ($providers['email']['password'] ?? null),
            'encryption' => $data['email_encryption'] ?? 'tls',
            'from_address' => $data['email_from_address'] ?? null,
            'from_name' => $data['email_from_name'] ?? $company->name,
        ];

        $providers['whatsapp'] = [
            'driver' => $data['whatsapp_driver'] ?? 'log',
            'api_token' => $data['whatsapp_api_token'] ?: ($providers['whatsapp']['api_token'] ?? null),
            'phone_number_id' => $data['whatsapp_phone_number_id'] ?? null,
        ];

        $settings['providers'] = $providers;
        $company->update(['settings' => $settings]);

        $this->logger->log('settings.providers_updated', $company);

        return $company->fresh();
    }

    /**
     * @param  array{enabled?: bool, mode?: string, user_ids?: list<int|string>}  $data
     */
    public function updateLeadAssignment(Company $company, array $data): Company
    {
        $company = app(LeadAssignmentService::class)->updateConfig($company, $data);

        $this->logger->log('settings.lead_assignment_updated', $company, [
            'enabled' => (bool) ($data['enabled'] ?? false),
            'mode' => $data['mode'] ?? 'all_active',
        ]);

        return $company;
    }

    /**
     * @return array{enabled: bool, mode: string, user_ids: list<int>, last_assigned_user_id: int|null, last_assigned_name: string|null}
     */
    public function leadAssignmentForUi(Company $company): array
    {
        return app(LeadAssignmentService::class)->forUi($company);
    }

    /**
     * Enable/disable lead sync platforms and rotate webhook secrets.
     *
     * @param  array{platform: string, enabled?: bool, access_token?: string|null, verify_token?: string|null, regenerate_secret?: bool}  $data
     */
    public function updateIntegration(Company $company, array $data): Company
    {
        $platform = $data['platform'];
        $catalog = config("integrations.platforms.{$platform}");
        if (! $catalog) {
            abort(422, 'Unknown platform.');
        }

        $settings = $company->settings ?? [];
        $integrations = $settings['integrations'] ?? [];
        $current = $integrations[$platform] ?? [];

        $secret = $current['webhook_secret'] ?? Str::random(40);
        if (! empty($data['regenerate_secret']) || empty($current['webhook_secret'])) {
            $secret = Str::random(40);
        }

        $integrations[$platform] = [
            'enabled' => (bool) ($data['enabled'] ?? ($current['enabled'] ?? false)),
            'webhook_secret' => $secret,
            'verify_token' => $data['verify_token']
                ?? ($current['verify_token'] ?? Str::random(24)),
            'access_token' => array_key_exists('access_token', $data) && $data['access_token'] !== null && $data['access_token'] !== ''
                ? $data['access_token']
                : ($current['access_token'] ?? null),
            'connected_at' => ! empty($data['enabled'])
                ? ($current['connected_at'] ?? now()->toIso8601String())
                : ($current['connected_at'] ?? null),
        ];

        $settings['integrations'] = $integrations;
        $company->update(['settings' => $settings]);

        $this->logger->log('settings.integration_updated', $company, [
            'platform' => $platform,
            'enabled' => $integrations[$platform]['enabled'],
        ]);

        return $company->fresh();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function integrationsForUi(Company $company): array
    {
        $stored = $company->settings['integrations'] ?? [];
        $metaConnected = (bool) ($stored['meta']['connected'] ?? false);
        $metaPages = [];

        try {
            $metaPages = \App\Models\MetaPage::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('page_name')
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'page_id' => $p->page_id,
                    'page_name' => $p->page_name,
                    'subscribed_leadgen' => $p->subscribed_leadgen,
                    'has_instagram' => filled($p->instagram_business_id),
                ])
                ->values()
                ->all();
        } catch (\Throwable) {
            $metaPages = [];
        }

        $items = [];

        foreach (config('integrations.platforms', []) as $key => $meta) {
            $row = $stored[$key] ?? [];
            $auth = $meta['auth'] ?? 'webhook';
            $secret = $row['webhook_secret'] ?? null;

            $webhookPath = "/webhooks/{$company->uuid}/{$key}";
            if ($key === 'meta') {
                $webhookPath = '/webhooks/meta';
            }

            $items[] = [
                'key' => $key,
                'name' => $meta['name'],
                'description' => $meta['description'],
                'docs' => $meta['docs'] ?? '',
                'icon' => $meta['icon'] ?? $key,
                'auth' => $auth,
                'enabled' => $key === 'meta'
                    ? $metaConnected
                    : (bool) ($row['enabled'] ?? false),
                'webhook_url' => url($webhookPath),
                'webhook_secret' => $auth === 'webhook' ? $secret : null,
                'verify_token' => $row['verify_token'] ?? null,
                'has_access_token' => ! empty($row['access_token']) || ($key === 'meta' && $metaConnected),
                'connected_at' => $key === 'meta'
                    ? ($stored['meta']['connected_at'] ?? null)
                    : ($row['connected_at'] ?? null),
                'meta_pages' => $key === 'meta' ? $metaPages : [],
                'meta_configured' => $key === 'meta'
                    ? (filled(config('services.meta.app_id')) && filled(config('services.meta.app_secret')))
                    : true,
                'connect_url' => $key === 'meta' ? url('/integrations/meta/connect') : null,
                'disconnect_url' => $key === 'meta' ? url('/integrations/meta/disconnect') : null,
            ];
        }

        return $items;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createLeadField(Company $company, array $data): CustomFieldDefinition
    {
        $key = $data['key'] ?? Str::slug($data['name'], '_');
        $maxOrder = CustomFieldDefinition::query()
            ->where('company_id', $company->id)
            ->where('entity', 'lead')
            ->max('sort_order') ?? 0;

        $options = [];
        if (! empty($data['options']) && is_string($data['options'])) {
            $options = array_values(array_filter(array_map('trim', explode(',', $data['options']))));
        } elseif (is_array($data['options'] ?? null)) {
            $options = $data['options'];
        }

        $field = CustomFieldDefinition::create([
            'company_id' => $company->id,
            'entity' => 'lead',
            'name' => $data['name'],
            'key' => $key,
            'type' => $data['type'] ?? 'text',
            'options' => $options ?: null,
            'is_required' => (bool) ($data['is_required'] ?? false),
            'is_system' => false,
            'show_in_list' => (bool) ($data['show_in_list'] ?? false),
            'sort_order' => $maxOrder + 1,
        ]);

        $this->logger->log('settings.lead_field_created', $field);

        return $field;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateLeadField(CustomFieldDefinition $field, array $data): CustomFieldDefinition
    {
        if ($field->is_system) {
            abort(422, 'System fields cannot be edited.');
        }

        $options = $field->options;
        if (array_key_exists('options', $data)) {
            if (is_string($data['options'])) {
                $options = array_values(array_filter(array_map('trim', explode(',', $data['options']))));
            } elseif (is_array($data['options'])) {
                $options = $data['options'];
            } else {
                $options = null;
            }
        }

        $field->update([
            'name' => $data['name'] ?? $field->name,
            'type' => $data['type'] ?? $field->type,
            'options' => ($data['type'] ?? $field->type) === 'select' ? ($options ?: null) : null,
            'is_required' => array_key_exists('is_required', $data)
                ? (bool) $data['is_required']
                : $field->is_required,
            'show_in_list' => array_key_exists('show_in_list', $data)
                ? (bool) $data['show_in_list']
                : $field->show_in_list,
        ]);

        $this->logger->log('settings.lead_field_updated', $field);

        return $field->fresh();
    }

    public function deleteLeadField(CustomFieldDefinition $field): void
    {
        if ($field->is_system) {
            abort(422, 'System fields cannot be deleted.');
        }

        $this->logger->log('settings.lead_field_deleted', $field);
        $field->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createPipelineStage(Company $company, Pipeline $pipeline, array $data): PipelineStage
    {
        $baseSlug = Str::slug($data['name']) ?: 'stage';
        $slug = $baseSlug;
        $i = 2;
        while (
            PipelineStage::withTrashed()
                ->where('pipeline_id', $pipeline->id)
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$i;
            $i++;
        }

        // Insert before Won/Lost so custom stages (e.g. Hold) appear on the open board
        $closedOrder = PipelineStage::query()
            ->where('pipeline_id', $pipeline->id)
            ->where(function ($q) {
                $q->where('is_won', true)->orWhere('is_lost', true);
            })
            ->min('sort_order');

        if ($closedOrder !== null) {
            $sortOrder = (int) $closedOrder;
            PipelineStage::query()
                ->where('pipeline_id', $pipeline->id)
                ->where('sort_order', '>=', $sortOrder)
                ->increment('sort_order');
        } else {
            $sortOrder = (int) (PipelineStage::query()
                ->where('pipeline_id', $pipeline->id)
                ->max('sort_order') ?? 0) + 1;
        }

        $stage = PipelineStage::create([
            'company_id' => $company->id,
            'pipeline_id' => $pipeline->id,
            'name' => $data['name'],
            'slug' => $slug,
            'color' => $data['color'] ?? '#64748b',
            'probability' => (int) ($data['probability'] ?? 0),
            'sort_order' => $sortOrder,
            'is_won' => (bool) ($data['is_won'] ?? false),
            'is_lost' => (bool) ($data['is_lost'] ?? false),
        ]);

        $this->logger->log('settings.pipeline_stage_created', $stage);

        return $stage;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updatePipelineStage(PipelineStage $stage, array $data): PipelineStage
    {
        $updates = [
            'name' => $data['name'] ?? $stage->name,
            'color' => $data['color'] ?? $stage->color,
            'probability' => $data['probability'] ?? $stage->probability,
            'is_won' => array_key_exists('is_won', $data) ? (bool) $data['is_won'] : $stage->is_won,
            'is_lost' => array_key_exists('is_lost', $data) ? (bool) $data['is_lost'] : $stage->is_lost,
            'sort_order' => $data['sort_order'] ?? $stage->sort_order,
        ];

        if (! empty($data['name']) && $data['name'] !== $stage->name) {
            $baseSlug = Str::slug($data['name']) ?: $stage->slug;
            $slug = $baseSlug;
            $i = 2;
            while (
                PipelineStage::withTrashed()
                    ->where('pipeline_id', $stage->pipeline_id)
                    ->where('slug', $slug)
                    ->where('id', '!=', $stage->id)
                    ->exists()
            ) {
                $slug = $baseSlug.'-'.$i;
                $i++;
            }
            $updates['slug'] = $slug;
        }

        $stage->update($updates);

        $this->logger->log('settings.pipeline_stage_updated', $stage);

        return $stage->fresh();
    }

    public function deletePipelineStage(PipelineStage $stage, ?int $reassignToStageId = null): void
    {
        $dealCount = $stage->deals()->count();

        if ($dealCount > 0) {
            $targetId = $reassignToStageId;

            if (! $targetId) {
                $targetId = PipelineStage::query()
                    ->where('pipeline_id', $stage->pipeline_id)
                    ->where('id', '!=', $stage->id)
                    ->orderBy('sort_order')
                    ->value('id');
            }

            if (! $targetId) {
                abort(422, 'Cannot delete the last stage while it still has deals.');
            }

            $target = PipelineStage::query()->find($targetId);
            if (! $target || $target->pipeline_id !== $stage->pipeline_id) {
                abort(422, 'Choose another stage in the same pipeline to move deals into.');
            }

            $stage->deals()->update(['pipeline_stage_id' => $target->id]);
        }

        $this->logger->log('settings.pipeline_stage_deleted', $stage, [
            'reassigned_deals' => $dealCount,
            'reassign_to' => $reassignToStageId,
        ]);
        $stage->delete();
    }

    /**
     * Move open custom stages (e.g. Hold) before Won/Lost so they show on the board.
     */
    public function ensureOpenStagesBeforeClosed(Pipeline $pipeline): void
    {
        $stages = PipelineStage::query()
            ->where('pipeline_id', $pipeline->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($stages->isEmpty()) {
            return;
        }

        $open = $stages->filter(fn (PipelineStage $s) => ! $s->is_won && ! $s->is_lost)->values();
        $closed = $stages->filter(fn (PipelineStage $s) => $s->is_won || $s->is_lost)->values();

        if ($closed->isEmpty()) {
            return;
        }

        $firstClosedOrder = (int) $closed->min('sort_order');
        $needsReorder = $open->contains(fn (PipelineStage $s) => (int) $s->sort_order > $firstClosedOrder);

        if (! $needsReorder) {
            return;
        }

        $order = 1;
        foreach ($open->concat($closed) as $stage) {
            if ((int) $stage->sort_order !== $order) {
                $stage->update(['sort_order' => $order]);
            }
            $order++;
        }
    }
}
