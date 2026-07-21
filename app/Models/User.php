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

    public function isCompanyAdmin(): bool
    {
        if ($this->hasRole('company_admin') || $this->hasRole('super_admin')) {
            return true;
        }

        // Fallback when Spatie team context / cache is out of sync
        $roles = $this->getRoleNames();

        return $roles->contains('company_admin') || $roles->contains('super_admin');
    }

    public function canManageTeam(): bool
    {
        if ($this->isCompanyAdmin()) {
            return true;
        }

        return $this->hasRole('manager') || $this->hasRole('sales_manager');
    }
}
