<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TeamService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @return array{user: User, temporary_password: string}
     */
    public function invite(Company $company, User $inviter, array $data): array
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($company->id);

        $temporaryPassword = Str::password(12);

        $user = User::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($temporaryPassword),
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $roleName = $data['role'] ?? 'sales_executive';
        $allowed = collect(config('permissions.roles', []))
            ->reject(fn ($r) => $r === 'super_admin')
            ->all();

        if (! in_array($roleName, $allowed, true)) {
            $roleName = 'sales_executive';
        }

        $role = Role::findOrCreate($roleName, 'web');
        $user->assignRole($role);

        $this->logger->log('team.member_invited', $user, [
            'role' => $roleName,
            'invited_by' => $inviter->id,
        ]);

        return [
            'user' => $user,
            'temporary_password' => $temporaryPassword,
        ];
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
