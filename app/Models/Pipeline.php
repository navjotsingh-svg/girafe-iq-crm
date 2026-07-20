<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pipeline extends Model
{
    use BelongsToCompany, HasUuid, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'name',
        'slug',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_active' => 'boolean'
        ];
    }

    public function stages()
    {
        return $this->hasMany(PipelineStage::class)->orderBy('sort_order');
    }
}
