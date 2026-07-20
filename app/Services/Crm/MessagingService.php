<?php

namespace App\Services\Crm;

use App\Models\Company;
use App\Models\MessageTemplate;
use App\Models\OutboundMessage;
use App\Models\User;
use App\Services\Tenant\ActivityLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MessagingService
{
    public function __construct(
        private ActivityLogger $logger
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function createTemplate(Company $company, User $user, array $data): MessageTemplate
    {
        $template = MessageTemplate::create([
            'company_id' => $company->id,
            'channel' => $data['channel'],
            'name' => $data['name'],
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'],
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        $this->logger->log('template.created', $template);

        return $template;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function queue(Company $company, ?User $user, array $data): OutboundMessage
    {
        /** @var Model|null $messageable */
        $messageable = $data['messageable'] ?? null;

        $message = OutboundMessage::create([
            'company_id' => $company->id,
            'channel' => $data['channel'],
            'template_id' => $data['template_id'] ?? null,
            'campaign_id' => $data['campaign_id'] ?? null,
            'to_name' => $data['to_name'] ?? null,
            'to_address' => $data['to_address'],
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'],
            'status' => $data['status'] ?? OutboundMessage::STATUS_QUEUED,
            'messageable_type' => $messageable ? $messageable::class : null,
            'messageable_id' => $messageable?->getKey(),
            'created_by' => $user?->id,
            'sent_at' => null,
        ]);

        $result = $this->dispatch($company, $message);

        $message->update([
            'status' => $result['status'],
            'sent_at' => $result['status'] === OutboundMessage::STATUS_SENT ? now() : null,
            'error' => $result['error'] ?? null,
        ]);

        $this->logger->log(
            $result['status'] === OutboundMessage::STATUS_SENT ? 'message.sent' : 'message.failed',
            $message,
            ['channel' => $message->channel, 'provider' => $result['provider'] ?? 'log']
        );

        return $message->fresh();
    }

    /**
     * @return array{status: string, provider: string, error?: string}
     */
    public function dispatch(Company $company, OutboundMessage $message): array
    {
        $settings = $company->settings['providers'] ?? [];

        if ($message->channel === 'email') {
            return $this->dispatchEmail($settings['email'] ?? [], $message);
        }

        return $this->dispatchWhatsApp($settings['whatsapp'] ?? [], $message);
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{status: string, provider: string, error?: string}
     */
    private function dispatchEmail(array $config, OutboundMessage $message): array
    {
        $driver = $config['driver'] ?? 'log';

        if ($driver === 'smtp') {
            if (empty($config['host']) || empty($config['from_address'])) {
                return [
                    'status' => OutboundMessage::STATUS_FAILED,
                    'provider' => 'smtp',
                    'error' => 'SMTP not configured. Set host and from address in Settings → Providers.',
                ];
            }

            try {
                config([
                    'mail.default' => 'smtp',
                    'mail.mailers.smtp.host' => $config['host'],
                    'mail.mailers.smtp.port' => $config['port'] ?? 587,
                    'mail.mailers.smtp.username' => $config['username'] ?? null,
                    'mail.mailers.smtp.password' => $config['password'] ?? null,
                    'mail.mailers.smtp.encryption' => $config['encryption'] ?? 'tls',
                    'mail.from.address' => $config['from_address'],
                    'mail.from.name' => $config['from_name'] ?? 'Girafe IQ',
                ]);

                Mail::raw($message->body, function ($mail) use ($message, $config) {
                    $mail->to($message->to_address, $message->to_name)
                        ->subject($message->subject ?: 'Message from Girafe IQ')
                        ->from($config['from_address'], $config['from_name'] ?? 'Girafe IQ');
                });

                return ['status' => OutboundMessage::STATUS_SENT, 'provider' => 'smtp'];
            } catch (\Throwable $e) {
                return [
                    'status' => OutboundMessage::STATUS_FAILED,
                    'provider' => 'smtp',
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info('Email (log driver)', [
            'to' => $message->to_address,
            'subject' => $message->subject,
            'body' => $message->body,
        ]);

        return ['status' => OutboundMessage::STATUS_SENT, 'provider' => 'log'];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{status: string, provider: string, error?: string}
     */
    private function dispatchWhatsApp(array $config, OutboundMessage $message): array
    {
        $driver = $config['driver'] ?? 'log';

        if ($driver === 'meta') {
            if (empty($config['api_token']) || empty($config['phone_number_id'])) {
                return [
                    'status' => OutboundMessage::STATUS_FAILED,
                    'provider' => 'meta',
                    'error' => 'WhatsApp Meta API not configured. Set token and phone number ID in Settings → Providers.',
                ];
            }

            $to = preg_replace('/\D+/', '', (string) $message->to_address);
            if (! $to || strlen($to) < 8) {
                return [
                    'status' => OutboundMessage::STATUS_FAILED,
                    'provider' => 'meta',
                    'error' => 'Invalid WhatsApp phone number. Use international format (e.g. 919876543210).',
                ];
            }

            $apiVersion = $config['api_version'] ?? 'v21.0';
            $url = sprintf(
                'https://graph.facebook.com/%s/%s/messages',
                $apiVersion,
                $config['phone_number_id']
            );

            try {
                $response = \Illuminate\Support\Facades\Http::withToken($config['api_token'])
                    ->acceptJson()
                    ->timeout(20)
                    ->post($url, [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $to,
                        'type' => 'text',
                        'text' => [
                            'preview_url' => false,
                            'body' => $message->body,
                        ],
                    ]);

                if ($response->successful()) {
                    Log::info('WhatsApp Meta sent', [
                        'to' => $to,
                        'message_id' => $response->json('messages.0.id'),
                    ]);

                    return ['status' => OutboundMessage::STATUS_SENT, 'provider' => 'meta'];
                }

                $error = $response->json('error.message')
                    ?? $response->body()
                    ?? 'Meta Graph API request failed';

                return [
                    'status' => OutboundMessage::STATUS_FAILED,
                    'provider' => 'meta',
                    'error' => is_string($error) ? $error : json_encode($error),
                ];
            } catch (\Throwable $e) {
                return [
                    'status' => OutboundMessage::STATUS_FAILED,
                    'provider' => 'meta',
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info('WhatsApp (log driver)', [
            'to' => $message->to_address,
            'body' => $message->body,
        ]);

        return ['status' => OutboundMessage::STATUS_SENT, 'provider' => 'log'];
    }

    public function deleteTemplate(MessageTemplate $template): void
    {
        $this->logger->log('template.deleted', $template);
        $template->delete();
    }
}
