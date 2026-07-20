<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\AutomationRule;
use App\Models\LeadSource;
use App\Services\Crm\AutomationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AutomationController extends Controller
{
    public const TRIGGERS = [
        ['value' => 'enquiry.created', 'label' => 'Enquiry created'],
        ['value' => 'lead.created', 'label' => 'Lead created'],
        ['value' => 'lead.hot', 'label' => 'Lead marked hot'],
        ['value' => 'deal.won', 'label' => 'Deal won'],
    ];

    public const ACTIONS = [
        ['value' => 'create_follow_up', 'label' => 'Create follow-up'],
        ['value' => 'send_email', 'label' => 'Send email'],
        ['value' => 'send_whatsapp', 'label' => 'Send WhatsApp'],
        ['value' => 'set_temperature', 'label' => 'Set lead temperature'],
    ];

    public function index(Request $request): Response
    {
        $rules = AutomationRule::query()
            ->latest()
            ->get()
            ->map(fn (AutomationRule $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'trigger' => $r->trigger,
                'action' => $r->action,
                'config' => $r->config,
                'is_active' => $r->is_active,
                'runs_count' => $r->runs_count,
                'last_run_at' => $r->last_run_at?->diffForHumans(),
            ]);

        return Inertia::render('Automation/Index', [
            'rules' => $rules,
            'triggers' => self::TRIGGERS,
            'actions' => self::ACTIONS,
            'sources' => LeadSource::query()->orderBy('sort_order')->get(['id', 'name']),
            'stats' => [
                'total' => $rules->count(),
                'active' => $rules->where('is_active', true)->count(),
                'runs' => $rules->sum('runs_count'),
            ],
        ]);
    }

    public function store(Request $request, AutomationService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'trigger' => ['required', Rule::in(array_column(self::TRIGGERS, 'value'))],
            'action' => ['required', Rule::in(array_column(self::ACTIONS, 'value'))],
            'due_in_hours' => 'nullable|integer|min:1|max:720',
            'title' => 'nullable|string|max:255',
            'subject' => 'nullable|string|max:255',
            'body' => 'nullable|string|max:5000',
            'temperature' => 'nullable|in:cold,warm,hot',
            'is_active' => 'nullable|boolean',
            'require_email' => 'nullable|boolean',
            'require_phone' => 'nullable|boolean',
            'condition_temperature' => 'nullable|in:cold,warm,hot',
            'condition_source_id' => 'nullable|exists:lead_sources,id',
        ]);

        $config = match ($data['action']) {
            'create_follow_up' => [
                'due_in_hours' => $data['due_in_hours'] ?? 24,
                'title' => $data['title'] ?? null,
            ],
            'send_email', 'send_whatsapp' => [
                'subject' => $data['subject'] ?? null,
                'body' => $data['body'] ?? null,
            ],
            'set_temperature' => [
                'temperature' => $data['temperature'] ?? 'hot',
            ],
            default => [],
        };

        $conditions = array_filter([
            'require_email' => (bool) ($data['require_email'] ?? false),
            'require_phone' => (bool) ($data['require_phone'] ?? false),
            'temperature' => $data['condition_temperature'] ?? null,
            'source_id' => $data['condition_source_id'] ?? null,
        ], fn ($v) => $v !== null && $v !== false && $v !== '');

        if ($conditions !== []) {
            $config['conditions'] = $conditions;
        }

        $service->create($request->user()->company, $request->user(), [
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'action' => $data['action'],
            'config' => $config,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return redirect()->route('automation.index')
            ->with('success', 'Automation rule created.');
    }

    public function toggle(AutomationRule $rule, Request $request, AutomationService $service): RedirectResponse
    {
        if ($rule->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $service->toggle($rule);

        return back()->with('success', 'Rule updated.');
    }

    public function destroy(AutomationRule $rule, Request $request, AutomationService $service): RedirectResponse
    {
        if ($rule->company_id !== $request->user()->company_id) {
            abort(403);
        }

        $service->delete($rule);

        return redirect()->route('automation.index')
            ->with('success', 'Rule deleted.');
    }
}
