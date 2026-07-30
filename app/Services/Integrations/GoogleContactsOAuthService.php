<?php

namespace App\Services\Integrations;

use App\Models\Account;
use App\Models\Company;
use App\Models\Contact;
use App\Models\User;
use App\Services\Crm\AccountService;
use App\Services\Crm\ContactService;
use App\Services\Tenant\ActivityLogger;
use App\Support\Phone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class GoogleContactsOAuthService
{
    private const SETTINGS_KEY = 'google_contacts';

    public function __construct(
        private ActivityLogger $logger,
        private ContactService $contacts,
        private AccountService $accounts,
    ) {}

    public function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }

    public function redirectUri(): string
    {
        return config('services.google.contacts_redirect_uri')
            ?: url('/contacts/google/callback');
    }

    public function authorizationUrl(Company $company, string $state): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
        }

        $params = [
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => implode(' ', config('services.google.contacts_scopes', [])),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
            'include_granted_scopes' => 'true',
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query($params);
    }

    public function handleCallback(Company $company, string $code): void
    {
        $tokens = $this->exchangeCode($code);
        $accessToken = (string) $tokens['access_token'];
        $profile = $this->fetchProfile($accessToken);

        $existing = $company->settings['integrations'][self::SETTINGS_KEY] ?? [];
        $refreshToken = isset($tokens['refresh_token'])
            ? encrypt((string) $tokens['refresh_token'])
            : ($existing['refresh_token'] ?? null);

        $settings = $company->settings ?? [];
        $settings['integrations'][self::SETTINGS_KEY] = [
            'connected' => true,
            'email' => $profile['email'] ?? null,
            'access_token' => encrypt($accessToken),
            'refresh_token' => $refreshToken,
            'expires_at' => now()->addSeconds((int) ($tokens['expires_in'] ?? 3600))->timestamp,
            'connected_at' => now()->toIso8601String(),
        ];
        $company->update(['settings' => $settings]);

        $this->logger->log('integrations.google_contacts_connected', $company, [
            'email' => $profile['email'] ?? null,
        ]);
    }

    public function disconnect(Company $company): void
    {
        $settings = $company->settings ?? [];
        $settings['integrations'][self::SETTINGS_KEY] = [
            'connected' => false,
            'disconnected_at' => now()->toIso8601String(),
        ];
        $company->update(['settings' => $settings]);

        $this->logger->log('integrations.google_contacts_disconnected', $company);
    }

    public function connectionForUi(Company $company): array
    {
        $stored = $company->settings['integrations'][self::SETTINGS_KEY] ?? [];

        return [
            'configured' => $this->isConfigured(),
            'connected' => (bool) ($stored['connected'] ?? false),
            'email' => $stored['email'] ?? null,
            'connected_at' => $stored['connected_at'] ?? null,
        ];
    }

    public function isConnected(Company $company): bool
    {
        return (bool) ($company->settings['integrations'][self::SETTINGS_KEY]['connected'] ?? false);
    }

    /**
     * @return array{imported: int, skipped: int, errors: list<string>}
     */
    public function syncContacts(Company $company, User $user): array
    {
        if (! $this->isConnected($company)) {
            throw new RuntimeException('Gmail is not connected. Connect your Google account first.');
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $pageToken = null;

        do {
            $response = $this->fetchConnectionsPage($company, $pageToken);
            $people = $response['connections'] ?? [];

            foreach ($people as $person) {
                $mapped = $this->mapPerson($person);
                if ($mapped === null) {
                    $skipped++;

                    continue;
                }

                $resourceName = (string) ($person['resourceName'] ?? '');
                if ($resourceName !== '') {
                    $exists = Contact::query()
                        ->where('company_id', $company->id)
                        ->where('google_resource_name', $resourceName)
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }
                } elseif (! empty($mapped['email'])) {
                    $exists = Contact::query()
                        ->where('company_id', $company->id)
                        ->whereRaw('LOWER(email) = ?', [strtolower($mapped['email'])])
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }
                }

                try {
                    $accountId = null;
                    if (! empty($mapped['company_name'])) {
                        $account = Account::query()
                            ->where('company_id', $company->id)
                            ->where('name', $mapped['company_name'])
                            ->first();

                        if (! $account) {
                            $account = $this->accounts->create($company, $user, [
                                'name' => $mapped['company_name'],
                            ]);
                        }
                        $accountId = $account->id;
                    }

                    $phone = $mapped['phone'];
                    if ($phone !== null && ! $this->isValidPhone($phone)) {
                        $phone = null;
                    }

                    $contact = $this->contacts->create($company, $user, [
                        'account_id' => $accountId,
                        'first_name' => $mapped['first_name'],
                        'last_name' => $mapped['last_name'],
                        'email' => $mapped['email'],
                        'phone' => $phone,
                        'job_title' => $mapped['job_title'],
                    ]);

                    if ($resourceName !== '') {
                        $contact->update(['google_resource_name' => $resourceName]);
                    }

                    $imported++;
                } catch (Throwable $e) {
                    $skipped++;
                    if (count($errors) < 20) {
                        $errors[] = ($mapped['first_name'] ?? 'Contact').': '.$e->getMessage();
                    }
                }
            }

            $pageToken = $response['nextPageToken'] ?? null;
        } while ($pageToken);

        $this->logger->log('integrations.google_contacts_synced', $company, [
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    public function makeState(Company $company): string
    {
        return encrypt([
            'company_id' => $company->id,
            'nonce' => Str::random(16),
            'exp' => now()->addMinutes(15)->timestamp,
        ]);
    }

    public function parseState(string $state): int
    {
        try {
            $payload = decrypt($state);
        } catch (Throwable) {
            throw new RuntimeException('Invalid OAuth state.');
        }

        if (! is_array($payload)
            || empty($payload['company_id'])
            || empty($payload['exp'])
            || $payload['exp'] < now()->timestamp) {
            throw new RuntimeException('OAuth state expired. Please try connecting again.');
        }

        return (int) $payload['company_id'];
    }

    /**
     * @return array<string, mixed>
     */
    private function exchangeCode(string $code): array
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => $this->redirectUri(),
            'grant_type' => 'authorization_code',
        ]);

        if (! $response->successful() || ! $response->json('access_token')) {
            throw new RuntimeException('Google token exchange failed: '.$response->body());
        }

        return $response->json();
    }

    /**
     * @return array{email?: string}
     */
    private function fetchProfile(string $accessToken): array
    {
        $response = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v2/userinfo');

        if (! $response->successful()) {
            return [];
        }

        return [
            'email' => $response->json('email'),
        ];
    }

    /**
     * @return array{connections?: list<array<string, mixed>>, nextPageToken?: string}
     */
    private function fetchConnectionsPage(Company $company, ?string $pageToken): array
    {
        $accessToken = $this->accessToken($company);

        $response = Http::withToken($accessToken)
            ->timeout(60)
            ->get('https://people.googleapis.com/v1/people/me/connections', [
                'personFields' => 'names,emailAddresses,phoneNumbers,organizations',
                'pageSize' => 500,
                'pageToken' => $pageToken,
                'sortOrder' => 'LAST_MODIFIED_DESCENDING',
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Failed to fetch Google contacts: '.$response->body());
        }

        return $response->json();
    }

    private function accessToken(Company $company): string
    {
        $stored = $company->fresh()->settings['integrations'][self::SETTINGS_KEY] ?? [];
        $expiresAt = (int) ($stored['expires_at'] ?? 0);

        if (! empty($stored['access_token']) && $expiresAt > now()->addMinute()->timestamp) {
            return decrypt((string) $stored['access_token']);
        }

        if (empty($stored['refresh_token'])) {
            throw new RuntimeException('Google session expired. Please reconnect Gmail.');
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => decrypt((string) $stored['refresh_token']),
            'grant_type' => 'refresh_token',
        ]);

        if (! $response->successful() || ! $response->json('access_token')) {
            Log::warning('Google token refresh failed', ['body' => $response->body()]);
            throw new RuntimeException('Google session expired. Please reconnect Gmail.');
        }

        $accessToken = (string) $response->json('access_token');
        $settings = $company->settings ?? [];
        $settings['integrations'][self::SETTINGS_KEY]['access_token'] = encrypt($accessToken);
        $settings['integrations'][self::SETTINGS_KEY]['expires_at'] = now()
            ->addSeconds((int) ($response->json('expires_in') ?? 3600))
            ->timestamp;
        $company->update(['settings' => $settings]);

        return $accessToken;
    }

    /**
     * @param  array<string, mixed>  $person
     * @return array{
     *   first_name: string,
     *   last_name?: string|null,
     *   email?: string|null,
     *   phone?: string|null,
     *   job_title?: string|null,
     *   company_name?: string|null
     * }|null
     */
    private function mapPerson(array $person): ?array
    {
        $names = $person['names'][0] ?? [];
        $firstName = trim((string) ($names['givenName'] ?? ''));
        $lastName = $this->nullIfEmpty($names['familyName'] ?? null);
        $displayName = trim((string) ($names['displayName'] ?? ''));

        if ($firstName === '' && $displayName !== '') {
            $parts = preg_split('/\s+/', $displayName, 2) ?: [];
            $firstName = $parts[0] ?? '';
            $lastName = $lastName ?: ($parts[1] ?? null);
        }

        if ($firstName === '') {
            return null;
        }

        $emails = $person['emailAddresses'] ?? [];
        $email = null;
        foreach ($emails as $entry) {
            $value = $this->nullIfEmpty($entry['value'] ?? null);
            if ($value !== null) {
                $email = $value;
                break;
            }
        }

        $phones = $person['phoneNumbers'] ?? [];
        $phone = null;
        foreach ($phones as $entry) {
            $value = $this->nullIfEmpty($entry['value'] ?? null);
            if ($value !== null) {
                $phone = $value;
                break;
            }
        }

        $orgs = $person['organizations'] ?? [];
        $jobTitle = null;
        $companyName = null;
        foreach ($orgs as $org) {
            $jobTitle = $jobTitle ?: $this->nullIfEmpty($org['title'] ?? null);
            $companyName = $companyName ?: $this->nullIfEmpty($org['name'] ?? null);
            if ($jobTitle && $companyName) {
                break;
            }
        }

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'job_title' => $jobTitle,
            'company_name' => $companyName,
        ];
    }

    private function isValidPhone(string $phone): bool
    {
        $digits = Phone::digitCount($phone);
        $min = Phone::minDigits();
        $max = Phone::maxDigits();

        return $digits >= $min && $digits <= $max && strlen($phone) <= (int) config('girafe.phone.max_chars', 30);
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
