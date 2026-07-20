<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Contact;
use App\Models\User;
use App\Services\Crm\ContactService;
use App\Services\Crm\CsvImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;

        $contacts = Contact::query()
            ->with(['account:id,name', 'assignee:id,name'])
            ->latest()
            ->paginate(15)
            ->through(fn (Contact $c) => [
                'id' => $c->id,
                'name' => $c->fullName(),
                'first_name' => $c->first_name,
                'last_name' => $c->last_name,
                'email' => $c->email,
                'phone' => $c->phone,
                'job_title' => $c->job_title,
                'is_primary' => $c->is_primary,
                'status' => $c->status,
                'account' => $c->account ? [
                    'id' => $c->account->id,
                    'name' => $c->account->name,
                ] : null,
                'assignee' => $c->assignee?->name,
            ]);

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
            'accounts' => Account::query()->orderBy('name')->get(['id', 'name']),
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'stats' => [
                'total' => Contact::query()->count(),
                'primary' => Contact::query()->where('is_primary', true)->count(),
            ],
        ]);
    }

    public function store(Request $request, ContactService $service): RedirectResponse
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'job_title' => 'nullable|string|max:100',
            'account_id' => 'nullable|exists:accounts,id',
            'is_primary' => 'nullable|boolean',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->create($request->user()->company, $request->user(), $data);

        if ($request->boolean('redirect_account') && ! empty($data['account_id'])) {
            return redirect()
                ->route('companies.show', $data['account_id'])
                ->with('success', 'Contact added.');
        }

        return redirect()->route('contacts.index')
            ->with('success', 'Contact created.');
    }

    public function update(Contact $contact, Request $request, ContactService $service): RedirectResponse
    {
        if ($contact->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $data = $request->validate([
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'job_title' => 'nullable|string|max:100',
            'account_id' => 'nullable|exists:accounts,id',
            'is_primary' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->update($contact, $data);

        return back()->with('success', 'Contact updated.');
    }

    public function import(Request $request, CsvImportService $import): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $result = $import->importContacts(
            $request->user()->company,
            $request->user(),
            $request->file('file')
        );

        $message = "Imported {$result['imported']} contacts";
        if ($result['skipped'] > 0) {
            $message .= ", skipped {$result['skipped']}";
        }

        return redirect()
            ->route('contacts.index')
            ->with('success', $message.'.')
            ->with('import_errors', $result['errors']);
    }

    public function sampleCsv(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['first_name', 'last_name', 'email', 'phone', 'job_title', 'company', 'is_primary', 'notes']);
            fputcsv($out, ['Riya', 'Shah', 'riya@acme.com', '+919811122233', 'Buyer', 'Acme Corp', 'yes', 'Sample contact']);
            fclose($out);
        }, 'contacts-sample.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
