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

        if ($user) {
            $roles = $user->getRoleNames()->values()->all();
            $canManageTeam = $user->canManageTeam();

            try {
                $permissions = $user->getAllPermissions()->pluck('name')->values()->all();
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
