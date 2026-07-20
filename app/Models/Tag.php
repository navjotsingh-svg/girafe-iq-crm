<?php

namespace App\Models;

use App\Support\Traits\BelongsToCompany;
use App\Support\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tag extends Model
{
    use BelongsToCompany, HasUuid, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'name',
        'slug',
        'color',
    ];
}
