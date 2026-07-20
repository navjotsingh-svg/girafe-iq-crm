<?php

namespace App\Services\Onboarding;

use App\Models\Company;
use App\Models\CustomFieldDefinition;
use App\Models\DashboardWidget;
use App\Models\LeadSource;
use App\Models\LeadStatus;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\TaskType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class IndustryPackService
{
    /**
     * Apply industry pack: statuses, fields, pipeline, task types, widgets, tenant roles.
     *
     * @param  list<string>  $selectedSourceSlugs
     */
    public function apply(Company $company, array $selectedSourceSlugs = []): void
    {
        DB::transaction(function () use ($company, $selectedSourceSlugs) {
            $packKey = $this->resolvePackKey($company->industry_key);
            $pack = config("industry_packs.packs.{$packKey}", config('industry_packs.packs.general'));
            $common = config('industry_packs.common', []);

            $this->seedSources($company, $selectedSourceSlugs);
            $this->seedStatuses($company, $pack['statuses'] ?? []);
            $this->seedLeadFields($company, array_merge(
                $common['lead_fields'] ?? [],
                $pack['lead_fields'] ?? []
            ));
            $this->seedPipeline($company, $pack['pipeline'] ?? []);
            $this->seedTaskTypes($company, $common['task_types'] ?? []);
            $this->seedWidgets($company, $common['widgets'] ?? []);
            $this->seedTenantRoles($company);
        });
    }

    public function resolvePackKey(string $industryKey): string
    {
        $packs = config('industry_packs.packs', []);

        if (isset($packs[$industryKey])) {
            return $industryKey;
        }

        // Use healthcare pack for hospitals when no dedicated pack exists.
        if ($industryKey === 'hospital' && isset($packs['healthcare'])) {
            return 'healthcare';
        }

        if ($industryKey === 'custom') {
            return config('industry_packs.fallback', 'general');
        }

        return config('industry_packs.fallback', 'general');
    }

    /**
     * @param  list<string>  $selectedSourceSlugs
     */
    private function seedSources(Company $company, array $selectedSourceSlugs): void
    {
        $catalog = config('industry_packs.source_catalog', []);
        $slugs = $selectedSourceSlugs ?: array_keys($catalog);

        foreach (array_values($slugs) as $i => $slug) {
            $name = $catalog[$slug] ?? Str::title(str_replace('_', ' ', $slug));
            LeadSource::withoutGlobalScopes()->updateOrCreate(
                ['company_id' => $company->id, 'slug' => $slug],
                [
                    'name' => $name,
                    'is_active' => true,
                    'sort_order' => $i + 1,
                ]
            );
        }
    }

    private function seedStatuses(Company $company, array $statuses): void
    {
        foreach (array_values($statuses) as $i => $status) {
            LeadStatus::withoutGlobalScopes()->updateOrCreate(
                ['company_id' => $company->id, 'slug' => $status['slug']],
                [
                    'name' => $status['name'],
                    'color' => $status['color'] ?? '#64748b',
                    'sort_order' => $i + 1,
                    'is_won' => (bool) ($status['is_won'] ?? false),
                    'is_lost' => (bool) ($status['is_lost'] ?? false),
                    'is_default' => (bool) ($status['is_default'] ?? false),
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedLeadFields(Company $company, array $fields): void
    {
        $seen = [];
        foreach (array_values($fields) as $i => $field) {
            $key = $field['key'];
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            CustomFieldDefinition::withoutGlobalScopes()->updateOrCreate(
                [
                    'company_id' => $company->id,
                    'entity' => 'lead',
                    'key' => $key,
                ],
                [
                    'name' => $field['name'],
                    'type' => $field['type'] ?? 'text',
                    'options' => $field['options'] ?? null,
                    'is_required' => (bool) ($field['is_required'] ?? false),
                    'is_system' => true,
                    'show_in_list' => (bool) ($field['show_in_list'] ?? false),
                    'sort_order' => $i + 1,
                ]
            );
        }
    }

    private function seedPipeline(Company $company, array $pipeline): void
    {
        if ($pipeline === []) {
            return;
        }

        $slug = Str::slug($pipeline['name'] ?? 'sales-pipeline');
        $pipe = Pipeline::withoutGlobalScopes()->updateOrCreate(
            ['company_id' => $company->id, 'slug' => $slug],
            [
                'name' => $pipeline['name'] ?? 'Sales Pipeline',
                'is_default' => true,
                'is_active' => true,
            ]
        );

        foreach (array_values($pipeline['stages'] ?? []) as $i => $stage) {
            PipelineStage::withoutGlobalScopes()->updateOrCreate(
                [
                    'company_id' => $company->id,
                    'pipeline_id' => $pipe->id,
                    'slug' => $stage['slug'],
                ],
                [
                    'name' => $stage['name'],
                    'color' => $stage['color'] ?? '#64748b',
                    'probability' => (int) ($stage['probability'] ?? 0),
                    'sort_order' => $i + 1,
                    'is_won' => (bool) ($stage['is_won'] ?? false),
                    'is_lost' => (bool) ($stage['is_lost'] ?? false),
                ]
            );
        }
    }

    private function seedTaskTypes(Company $company, array $types): void
    {
        foreach (array_values($types) as $i => $type) {
            TaskType::withoutGlobalScopes()->updateOrCreate(
                ['company_id' => $company->id, 'slug' => $type['slug']],
                [
                    'name' => $type['name'],
                    'icon' => $type['icon'] ?? null,
                    'color' => $type['color'] ?? '#64748b',
                    'is_active' => true,
                    'sort_order' => $i + 1,
                ]
            );
        }
    }

    private function seedWidgets(Company $company, array $widgets): void
    {
        foreach (array_values($widgets) as $i => $widget) {
            DashboardWidget::withoutGlobalScopes()->updateOrCreate(
                ['company_id' => $company->id, 'key' => $widget['key']],
                [
                    'label' => $widget['label'],
                    'is_enabled' => true,
                    'sort_order' => $i + 1,
                ]
            );
        }
    }

    private function seedTenantRoles(Company $company): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $allPermissions = $this->ensurePermissionsExist();

        foreach (config('permissions.roles') as $roleName) {
            if ($roleName === 'super_admin') {
                continue;
            }

            $role = Role::findOrCreate($roleName, 'web');

            if (in_array($roleName, ['company_admin', 'manager'], true)) {
                $role->syncPermissions($allPermissions);
            } elseif ($roleName === 'viewer') {
                $role->syncPermissions(
                    $allPermissions->filter(fn (Permission $p) => str_ends_with($p->name, '.view'))
                );
            } elseif ($roleName === 'sales_executive') {
                $role->syncPermissions($this->permissionsByName([
                    'dashboard.view',
                    'enquiries.view', 'enquiries.create', 'enquiries.update', 'enquiries.convert',
                    'leads.view', 'leads.create', 'leads.update',
                    'pipeline.view', 'deals.view', 'deals.create', 'deals.update',
                    'customers.view',
                    'tasks.view', 'tasks.create', 'tasks.update',
                    'calendar.view',
                    'documents.view',
                ], $allPermissions));
            } elseif ($roleName === 'sales_manager') {
                $role->syncPermissions($this->permissionsByName([
                    'dashboard.view',
                    'enquiries.view', 'enquiries.create', 'enquiries.update', 'enquiries.convert',
                    'leads.view', 'leads.create', 'leads.update', 'leads.assign', 'leads.merge',
                    'pipeline.view', 'pipeline.manage', 'deals.view', 'deals.create', 'deals.update', 'deals.delete',
                    'customers.view', 'customers.create', 'customers.update',
                    'tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete',
                    'calendar.view', 'calendar.manage',
                    'team.view',
                    'reports.view', 'reports.export',
                    'documents.view', 'documents.manage',
                ], $allPermissions));
            } elseif ($roleName === 'marketing') {
                $role->syncPermissions($this->permissionsByName([
                    'dashboard.view',
                    'leads.view', 'leads.create',
                    'campaigns.view', 'campaigns.manage',
                    'email.view', 'email.manage',
                    'whatsapp.view',
                    'reports.view',
                ], $allPermissions));
            } elseif ($roleName === 'support') {
                $role->syncPermissions($this->permissionsByName([
                    'dashboard.view',
                    'customers.view', 'customers.update',
                    'tasks.view', 'tasks.create', 'tasks.update',
                    'documents.view',
                ], $allPermissions));
            }
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, Permission>
     */
    private function ensurePermissionsExist()
    {
        foreach (config('permissions.permissions', []) as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        return Permission::query()->where('guard_name', 'web')->get();
    }

    /**
     * @param  list<string>  $names
     * @param  \Illuminate\Support\Collection<int, Permission>  $all
     * @return \Illuminate\Support\Collection<int, Permission>
     */
    private function permissionsByName(array $names, $all)
    {
        return $all->whereIn('name', $names)->values();
    }
}
