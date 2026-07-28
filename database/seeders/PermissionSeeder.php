<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Services\Onboarding\IndustryPackService;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (config('permissions.permissions') as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $all = Permission::query()->where('guard_name', 'web')->get();
        $adminOnly = config('permissions.admin_only', []);
        $grants = config('permissions.role_grants', []);

        foreach (config('permissions.roles') as $roleName) {
            $role = Role::findOrCreate($roleName, 'web');

            if (in_array($roleName, ['super_admin', 'company_admin'], true)) {
                $role->syncPermissions($all);

                continue;
            }

            $grant = array_key_exists($roleName, $grants) ? $grants[$roleName] : [];

            if ($grant === null) {
                $role->syncPermissions($all);
            } elseif ($grant === 'view_except_admin') {
                $role->syncPermissions(
                    $all->filter(
                        fn (Permission $p) => str_ends_with($p->name, '.view')
                            && ! in_array($p->name, $adminOnly, true)
                    )
                );
            } else {
                $role->syncPermissions(
                    $all->whereIn('name', array_values(array_diff((array) $grant, $adminOnly)))->values()
                );
            }
        }

        $packs = app(IndustryPackService::class);
        Company::query()->each(fn (Company $company) => $packs->syncTenantRoles($company));
    }
}
