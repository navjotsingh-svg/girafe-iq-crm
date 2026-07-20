<?php

namespace App\Services\Crm;

use App\Models\Account;
use App\Models\Company;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;

class AccountService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): Account
    {
        $account = Account::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'legal_name' => $data['legal_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'website' => $data['website'] ?? null,
            'industry' => $data['industry'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'country' => $data['country'] ?? $company->country,
            'status' => $data['status'] ?? Account::STATUS_ACTIVE,
            'notes' => $data['notes'] ?? null,
            'assigned_user_id' => $data['assigned_user_id'] ?? $user->id,
            'created_by' => $user->id,
        ]);

        $this->logger->log('account.created', $account);

        return $account;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Account $account, array $data): Account
    {
        $account->update([
            'name' => $data['name'] ?? $account->name,
            'legal_name' => $data['legal_name'] ?? $account->legal_name,
            'email' => $data['email'] ?? $account->email,
            'phone' => $data['phone'] ?? $account->phone,
            'website' => $data['website'] ?? $account->website,
            'industry' => $data['industry'] ?? $account->industry,
            'city' => $data['city'] ?? $account->city,
            'state' => $data['state'] ?? $account->state,
            'country' => $data['country'] ?? $account->country,
            'status' => $data['status'] ?? $account->status,
            'notes' => $data['notes'] ?? $account->notes,
            'assigned_user_id' => $data['assigned_user_id'] ?? $account->assigned_user_id,
        ]);

        $this->logger->log('account.updated', $account);

        return $account->fresh();
    }
}
