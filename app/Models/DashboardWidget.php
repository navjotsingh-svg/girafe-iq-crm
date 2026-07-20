<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class DashboardWidget extends Model
{
    use BelongsToCompany, HasUuid;

    protected $fillable = [
        'uuid',
        'company_id',
        'key',
        'label',
        'is_enabled',
        'sort_order',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'config' => 'array',
        ];
    }
}
