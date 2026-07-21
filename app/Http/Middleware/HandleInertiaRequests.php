<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

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

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'theme' => $user->theme ?? 'system',
                    'company_id' => $user->company_id,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
                'company' => $user?->company ? [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                    'industry_key' => $user->company->industry_key,
                    'industry' => $user->company->industryName(),
                    'currency' => $user->company->currency,
                    'onboarding_completed' => $user->company->onboarding_completed,
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
        ];
    }
}
