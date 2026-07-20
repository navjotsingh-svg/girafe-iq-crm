<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\MessageTemplate;
use App\Services\Crm\CampaignService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(Request $request): Response
    {
        $campaigns = Campaign::query()
            ->with('template:id,name')
            ->latest()
            ->get()
            ->map(fn (Campaign $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'channel' => $c->channel,
                'status' => $c->status,
                'audience' => $c->audience,
                'audience_count' => $c->audience_count,
                'sent_count' => $c->sent_count,
                'template' => $c->template?->name,
                'scheduled_at' => $c->scheduled_at?->toIso8601String(),
                'completed_at' => $c->completed_at?->diffForHumans(),
                'created_at' => $c->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'templates' => MessageTemplate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'channel', 'subject', 'body']),
            'stats' => [
                'total' => $campaigns->count(),
                'completed' => $campaigns->where('status', Campaign::STATUS_COMPLETED)->count(),
                'sent' => $campaigns->sum('sent_count'),
            ],
        ]);
    }

    public function store(Request $request, CampaignService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'channel' => ['required', Rule::in(['email', 'whatsapp'])],
            'audience' => ['required', Rule::in(['all_leads', 'hot_leads', 'customers'])],
            'template_id' => 'nullable|exists:message_templates,id',
            'subject' => 'nullable|string|max:255',
            'body' => 'nullable|string|max:5000',
            'scheduled_at' => 'nullable|date',
        ]);

        $service->create($request->user()->company, $request->user(), $data);

        return redirect()->route('campaigns.index')
            ->with('success', 'Campaign created as draft.');
    }

    public function launch(Campaign $campaign, Request $request, CampaignService $service): RedirectResponse
    {
        if ($campaign->company_id !== $request->user()->company_id) {
            abort(403);
        }

        if (empty($campaign->body)) {
            return back()->with('error', 'Campaign needs a message body before launch.');
        }

        $result = $service->launch($campaign, $request->user());

        return redirect()->route('campaigns.index')
            ->with('success', "Campaign sent to {$result->sent_count} recipients.");
    }
}
