<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Crm\RolePermissionService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::before(function ($user, string $ability) {
            if (! $user instanceof User) {
                return null;
            }

            if (! str_contains($ability, '.')) {
                return null;
            }

            $effective = app(RolePermissionService::class)->effectivePermissionNames($user);
            if ($effective === null) {
                return null;
            }

            return in_array($ability, $effective, true);
        });
    }
}
