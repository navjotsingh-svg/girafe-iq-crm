<?php

namespace App\Services\Crm;

use App\Mail\TeamInviteMail;
use App\Models\Company;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Throwable;

class TeamService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * Invite staff by email. Invitee sets their own password via the link.
     *
     * @param  array<string, mixed>  $data
     * @return array{invitation: TeamInvitation, email_sent: bool}
     */
    public function invite(Company $company, User $inviter, array $data): array
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        $roleName = $this->normalizeRole($data['role'] ?? 'sales_executive');

        // Replace any previous pending invite for this email in this company
        TeamInvitation::query()
            ->where('company_id', $company->id)
            ->where('email', $data['email'])
            ->whereNull('accepted_at')
            ->delete();

        $invitation = TeamInvitation::create([
            'company_id' => $company->id,
            'invited_by' => $inviter->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => $roleName,
            'expires_at' => now()->addDays(7),
        ]);

        $invitation->setRelation('company', $company);
        $invitation->setRelation('inviter', $inviter);

        $emailSent = $this->sendInviteEmail($invitation);

        $this->logger->log('team.member_invited', $company, [
            'role' => $roleName,
            'invited_by' => $inviter->id,
            'email' => $invitation->email,
            'invitation_id' => $invitation->id,
            'email_sent' => $emailSent,
        ]);

        return [
            'invitation' => $invitation,
            'email_sent' => $emailSent,
        ];
    }

    /**
     * Accept invite: create staff user under the admin's company with chosen password.
     *
     * @param  array{password: string, name?: string}  $data
     */
    public function accept(TeamInvitation $invitation, array $data): User
    {
        if (! $invitation->isPending()) {
            throw ValidationException::withMessages([
                'token' => $invitation->accepted_at
                    ? 'This invitation has already been accepted.'
                    : 'This invitation has expired. Ask your admin to send a new one.',
            ]);
        }

        if (User::query()->where('email', $invitation->email)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'An account with this email already exists. Please log in instead.',
            ]);
        }

        return DB::transaction(function () use ($invitation, $data) {
            $company = $invitation->company;
            app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

            $user = User::create([
                'company_id' => $company->id,
                'name' => $data['name'] ?? $invitation->name,
                'email' => $invitation->email,
                'phone' => $invitation->phone,
                'password' => $data['password'],
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $role = Role::findOrCreate($invitation->role, 'web');
            $user->assignRole($role);

            $invitation->update(['accepted_at' => now()]);

            $this->logger->log('team.invite_accepted', $user, [
                'role' => $invitation->role,
                'invitation_id' => $invitation->id,
                'company_id' => $company->id,
            ]);

            return $user->fresh();
        });
    }

    public function cancelInvitation(TeamInvitation $invitation, Company $company): void
    {
        if ($invitation->company_id !== $company->id) {
            abort(403);
        }

        if ($invitation->accepted_at) {
            abort(422, 'Invitation already accepted.');
        }

        $invitation->delete();

        $this->logger->log('team.invite_cancelled', $company, [
            'email' => $invitation->email,
            'invitation_id' => $invitation->id,
        ]);
    }

    private function sendInviteEmail(TeamInvitation $invitation): bool
    {
        try {
            Mail::to($invitation->email)->send(new TeamInviteMail($invitation));

            return true;
        } catch (Throwable $e) {
            Log::warning('Failed to send team invite email', [
                'invitation_id' => $invitation->id,
                'email' => $invitation->email,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function normalizeRole(string $roleName): string
    {
        $allowed = collect(config('permissions.roles', []))
            ->reject(fn ($r) => $r === 'super_admin')
            ->all();

        return in_array($roleName, $allowed, true) ? $roleName : 'sales_executive';
    }

    public function updateRole(User $member, Company $company, string $roleName): User
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        $allowed = collect(config('permissions.roles', []))
            ->reject(fn ($r) => $r === 'super_admin')
            ->all();

        if (! in_array($roleName, $allowed, true)) {
            abort(422, 'Invalid role.');
        }

        $role = Role::findOrCreate($roleName, 'web');
        $member->syncRoles([$role]);

        $this->logger->log('team.role_updated', $member, ['role' => $roleName]);

        return $member->fresh();
    }

    public function setActive(User $member, bool $active): User
    {
        $member->update(['is_active' => $active]);

        $this->logger->log($active ? 'team.member_activated' : 'team.member_deactivated', $member);

        return $member->fresh();
    }
}
