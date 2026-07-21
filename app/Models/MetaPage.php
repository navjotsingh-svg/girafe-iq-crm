<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetaPage extends Model
{
    protected $fillable = [
        'company_id',
        'page_id',
        'page_name',
        'page_access_token',
        'instagram_business_id',
        'subscribed_leadgen',
        'is_active',
    ];

    protected $hidden = [
        'page_access_token',
    ];

    protected function casts(): array
    {
        return [
            'subscribed_leadgen' => 'boolean',
            'is_active' => 'boolean',
            'page_access_token' => 'encrypted',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
