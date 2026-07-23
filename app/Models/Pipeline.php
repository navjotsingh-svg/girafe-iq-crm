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

    public static function resolveForCompany(int $companyId): ?self
    {
        return static::query()
            ->where('company_id', $companyId)
            ->where('is_default', true)
            ->where('is_active', true)
            ->first()
            ?? static::query()
                ->where('company_id', $companyId)
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('id')
                ->first();
    }

    /**
     * All stages for this pipeline (company already verified).
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, PipelineStage>
     */
    public function stagesForBoard()
    {
        return PipelineStage::query()
            ->where('pipeline_id', $this->id)
            ->where('company_id', $this->company_id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }
}
