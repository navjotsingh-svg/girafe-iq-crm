<?php

namespace App\Http\Middleware;

use App\Services\Crm\RolePermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminModuleAccess
{
    /**
     * Allow company admins / managers, or users with the given permission
     * (including company-customized staff permissions).
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $user->syncPermissionTeam();

        if ($user->isCompanyAdmin()
            || $user->hasRole('manager')
            || $user->hasRole('super_admin')
            || $user->isWorkspaceOwner()
            || $user->canManageTeam()
        ) {
            return $next($request);
        }

        $roles = app(RolePermissionService::class);

        foreach ($permissions as $permission) {
            if ($permission !== '' && $roles->userHasPermission($user, $permission)) {
                return $next($request);
            }
        }

        abort(403, 'You do not have access to this page.');
    }
}
