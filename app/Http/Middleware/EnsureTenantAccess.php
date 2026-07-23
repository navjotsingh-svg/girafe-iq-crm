<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->company_id) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($user->company_id);
        }

        if ($user->hasRole('super_admin') && ! $user->company_id) {
            return $next($request);
        }

        if (! $user->company_id || ! $user->company) {
            abort(403, 'Your account is not linked to a company.');
        }

        if (! $user->is_active || ! $user->company->is_active) {
            abort(403, 'Your company account is inactive.');
        }

        return $next($request);
    }
}
