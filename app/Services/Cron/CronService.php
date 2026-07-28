<?php

namespace App\Services\Cron;

use App\Models\Campaign;
use App\Models\Company;
use App\Models\FollowUp;
use App\Models\OutboundMessage;
use App\Models\TeamInvitation;
use App\Services\Crm\CampaignService;
use App\Services\Crm\MessagingService;
use Illuminate\Support\Facades\Log;

class CronService
{
    /** @var list<string> */
    public const JOBS = [
        'messages',
        'campaigns',
        'invitations',
        'trials',
        'followups',
    ];

    public function __construct(
        private MessagingService $messaging,
        private CampaignService $campaigns,
    ) {}

    /**
     * @param  list<string>|null  $only
     * @return array{ok: bool, ran_at: string, jobs: array<string, array<string, mixed>>}
     */
    public function run(?array $only = null): array
    {
        $jobs = $only && $only !== []
            ? array_values(array_intersect(self::JOBS, $only))
            : self::JOBS;

        $results = [];

        foreach ($jobs as $job) {
            try {
                $results[$job] = match ($job) {
                    'messages' => $this->processQueuedMessages(),
                    'campaigns' => $this->launchScheduledCampaigns(),
                    'invitations' => $this->expireTeamInvitations(),
                    'trials' => $this->expireTrials(),
                    'followups' => $this->summarizeDueFollowUps(),
                    default => ['error' => 'Unknown job'],
                };
            } catch (\Throwable $e) {
                Log::error('Cron job failed', [
                    'job' => $job,
                    'error' => $e->getMessage(),
                ]);
                $results[$job] = [
                    'ok' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info('CRM cron completed', ['jobs' => array_keys($results)]);

        return [
            'ok' => true,
            'ran_at' => now()->toIso8601String(),
            'jobs' => $results,
        ];
    }

    /**
     * @return array{ok: bool, processed: int, sent: int, failed: int}
     */
    public function processQueuedMessages(): array
    {
        $limit = max(1, (int) config('cron.message_batch', 100));

        $messages = OutboundMessage::query()
            ->with('company')
            ->where('status', OutboundMessage::STATUS_QUEUED)
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $sent = 0;
        $failed = 0;

        foreach ($messages as $message) {
            $company = $message->company;
            if (! $company instanceof Company) {
                $message->update([
                    'status' => OutboundMessage::STATUS_FAILED,
                    'error' => 'Company missing for queued message.',
                ]);
                $failed++;

                continue;
            }

            $result = $this->messaging->dispatch($company, $message);

            $message->update([
                'status' => $result['status'],
                'sent_at' => $result['status'] === OutboundMessage::STATUS_SENT ? now() : null,
                'error' => $result['error'] ?? null,
            ]);

            if ($result['status'] === OutboundMessage::STATUS_SENT) {
                $sent++;
            } else {
                $failed++;
            }
        }

        return [
            'ok' => true,
            'processed' => $messages->count(),
            'sent' => $sent,
            'failed' => $failed,
        ];
    }

    /**
     * @return array{ok: bool, launched: int, skipped: int, campaign_ids: list<int>}
     */
    public function launchScheduledCampaigns(): array
    {
        $campaigns = Campaign::query()
            ->with(['creator', 'company'])
            ->whereIn('status', [Campaign::STATUS_DRAFT, Campaign::STATUS_ACTIVE])
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->whereNull('completed_at')
            ->orderBy('scheduled_at')
            ->limit(50)
            ->get();

        $launched = 0;
        $skipped = 0;
        $ids = [];

        foreach ($campaigns as $campaign) {
            if (empty(trim((string) $campaign->body))) {
                $skipped++;

                continue;
            }

            $user = $campaign->creator;
            if (! $user) {
                $skipped++;

                continue;
            }

            $this->campaigns->launch($campaign, $user);
            $launched++;
            $ids[] = (int) $campaign->id;
        }

        return [
            'ok' => true,
            'launched' => $launched,
            'skipped' => $skipped,
            'campaign_ids' => $ids,
        ];
    }

    /**
     * @return array{ok: bool, deleted: int}
     */
    public function expireTeamInvitations(): array
    {
        $deleted = TeamInvitation::query()
            ->whereNull('accepted_at')
            ->where('expires_at', '<', now())
            ->delete();

        return [
            'ok' => true,
            'deleted' => $deleted,
        ];
    }

    /**
     * @return array{ok: bool, expired: int}
     */
    public function expireTrials(): array
    {
        $expired = Company::query()
            ->where('subscription_status', 'trialing')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '<', now())
            ->update(['subscription_status' => 'expired']);

        return [
            'ok' => true,
            'expired' => $expired,
        ];
    }

    /**
     * Report due / overdue follow-ups (dashboard uses live queries; this is for monitoring).
     *
     * @return array{ok: bool, due_today: int, overdue: int}
     */
    public function summarizeDueFollowUps(): array
    {
        $pending = FollowUp::query()->where('status', FollowUp::STATUS_PENDING);

        $dueToday = (clone $pending)
            ->whereDate('due_at', now()->toDateString())
            ->count();

        $overdue = (clone $pending)
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->count();

        return [
            'ok' => true,
            'due_today' => $dueToday,
            'overdue' => $overdue,
        ];
    }
}
