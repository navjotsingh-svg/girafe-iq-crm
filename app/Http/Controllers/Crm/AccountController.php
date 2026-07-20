<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\User;
use App\Services\Crm\AccountService;
use App\Services\Crm\CsvImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;

        $accounts = Account::query()
            ->with(['assignee:id,name'])
            ->withCount(['contacts', 'leads'])
            ->latest()
            ->paginate(15)
            ->through(fn (Account $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'email' => $a->email,
                'phone' => $a->phone,
                'industry' => $a->industry,
                'city' => $a->city,
                'status' => $a->status,
                'contacts_count' => $a->contacts_count,
                'leads_count' => $a->leads_count,
                'assignee' => $a->assignee?->name,
            ]);

        return Inertia::render('Companies/Index', [
            'accounts' => $accounts,
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'stats' => [
                'total' => Account::query()->count(),
                'active' => Account::query()->where('status', Account::STATUS_ACTIVE)->count(),
            ],
        ]);
    }

    public function show(Account $account, Request $request): Response
    {
        if ($account->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $account->load([
            'assignee:id,name',
            'contacts' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('first_name'),
            'leads:id,name,temperature,account_id',
        ]);

        $company = $request->user()->company;

        return Inertia::render('Companies/Show', [
            'account' => [
                'id' => $account->id,
                'name' => $account->name,
                'legal_name' => $account->legal_name,
                'email' => $account->email,
                'phone' => $account->phone,
                'website' => $account->website,
                'industry' => $account->industry,
                'city' => $account->city,
                'state' => $account->state,
                'country' => $account->country,
                'status' => $account->status,
                'notes' => $account->notes,
                'assignee' => $account->assignee,
                'contacts' => $account->contacts->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->fullName(),
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'job_title' => $c->job_title,
                    'is_primary' => $c->is_primary,
                ]),
                'leads' => $account->leads->map(fn ($l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'temperature' => $l->temperature,
                ]),
            ],
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, AccountService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'website' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->create($request->user()->company, $request->user(), $data);

        return redirect()->route('companies.index')
            ->with('success', 'Company account created.');
    }

    public function update(Account $account, Request $request, AccountService $service): RedirectResponse
    {
        if ($account->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'website' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->update($account, $data);

        return back()->with('success', 'Company updated.');
    }

    public function import(Request $request, CsvImportService $import): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $result = $import->importAccounts(
            $request->user()->company,
            $request->user(),
            $request->file('file')
        );

        $message = "Imported {$result['imported']} companies";
        if ($result['skipped'] > 0) {
            $message .= ", skipped {$result['skipped']}";
        }

        return redirect()
            ->route('companies.index')
            ->with('success', $message.'.')
            ->with('import_errors', $result['errors']);
    }

    public function sampleCsv(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['name', 'email', 'phone', 'website', 'industry', 'city', 'country', 'notes']);
            fputcsv($out, ['Acme Corp', 'hello@acme.com', '+919876543210', 'https://acme.com', 'Manufacturing', 'Pune', 'India', 'Sample row']);
            fclose($out);
        }, 'companies-sample.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
