<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Spatie\Permission\PermissionRegistrar;
use Throwable;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user && $user->company_id) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($user->company_id);
        }

        $roles = [];
        $permissions = [];
        $canManageTeam = false;
        $canManageIntegrations = false;
        $canAccessAdminModules = false;

        if ($user) {
            $user->syncPermissionTeam();
            $roles = $user->getRoleNames()->values()->all();
            $canManageTeam = $user->canManageTeam();
            $canManageIntegrations = $user->canManageIntegrations();
            $canAccessAdminModules = $user->canAccessAdminModules();

            try {
                $effective = app(\App\Services\Crm\RolePermissionService::class)
                    ->effectivePermissionNames($user);

                $permissions = $effective ?? $user->getAllPermissions()->pluck('name')->values()->all();
            } catch (Throwable) {
                $permissions = [];
            }
        }

        $company = $user ? $user->company : null;

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'theme' => $user->theme ?? 'system',
                    'company_id' => $user->company_id,
                    'roles' => $roles,
                    'permissions' => $permissions,
                    'can_manage_team' => $canManageTeam,
                    'can_manage_integrations' => $canManageIntegrations,
                    'can_access_admin_modules' => $canAccessAdminModules,
                ] : null,
                'company' => $company ? [
                    'id' => $company->id,
                    'name' => $company->name,
                    'industry_key' => $company->industry_key,
                    'industry' => $company->industryName(),
                    'currency' => $company->currency,
                    'onboarding_completed' => $company->onboarding_completed,
                ] : null,
            ],
            'app' => [
                'name' => config('girafe.name'),
                'tagline' => config('girafe.tagline'),
                'trial_days' => config('girafe.trial_days'),
                'phone' => [
                    'min_digits' => (int) config('girafe.phone.min_digits', 10),
                    'max_digits' => (int) config('girafe.phone.max_digits', 15),
                    'max_chars' => (int) config('girafe.phone.max_chars', 30),
                ],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
                'import_errors' => fn () => $request->session()->get('import_errors'),
            ],
        ]);
    }
}
