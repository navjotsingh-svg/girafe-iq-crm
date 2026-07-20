<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Lead;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;

class LeadService
{
    public function __construct(
        private ActivityLogger $logger,
        private DealService $dealService,
        private AutomationService $automation,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): Lead
    {
        $lead = Lead::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'lead_status_id' => $data['lead_status_id'] ?? null,
            'lead_source_id' => $data['lead_source_id'] ?? null,
            'assigned_user_id' => $data['assigned_user_id'] ?? $user->id,
            'temperature' => $data['temperature'] ?? 'warm',
            'next_follow_up_at' => $data['next_follow_up_at'] ?? null,
            'notes' => $data['notes'] ?? null,
            'created_by' => $user->id,
        ]);

        $this->logger->log('lead.created', $lead);

        $this->dealService->createFromLead($lead, $user);

        $this->automation->runForTrigger('lead.created', $company, $lead, $user);

        if ($lead->temperature === 'hot') {
            $this->automation->runForTrigger('lead.hot', $company, $lead, $user);
        }

        return $lead;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Lead $lead, array $data): Lead
    {
        $wasHot = $lead->temperature === 'hot';

        $lead->update([
            'lead_status_id' => $data['lead_status_id'] ?? $lead->lead_status_id,
            'temperature' => $data['temperature'] ?? $lead->temperature,
            'next_follow_up_at' => $data['next_follow_up_at'] ?? $lead->next_follow_up_at,
            'notes' => $data['notes'] ?? $lead->notes,
            'assigned_user_id' => $data['assigned_user_id'] ?? $lead->assigned_user_id,
            'account_id' => array_key_exists('account_id', $data)
                ? ($data['account_id'] ?: null)
                : $lead->account_id,
            'contact_id' => array_key_exists('contact_id', $data)
                ? ($data['contact_id'] ?: null)
                : $lead->contact_id,
        ]);

        $this->logger->log('lead.updated', $lead);

        $lead = $lead->fresh();

        if (! $wasHot && $lead->temperature === 'hot' && $lead->company) {
            $this->automation->runForTrigger('lead.hot', $lead->company, $lead, auth()->user());
        }

        return $lead;
    }
}
