<?php

namespace App\Services\Crm;

use App\Models\Campaign;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\OutboundMessage;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    public function __construct(
        private ActivityLogger $logger,
        private MessagingService $messaging,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): Campaign
    {
        $template = null;
        if (! empty($data['template_id'])) {
            $template = MessageTemplate::query()->find($data['template_id']);
        }

        $audienceCount = $this->countAudience($company, $data['audience'] ?? 'all_leads');

        $campaign = Campaign::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'channel' => $data['channel'],
            'status' => Campaign::STATUS_DRAFT,
            'audience' => $data['audience'] ?? 'all_leads',
            'template_id' => $template?->id,
            'subject' => $data['subject'] ?? $template?->subject,
            'body' => $data['body'] ?? $template?->body,
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'audience_count' => $audienceCount,
            'created_by' => $user->id,
        ]);

        $this->logger->log('campaign.created', $campaign);

        return $campaign;
    }

    public function launch(Campaign $campaign, User $user): Campaign
    {
        if ($campaign->status === Campaign::STATUS_COMPLETED) {
            return $campaign;
        }

        return DB::transaction(function () use ($campaign, $user) {
            $recipients = $this->recipients($campaign);
            $sent = 0;

            foreach ($recipients as $recipient) {
                $address = $campaign->channel === 'email'
                    ? $recipient['email']
                    : $recipient['phone'];

                if (! $address) {
                    continue;
                }

                $body = str_replace(
                    '{{name}}',
                    $recipient['name'] ?? 'there',
                    $campaign->body ?? ''
                );

                $this->messaging->queue($campaign->company, $user, [
                    'channel' => $campaign->channel,
                    'template_id' => $campaign->template_id,
                    'campaign_id' => $campaign->id,
                    'to_name' => $recipient['name'],
                    'to_address' => $address,
                    'subject' => $campaign->subject,
                    'body' => $body,
                    'status' => OutboundMessage::STATUS_SENT,
                    'messageable' => $recipient['model'],
                ]);

                $sent++;
            }

            $campaign->update([
                'status' => Campaign::STATUS_COMPLETED,
                'audience_count' => count($recipients),
                'sent_count' => $sent,
                'started_at' => $campaign->started_at ?? now(),
                'completed_at' => now(),
            ]);

            $this->logger->log('campaign.launched', $campaign, ['sent' => $sent]);

            return $campaign->fresh();
        });
    }

    public function pause(Campaign $campaign): Campaign
    {
        if ($campaign->status !== Campaign::STATUS_ACTIVE) {
            return $campaign;
        }

        $campaign->update(['status' => Campaign::STATUS_PAUSED]);
        $this->logger->log('campaign.paused', $campaign);

        return $campaign->fresh();
    }

    private function countAudience(Company $company, string $audience): int
    {
        return match ($audience) {
            'hot_leads' => Lead::query()->where('company_id', $company->id)->where('temperature', 'hot')->count(),
            'customers' => Customer::query()->where('company_id', $company->id)->count(),
            default => Lead::query()->where('company_id', $company->id)->count(),
        };
    }

    /**
     * @return list<array{name: string, email: ?string, phone: ?string, model: Lead|Customer}>
     */
    private function recipients(Campaign $campaign): array
    {
        $companyId = $campaign->company_id;

        if ($campaign->audience === 'customers') {
            return Customer::query()
                ->where('company_id', $companyId)
                ->get()
                ->map(fn (Customer $c) => [
                    'name' => $c->name,
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'model' => $c,
                ])
                ->all();
        }

        $query = Lead::query()->where('company_id', $companyId);
        if ($campaign->audience === 'hot_leads') {
            $query->where('temperature', 'hot');
        }

        return $query->get()
            ->map(fn (Lead $l) => [
                'name' => $l->name,
                'email' => $l->email,
                'phone' => $l->phone,
                'model' => $l,
            ])
            ->all();
    }
}
