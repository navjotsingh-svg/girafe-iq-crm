<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use BelongsToCompany, HasUuid, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_CHURNED = 'churned';

    protected $fillable = [
        'uuid',
        'company_id',
        'lead_id',
        'deal_id',
        'name',
        'email',
        'phone',
        'status',
        'lifetime_value',
        'currency',
        'notes',
        'custom_fields',
        'assigned_user_id',
        'created_by',
        'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'lifetime_value' => 'decimal:2',
            'custom_fields' => 'array',
            'converted_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
