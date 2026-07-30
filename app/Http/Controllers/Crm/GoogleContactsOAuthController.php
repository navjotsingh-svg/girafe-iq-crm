<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\Integrations\GoogleContactsOAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

class GoogleContactsOAuthController extends Controller
{
    public function connect(Request $request, GoogleContactsOAuthService $google): RedirectResponse
    {
        $user = $request->user();
        $company = $user?->company;

        if (! $user || ! $company) {
            return redirect()->route('login')->with('status', 'Please log in to connect Gmail.');
        }

        if (! $google->isConfigured()) {
            return redirect()
                ->route('contacts.index')
                ->with('error', 'Gmail import is not configured. Ask your admin to set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
        }

        $state = $google->makeState($company);
        $request->session()->put('google_contacts_oauth_state', $state);

        return redirect()->away($google->authorizationUrl($company, $state));
    }

    public function callback(Request $request, GoogleContactsOAuthService $google): RedirectResponse
    {
        if ($request->filled('error')) {
            return redirect()
                ->route('contacts.index')
                ->with('error', 'Gmail connection cancelled: '.$request->get('error_description', $request->get('error')));
        }

        $state = (string) $request->get('state', '');
        $sessionState = (string) $request->session()->pull('google_contacts_oauth_state', '');

        if ($state === '' || ! hash_equals($sessionState, $state)) {
            return redirect()
                ->route('contacts.index')
                ->with('error', 'Invalid Gmail OAuth state. Please try again.');
        }

        try {
            $companyId = $google->parseState($state);
            $company = Company::query()->findOrFail($companyId);

            if (! $request->user() || $request->user()->company_id !== $company->id) {
                return redirect()
                    ->route('login')
                    ->with('status', 'Please log in and connect Gmail again.');
            }

            $code = (string) $request->get('code', '');
            if ($code === '') {
                throw new \RuntimeException('Missing authorization code from Google.');
            }

            $google->handleCallback($company, $code);

            return redirect()
                ->route('contacts.index', ['gmail' => 1])
                ->with('success', 'Gmail connected. Click “Sync from Gmail” to import your contacts.');
        } catch (Throwable $e) {
            return redirect()
                ->route('contacts.index')
                ->with('error', 'Gmail connection failed: '.$e->getMessage());
        }
    }

    public function sync(Request $request, GoogleContactsOAuthService $google): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        try {
            $result = $google->syncContacts($user->company, $user);

            $message = "Imported {$result['imported']} contacts from Gmail";
            if ($result['skipped'] > 0) {
                $message .= ", skipped {$result['skipped']}";
            }

            return redirect()
                ->route('contacts.index')
                ->with('success', $message.'.')
                ->with('import_errors', $result['errors']);
        } catch (Throwable $e) {
            return redirect()
                ->route('contacts.index')
                ->with('error', 'Gmail sync failed: '.$e->getMessage());
        }
    }

    public function disconnect(Request $request, GoogleContactsOAuthService $google): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $google->disconnect($user->company);

        return redirect()
            ->route('contacts.index')
            ->with('success', 'Gmail disconnected.');
    }
}
