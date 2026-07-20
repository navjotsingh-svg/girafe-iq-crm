<?php

namespace Database\Seeders;

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

        // Global roles without team (templates). Tenant roles created at onboarding.
        foreach (config('permissions.roles') as $roleName) {
            $role = Role::findOrCreate($roleName, 'web');
            if (in_array($roleName, ['super_admin', 'company_admin'], true)) {
                $role->syncPermissions(Permission::all());
            } elseif ($roleName === 'viewer') {
                $role->syncPermissions(
                    Permission::query()->where('name', 'like', '%.view')->get()
                );
            } elseif ($roleName === 'sales_executive') {
                $role->syncPermissions(
                    Permission::query()->whereIn('name', [
                        'dashboard.view',
                        'enquiries.view', 'enquiries.create', 'enquiries.update', 'enquiries.convert',
                        'leads.view', 'leads.create', 'leads.update',
                        'pipeline.view', 'deals.view', 'deals.create', 'deals.update',
                        'customers.view',
                        'tasks.view', 'tasks.create', 'tasks.update',
                        'calendar.view',
                        'documents.view',
                    ])->get()
                );
            }
        }
    }
}
