<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Enquiry;
use App\Models\Lead;
use App\Models\LeadStatus;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Facades\DB;

class EnquiryService
{
    public function __construct(
        private ActivityLogger $logger,
        private DealService $dealService,
        private AutomationService $automation,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): Enquiry
    {
        $enquiry = Enquiry::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'lead_source_id' => $data['lead_source_id'] ?? null,
            'channel' => $data['channel'] ?? null,
            'message' => $data['message'] ?? null,
            'assigned_user_id' => $data['assigned_user_id'] ?? $user->id,
            'created_by' => $user->id,
            'status' => Enquiry::STATUS_NEW,
        ]);

        $this->logger->log('enquiry.created', $enquiry);

        $this->automation->runForTrigger('enquiry.created', $company, $enquiry, $user);

        return $enquiry;
    }

    public function convertToLead(Enquiry $enquiry, User $user): Lead
    {
        if ($enquiry->isConverted()) {
            return $enquiry->lead;
        }

        return DB::transaction(function () use ($enquiry, $user) {
            $defaultStatus = LeadStatus::query()
                ->where('company_id', $enquiry->company_id)
                ->where('is_default', true)
                ->first()
                ?? LeadStatus::query()
                    ->where('company_id', $enquiry->company_id)
                    ->orderBy('sort_order')
                    ->first();

            $lead = Lead::create([
                'company_id' => $enquiry->company_id,
                'enquiry_id' => $enquiry->id,
                'name' => $enquiry->name,
                'email' => $enquiry->email,
                'phone' => $enquiry->phone,
                'lead_status_id' => $defaultStatus?->id,
                'lead_source_id' => $enquiry->lead_source_id,
                'assigned_user_id' => $enquiry->assigned_user_id ?? $user->id,
                'temperature' => 'warm',
                'notes' => $enquiry->message,
                'created_by' => $user->id,
            ]);

            $enquiry->update([
                'status' => Enquiry::STATUS_CONVERTED,
                'converted_at' => now(),
                'lead_id' => $lead->id,
            ]);

            $this->logger->log('enquiry.converted', $enquiry, ['lead_id' => $lead->id]);
            $this->logger->log('lead.created', $lead, ['from_enquiry' => $enquiry->id]);

            $this->dealService->createFromLead($lead, $user);

            $this->automation->runForTrigger('lead.created', $enquiry->company, $lead, $user);

            return $lead;
        });
    }
}
