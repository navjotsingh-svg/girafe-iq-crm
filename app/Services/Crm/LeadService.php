<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;

class LeadService
{
    public function __construct(
        private ActivityLogger $logger,
        private DealService $dealService,
        private AutomationService $automation,
        private LeadAssignmentService $assignment,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): Lead
    {
        $explicit = ! empty($data['assigned_user_id']) ? (int) $data['assigned_user_id'] : null;
        $assignedUserId = $this->assignment->resolveAssigneeId($company, $explicit, $user);

        $lead = Lead::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'lead_status_id' => $data['lead_status_id'] ?? null,
            'lead_source_id' => $data['lead_source_id'] ?? null,
            'assigned_user_id' => $assignedUserId,
            'temperature' => $data['temperature'] ?? 'warm',
            'next_follow_up_at' => $data['next_follow_up_at'] ?? null,
            'notes' => $data['notes'] ?? null,
            'custom_fields' => $data['custom_fields'] ?? null,
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
            'name' => $data['name'] ?? $lead->name,
            'email' => array_key_exists('email', $data) ? ($data['email'] ?: null) : $lead->email,
            'phone' => array_key_exists('phone', $data) ? ($data['phone'] ?: null) : $lead->phone,
            'lead_status_id' => array_key_exists('lead_status_id', $data)
                ? ($data['lead_status_id'] ?: null)
                : $lead->lead_status_id,
            'lead_source_id' => array_key_exists('lead_source_id', $data)
                ? ($data['lead_source_id'] ?: null)
                : $lead->lead_source_id,
            'temperature' => $data['temperature'] ?? $lead->temperature,
            'next_follow_up_at' => array_key_exists('next_follow_up_at', $data)
                ? ($data['next_follow_up_at'] ?: null)
                : $lead->next_follow_up_at,
            'notes' => array_key_exists('notes', $data) ? ($data['notes'] ?: null) : $lead->notes,
            'assigned_user_id' => array_key_exists('assigned_user_id', $data)
                ? ($data['assigned_user_id'] ?: null)
                : $lead->assigned_user_id,
            'account_id' => array_key_exists('account_id', $data)
                ? ($data['account_id'] ?: null)
                : $lead->account_id,
            'contact_id' => array_key_exists('contact_id', $data)
                ? ($data['contact_id'] ?: null)
                : $lead->contact_id,
            'custom_fields' => array_key_exists('custom_fields', $data)
                ? $data['custom_fields']
                : $lead->custom_fields,
        ]);

        // Keep linked deal title in sync with lead name
        if (! empty($data['name'])) {
            Deal::query()
                ->where('lead_id', $lead->id)
                ->update(['title' => $data['name']]);
        }

        $this->logger->log('lead.updated', $lead);

        $lead = $lead->fresh();

        if (! $wasHot && $lead->temperature === 'hot' && $lead->company) {
            $this->automation->runForTrigger('lead.hot', $lead->company, $lead, auth()->user());
        }

        return $lead;
    }
}
