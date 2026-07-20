<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;

class DealService
{
    public function __construct(
        private ActivityLogger $logger,
        private CustomerService $customerService,
        private AutomationService $automation,
    ) {}

    public function createFromLead(Lead $lead, User $user): ?Deal
    {
        if (Deal::query()->where('lead_id', $lead->id)->exists()) {
            return $lead->deal;
        }

        $pipeline = Pipeline::query()
            ->where('company_id', $lead->company_id)
            ->where('is_default', true)
            ->first()
            ?? Pipeline::query()
                ->where('company_id', $lead->company_id)
                ->where('is_active', true)
                ->first();

        if (! $pipeline) {
            return null;
        }

        $firstStage = PipelineStage::query()
            ->where('pipeline_id', $pipeline->id)
            ->orderBy('sort_order')
            ->first();

        if (! $firstStage) {
            return null;
        }

        $deal = Deal::create([
            'company_id' => $lead->company_id,
            'lead_id' => $lead->id,
            'pipeline_id' => $pipeline->id,
            'pipeline_stage_id' => $firstStage->id,
            'title' => $lead->name,
            'value' => 0,
            'currency' => $lead->company?->currency ?? 'INR',
            'assigned_user_id' => $lead->assigned_user_id ?? $user->id,
            'created_by' => $user->id,
        ]);

        $this->logger->log('deal.created', $deal, ['lead_id' => $lead->id]);

        return $deal;
    }

    public function moveToStage(Deal $deal, PipelineStage $stage): Deal
    {
        $fromStageId = $deal->pipeline_stage_id;

        $updates = ['pipeline_stage_id' => $stage->id];

        if ($stage->is_won) {
            $updates['won_at'] = now();
            $updates['lost_at'] = null;
            $updates['lost_reason'] = null;
        } elseif ($stage->is_lost) {
            $updates['lost_at'] = now();
            $updates['won_at'] = null;
        } else {
            $updates['won_at'] = null;
            $updates['lost_at'] = null;
            $updates['lost_reason'] = null;
        }

        $deal->update($updates);

        $this->logger->log('deal.stage_changed', $deal, [
            'from_stage_id' => $fromStageId,
            'to_stage_id' => $stage->id,
            'stage_name' => $stage->name,
        ]);

        $deal = $deal->fresh(['lead', 'stage']);

        if ($stage->is_won && auth()->user()) {
            $this->customerService->createFromDeal($deal, auth()->user());
            if ($deal->company) {
                $this->automation->runForTrigger('deal.won', $deal->company, $deal, auth()->user());
            }
        }

        return $deal;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Deal $deal, array $data): Deal
    {
        $deal->update([
            'title' => $data['title'] ?? $deal->title,
            'value' => $data['value'] ?? $deal->value,
            'expected_close_date' => $data['expected_close_date'] ?? $deal->expected_close_date,
            'notes' => $data['notes'] ?? $deal->notes,
            'assigned_user_id' => $data['assigned_user_id'] ?? $deal->assigned_user_id,
        ]);

        $this->logger->log('deal.updated', $deal);

        return $deal->fresh();
    }
}
