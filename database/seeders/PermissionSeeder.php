<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Services\Crm\RolePermissionService;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $service = app(RolePermissionService::class);
        $service->seedDefaultRoleTemplates(true);

        Company::query()->each(fn (Company $company) => $service->ensureCompanyRoles($company));
    }
}
