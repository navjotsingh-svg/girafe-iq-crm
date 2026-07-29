<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Models\FollowUp;
use App\Models\LeadSource;
use App\Models\User;
use App\Services\Crm\EnquiryService;
use App\Services\Crm\FollowUpService;
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
            ->withCount([
                'followUps as notes_count' => fn ($q) => $q->where('status', FollowUp::STATUS_COMPLETED),
                'followUps as follow_ups_count' => fn ($q) => $q->where('status', FollowUp::STATUS_PENDING),
            ])
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
                'notes_count' => (int) $e->notes_count,
                'follow_ups_count' => (int) $e->follow_ups_count,
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

    public function show(Enquiry $enquiry, Request $request): Response
    {
        $this->authorizeEnquiry($enquiry, $request);

        $company = $request->user()->company;
        $enquiry->load(['source:id,name', 'assignee:id,name', 'lead:id,name']);

        $items = FollowUp::query()
            ->with(['taskType:id,name,slug,color', 'assignee:id,name'])
            ->where('enquiry_id', $enquiry->id)
            ->latest()
            ->get()
            ->map(fn (FollowUp $f) => [
                'id' => $f->id,
                'title' => $f->title,
                'description' => $f->description,
                'status' => $f->status,
                'due_at' => $f->due_at?->toIso8601String(),
                'completed_at' => $f->completed_at?->toIso8601String(),
                'task_type' => $f->taskType?->only(['id', 'name', 'slug', 'color']),
                'assignee' => $f->assignee?->name,
                'is_overdue' => $f->isOverdue(),
            ]);

        return Inertia::render('Enquiries/Show', [
            'enquiry' => [
                'id' => $enquiry->id,
                'name' => $enquiry->name,
                'email' => $enquiry->email,
                'phone' => $enquiry->phone,
                'status' => $enquiry->status,
                'channel' => $enquiry->channel,
                'message' => $enquiry->message,
                'source' => $enquiry->source?->name,
                'assignee' => $enquiry->assignee?->name,
                'lead_id' => $enquiry->lead_id,
                'lead_name' => $enquiry->lead?->name,
                'created_at' => $enquiry->created_at?->toIso8601String(),
            ],
            'notes' => $items->where('status', FollowUp::STATUS_COMPLETED)->values(),
            'followUps' => $items->where('status', FollowUp::STATUS_PENDING)->values(),
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, EnquiryService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => \App\Support\Phone::rules(),
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'channel' => 'nullable|string|max:40',
            'message' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->create($request->user()->company, $request->user(), $data);

        return redirect()->route('enquiries.index')
            ->with('success', 'Enquiry captured successfully.');
    }

    public function log(Enquiry $enquiry, Request $request, FollowUpService $service): RedirectResponse
    {
        $this->authorizeEnquiry($enquiry, $request);

        $data = $request->validate([
            'kind' => 'required|in:note,call',
            'description' => 'required|string|max:5000',
            'outcome' => 'nullable|string|max:100',
            'duration_minutes' => 'nullable|integer|min:1|max:600',
        ]);

        $service->logAgainstEnquiry($request->user()->company, $request->user(), $enquiry, $data);

        if ($enquiry->status === Enquiry::STATUS_NEW) {
            $enquiry->update(['status' => Enquiry::STATUS_IN_PROGRESS]);
        }

        return redirect()->route('enquiries.show', $enquiry)
            ->with('success', $data['kind'] === 'call' ? 'Call logged.' : 'Comment added.');
    }

    public function scheduleFollowUp(Enquiry $enquiry, Request $request, FollowUpService $service): RedirectResponse
    {
        $this->authorizeEnquiry($enquiry, $request);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'due_at' => 'required|date',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->create($request->user()->company, $request->user(), [
            'enquiry_id' => $enquiry->id,
            'lead_id' => $enquiry->lead_id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'due_at' => $data['due_at'],
            'assigned_user_id' => $data['assigned_user_id'] ?? $enquiry->assigned_user_id,
            'task_type_id' => $service->defaultTaskTypeId($request->user()->company),
        ]);

        if ($enquiry->status === Enquiry::STATUS_NEW) {
            $enquiry->update(['status' => Enquiry::STATUS_IN_PROGRESS]);
        }

        return redirect()->route('enquiries.show', $enquiry)
            ->with('success', 'Follow-up scheduled.');
    }

    public function convert(Enquiry $enquiry, Request $request, EnquiryService $service): RedirectResponse
    {
        $this->authorizeEnquiry($enquiry, $request);

        if ($enquiry->isConverted()) {
            return redirect()->route('leads.show', $enquiry->lead_id)
                ->with('success', 'Enquiry was already converted to a lead.');
        }

        $lead = $service->convertToLead($enquiry, $request->user());

        return redirect()->route('leads.show', $lead)
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
