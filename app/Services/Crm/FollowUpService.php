<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\TaskType;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;

class FollowUpService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): FollowUp
    {
        $followUp = FollowUp::create([
            'company_id' => $company->id,
            'lead_id' => $data['lead_id'] ?? null,
            'deal_id' => $data['deal_id'] ?? null,
            'task_type_id' => $data['task_type_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => FollowUp::STATUS_PENDING,
            'due_at' => $data['due_at'] ?? null,
            'assigned_user_id' => $data['assigned_user_id'] ?? $user->id,
            'created_by' => $user->id,
        ]);

        if ($followUp->lead_id) {
            Lead::query()
                ->where('id', $followUp->lead_id)
                ->update(['next_follow_up_at' => $followUp->due_at]);
        }

        $this->logger->log('follow_up.created', $followUp);

        return $followUp;
    }

    public function complete(FollowUp $followUp): FollowUp
    {
        $followUp->update([
            'status' => FollowUp::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        $this->logger->log('follow_up.completed', $followUp);

        return $followUp->fresh();
    }

    public function defaultTaskTypeId(Company $company): ?int
    {
        return TaskType::query()
            ->where('company_id', $company->id)
            ->where('slug', 'follow-up')
            ->value('id')
            ?? TaskType::query()
                ->where('company_id', $company->id)
                ->orderBy('sort_order')
                ->value('id');
    }
}
