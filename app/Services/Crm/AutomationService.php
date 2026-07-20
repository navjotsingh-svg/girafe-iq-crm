<?php

namespace App\Services\Crm;

use App\Models\AutomationRule;
use App\Models\Company;
use App\Models\Enquiry;
use App\Models\FollowUp;
use App\Models\Lead;
use App\Models\OutboundMessage;
use App\Models\TaskType;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Database\Eloquent\Model;

class AutomationService
{
    public function __construct(
        private ActivityLogger $logger,
        private MessagingService $messaging,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Company $company, User $user, array $data): AutomationRule
    {
        $rule = AutomationRule::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'action' => $data['action'],
            'config' => $data['config'] ?? [],
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $user->id,
        ]);

        $this->logger->log('automation.created', $rule);

        return $rule;
    }

    public function toggle(AutomationRule $rule): AutomationRule
    {
        $rule->update(['is_active' => ! $rule->is_active]);
        $this->logger->log('automation.toggled', $rule, ['is_active' => $rule->is_active]);

        return $rule->fresh();
    }

    public function delete(AutomationRule $rule): void
    {
        $this->logger->log('automation.deleted', $rule);
        $rule->delete();
    }

    public function runForTrigger(string $trigger, Company $company, Model $subject, ?User $user = null): int
    {
        $rules = AutomationRule::query()
            ->where('company_id', $company->id)
            ->where('trigger', $trigger)
            ->where('is_active', true)
            ->get();

        $ran = 0;
        foreach ($rules as $rule) {
            if (! $this->passesConditions($rule, $subject)) {
                continue;
            }
            $this->execute($rule, $subject, $user);
            $ran++;
        }

        return $ran;
    }

    /**
     * @param  array<string, mixed>|null  $conditions
     */
    public function passesConditions(AutomationRule $rule, Model $subject): bool
    {
        $conditions = $rule->config['conditions'] ?? [];
        if (! is_array($conditions) || $conditions === []) {
            return true;
        }

        $email = $subject->email ?? null;
        $phone = $subject->phone ?? null;
        $temperature = $subject->temperature ?? null;
        $sourceId = $subject->lead_source_id ?? null;

        if ($subject instanceof \App\Models\Deal) {
            $subject->loadMissing('lead');
            $email = $subject->lead?->email;
            $phone = $subject->lead?->phone;
            $temperature = $subject->lead?->temperature;
            $sourceId = $subject->lead?->lead_source_id;
        }

        if (! empty($conditions['require_email']) && empty($email)) {
            return false;
        }

        if (! empty($conditions['require_phone']) && empty($phone)) {
            return false;
        }

        if (! empty($conditions['temperature']) && $temperature !== $conditions['temperature']) {
            return false;
        }

        if (! empty($conditions['source_id']) && (int) $sourceId !== (int) $conditions['source_id']) {
            return false;
        }

        return true;
    }

    public function execute(AutomationRule $rule, Model $subject, ?User $user = null): void
    {
        $config = $rule->config ?? [];

        match ($rule->action) {
            'create_follow_up' => $this->actionCreateFollowUp($rule, $subject, $config, $user),
            'send_email' => $this->actionSendMessage($rule, $subject, 'email', $config, $user),
            'send_whatsapp' => $this->actionSendMessage($rule, $subject, 'whatsapp', $config, $user),
            'set_temperature' => $this->actionSetTemperature($subject, $config),
            default => null,
        };

        $rule->update([
            'runs_count' => $rule->runs_count + 1,
            'last_run_at' => now(),
        ]);

        $this->logger->log('automation.ran', $rule, [
            'subject_type' => $subject::class,
            'subject_id' => $subject->getKey(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function actionCreateFollowUp(AutomationRule $rule, Model $subject, array $config, ?User $user): void
    {
        $leadId = null;
        $name = 'Auto follow-up';
        $companyId = $rule->company_id;

        if ($subject instanceof Lead) {
            $leadId = $subject->id;
            $name = $subject->name;
        } elseif ($subject instanceof Enquiry) {
            $leadId = $subject->lead_id;
            $name = $subject->name;
        }

        $hours = (int) ($config['due_in_hours'] ?? 24);
        $title = $config['title'] ?? "Follow up with {$name}";

        $taskTypeId = TaskType::query()
            ->where('company_id', $companyId)
            ->where('slug', 'follow-up')
            ->value('id');

        FollowUp::create([
            'company_id' => $companyId,
            'lead_id' => $leadId,
            'task_type_id' => $taskTypeId,
            'title' => $title,
            'description' => 'Created by automation: '.$rule->name,
            'status' => FollowUp::STATUS_PENDING,
            'due_at' => now()->addHours($hours),
            'assigned_user_id' => $user?->id ?? ($subject->assigned_user_id ?? null),
            'created_by' => $user?->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function actionSendMessage(AutomationRule $rule, Model $subject, string $channel, array $config, ?User $user): void
    {
        $toName = null;
        $toAddress = null;
        $messageable = $subject;

        if ($subject instanceof Lead || $subject instanceof Enquiry) {
            $toName = $subject->name;
            $toAddress = $channel === 'email' ? $subject->email : $subject->phone;
        } elseif ($subject instanceof \App\Models\Deal) {
            $subject->loadMissing('lead');
            $toName = $subject->lead?->name ?? $subject->title;
            $toAddress = $channel === 'email'
                ? $subject->lead?->email
                : $subject->lead?->phone;
            $messageable = $subject->lead ?? $subject;
        }

        if (! $toAddress) {
            return;
        }

        $body = $config['body'] ?? 'Hello {{name}}, thanks for connecting with us.';
        $body = str_replace('{{name}}', $toName ?? 'there', $body);
        $subjectLine = $config['subject'] ?? 'Message from Girafe IQ';

        $company = $rule->company ?? Company::query()->find($rule->company_id);
        if (! $company) {
            return;
        }

        $this->messaging->queue(
            $company,
            $user,
            [
                'channel' => $channel,
                'to_name' => $toName,
                'to_address' => $toAddress,
                'subject' => $channel === 'email' ? $subjectLine : null,
                'body' => $body,
                'status' => OutboundMessage::STATUS_SENT,
                'messageable' => $messageable,
            ]
        );
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function actionSetTemperature(Model $subject, array $config): void
    {
        if (! $subject instanceof Lead) {
            return;
        }

        $temp = $config['temperature'] ?? 'hot';
        if (! in_array($temp, ['cold', 'warm', 'hot'], true)) {
            return;
        }

        $subject->update(['temperature' => $temp]);
    }
}
