<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enquiry extends Model
{
    use BelongsToCompany, HasUuid, SoftDeletes;

    public const STATUS_NEW = 'new';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_CONVERTED = 'converted';

    public const STATUS_JUNK = 'junk';

    protected $fillable = [
        'uuid',
        'company_id',
        'name',
        'email',
        'phone',
        'lead_source_id',
        'status',
        'channel',
        'message',
        'assigned_user_id',
        'created_by',
        'converted_at',
        'lead_id',
    ];

    protected function casts(): array
    {
        return [
            'converted_at' => 'datetime',
        ];
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'lead_source_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function isConverted(): bool
    {
        return $this->status === self::STATUS_CONVERTED && $this->lead_id !== null;
    }
}
