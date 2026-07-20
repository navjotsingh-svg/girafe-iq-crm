<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\TaskType;
use App\Models\User;
use App\Services\Crm\FollowUpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FollowUpController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;
        $filter = $request->get('filter', 'pending');

        $query = FollowUp::query()
            ->with(['lead:id,name', 'taskType:id,name,color', 'assignee:id,name'])
            ->latest('due_at');

        match ($filter) {
            'today' => $query->where('status', FollowUp::STATUS_PENDING)
                ->whereDate('due_at', today()),
            'overdue' => $query->where('status', FollowUp::STATUS_PENDING)
                ->where('due_at', '<', now()),
            'completed' => $query->where('status', FollowUp::STATUS_COMPLETED),
            default => $query->where('status', FollowUp::STATUS_PENDING),
        };

        $followUps = $query->paginate(20)->through(fn (FollowUp $f) => [
            'id' => $f->id,
            'title' => $f->title,
            'description' => $f->description,
            'status' => $f->status,
            'due_at' => $f->due_at?->toIso8601String(),
            'completed_at' => $f->completed_at?->toIso8601String(),
            'lead' => $f->lead ? ['id' => $f->lead->id, 'name' => $f->lead->name] : null,
            'task_type' => $f->taskType,
            'assignee' => $f->assignee?->name,
            'is_overdue' => $f->isOverdue(),
        ]);

        return Inertia::render('Tasks/Index', [
            'followUps' => $followUps,
            'filter' => $filter,
            'leads' => Lead::query()->orderBy('name')->get(['id', 'name']),
            'taskTypes' => TaskType::query()->orderBy('sort_order')->get(['id', 'name', 'color']),
            'team' => User::query()
                ->where('company_id', $company->id)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'stats' => [
                'pending' => FollowUp::query()->where('status', FollowUp::STATUS_PENDING)->count(),
                'due_today' => FollowUp::query()
                    ->where('status', FollowUp::STATUS_PENDING)
                    ->whereDate('due_at', today())
                    ->count(),
                'overdue' => FollowUp::query()
                    ->where('status', FollowUp::STATUS_PENDING)
                    ->where('due_at', '<', now())
                    ->count(),
            ],
        ]);
    }

    public function store(Request $request, FollowUpService $service): RedirectResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'lead_id' => 'nullable|exists:leads,id',
            'task_type_id' => 'nullable|exists:task_types,id',
            'due_at' => 'nullable|date',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        if (empty($data['task_type_id'])) {
            $data['task_type_id'] = $service->defaultTaskTypeId($request->user()->company);
        }

        $followUp = $service->create($request->user()->company, $request->user(), $data);

        if ($request->has('redirect_lead') && $followUp->lead_id) {
            return redirect()
                ->route('leads.show', $followUp->lead_id)
                ->with('success', 'Follow-up scheduled.');
        }

        return redirect()->route('tasks.index')
            ->with('success', 'Follow-up created.');
    }

    public function complete(FollowUp $followUp, Request $request, FollowUpService $service): RedirectResponse
    {
        if ($followUp->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $service->complete($followUp);

        return back()->with('success', 'Follow-up marked complete.');
    }
}
