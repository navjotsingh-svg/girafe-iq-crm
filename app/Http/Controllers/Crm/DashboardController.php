<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Enquiry;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $company = $user->company;
        $currency = $company->currency ?? 'INR';
        $userId = $user->id;

        $leadsToday = Lead::query()->whereDate('created_at', today())->count();
        $weekStart = now()->copy()->startOfWeek();
        $weekEnd = now()->copy()->endOfWeek();
        $prevWeekStart = now()->copy()->subWeek()->startOfWeek();
        $prevWeekEnd = now()->copy()->subWeek()->endOfWeek();

        $leadsThisWeek = Lead::query()->whereBetween('created_at', [$weekStart, $weekEnd])->count();
        $leadsLastWeek = Lead::query()->whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])->count();

        $enquiriesToday = Enquiry::query()->whereDate('created_at', today())->count();
        $enquiriesNew = Enquiry::query()->where('status', Enquiry::STATUS_NEW)->count();

        $followupsToday = FollowUp::query()
            ->where('status', FollowUp::STATUS_PENDING)
            ->whereDate('due_at', today())
            ->count();
        $overdue = FollowUp::query()
            ->where('status', FollowUp::STATUS_PENDING)
            ->where('due_at', '<', now())
            ->count();
        $myOverdue = FollowUp::query()
            ->where('status', FollowUp::STATUS_PENDING)
            ->where('due_at', '<', now())
            ->where('assigned_user_id', $userId)
            ->count();
        $myDueToday = FollowUp::query()
            ->where('status', FollowUp::STATUS_PENDING)
            ->whereDate('due_at', today())
            ->where('assigned_user_id', $userId)
            ->count();

        $hotLeads = Lead::query()->where('temperature', 'hot')->count();
        $myLeads = Lead::query()->where('assigned_user_id', $userId)->count();
        $myHotLeads = Lead::query()
            ->where('assigned_user_id', $userId)
            ->where('temperature', 'hot')
            ->count();

        $openDeals = Deal::query()->whereNull('won_at')->whereNull('lost_at')->count();
        $pipelineValue = (float) Deal::query()
            ->whereNull('won_at')
            ->whereNull('lost_at')
            ->sum('value');
        $wonThisMonth = Deal::query()
            ->whereNotNull('won_at')
            ->whereMonth('won_at', now()->month)
            ->whereYear('won_at', now()->year)
            ->count();
        $revenueThisMonth = (float) Deal::query()
            ->whereNotNull('won_at')
            ->whereMonth('won_at', now()->month)
            ->whereYear('won_at', now()->year)
            ->sum('value');
        $customersCount = Customer::query()->count();

        $converted = Enquiry::query()->where('status', Enquiry::STATUS_CONVERTED)->count();
        $totalEnquiries = Enquiry::query()->count();
        $conversionPct = $totalEnquiries > 0
            ? round(($converted / $totalEnquiries) * 100, 1)
            : 0;

        $weekDelta = $leadsThisWeek - $leadsLastWeek;

        $temperature = [
            'hot' => Lead::query()->where('temperature', 'hot')->count(),
            'warm' => Lead::query()->where('temperature', 'warm')->count(),
            'cold' => Lead::query()->where('temperature', 'cold')->count(),
        ];

        $pipelineStages = $this->pipelineStageSnapshot($company->id);

        $leadsByDay = Lead::query()
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day');

        $activity = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = now()->subDays($i);
            $key = $day->toDateString();
            $activity[] = [
                'label' => $day->format('D'),
                'date' => $key,
                'count' => (int) ($leadsByDay[$key] ?? 0),
            ];
        }
        $counts = array_column($activity, 'count');
        $activityMax = max(1, ...(count($counts) ? $counts : [0]));

        return Inertia::render('Dashboard/Index', [
            'company' => $company ? [
                'name' => $company->name,
                'industry' => $company->industryName(),
                'industry_key' => $company->industry_key,
                'currency' => $currency,
            ] : null,
            'userName' => $user->name,
            'todayLabel' => now()->format('l, M j'),
            'attention' => [
                [
                    'key' => 'overdue',
                    'label' => 'Overdue',
                    'value' => $overdue,
                    'hint' => $myOverdue > 0 ? "{$myOverdue} assigned to you" : null,
                    'tone' => $overdue > 0 ? 'danger' : 'neutral',
                    'href' => route('tasks.index', ['filter' => 'overdue']),
                ],
                [
                    'key' => 'followups_today',
                    'label' => 'Due today',
                    'value' => $followupsToday,
                    'hint' => $myDueToday > 0 ? "{$myDueToday} yours" : null,
                    'tone' => $followupsToday > 0 ? 'warn' : 'neutral',
                    'href' => route('tasks.index', ['filter' => 'today']),
                ],
                [
                    'key' => 'hot',
                    'label' => 'Hot leads',
                    'value' => $hotLeads,
                    'hint' => $myHotLeads > 0 ? "{$myHotLeads} yours" : null,
                    'tone' => $hotLeads > 0 ? 'hot' : 'neutral',
                    'href' => route('leads.index', ['temperature' => 'hot']),
                ],
                [
                    'key' => 'new_enquiries',
                    'label' => 'New enquiries',
                    'value' => $enquiriesNew,
                    'hint' => null,
                    'tone' => $enquiriesNew > 0 ? 'info' : 'neutral',
                    'href' => route('enquiries.index'),
                ],
            ],
            'stats' => [
                [
                    'key' => 'leads_today',
                    'label' => 'Leads today',
                    'value' => $leadsToday,
                    'href' => route('leads.index'),
                ],
                [
                    'key' => 'enquiries_today',
                    'label' => 'Enquiries today',
                    'value' => $enquiriesToday,
                    'href' => route('enquiries.index'),
                ],
                [
                    'key' => 'my_leads',
                    'label' => 'My leads',
                    'value' => $myLeads,
                    'href' => route('leads.index', ['assignee' => $userId]),
                ],
                [
                    'key' => 'open_deals',
                    'label' => 'Open deals',
                    'value' => $openDeals,
                    'href' => route('pipeline.index'),
                ],
                [
                    'key' => 'pipeline_value',
                    'label' => 'Pipeline value',
                    'value' => $this->money($currency, $pipelineValue),
                    'href' => route('pipeline.index'),
                ],
                [
                    'key' => 'won_month',
                    'label' => 'Won this month',
                    'value' => $wonThisMonth,
                    'sub' => $this->money($currency, $revenueThisMonth),
                    'href' => route('reports.index'),
                ],
                [
                    'key' => 'customers',
                    'label' => 'Customers',
                    'value' => $customersCount,
                    'href' => route('customers.index'),
                ],
                [
                    'key' => 'conversion',
                    'label' => 'Enquiry → lead',
                    'value' => $conversionPct.'%',
                    'href' => route('reports.index'),
                ],
            ],
            'week' => [
                'leads' => $leadsThisWeek,
                'previous' => $leadsLastWeek,
                'delta' => $weekDelta,
            ],
            'activity' => $activity,
            'activityMax' => $activityMax,
            'temperature' => $temperature,
            'pipelineStages' => $pipelineStages,
            'recentEnquiries' => Enquiry::query()
                ->with('assignee:id,name')
                ->latest()
                ->limit(6)
                ->get(['id', 'name', 'status', 'phone', 'assigned_user_id', 'created_at'])
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'status' => $e->status,
                    'phone' => $e->phone,
                    'assignee' => $e->assignee?->name,
                    'created_at' => $e->created_at?->diffForHumans(),
                ]),
            'recentLeads' => Lead::query()
                ->with(['status:id,name,color', 'assignee:id,name'])
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'phone' => $l->phone,
                    'temperature' => $l->temperature,
                    'status' => $l->status?->name,
                    'status_color' => $l->status?->color,
                    'assignee' => $l->assignee?->name,
                    'created_at' => $l->created_at?->diffForHumans(),
                ]),
            'dueToday' => FollowUp::query()
                ->with(['lead:id,name', 'assignee:id,name'])
                ->where('status', FollowUp::STATUS_PENDING)
                ->whereDate('due_at', today())
                ->orderBy('due_at')
                ->limit(8)
                ->get()
                ->map(fn (FollowUp $f) => [
                    'id' => $f->id,
                    'title' => $f->title,
                    'lead' => $f->lead?->name,
                    'lead_id' => $f->lead_id,
                    'assignee' => $f->assignee?->name,
                    'mine' => (int) $f->assigned_user_id === $userId,
                    'due_at' => $f->due_at?->format('H:i'),
                ]),
            'overdueTasks' => FollowUp::query()
                ->with(['lead:id,name', 'assignee:id,name'])
                ->where('status', FollowUp::STATUS_PENDING)
                ->where('due_at', '<', now())
                ->orderBy('due_at')
                ->limit(8)
                ->get()
                ->map(fn (FollowUp $f) => [
                    'id' => $f->id,
                    'title' => $f->title,
                    'lead' => $f->lead?->name,
                    'lead_id' => $f->lead_id,
                    'assignee' => $f->assignee?->name,
                    'mine' => (int) $f->assigned_user_id === $userId,
                    'due_at' => $f->due_at?->diffForHumans(),
                ]),
        ]);
    }

    private function money(string $currency, float $amount): string
    {
        return $currency.' '.number_format($amount, 0);
    }

    /**
     * @return list<array{id: int, name: string, color: string, count: int, value: float}>
     */
    private function pipelineStageSnapshot(int $companyId): array
    {
        $pipeline = Pipeline::resolveForCompany($companyId);
        if (! $pipeline) {
            return [];
        }

        return $pipeline->stagesForBoard()
            ->map(function (PipelineStage $stage) {
                $count = Deal::query()
                    ->where('pipeline_stage_id', $stage->id)
                    ->whereNull('won_at')
                    ->whereNull('lost_at')
                    ->count();
                $value = (float) Deal::query()
                    ->where('pipeline_stage_id', $stage->id)
                    ->whereNull('won_at')
                    ->whereNull('lost_at')
                    ->sum('value');

                return [
                    'id' => $stage->id,
                    'name' => $stage->name,
                    'color' => $stage->color ?? '#64748b',
                    'count' => $count,
                    'value' => $value,
                ];
            })
            ->values()
            ->all();
    }
}
