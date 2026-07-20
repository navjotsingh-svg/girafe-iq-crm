<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Contact;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;

class ContactService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): Contact
    {
        $contact = Contact::create([
            'company_id' => $company->id,
            'account_id' => $data['account_id'] ?? null,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'job_title' => $data['job_title'] ?? null,
            'is_primary' => (bool) ($data['is_primary'] ?? false),
            'status' => $data['status'] ?? 'active',
            'notes' => $data['notes'] ?? null,
            'assigned_user_id' => $data['assigned_user_id'] ?? $user->id,
            'created_by' => $user->id,
        ]);

        if ($contact->is_primary && $contact->account_id) {
            Contact::query()
                ->where('account_id', $contact->account_id)
                ->where('id', '!=', $contact->id)
                ->update(['is_primary' => false]);
        }

        $this->logger->log('contact.created', $contact);

        return $contact;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Contact $contact, array $data): Contact
    {
        $contact->update([
            'account_id' => $data['account_id'] ?? $contact->account_id,
            'first_name' => $data['first_name'] ?? $contact->first_name,
            'last_name' => $data['last_name'] ?? $contact->last_name,
            'email' => $data['email'] ?? $contact->email,
            'phone' => $data['phone'] ?? $contact->phone,
            'job_title' => $data['job_title'] ?? $contact->job_title,
            'is_primary' => array_key_exists('is_primary', $data)
                ? (bool) $data['is_primary']
                : $contact->is_primary,
            'status' => $data['status'] ?? $contact->status,
            'notes' => $data['notes'] ?? $contact->notes,
            'assigned_user_id' => $data['assigned_user_id'] ?? $contact->assigned_user_id,
        ]);

        if ($contact->is_primary && $contact->account_id) {
            Contact::query()
                ->where('account_id', $contact->account_id)
                ->where('id', '!=', $contact->id)
                ->update(['is_primary' => false]);
        }

        $this->logger->log('contact.updated', $contact);

        return $contact->fresh();
    }
}
