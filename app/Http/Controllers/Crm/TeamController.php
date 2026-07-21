<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\TeamInvitation;
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

        $pendingInvites = collect();

        try {
            $pendingInvites = TeamInvitation::query()
                ->where('company_id', $company->id)
                ->pending()
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (TeamInvitation $invite) => [
                    'id' => $invite->id,
                    'name' => $invite->name,
                    'email' => $invite->email,
                    'role' => $invite->role,
                    'role_label' => $invite->roleLabel(),
                    'expires_at' => $invite->expires_at?->toDateString(),
                ]);
        } catch (\Throwable) {
            // Table may be missing until migrations are run on the server.
            $pendingInvites = collect();
        }

        $canManage = $request->user()->canManageTeam();

        return Inertia::render('Team/Index', [
            'members' => $members,
            'pendingInvites' => $pendingInvites,
            'roles' => $roles,
            'stats' => [
                'total' => $members->count(),
                'active' => $members->where('is_active', true)->count(),
                'pending' => $pendingInvites->count(),
            ],
            'canManage' => $canManage,
        ]);
    }

    public function store(Request $request, TeamService $service): RedirectResponse
    {
        $company = $request->user()->company;
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        if (! $request->user()->canManageTeam()) {
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
            ? 'Invite sent to '.$result['invitation']->email.'. They will create their own password and join as staff.'
            : 'Invite saved, but the email could not be sent. Check mail settings and try again.';

        return redirect()->route('team.index')->with('success', $message);
    }

    public function cancelInvite(
        TeamInvitation $invitation,
        Request $request,
        TeamService $service,
    ): RedirectResponse {
        $company = $request->user()->company;

        if (! $request->user()->canManageTeam()) {
            abort(403);
        }

        $service->cancelInvitation($invitation, $company);

        return back()->with('success', 'Invitation cancelled.');
    }

    public function updateRole(User $member, Request $request, TeamService $service): RedirectResponse
    {
        $company = $request->user()->company;

        if ($member->company_id !== $company->id) {
            abort(403);
        }

        if (! $request->user()->canManageTeam()) {
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

        if (! $request->user()->canManageTeam()) {
            abort(403);
        }

        if ($member->id === $request->user()->id) {
            return back()->with('error', 'You cannot deactivate yourself.');
        }

        $service->setActive($member, ! $member->is_active);

        return back()->with('success', $member->fresh()->is_active ? 'Member activated.' : 'Member deactivated.');
    }
}
