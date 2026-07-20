<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use App\Services\Onboarding\IndustryPackService;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DemoTenantSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::firstOrCreate(
            ['slug' => 'girafe-demo'],
            [
                'name' => 'Girafe Demo Co',
                'industry_key' => 'general',
                'email' => 'admin@girafeiq.local',
                'phone' => '9999999999',
                'country' => 'IN',
                'timezone' => 'Asia/Kolkata',
                'currency' => 'INR',
                'team_size' => '2-5',
                'onboarding_step' => 7,
                'onboarding_completed' => true,
                'subscription_status' => 'trialing',
                'is_active' => true,
                'settings' => [
                    'selected_sources' => ['website', 'referrals', 'google_ads'],
                    'pack_applied_at' => now()->toIso8601String(),
                    'setup_checklist' => [
                        'pipeline' => true,
                        'lead_fields' => true,
                        'follow_up_types' => true,
                        'dashboard' => true,
                        'reports' => true,
                        'team_roles' => true,
                    ],
                ],
            ]
        );

        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        app(IndustryPackService::class)->apply($company, ['website', 'referrals', 'google_ads']);

        $adminRole = Role::findOrCreate('company_admin', 'web');

        $admin = User::firstOrCreate(
            ['email' => 'admin@girafeiq.local'],
            [
                'company_id' => $company->id,
                'name' => 'Demo Admin',
                'password' => 'password',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        if (! $admin->company_id) {
            $admin->update(['company_id' => $company->id]);
        }

        $admin->syncRoles([$adminRole]);
    }
}
