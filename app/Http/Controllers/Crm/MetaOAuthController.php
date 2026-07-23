<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\Integrations\MetaOAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

class MetaOAuthController extends Controller
{
    public function connect(Request $request, MetaOAuthService $meta): RedirectResponse
    {
        $user = $request->user();
        $company = $user?->company;

        if (! $user || ! $company) {
            return redirect()
                ->route('login')
                ->with('status', 'Please log in to connect Meta.');
        }

        $user->syncPermissionTeam();

        if (! $user->canManageIntegrations()) {
            return redirect()
                ->route('integrations.index')
                ->with('error', 'Only company admins or managers can connect Meta. Ask your admin to connect the account.');
        }

        if (! $meta->isConfigured()) {
            return redirect()
                ->route('integrations.index')
                ->with('error', 'Meta app is not configured on this CRM. Ask the platform admin to set META_APP_ID and META_APP_SECRET.');
        }

        $state = $meta->makeState($company);
        $request->session()->put('meta_oauth_state', $state);

        return redirect()->away($meta->authorizationUrl($company, $state));
    }

    public function callback(Request $request, MetaOAuthService $meta): RedirectResponse
    {
        if ($request->filled('error')) {
            return redirect()
                ->route('integrations.index')
                ->with('error', 'Meta connection cancelled: '.$request->get('error_description', $request->get('error')));
        }

        $state = (string) $request->get('state', '');
        $sessionState = (string) $request->session()->pull('meta_oauth_state', '');

        if ($state === '' || ! hash_equals($sessionState, $state)) {
            return redirect()
                ->route('integrations.index')
                ->with('error', 'Invalid Meta OAuth state. Please try Connect again.');
        }

        try {
            $companyId = $meta->parseState($state);
            $company = Company::query()->findOrFail($companyId);

            // Must be logged in as that company
            if (! $request->user() || $request->user()->company_id !== $company->id) {
                return redirect()
                    ->route('login')
                    ->with('status', 'Please log in as the company admin and connect Meta again.');
            }

            $code = (string) $request->get('code', '');
            if ($code === '') {
                throw new \RuntimeException('Missing authorization code from Meta.');
            }

            $pages = $meta->handleCallback($company, $code);
            $count = count($pages);

            return redirect()
                ->route('integrations.index')
                ->with('success', $count > 0
                    ? "Meta connected — {$count} Facebook Page(s) linked. Lead Ads will sync into Enquiries."
                    : 'Meta connected, but no Facebook Pages were found on this account.');
        } catch (Throwable $e) {
            return redirect()
                ->route('integrations.index')
                ->with('error', 'Meta connection failed: '.$e->getMessage());
        }
    }

    public function disconnect(Request $request, MetaOAuthService $meta): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $user->syncPermissionTeam();

        if (! $user->canManageIntegrations()) {
            return redirect()
                ->route('integrations.index')
                ->with('error', 'Only company admins or managers can disconnect Meta.');
        }

        $meta->disconnect($user->company);

        return redirect()
            ->route('integrations.index')
            ->with('success', 'Meta account disconnected.');
    }
}
