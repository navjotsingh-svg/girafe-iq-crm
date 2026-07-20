<?php

namespace App\Services\Tenant;

use App\Models\Company;
use App\Models\User;

class TenantContextService
{
    public function currentCompany(?User $user = null): ?Company
    {
        $user ??= auth()->user();

        return $user?->company;
    }

    public function currentCompanyId(?User $user = null): ?int
    {
        return $this->currentCompany($user)?->id;
    }
}
