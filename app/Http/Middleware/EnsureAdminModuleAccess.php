<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminModuleAccess
{
    /**
     * Allow company admins / managers, or users with the given permission.
     * Avoids Spatie team-permission false 403s on admin menu pages.
     *
     * @param  list<string>|string  $permission
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $user->syncPermissionTeam();

        if ($user->isCompanyAdmin() || $user->hasRole('manager') || $user->hasRole('super_admin')) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            try {
                if ($permission !== '' && $user->can($permission)) {
                    return $next($request);
                }
            } catch (\Throwable) {
                // continue
            }
        }

        abort(403, 'You do not have access to this page.');
    }
}
