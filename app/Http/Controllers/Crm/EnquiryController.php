<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Models\LeadSource;
use App\Models\User;
use App\Services\Crm\EnquiryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnquiryController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;
        $filters = [
            'search' => trim((string) $request->get('search', '')),
            'status' => (string) $request->get('status', ''),
            'source' => (string) $request->get('source', ''),
            'assignee' => (string) $request->get('assignee', ''),
        ];

        $query = Enquiry::query()
            ->with(['source:id,name', 'assignee:id,name', 'lead:id,uuid'])
            ->latest();

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('channel', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if (in_array($filters['status'], [
            Enquiry::STATUS_NEW,
            Enquiry::STATUS_IN_PROGRESS,
            Enquiry::STATUS_CONVERTED,
            Enquiry::STATUS_JUNK,
        ], true)) {
            $query->where('status', $filters['status']);
        }

        if ($filters['source'] !== '') {
            $query->where('lead_source_id', (int) $filters['source']);
        }

        if ($filters['assignee'] !== '') {
            $query->where('assigned_user_id', (int) $filters['assignee']);
        }

        $enquiries = $query
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Enquiry $e) => [
                'id' => $e->id,
                'uuid' => $e->uuid,
                'name' => $e->name,
                'email' => $e->email,
                'phone' => $e->phone,
                'status' => $e->status,
                'channel' => $e->channel,
                'message' => $e->message,
                'source' => $e->source?->name,
                'assignee' => $e->assignee?->name,
                'lead_id' => $e->lead_id,
                'created_at' => $e->created_at?->diffForHumans(),
            ]);

        return Inertia::render('Enquiries/Index', [
            'enquiries' => $enquiries,
            'filters' => $filters,
            'sources' => LeadSource::query()->orderBy('sort_order')->get(['id', 'name']),
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'openCreate' => $request->boolean('create'),
            'roundRobinEnabled' => (bool) ($company->settings['lead_assignment']['enabled'] ?? false),
            'stats' => [
                'new' => Enquiry::query()->where('status', Enquiry::STATUS_NEW)->count(),
                'in_progress' => Enquiry::query()->where('status', Enquiry::STATUS_IN_PROGRESS)->count(),
                'converted' => Enquiry::query()->where('status', Enquiry::STATUS_CONVERTED)->count(),
            ],
        ]);
    }

    public function store(Request $request, EnquiryService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'channel' => 'nullable|string|max:40',
            'message' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->create($request->user()->company, $request->user(), $data);

        return redirect()->route('enquiries.index')
            ->with('success', 'Enquiry captured successfully.');
    }

    public function convert(Enquiry $enquiry, Request $request, EnquiryService $service): RedirectResponse
    {
        $this->authorizeEnquiry($enquiry, $request);

        if ($enquiry->isConverted()) {
            return redirect()->route('leads.index')
                ->with('success', 'Enquiry was already converted to a lead.');
        }

        $lead = $service->convertToLead($enquiry, $request->user());

        return redirect()->route('leads.index')
            ->with('success', "Lead created from enquiry: {$lead->name}");
    }

    public function bulkConvert(Request $request, EnquiryService $service): RedirectResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:enquiries,id',
        ]);

        $enquiries = Enquiry::query()
            ->whereIn('id', $data['ids'])
            ->get();

        $converted = 0;
        foreach ($enquiries as $enquiry) {
            $this->authorizeEnquiry($enquiry, $request);
            if ($enquiry->isConverted()) {
                continue;
            }
            $service->convertToLead($enquiry, $request->user());
            $converted++;
        }

        return redirect()->route('enquiries.index')
            ->with('success', $converted > 0
                ? "{$converted} enquiry(s) converted to leads."
                : 'Selected enquiries were already converted.');
    }

    private function authorizeEnquiry(Enquiry $enquiry, Request $request): void
    {
        if ($enquiry->company_id !== $request->user()->company_id) {
            abort(403);
        }
    }
}
