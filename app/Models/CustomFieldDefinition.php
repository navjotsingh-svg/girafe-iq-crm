<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomFieldDefinition extends Model
{
    use BelongsToCompany, HasUuid, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'entity',
        'name',
        'key',
        'type',
        'options',
        'is_required',
        'is_system',
        'show_in_list',
        'sort_order',
        'validation',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'validation' => 'array',
            'is_required' => 'boolean',
            'is_system' => 'boolean',
            'show_in_list' => 'boolean'
        ];
    }
}
