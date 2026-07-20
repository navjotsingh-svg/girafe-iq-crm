<?php

namespace App\Services\Tenant;

use App\Models\ActivityLog;
use App\Models\Company;
use Illuminate\Database\Eloquent\Model;

class ActivityLogger
{
    public function log(string $action, ?Model $subject = null, array $properties = []): ActivityLog
    {
        $user = auth()->user();
        $companyId = $user?->company_id;

        if (! $companyId && $subject instanceof Company) {
            $companyId = $subject->id;
        }

        if (! $companyId && $subject && isset($subject->company_id)) {
            $companyId = $subject->company_id;
        }

        return ActivityLog::withoutGlobalScopes()->create([
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subject ? $subject::class : null,
            'subject_id' => $subject?->getKey(),
            'properties' => $properties,
            'ip_address' => request()->ip(),
        ]);
    }
}
