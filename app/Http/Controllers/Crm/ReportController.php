<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Enquiry;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\User;
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

        $totalEnquiries = Enquiry::query()->count();
        $convertedEnquiries = Enquiry::query()->where('status', Enquiry::STATUS_CONVERTED)->count();
        $totalLeads = Lead::query()->count();
        $totalDeals = Deal::query()->count();
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
            ->map(function (LeadSource $source) {
                $enquiries = Enquiry::query()->where('lead_source_id', $source->id)->count();
                $leads = Lead::query()->where('lead_source_id', $source->id)->count();
                $won = Deal::query()
                    ->whereNotNull('won_at')
                    ->whereHas('lead', fn ($q) => $q->where('lead_source_id', $source->id))
                    ->count();

                return [
                    'name' => $source->name,
                    'enquiries' => $enquiries,
                    'leads' => $leads,
                    'won' => $won,
                ];
            })
            ->filter(fn ($row) => $row['enquiries'] > 0 || $row['leads'] > 0)
            ->values();

        $teamPerformance = User::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(function (User $user) {
                return [
                    'name' => $user->name,
                    'leads' => Lead::query()->where('assigned_user_id', $user->id)->count(),
                    'deals_won' => Deal::query()
                        ->where('assigned_user_id', $user->id)
                        ->whereNotNull('won_at')
                        ->count(),
                    'revenue' => (float) Deal::query()
                        ->where('assigned_user_id', $user->id)
                        ->whereNotNull('won_at')
                        ->sum('value'),
                    'follow_ups_done' => FollowUp::query()
                        ->where('assigned_user_id', $user->id)
                        ->where('status', FollowUp::STATUS_COMPLETED)
                        ->count(),
                ];
            })
            ->values();

        $lostReasons = Deal::query()
            ->whereNotNull('lost_at')
            ->whereNotNull('lost_reason')
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
            'hot' => Lead::query()->where('temperature', 'hot')->count(),
            'warm' => Lead::query()->where('temperature', 'warm')->count(),
            'cold' => Lead::query()->where('temperature', 'cold')->count(),
        ];

        return Inertia::render('Reports/Index', [
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
            'currency' => $currency,
        ]);
    }
}
