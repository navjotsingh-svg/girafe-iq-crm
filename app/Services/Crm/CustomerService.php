<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;

class CustomerService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    public function createFromDeal(Deal $deal, User $user): ?Customer
    {
        if (! $deal->isWon()) {
            return null;
        }

        $existing = Customer::query()->where('deal_id', $deal->id)->first();
        if ($existing) {
            return $existing;
        }

        $deal->loadMissing('lead');

        $customer = Customer::create([
            'company_id' => $deal->company_id,
            'lead_id' => $deal->lead_id,
            'deal_id' => $deal->id,
            'name' => $deal->lead?->name ?? $deal->title,
            'email' => $deal->lead?->email,
            'phone' => $deal->lead?->phone,
            'status' => Customer::STATUS_ACTIVE,
            'lifetime_value' => $deal->value ?? 0,
            'currency' => $deal->currency ?? 'INR',
            'notes' => $deal->notes,
            'assigned_user_id' => $deal->assigned_user_id ?? $user->id,
            'created_by' => $user->id,
            'converted_at' => $deal->won_at ?? now(),
        ]);

        $this->logger->log('customer.created', $customer, [
            'from_deal' => $deal->id,
            'lead_id' => $deal->lead_id,
        ]);

        return $customer;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): Customer
    {
        $customer = Customer::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'status' => $data['status'] ?? Customer::STATUS_ACTIVE,
            'lifetime_value' => $data['lifetime_value'] ?? 0,
            'currency' => $company->currency ?? 'INR',
            'notes' => $data['notes'] ?? null,
            'assigned_user_id' => $data['assigned_user_id'] ?? $user->id,
            'created_by' => $user->id,
            'converted_at' => now(),
        ]);

        $this->logger->log('customer.created', $customer);

        return $customer;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Customer $customer, array $data): Customer
    {
        $customer->update([
            'name' => $data['name'] ?? $customer->name,
            'email' => $data['email'] ?? $customer->email,
            'phone' => $data['phone'] ?? $customer->phone,
            'status' => $data['status'] ?? $customer->status,
            'lifetime_value' => $data['lifetime_value'] ?? $customer->lifetime_value,
            'notes' => $data['notes'] ?? $customer->notes,
            'assigned_user_id' => $data['assigned_user_id'] ?? $customer->assigned_user_id,
        ]);

        $this->logger->log('customer.updated', $customer);

        return $customer->fresh();
    }
}
