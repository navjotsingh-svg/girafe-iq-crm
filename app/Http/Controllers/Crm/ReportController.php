<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Enquiry;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStatus;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->company;
        $currency = $company->currency ?? 'INR';
        $range = $request->get('range', '30');
        if (! in_array($range, ['7', '30', '90', '365', 'all'], true)) {
            $range = '30';
        }

        $from = match ($range) {
            '7' => now()->subDays(6)->startOfDay(),
            '30' => now()->subDays(29)->startOfDay(),
            '90' => now()->subDays(89)->startOfDay(),
            '365' => now()->subDays(364)->startOfDay(),
            default => null,
        };

        $totalEnquiries = Enquiry::query()->count();
        $convertedEnquiries = Enquiry::query()->where('status', Enquiry::STATUS_CONVERTED)->count();
        $totalLeads = Lead::query()->count();
        $wonDeals = Deal::query()->whereNotNull('won_at')->count();
        $lostDeals = Deal::query()->whereNotNull('lost_at')->count();
        $openDeals = Deal::query()->whereNull('won_at')->whereNull('lost_at')->count();
        $revenue = (float) Deal::query()->whereNotNull('won_at')->sum('value');
        $pipelineValue = (float) Deal::query()->whereNull('won_at')->whereNull('lost_at')->sum('value');
        $customers = Customer::query()->count();

        $enquiryToLead = $totalEnquiries > 0
            ? round(($convertedEnquiries / $totalEnquiries) * 100, 1)
            : 0;
        $leadToWon = $totalLeads > 0
            ? round(($wonDeals / $totalLeads) * 100, 1)
            : 0;

        $bySource = LeadSource::query()
            ->orderBy('sort_order')
            ->get(['id', 'name'])
            ->map(function (LeadSource $source) use ($from) {
                $enquiriesQ = Enquiry::query()->where('lead_source_id', $source->id);
                $leadsQ = Lead::query()->where('lead_source_id', $source->id);
                if ($from) {
                    $enquiriesQ->where('created_at', '>=', $from);
                    $leadsQ->where('created_at', '>=', $from);
                }
                $enquiries = $enquiriesQ->count();
                $leads = $leadsQ->count();
                $wonQ = Deal::query()
                    ->whereNotNull('won_at')
                    ->whereHas('lead', fn ($q) => $q->where('lead_source_id', $source->id));
                if ($from) {
                    $wonQ->where('won_at', '>=', $from);
                }
                $won = $wonQ->count();

                return [
                    'name' => $source->name,
                    'enquiries' => $enquiries,
                    'leads' => $leads,
                    'won' => $won,
                ];
            })
            ->filter(fn ($row) => $row['enquiries'] > 0 || $row['leads'] > 0 || $row['won'] > 0)
            ->values();

        $teamPerformance = User::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(function (User $user) use ($from) {
                $leadsQ = Lead::query()->where('assigned_user_id', $user->id);
                $wonQ = Deal::query()
                    ->where('assigned_user_id', $user->id)
                    ->whereNotNull('won_at');
                $revenueQ = Deal::query()
                    ->where('assigned_user_id', $user->id)
                    ->whereNotNull('won_at');
                $followQ = FollowUp::query()
                    ->where('assigned_user_id', $user->id)
                    ->where('status', FollowUp::STATUS_COMPLETED);

                if ($from) {
                    $leadsQ->where('created_at', '>=', $from);
                    $wonQ->where('won_at', '>=', $from);
                    $revenueQ->where('won_at', '>=', $from);
                    $followQ->where('updated_at', '>=', $from);
                }

                return [
                    'name' => $user->name,
                    'leads' => $leadsQ->count(),
                    'deals_won' => $wonQ->count(),
                    'revenue' => (float) $revenueQ->sum('value'),
                    'follow_ups_done' => $followQ->count(),
                ];
            })
            ->values();

        $lostReasonsQ = Deal::query()
            ->whereNotNull('lost_at')
            ->whereNotNull('lost_reason');
        if ($from) {
            $lostReasonsQ->where('lost_at', '>=', $from);
        }
        $lostReasons = $lostReasonsQ
            ->select('lost_reason', DB::raw('count(*) as total'))
            ->groupBy('lost_reason')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'reason' => $row->lost_reason,
                'count' => (int) $row->total,
            ]);

        $temperature = [
            'hot' => $this->countLeadsByTemperature('hot', $from),
            'warm' => $this->countLeadsByTemperature('warm', $from),
            'cold' => $this->countLeadsByTemperature('cold', $from),
        ];

        $leadStatuses = LeadStatus::query()
            ->orderBy('sort_order')
            ->get(['id', 'name', 'color'])
            ->map(function (LeadStatus $status) use ($from) {
                $q = Lead::query()->where('lead_status_id', $status->id);
                if ($from) {
                    $q->where('created_at', '>=', $from);
                }

                return [
                    'name' => $status->name,
                    'color' => $status->color ?? '#64748b',
                    'count' => $q->count(),
                ];
            })
            ->filter(fn ($row) => $row['count'] > 0)
            ->values();

        $enquiryStatuses = collect([
            Enquiry::STATUS_NEW,
            Enquiry::STATUS_IN_PROGRESS,
            Enquiry::STATUS_CONVERTED,
            Enquiry::STATUS_JUNK,
        ])->map(function (string $status) use ($from) {
            $q = Enquiry::query()->where('status', $status);
            if ($from) {
                $q->where('created_at', '>=', $from);
            }

            return [
                'name' => str_replace('_', ' ', ucfirst($status)),
                'count' => $q->count(),
            ];
        })->filter(fn ($row) => $row['count'] > 0)->values();

        $pipelineStages = $this->pipelineStages($company->id);

        $followUpStats = [
            'pending' => FollowUp::query()->where('status', FollowUp::STATUS_PENDING)->count(),
            'completed' => FollowUp::query()->where('status', FollowUp::STATUS_COMPLETED)->count(),
            'overdue' => FollowUp::query()
                ->where('status', FollowUp::STATUS_PENDING)
                ->where('due_at', '<', now())
                ->count(),
            'due_today' => FollowUp::query()
                ->where('status', FollowUp::STATUS_PENDING)
                ->whereDate('due_at', today())
                ->count(),
        ];

        $trend = $this->buildTrend($from, $range);
        $revenueTrend = $this->buildRevenueTrend($from, $range);

        $dealsBreakdown = [
            ['name' => 'Open', 'value' => $openDeals, 'color' => '#0ea5e9'],
            ['name' => 'Won', 'value' => $wonDeals, 'color' => '#10b981'],
            ['name' => 'Lost', 'value' => $lostDeals, 'color' => '#f43f5e'],
        ];

        return Inertia::render('Reports/Index', [
            'range' => $range,
            'kpis' => [
                ['key' => 'enquiries', 'label' => 'Enquiries', 'value' => $totalEnquiries],
                ['key' => 'leads', 'label' => 'Leads', 'value' => $totalLeads],
                ['key' => 'open_deals', 'label' => 'Open deals', 'value' => $openDeals],
                ['key' => 'won', 'label' => 'Deals won', 'value' => $wonDeals],
                ['key' => 'lost', 'label' => 'Deals lost', 'value' => $lostDeals],
                ['key' => 'customers', 'label' => 'Customers', 'value' => $customers],
                ['key' => 'revenue', 'label' => 'Revenue', 'value' => $currency.' '.number_format($revenue, 0)],
                ['key' => 'pipeline', 'label' => 'Pipeline value', 'value' => $currency.' '.number_format($pipelineValue, 0)],
            ],
            'funnel' => [
                ['label' => 'Enquiries', 'value' => $totalEnquiries],
                ['label' => 'Converted to leads', 'value' => $convertedEnquiries, 'rate' => $enquiryToLead.'%'],
                ['label' => 'Leads', 'value' => $totalLeads],
                ['label' => 'Deals won', 'value' => $wonDeals, 'rate' => $leadToWon.'%'],
                ['label' => 'Customers', 'value' => $customers],
            ],
            'bySource' => $bySource,
            'teamPerformance' => $teamPerformance,
            'lostReasons' => $lostReasons,
            'temperature' => $temperature,
            'leadStatuses' => $leadStatuses,
            'enquiryStatuses' => $enquiryStatuses,
            'pipelineStages' => $pipelineStages,
            'followUpStats' => $followUpStats,
            'trend' => $trend,
            'revenueTrend' => $revenueTrend,
            'dealsBreakdown' => $dealsBreakdown,
            'currency' => $currency,
        ]);
    }

    private function countLeadsByTemperature(string $temp, ?Carbon $from): int
    {
        $q = Lead::query()->where('temperature', $temp);
        if ($from) {
            $q->where('created_at', '>=', $from);
        }

        return $q->count();
    }

    /**
     * @return list<array{name: string, color: string, count: int, value: float}>
     */
    private function pipelineStages(int $companyId): array
    {
        $pipeline = Pipeline::resolveForCompany($companyId);
        if (! $pipeline) {
            return [];
        }

        return $pipeline->stagesForBoard()
            ->map(function (PipelineStage $stage) {
                return [
                    'name' => $stage->name,
                    'color' => $stage->color ?? '#64748b',
                    'count' => Deal::query()
                        ->where('pipeline_stage_id', $stage->id)
                        ->whereNull('won_at')
                        ->whereNull('lost_at')
                        ->count(),
                    'value' => (float) Deal::query()
                        ->where('pipeline_stage_id', $stage->id)
                        ->whereNull('won_at')
                        ->whereNull('lost_at')
                        ->sum('value'),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array{label: string, leads: int, enquiries: int, won: int}>
     */
    private function buildTrend(?Carbon $from, string $range): array
    {
        $days = match ($range) {
            '7' => 7,
            '90' => 90,
            '365' => 365,
            'all' => 90,
            default => 30,
        };

        // Aggregate by week for long ranges
        $byWeek = $days > 60;

        if ($byWeek) {
            $weeks = (int) ceil($days / 7);
            $points = [];
            for ($i = $weeks - 1; $i >= 0; $i--) {
                $start = now()->copy()->subWeeks($i)->startOfWeek();
                $end = now()->copy()->subWeeks($i)->endOfWeek();
                $points[] = [
                    'label' => $start->format('M j'),
                    'leads' => Lead::query()->whereBetween('created_at', [$start, $end])->count(),
                    'enquiries' => Enquiry::query()->whereBetween('created_at', [$start, $end])->count(),
                    'won' => Deal::query()
                        ->whereNotNull('won_at')
                        ->whereBetween('won_at', [$start, $end])
                        ->count(),
                ];
            }

            return $points;
        }

        $points = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $day = now()->copy()->subDays($i);
            $key = $day->toDateString();
            $points[] = [
                'label' => $day->format($days <= 14 ? 'D j' : 'M j'),
                'leads' => Lead::query()->whereDate('created_at', $key)->count(),
                'enquiries' => Enquiry::query()->whereDate('created_at', $key)->count(),
                'won' => Deal::query()
                    ->whereNotNull('won_at')
                    ->whereDate('won_at', $key)
                    ->count(),
            ];
        }

        return $points;
    }

    /**
     * @return list<array{label: string, revenue: float}>
     */
    private function buildRevenueTrend(?Carbon $from, string $range): array
    {
        $months = match ($range) {
            '7', '30' => 6,
            '90' => 6,
            '365', 'all' => 12,
            default => 6,
        };

        $points = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $start = now()->copy()->subMonths($i)->startOfMonth();
            $end = now()->copy()->subMonths($i)->endOfMonth();
            $points[] = [
                'label' => $start->format('M Y'),
                'revenue' => (float) Deal::query()
                    ->whereNotNull('won_at')
                    ->whereBetween('won_at', [$start, $end])
                    ->sum('value'),
            ];
        }

        return $points;
    }
}
