<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use BelongsToCompany, HasUuid, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'enquiry_id',
        'account_id',
        'contact_id',
        'name',
        'email',
        'phone',
        'lead_status_id',
        'lead_source_id',
        'assigned_user_id',
        'temperature',
        'next_follow_up_at',
        'notes',
        'custom_fields',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'next_follow_up_at' => 'datetime',
            'custom_fields' => 'array',
        ];
    }

    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(LeadStatus::class, 'lead_status_id');
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

    public function deal(): HasOne
    {
        return $this->hasOne(Deal::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class)->latest('due_at');
    }
}
