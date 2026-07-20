<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Enquiry;
use App\Models\FollowUp;
use App\Models\Lead;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $company = auth()->user()->company;

        $leadsToday = Lead::query()->whereDate('created_at', today())->count();
        $enquiriesToday = Enquiry::query()->whereDate('created_at', today())->count();
        $followupsToday = FollowUp::query()
            ->where('status', FollowUp::STATUS_PENDING)
            ->whereDate('due_at', today())
            ->count();
        $overdue = FollowUp::query()
            ->where('status', FollowUp::STATUS_PENDING)
            ->where('due_at', '<', now())
            ->count();
        $hotLeads = Lead::query()->where('temperature', 'hot')->count();
        $dealsWon = Deal::query()->whereNotNull('won_at')->count();
        $customersCount = Customer::query()->count();
        $pipelineValue = Deal::query()
            ->whereNull('won_at')
            ->whereNull('lost_at')
            ->sum('value');
        $converted = Enquiry::query()->where('status', Enquiry::STATUS_CONVERTED)->count();
        $totalEnquiries = Enquiry::query()->count();
        $conversion = $totalEnquiries > 0
            ? round(($converted / $totalEnquiries) * 100).'%'
            : '0%';

        $currency = $company->currency ?? 'INR';
        $formattedPipeline = $currency.' '.number_format((float) $pipelineValue, 0);

        return Inertia::render('Dashboard/Index', [
            'company' => $company ? [
                'name' => $company->name,
                'industry' => $company->industryName(),
                'industry_key' => $company->industry_key,
                'currency' => $currency,
            ] : null,
            'kpis' => [
                ['key' => 'enquiries_today', 'label' => "Today's Enquiries", 'value' => $enquiriesToday],
                ['key' => 'leads_today', 'label' => "Today's Leads", 'value' => $leadsToday],
                ['key' => 'followups', 'label' => "Today's Follow-ups", 'value' => $followupsToday],
                ['key' => 'overdue', 'label' => 'Overdue Tasks', 'value' => $overdue],
                ['key' => 'hot', 'label' => 'Hot Leads', 'value' => $hotLeads],
                ['key' => 'deals_won', 'label' => 'Deals Won', 'value' => $dealsWon],
                ['key' => 'customers', 'label' => 'Customers', 'value' => $customersCount],
                ['key' => 'pipeline_value', 'label' => 'Pipeline Value', 'value' => $formattedPipeline],
                ['key' => 'conversion', 'label' => 'Conversion Rate', 'value' => $conversion],
            ],
            'recentEnquiries' => Enquiry::query()
                ->latest()
                ->limit(5)
                ->get(['id', 'name', 'status', 'created_at'])
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'status' => $e->status,
                    'created_at' => $e->created_at?->diffForHumans(),
                ]),
            'recentLeads' => Lead::query()
                ->with('status:id,name,color')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'temperature' => $l->temperature,
                    'status' => $l->status?->name,
                    'created_at' => $l->created_at?->diffForHumans(),
                ]),
            'dueToday' => FollowUp::query()
                ->with('lead:id,name')
                ->where('status', FollowUp::STATUS_PENDING)
                ->whereDate('due_at', today())
                ->orderBy('due_at')
                ->limit(5)
                ->get()
                ->map(fn (FollowUp $f) => [
                    'id' => $f->id,
                    'title' => $f->title,
                    'lead' => $f->lead?->name,
                    'due_at' => $f->due_at?->format('H:i'),
                ]),
        ]);
    }
}
