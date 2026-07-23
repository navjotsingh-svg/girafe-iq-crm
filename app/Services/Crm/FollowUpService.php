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
        $status = $data['status'] ?? FollowUp::STATUS_PENDING;
        $completedAt = $status === FollowUp::STATUS_COMPLETED
            ? ($data['completed_at'] ?? now())
            : null;

        $followUp = FollowUp::create([
            'company_id' => $company->id,
            'lead_id' => $data['lead_id'] ?? null,
            'deal_id' => $data['deal_id'] ?? null,
            'task_type_id' => $data['task_type_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => $status,
            'due_at' => $data['due_at'] ?? ($status === FollowUp::STATUS_COMPLETED ? now() : null),
            'completed_at' => $completedAt,
            'assigned_user_id' => $data['assigned_user_id'] ?? $user->id,
            'created_by' => $user->id,
        ]);

        if ($followUp->lead_id && $status === FollowUp::STATUS_PENDING) {
            Lead::query()
                ->where('id', $followUp->lead_id)
                ->update(['next_follow_up_at' => $followUp->due_at]);
        }

        $this->logger->log(
            $status === FollowUp::STATUS_COMPLETED ? 'follow_up.logged' : 'follow_up.created',
            $followUp
        );

        return $followUp;
    }

    public function logAgainstLead(Company $company, User $user, Lead $lead, array $data): FollowUp
    {
        $kind = ($data['kind'] ?? 'note') === 'call' ? 'call' : 'note';

        $taskTypeId = TaskType::query()
            ->where('company_id', $company->id)
            ->where('slug', $kind)
            ->value('id');

        if (! $taskTypeId) {
            $taskType = TaskType::create([
                'company_id' => $company->id,
                'name' => $kind === 'call' ? 'Call' : 'Note',
                'slug' => $kind,
                'icon' => $kind === 'call' ? 'phone-call' : 'file-text',
                'color' => $kind === 'call' ? '#059669' : '#6366f1',
                'is_active' => true,
                'sort_order' => $kind === 'call' ? 1 : 2,
            ]);
            $taskTypeId = $taskType->id;
        }

        $outcome = $data['outcome'] ?? null;
        $title = $data['title'] ?? ($kind === 'call'
            ? 'Call'.($outcome ? " · {$outcome}" : '')
            : 'Note');

        $description = trim((string) ($data['description'] ?? ''));
        if ($kind === 'call' && ! empty($data['duration_minutes'])) {
            $description = trim($description."\nDuration: ".$data['duration_minutes'].' min');
        }

        return $this->create($company, $user, [
            'lead_id' => $lead->id,
            'task_type_id' => $taskTypeId,
            'title' => $title,
            'description' => $description !== '' ? $description : null,
            'status' => FollowUp::STATUS_COMPLETED,
            'due_at' => $data['logged_at'] ?? now(),
            'completed_at' => $data['logged_at'] ?? now(),
        ]);
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
