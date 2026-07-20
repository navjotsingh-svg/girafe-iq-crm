<?php

namespace App\Services\Onboarding;

use App\Models\Company;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class OnboardingService
{
    public function __construct(
        private IndustryPackService $packs,
        private ActivityLogger $logger
    ) {}

    /**
     * Step 1 — Sign up: Name, Email/Phone, Company.
     *
     * @param  array<string, mixed>  $data
     */
    public function registerAccount(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $company = Company::create([
                'name' => $data['company_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'country' => config('girafe.default_country', 'IN'),
                'timezone' => config('girafe.default_timezone', 'Asia/Kolkata'),
                'currency' => config('girafe.default_currency', 'INR'),
                'industry_key' => config('industries.default', 'custom'),
                'onboarding_step' => 2,
                'onboarding_completed' => false,
                'subscription_status' => 'trialing',
                'is_active' => true,
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            foreach (config('permissions.permissions', []) as $permission) {
                Permission::findOrCreate($permission, 'web');
            }

            $user = User::create([
                'company_id' => $company->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $adminRole = Role::findOrCreate('company_admin', 'web');
            $adminRole->syncPermissions(Permission::query()->where('guard_name', 'web')->get());
            $user->assignRole($adminRole);
            $user->setRelation('company', $company);

            $this->logger->log('company.registered', $company, [
                'company' => $company->name,
                'owner' => $user->email,
            ]);

            return $user;
        });
    }

    public function saveIndustry(Company $company, string $industryKey): Company
    {
        $company->update([
            'industry_key' => $industryKey,
            'onboarding_step' => max($company->onboarding_step, 3),
        ]);

        return $company->fresh();
    }

    public function saveTeamSize(Company $company, string $teamSize): Company
    {
        $company->update([
            'team_size' => $teamSize,
            'onboarding_step' => max($company->onboarding_step, 4),
        ]);

        return $company->fresh();
    }

    /**
     * Step 4 — save selected lead sources, then move to auto-setup.
     *
     * @param  list<string>  $sources
     */
    public function saveSources(Company $company, array $sources): Company
    {
        $company->update([
            'onboarding_step' => 5,
            'settings' => array_merge($company->settings ?? [], [
                'selected_sources' => $sources,
            ]),
        ]);

        return $company->fresh();
    }

    /**
     * Step 5 — Auto setup by Girafe IQ (pipeline, fields, roles, etc.).
     */
    public function runAutoSetup(Company $company): Company
    {
        return DB::transaction(function () use ($company) {
            $sources = $company->settings['selected_sources'] ?? [];

            $this->packs->apply($company, $sources);

            $company->update([
                'onboarding_step' => 6,
                'settings' => array_merge($company->settings ?? [], [
                    'pack_applied_at' => now()->toIso8601String(),
                    'setup_checklist' => [
                        'pipeline' => true,
                        'lead_fields' => true,
                        'follow_up_types' => true,
                        'dashboard' => true,
                        'reports' => true,
                        'team_roles' => true,
                    ],
                ]),
            ]);

            $this->logger->log('onboarding.pack_applied', $company, [
                'industry' => $company->industry_key,
                'sources' => $sources,
            ]);

            return $company->fresh();
        });
    }

    /**
     * Step 6 — import choice (enquiry / import / connect / sample / skip).
     */
    public function chooseImportPath(Company $company, string $path): Company
    {
        $company->update([
            'onboarding_step' => 7,
            'settings' => array_merge($company->settings ?? [], [
                'import_path' => $path,
            ]),
        ]);

        return $company->fresh();
    }

    public function complete(Company $company): Company
    {
        $company->update([
            'onboarding_step' => 7,
            'onboarding_completed' => true,
        ]);

        $this->logger->log('onboarding.completed', $company);

        return $company->fresh();
    }
}
