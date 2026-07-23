<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'name',
        'email',
        'phone',
        'password',
        'is_active',
        'theme',
        'preferences',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'preferences' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) Str::uuid();
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function syncPermissionTeam(): void
    {
        if ($this->company_id) {
            app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->company_id);
        }
    }

    public function isCompanyAdmin(): bool
    {
        $this->syncPermissionTeam();

        if ($this->hasRole('company_admin') || $this->hasRole('super_admin')) {
            return true;
        }

        // Fallback when Spatie team context / cache is out of sync
        $roles = $this->getRoleNames();

        return $roles->contains('company_admin') || $roles->contains('super_admin');
    }

    public function canManageTeam(): bool
    {
        $this->syncPermissionTeam();

        if ($this->isCompanyAdmin()) {
            return true;
        }

        if ($this->hasRole('manager') || $this->hasRole('sales_manager')) {
            return true;
        }

        $roles = $this->getRoleNames();

        return $roles->contains('manager') || $roles->contains('sales_manager');
    }

    public function canManageIntegrations(): bool
    {
        $this->syncPermissionTeam();

        if ($this->canManageTeam()) {
            return true;
        }

        try {
            if ($this->can('settings.manage') || $this->can('settings.view')) {
                return true;
            }
        } catch (\Throwable) {
            // ignore permission cache issues
        }

        // Last resort: workspace owner (first user of the company)
        return $this->isWorkspaceOwner();
    }

    public function isWorkspaceOwner(): bool
    {
        if (! $this->company_id) {
            return false;
        }

        $ownerId = static::query()
            ->where('company_id', $this->company_id)
            ->orderBy('id')
            ->value('id');

        return (int) $ownerId === (int) $this->id;
    }
}
