<?php

namespace App\Services\Crm;

use App\Models\Account;
use App\Models\Company;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Http\UploadedFile;

class CsvImportService
{
    public function __construct(
        private ActivityLogger $logger,
        private AccountService $accounts,
        private ContactService $contacts,
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
