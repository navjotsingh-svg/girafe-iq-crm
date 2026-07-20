<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\ActivityLog;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enquiry;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStatus;
use App\Models\TaskType;
use App\Models\User;
use App\Services\Crm\LeadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;

        $leads = Lead::query()
            ->with(['status:id,name,color', 'source:id,name', 'assignee:id,name'])
            ->latest()
            ->paginate(15)
            ->through(fn (Lead $l) => [
                'id' => $l->id,
                'uuid' => $l->uuid,
                'name' => $l->name,
                'email' => $l->email,
                'phone' => $l->phone,
                'temperature' => $l->temperature,
                'status' => $l->status ? [
                    'name' => $l->status->name,
                    'color' => $l->status->color,
                ] : null,
                'source' => $l->source?->name,
                'assignee' => $l->assignee?->name,
                'next_follow_up_at' => $l->next_follow_up_at?->toIso8601String(),
                'created_at' => $l->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Leads/Index', [
            'leads' => $leads,
            'statuses' => LeadStatus::query()->orderBy('sort_order')->get(['id', 'name', 'color']),
            'sources' => LeadSource::query()->orderBy('sort_order')->get(['id', 'name']),
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'stats' => [
                'total' => Lead::query()->count(),
                'hot' => Lead::query()->where('temperature', 'hot')->count(),
                'due_today' => Lead::query()
                    ->whereDate('next_follow_up_at', today())
                    ->count(),
            ],
        ]);
    }

    public function show(Lead $lead, Request $request): Response
    {
        if ($lead->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $lead->load([
            'status:id,name,color',
            'source:id,name',
            'assignee:id,name',
            'enquiry:id,name,status,created_at',
            'deal.stage:id,name,color',
            'account:id,name',
            'contact:id,first_name,last_name,email,phone',
            'followUps.taskType:id,name,color',
            'followUps.assignee:id,name',
        ]);

        $followUpIds = $lead->followUps->pluck('id');
        $dealId = $lead->deal?->id;

        $activities = ActivityLog::query()
            ->with('user:id,name')
            ->where(function ($q) use ($lead, $followUpIds, $dealId) {
                $q->where(fn ($q) => $q
                    ->where('subject_type', Lead::class)
                    ->where('subject_id', $lead->id));

                if ($lead->enquiry_id) {
                    $q->orWhere(fn ($q) => $q
                        ->where('subject_type', Enquiry::class)
                        ->where('subject_id', $lead->enquiry_id));
                }

                if ($followUpIds->isNotEmpty()) {
                    $q->orWhere(fn ($q) => $q
                        ->where('subject_type', FollowUp::class)
                        ->whereIn('subject_id', $followUpIds));
                }

                if ($dealId) {
                    $q->orWhere(fn ($q) => $q
                        ->where('subject_type', Deal::class)
                        ->where('subject_id', $dealId));
                }
            })
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'user' => $log->user?->name ?? 'System',
                'properties' => $log->properties,
                'created_at' => $log->created_at?->diffForHumans(),
            ]);

        $company = $request->user()->company;

        return Inertia::render('Leads/Show', [
            'lead' => [
                'id' => $lead->id,
                'uuid' => $lead->uuid,
                'name' => $lead->name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'temperature' => $lead->temperature,
                'notes' => $lead->notes,
                'next_follow_up_at' => $lead->next_follow_up_at?->toIso8601String(),
                'created_at' => $lead->created_at?->toIso8601String(),
                'status' => $lead->status,
                'source' => $lead->source,
                'assignee' => $lead->assignee,
                'enquiry' => $lead->enquiry ? [
                    'id' => $lead->enquiry->id,
                    'name' => $lead->enquiry->name,
                    'status' => $lead->enquiry->status,
                    'created_at' => $lead->enquiry->created_at?->diffForHumans(),
                ] : null,
                'deal' => $lead->deal ? [
                    'id' => $lead->deal->id,
                    'title' => $lead->deal->title,
                    'value' => (float) $lead->deal->value,
                    'currency' => $lead->deal->currency,
                    'stage' => $lead->deal->stage,
                ] : null,
                'account' => $lead->account ? [
                    'id' => $lead->account->id,
                    'name' => $lead->account->name,
                ] : null,
                'contact' => $lead->contact ? [
                    'id' => $lead->contact->id,
                    'name' => $lead->contact->fullName(),
                    'email' => $lead->contact->email,
                    'phone' => $lead->contact->phone,
                ] : null,
                'account_id' => $lead->account_id,
                'contact_id' => $lead->contact_id,
            ],
            'followUps' => $lead->followUps->map(fn (FollowUp $f) => [
                'id' => $f->id,
                'title' => $f->title,
                'description' => $f->description,
                'status' => $f->status,
                'due_at' => $f->due_at?->toIso8601String(),
                'completed_at' => $f->completed_at?->toIso8601String(),
                'task_type' => $f->taskType,
                'assignee' => $f->assignee?->name,
                'is_overdue' => $f->isOverdue(),
            ]),
            'activities' => $activities,
            'statuses' => LeadStatus::query()->orderBy('sort_order')->get(['id', 'name', 'color']),
            'taskTypes' => TaskType::query()->orderBy('sort_order')->get(['id', 'name', 'color']),
            'accounts' => Account::query()->orderBy('name')->get(['id', 'name']),
            'contacts' => Contact::query()
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'account_id', 'email'])
                ->map(fn (Contact $c) => [
                    'id' => $c->id,
                    'name' => $c->fullName(),
                    'account_id' => $c->account_id,
                    'email' => $c->email,
                ]),
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, LeadService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'lead_status_id' => 'nullable|exists:lead_statuses,id',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'temperature' => 'nullable|in:cold,warm,hot',
            'next_follow_up_at' => 'nullable|date',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $service->create($request->user()->company, $request->user(), $data);

        return redirect()->route('leads.index')
            ->with('success', 'Lead created successfully.');
    }

    public function update(Lead $lead, Request $request, LeadService $service): RedirectResponse
    {
        if ($lead->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $data = $request->validate([
            'lead_status_id' => 'nullable|exists:lead_statuses,id',
            'temperature' => 'nullable|in:cold,warm,hot',
            'next_follow_up_at' => 'nullable|date',
            'notes' => 'nullable|string|max:5000',
            'assigned_user_id' => 'nullable|exists:users,id',
            'account_id' => 'nullable|exists:accounts,id',
            'contact_id' => 'nullable|exists:contacts,id',
        ]);

        if (! empty($data['account_id'])) {
            $ownsAccount = Account::query()
                ->where('company_id', $request->user()->company_id)
                ->where('id', $data['account_id'])
                ->exists();
            if (! $ownsAccount) {
                abort(403);
            }
        }

        if (! empty($data['contact_id'])) {
            $ownsContact = Contact::query()
                ->where('company_id', $request->user()->company_id)
                ->where('id', $data['contact_id'])
                ->exists();
            if (! $ownsContact) {
                abort(403);
            }
        }

        $service->update($lead, $data);

        return back()->with('success', 'Lead updated.');
    }
}
