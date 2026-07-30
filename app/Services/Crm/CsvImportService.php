<?php

namespace App\Services\Crm;

use App\Models\Account;
use App\Models\Company;
use App\Models\CustomFieldDefinition;
use App\Models\Enquiry;
use App\Models\LeadSource;
use App\Models\LeadStatus;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use App\Support\Phone;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CsvImportService
{
    public function __construct(
        private ActivityLogger $logger,
        private AccountService $accounts,
        private ContactService $contacts,
        private EnquiryService $enquiries,
        private LeadService $leads,
    ) {}

    /**
     * @return array{imported: int, skipped: int, errors: list<string>}
     */
    public function importAccounts(Company $company, User $user, UploadedFile $file): array
    {
        $rows = $this->parseCsv($file);
        if ($rows === []) {
            return ['imported' => 0, 'skipped' => 0, 'errors' => ['CSV is empty or invalid.']];
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2; // header is line 1
            $name = trim((string) ($row['name'] ?? $row['company'] ?? $row['company_name'] ?? ''));

            if ($name === '') {
                $skipped++;
                $errors[] = "Line {$line}: missing name";
                continue;
            }

            try {
                $this->accounts->create($company, $user, [
                    'name' => $name,
                    'legal_name' => $row['legal_name'] ?? null,
                    'email' => $this->nullIfEmpty($row['email'] ?? null),
                    'phone' => $this->nullIfEmpty($row['phone'] ?? null),
                    'website' => $this->nullIfEmpty($row['website'] ?? null),
                    'industry' => $this->nullIfEmpty($row['industry'] ?? null),
                    'city' => $this->nullIfEmpty($row['city'] ?? null),
                    'state' => $this->nullIfEmpty($row['state'] ?? null),
                    'country' => $this->nullIfEmpty($row['country'] ?? null),
                    'notes' => $this->nullIfEmpty($row['notes'] ?? null),
                ]);
                $imported++;
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = "Line {$line}: ".$e->getMessage();
            }
        }

        $this->logger->log('import.accounts', $company, [
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 20),
        ];
    }

    /**
     * @return array{imported: int, skipped: int, errors: list<string>}
     */
    public function importContacts(Company $company, User $user, UploadedFile $file): array
    {
        $rows = $this->parseCsv($file);
        if ($rows === []) {
            return ['imported' => 0, 'skipped' => 0, 'errors' => ['CSV is empty or invalid.']];
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2;
            $firstName = trim((string) ($row['first_name'] ?? $row['firstname'] ?? ''));
            $fullName = trim((string) ($row['name'] ?? ''));

            if ($firstName === '' && $fullName !== '') {
                $parts = preg_split('/\s+/', $fullName, 2) ?: [];
                $firstName = $parts[0] ?? '';
                $row['last_name'] = $row['last_name'] ?? ($parts[1] ?? null);
            }

            if ($firstName === '') {
                $skipped++;
                $errors[] = "Line {$line}: missing first_name or name";
                continue;
            }

            $accountId = null;
            $accountName = trim((string) ($row['company'] ?? $row['account'] ?? $row['account_name'] ?? ''));
            if ($accountName !== '') {
                $account = Account::query()
                    ->where('company_id', $company->id)
                    ->where('name', $accountName)
                    ->first();

                if (! $account) {
                    $account = $this->accounts->create($company, $user, ['name' => $accountName]);
                }
                $accountId = $account->id;
            } elseif (! empty($row['account_id'])) {
                $accountId = Account::query()
                    ->where('company_id', $company->id)
                    ->where('id', (int) $row['account_id'])
                    ->value('id');
            }

            try {
                $this->contacts->create($company, $user, [
                    'first_name' => $firstName,
                    'last_name' => $this->nullIfEmpty($row['last_name'] ?? $row['lastname'] ?? null),
                    'email' => $this->nullIfEmpty($row['email'] ?? null),
                    'phone' => $this->nullIfEmpty($row['phone'] ?? null),
                    'job_title' => $this->nullIfEmpty($row['job_title'] ?? $row['title'] ?? null),
                    'account_id' => $accountId,
                    'is_primary' => in_array(strtolower((string) ($row['is_primary'] ?? '')), ['1', 'true', 'yes'], true),
                    'notes' => $this->nullIfEmpty($row['notes'] ?? null),
                ]);
                $imported++;
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = "Line {$line}: ".$e->getMessage();
            }
        }

        $this->logger->log('import.contacts', $company, [
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 20),
        ];
    }

    /**
     * @return array{imported: int, skipped: int, errors: list<string>}
     */
    public function importEnquiries(Company $company, User $user, UploadedFile $file): array
    {
        $rows = $this->parseCsv($file);
        if ($rows === []) {
            return ['imported' => 0, 'skipped' => 0, 'errors' => ['CSV is empty or invalid.']];
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2;
            $name = trim((string) ($row['name'] ?? ''));

            if ($name === '') {
                $skipped++;
                $errors[] = "Line {$line}: missing name";
                continue;
            }

            $payload = [
                'name' => $name,
                'email' => $this->nullIfEmpty($row['email'] ?? null),
                'phone' => $this->nullIfEmpty($row['phone'] ?? null),
            ];

            if ($error = $this->validateImportRow($payload, [
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => Phone::rules(),
            ], $line)) {
                $skipped++;
                $errors[] = $error;
                continue;
            }

            $externalId = $this->nullIfEmpty($row['external_id'] ?? $row['id'] ?? null);
            if ($externalId) {
                $exists = Enquiry::query()
                    ->where('company_id', $company->id)
                    ->where('platform', 'csv_import')
                    ->where('external_id', $externalId)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }
            }

            try {
                $this->enquiries->create($company, $user, [
                    'name' => $name,
                    'email' => $payload['email'],
                    'phone' => $payload['phone'],
                    'lead_source_id' => $this->resolveLeadSourceId(
                        $company,
                        $this->nullIfEmpty($row['source'] ?? $row['lead_source'] ?? null)
                    ),
                    'channel' => $this->nullIfEmpty($row['channel'] ?? null) ?? 'import',
                    'message' => $this->nullIfEmpty($row['message'] ?? $row['notes'] ?? null),
                    'assigned_user_id' => $this->resolveUserId(
                        $company,
                        $this->nullIfEmpty($row['assigned_user'] ?? $row['assignee'] ?? $row['assigned_to'] ?? null)
                    ),
                    'platform' => 'csv_import',
                    'external_id' => $externalId,
                ]);
                $imported++;
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = "Line {$line}: ".$e->getMessage();
            }
        }

        $this->logger->log('import.enquiries', $company, [
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 20),
        ];
    }

    /**
     * @return array{imported: int, skipped: int, errors: list<string>}
     */
    public function importLeads(Company $company, User $user, UploadedFile $file): array
    {
        $rows = $this->parseCsv($file);
        if ($rows === []) {
            return ['imported' => 0, 'skipped' => 0, 'errors' => ['CSV is empty or invalid.']];
        }

        $customFields = CustomFieldDefinition::query()
            ->where('company_id', $company->id)
            ->where('entity', 'lead')
            ->orderBy('sort_order')
            ->get(['key', 'type']);

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2;
            $name = trim((string) ($row['name'] ?? ''));

            if ($name === '') {
                $skipped++;
                $errors[] = "Line {$line}: missing name";
                continue;
            }

            $payload = [
                'name' => $name,
                'email' => $this->nullIfEmpty($row['email'] ?? null),
                'phone' => $this->nullIfEmpty($row['phone'] ?? null),
            ];

            if ($error = $this->validateImportRow($payload, [
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => Phone::rules(required: true),
            ], $line)) {
                $skipped++;
                $errors[] = $error;
                continue;
            }

            $temperature = strtolower((string) ($row['temperature'] ?? 'warm'));
            if (! in_array($temperature, ['cold', 'warm', 'hot'], true)) {
                $skipped++;
                $errors[] = "Line {$line}: temperature must be cold, warm, or hot";
                continue;
            }

            $customFieldValues = [];
            foreach ($customFields as $field) {
                if (! array_key_exists($field->key, $row)) {
                    continue;
                }

                $value = $this->nullIfEmpty($row[$field->key]);
                if ($value === null) {
                    continue;
                }

                if ($field->type === 'boolean') {
                    $customFieldValues[$field->key] = in_array(
                        strtolower($value),
                        ['1', 'true', 'yes', 'y'],
                        true
                    );
                } elseif ($field->type === 'number') {
                    if (! is_numeric($value)) {
                        $skipped++;
                        $errors[] = "Line {$line}: {$field->key} must be a number";
                        continue 2;
                    }
                    $customFieldValues[$field->key] = $value;
                } else {
                    $customFieldValues[$field->key] = $value;
                }
            }

            try {
                $this->leads->create($company, $user, [
                    'name' => $name,
                    'email' => $payload['email'],
                    'phone' => $payload['phone'],
                    'lead_status_id' => $this->resolveLeadStatusId(
                        $company,
                        $this->nullIfEmpty($row['status'] ?? $row['lead_status'] ?? null)
                    ),
                    'lead_source_id' => $this->resolveLeadSourceId(
                        $company,
                        $this->nullIfEmpty($row['source'] ?? $row['lead_source'] ?? null)
                    ),
                    'temperature' => $temperature,
                    'notes' => $this->nullIfEmpty($row['notes'] ?? null),
                    'next_follow_up_at' => $this->nullIfEmpty($row['next_follow_up_at'] ?? $row['follow_up'] ?? null),
                    'assigned_user_id' => $this->resolveUserId(
                        $company,
                        $this->nullIfEmpty($row['assigned_user'] ?? $row['assignee'] ?? $row['assigned_to'] ?? null)
                    ),
                    'custom_fields' => $customFieldValues !== [] ? $customFieldValues : null,
                ]);
                $imported++;
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = "Line {$line}: ".$e->getMessage();
            }
        }

        $this->logger->log('import.leads', $company, [
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 20),
        ];
    }

    private function resolveLeadSourceId(Company $company, ?string $name): ?int
    {
        if ($name === null || $name === '') {
            return null;
        }

        $source = LeadSource::query()
            ->where('company_id', $company->id)
            ->where(function ($q) use ($name) {
                $q->whereRaw('LOWER(name) = ?', [strtolower($name)])
                    ->orWhere('slug', Str::slug($name));
            })
            ->first();

        if ($source) {
            return $source->id;
        }

        $source = LeadSource::create([
            'company_id' => $company->id,
            'name' => $name,
            'slug' => Str::slug($name) ?: 'source',
            'is_active' => true,
            'sort_order' => 99,
        ]);

        return $source->id;
    }

    private function resolveLeadStatusId(Company $company, ?string $name): ?int
    {
        if ($name === null || $name === '') {
            return null;
        }

        return LeadStatus::query()
            ->where('company_id', $company->id)
            ->where(function ($q) use ($name) {
                $q->whereRaw('LOWER(name) = ?', [strtolower($name)])
                    ->orWhere('slug', Str::slug($name));
            })
            ->value('id');
    }

    private function resolveUserId(Company $company, ?string $identifier): ?int
    {
        if ($identifier === null || $identifier === '') {
            return null;
        }

        $user = User::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->whereRaw('LOWER(email) = ?', [strtolower($identifier)])
            ->first();

        if ($user) {
            return $user->id;
        }

        return User::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->whereRaw('LOWER(name) = ?', [strtolower($identifier)])
            ->value('id');
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $rules
     */
    private function validateImportRow(array $data, array $rules, int $line): ?string
    {
        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            return "Line {$line}: ".$validator->errors()->first();
        }

        return null;
    }

    /**
     * @return list<array<string, string>>
     */
    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return [];
        }

        $header = fgetcsv($handle);
        if (! $header) {
            fclose($handle);

            return [];
        }

        $header = array_map(function ($h) {
            $h = strtolower(trim((string) $h));
            $h = preg_replace('/[^a-z0-9_]+/', '_', $h) ?? $h;

            return trim($h, '_');
        }, $header);

        $rows = [];
        while (($data = fgetcsv($handle)) !== false) {
            if (count(array_filter($data, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }
            $row = [];
            foreach ($header as $i => $key) {
                if ($key === '') {
                    continue;
                }
                $row[$key] = isset($data[$i]) ? trim((string) $data[$i]) : '';
            }
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    private function nullIfEmpty(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
