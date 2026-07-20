<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\User;
use App\Services\Crm\TeamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        $roles = collect(config('permissions.roles', []))
            ->reject(fn ($r) => $r === 'super_admin')
            ->values()
            ->map(fn ($r) => [
                'value' => $r,
                'label' => str_replace('_', ' ', ucwords($r, '_')),
            ]);

        $members = User::query()
            ->where('company_id', $company->id)
            ->orderBy('name')
            ->get()
            ->map(function (User $u) {
                $role = $u->getRoleNames()->first();

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'is_active' => $u->is_active,
                    'role' => $role,
                    'leads_count' => Lead::query()->where('assigned_user_id', $u->id)->count(),
                    'deals_won' => Deal::query()
                        ->where('assigned_user_id', $u->id)
                        ->whereNotNull('won_at')
                        ->count(),
                    'tasks_pending' => FollowUp::query()
                        ->where('assigned_user_id', $u->id)
                        ->where('status', FollowUp::STATUS_PENDING)
                        ->count(),
                    'created_at' => $u->created_at?->toIso8601String(),
                ];
            });

        return Inertia::render('Team/Index', [
            'members' => $members,
            'roles' => $roles,
            'stats' => [
                'total' => $members->count(),
                'active' => $members->where('is_active', true)->count(),
            ],
            'canManage' => $request->user()->isCompanyAdmin()
                || $request->user()->hasRole('manager')
                || $request->user()->hasRole('sales_manager'),
        ]);
    }

    public function store(Request $request, TeamService $service): RedirectResponse
    {
        $company = $request->user()->company;
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        if (! $request->user()->isCompanyAdmin()
            && ! $request->user()->hasRole('manager')
            && ! $request->user()->hasRole('sales_manager')) {
            abort(403);
        }

        $allowedRoles = collect(config('permissions.roles', []))
            ->reject(fn ($r) => $r === 'super_admin')
            ->all();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'phone' => 'nullable|string|max:30',
            'role' => ['required', Rule::in($allowedRoles)],
        ]);

        $result = $service->invite($company, $request->user(), $data);

        $message = $result['email_sent']
            ? 'Invite emailed to '.$result['user']->email.' with their role and login details.'
            : 'Team member created, but the invite email could not be sent. Share the temporary password below.';

        return redirect()->route('team.index')
            ->with('success', $message)
            ->with('invite_password', $result['temporary_password'])
            ->with('invite_email', $result['user']->email);
    }

    public function updateRole(User $member, Request $request, TeamService $service): RedirectResponse
    {
        $company = $request->user()->company;

        if ($member->company_id !== $company->id) {
            abort(403);
        }

        if (! $request->user()->isCompanyAdmin() && ! $request->user()->hasRole('manager')) {
            abort(403);
        }

        if ($member->id === $request->user()->id) {
            return back()->with('error', 'You cannot change your own role here.');
        }

        $allowedRoles = collect(config('permissions.roles', []))
            ->reject(fn ($r) => $r === 'super_admin')
            ->all();

        $data = $request->validate([
            'role' => ['required', Rule::in($allowedRoles)],
        ]);

        $service->updateRole($member, $company, $data['role']);

        return back()->with('success', 'Role updated.');
    }

    public function toggleActive(User $member, Request $request, TeamService $service): RedirectResponse
    {
        $company = $request->user()->company;

        if ($member->company_id !== $company->id) {
            abort(403);
        }

        if (! $request->user()->isCompanyAdmin() && ! $request->user()->hasRole('manager')) {
            abort(403);
        }

        if ($member->id === $request->user()->id) {
            return back()->with('error', 'You cannot deactivate yourself.');
        }

        $service->setActive($member, ! $member->is_active);

        return back()->with('success', $member->fresh()->is_active ? 'Member activated.' : 'Member deactivated.');
    }
}
