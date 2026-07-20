<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AutomationRule extends Model
{
    use BelongsToCompany, HasUuid, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'name',
        'trigger',
        'action',
        'config',
        'is_active',
        'runs_count',
        'last_run_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'is_active' => 'boolean',
            'last_run_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
