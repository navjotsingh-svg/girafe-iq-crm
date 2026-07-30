<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionService
{
    public function __construct(
        private ActivityLogger $logger,
    ) {}

    /**
     * Seed default Spatie role permissions (shared templates). Safe for all companies.
     */
    public function seedDefaultRoleTemplates(bool $force = false): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $allPermissions = $this->ensurePermissionsExist();
        $adminOnly = config('permissions.admin_only', []);
        $grants = config('permissions.role_grants', []);

        foreach (config('permissions.roles', []) as $roleName) {
            $role = Role::findOrCreate($roleName, 'web');
            $isAdminRole = in_array($roleName, ['company_admin', 'manager', 'super_admin'], true);

            // Keep existing staff templates unless forcing; always refresh admin roles
            if (! $force && ! $isAdminRole && $role->permissions()->count() > 0) {
                continue;
            }

            $grant = array_key_exists($roleName, $grants) ? $grants[$roleName] : [];

            if ($grant === null || $isAdminRole) {
                $role->syncPermissions($allPermissions);
            } elseif ($grant === 'view_except_admin') {
                $role->syncPermissions(
                    $allPermissions->filter(
                        fn (Permission $p) => str_ends_with($p->name, '.view')
                            && ! in_array($p->name, $adminOnly, true)
                    )
                );
            } else {
                $names = array_values(array_diff((array) $grant, $adminOnly));
                $role->syncPermissions($allPermissions->whereIn('name', $names)->values());
            }
        }
    }

    /**
     * Ensure company roles exist for assignment (uses shared Spatie role templates).
     */
    public function ensureCompanyRoles(Company $company, bool $forceDefaults = false): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);
        $this->seedDefaultRoleTemplates($forceDefaults);

        // Clear company overrides only when forcing defaults
        if ($forceDefaults) {
            $settings = $company->settings ?? [];
            unset($settings['staff_role_permissions']);
            $company->update(['settings' => $settings]);
        }
    }

    /**
     * @return array{
     *   roles: list<array{value: string, label: string}>,
     *   modules: list<array<string, mixed>>,
     *   role_permissions: array<string, list<string>>,
     *   locked: list<string>
     * }
     */
    public function matrixForUi(Company $company): array
    {
        $editable = config('permissions.editable_roles', []);
        $roles = collect($editable)
            ->map(fn (string $r) => [
                'value' => $r,
                'label' => str_replace('_', ' ', ucwords($r, '_')),
            ])
            ->values()
            ->all();

        $rolePermissions = [];
        foreach ($editable as $roleName) {
            $rolePermissions[$roleName] = $this->permissionsForRole($company, $roleName);
        }

        return [
            'roles' => $roles,
            'modules' => config('permissions.modules', []),
            'role_permissions' => $rolePermissions,
            'locked' => config('permissions.locked_from_staff', []),
        ];
    }

    /**
     * @return list<string>
     */
    public function permissionsForRole(Company $company, string $roleName): array
    {
        $custom = $company->settings['staff_role_permissions'][$roleName] ?? null;
        if (is_array($custom)) {
            return array_values(array_unique(array_map('strval', $custom)));
        }

        return $this->defaultPermissionsForRole($roleName);
    }

    /**
     * Effective permission names for a user, or null to use Spatie defaults (admins).
     *
     * @return list<string>|null
     */
    public function effectivePermissionNames(User $user): ?array
    {
        if (! $user->company_id) {
            return null;
        }

        $user->syncPermissionTeam();

        if ($user->isCompanyAdmin() || $user->hasRole('manager') || $user->hasRole('super_admin')) {
            return null;
        }

        $roleName = $user->getRoleNames()->first();
        if (! $roleName || ! in_array($roleName, config('permissions.editable_roles', []), true)) {
            return null;
        }

        $company = $user->company;
        if (! $company) {
            return null;
        }

        return $this->permissionsForRole($company, $roleName);
    }

    public function userHasPermission(User $user, string $permission): bool
    {
        $effective = $this->effectivePermissionNames($user);
        if ($effective === null) {
            try {
                return $user->can($permission);
            } catch (\Throwable) {
                return false;
            }
        }

        return in_array($permission, $effective, true);
    }

    /**
     * @param  list<string>  $permissions
     */
    public function updateRolePermissions(Company $company, string $roleName, array $permissions, User $actor): void
    {
        $editable = config('permissions.editable_roles', []);
        if (! in_array($roleName, $editable, true)) {
            abort(422, 'This role cannot be customized.');
        }

        $locked = config('permissions.locked_from_staff', []);
        $allowed = collect(config('permissions.permissions', []))
            ->reject(fn (string $p) => in_array($p, $locked, true))
            ->all();

        $permissions = array_values(array_intersect(
            array_unique(array_map('strval', $permissions)),
            $allowed
        ));
        $permissions = $this->ensureViewImplies($permissions);

        $settings = $company->settings ?? [];
        $settings['staff_role_permissions'] = $settings['staff_role_permissions'] ?? [];
        $settings['staff_role_permissions'][$roleName] = $permissions;
        $company->update(['settings' => $settings]);

        $this->logger->log('settings.role_permissions_updated', $company, [
            'role' => $roleName,
            'permissions' => $permissions,
            'by' => $actor->id,
        ]);
    }

    public function assignCompanyRole(User $user, Company $company, string $roleName): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);
        $this->ensureCompanyRoles($company);
        $role = Role::findOrCreate($roleName, 'web');
        $user->syncRoles([$role]);
    }

    /**
     * @return list<string>
     */
    private function defaultPermissionsForRole(string $roleName): array
    {
        $grants = config('permissions.role_grants', []);
        $adminOnly = config('permissions.admin_only', []);
        $grant = array_key_exists($roleName, $grants) ? $grants[$roleName] : [];

        if ($grant === null) {
            return config('permissions.permissions', []);
        }

        if ($grant === 'view_except_admin') {
            return collect(config('permissions.permissions', []))
                ->filter(fn (string $p) => str_ends_with($p, '.view') && ! in_array($p, $adminOnly, true))
                ->values()
                ->all();
        }

        return array_values(array_diff((array) $grant, $adminOnly));
    }

    /**
     * @return Collection<int, Permission>
     */
    private function ensurePermissionsExist(): Collection
    {
        foreach (config('permissions.permissions', []) as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        return Permission::query()->where('guard_name', 'web')->get();
    }

    /**
     * @param  list<string>  $permissions
     * @return list<string>
     */
    private function ensureViewImplies(array $permissions): array
    {
        $set = collect($permissions);

        foreach ($permissions as $permission) {
            if (! str_contains($permission, '.')) {
                continue;
            }
            [$module] = explode('.', $permission, 2);
            $view = $module.'.view';
            if ($module !== '' && ! $set->contains($view) && in_array($view, config('permissions.permissions', []), true)) {
                $set->push($view);
            }
            if (str_starts_with($permission, 'deals.') && ! $set->contains('pipeline.view')) {
                $set->push('pipeline.view');
            }
        }

        return $set->unique()->values()->all();
    }
}
