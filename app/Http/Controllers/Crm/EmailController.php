<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\OutboundMessage;
use App\Services\Crm\MessagingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailController extends Controller
{
    public function index(Request $request): Response
    {
        $channel = 'email';

        $templates = MessageTemplate::query()
            ->where('channel', $channel)
            ->latest()
            ->get()
            ->map(fn (MessageTemplate $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'subject' => $t->subject,
                'body' => $t->body,
                'is_active' => $t->is_active,
            ]);

        $messages = OutboundMessage::query()
            ->where('channel', $channel)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (OutboundMessage $m) => [
                'id' => $m->id,
                'to_name' => $m->to_name,
                'to_address' => $m->to_address,
                'subject' => $m->subject,
                'body' => $m->body,
                'status' => $m->status,
                'sent_at' => $m->sent_at?->diffForHumans(),
            ]);

        return Inertia::render('Messaging/Channel', [
            'channel' => $channel,
            'title' => 'Email',
            'templates' => $templates,
            'messages' => $messages,
            'leads' => Lead::query()->orderBy('name')->limit(100)->get(['id', 'name', 'email', 'phone']),
            'stats' => [
                'templates' => $templates->count(),
                'sent' => OutboundMessage::query()
                    ->where('channel', $channel)
                    ->where('status', OutboundMessage::STATUS_SENT)
                    ->count(),
            ],
        ]);
    }

    public function storeTemplate(Request $request, MessagingService $service): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
        ]);

        $service->createTemplate($request->user()->company, $request->user(), [
            'channel' => 'email',
            'name' => $data['name'],
            'subject' => $data['subject'],
            'body' => $data['body'],
        ]);

        return redirect()->route('email.index')
            ->with('success', 'Email template saved.');
    }

    public function send(Request $request, MessagingService $service): RedirectResponse
    {
        $data = $request->validate([
            'to_name' => 'nullable|string|max:255',
            'to_address' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:5000',
            'template_id' => 'nullable|exists:message_templates,id',
            'lead_id' => 'nullable|exists:leads,id',
        ]);

        $lead = ! empty($data['lead_id'])
            ? Lead::query()->find($data['lead_id'])
            : null;

        $service->queue($request->user()->company, $request->user(), [
            'channel' => 'email',
            'template_id' => $data['template_id'] ?? null,
            'to_name' => $data['to_name'] ?? $lead?->name,
            'to_address' => $data['to_address'],
            'subject' => $data['subject'],
            'body' => $data['body'],
            'messageable' => $lead,
        ]);

        return redirect()->route('email.index')
            ->with('success', 'Email sent (logged).');
    }

    public function destroyTemplate(MessageTemplate $template, Request $request, MessagingService $service): RedirectResponse
    {
        if ($template->company_id !== $request->user()->company_id || $template->channel !== 'email') {
            abort(403);
        }

        $service->deleteTemplate($template);

        return back()->with('success', 'Template deleted.');
    }
}
