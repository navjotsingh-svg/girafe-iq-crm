<?php

namespace App\Mail;

use App\Models\TeamInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TeamInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public TeamInvitation $invitation) {}

    public function envelope(): Envelope
    {
        $companyName = $this->invitation->company?->name ?? config('girafe.name', config('app.name'));

        return new Envelope(
            subject: "You're invited to join {$companyName}",
        );
    }

    public function content(): Content
    {
        $invitation = $this->invitation->loadMissing(['company', 'inviter']);

        return new Content(
            markdown: 'emails.team-invite',
            with: [
                'inviteeName' => $invitation->name,
                'inviterName' => $invitation->inviter?->name ?? 'Your admin',
                'companyName' => $invitation->company?->name ?? 'the team',
                'roleLabel' => $invitation->roleLabel(),
                'email' => $invitation->email,
                'appName' => config('girafe.name', config('app.name')),
                'acceptUrl' => $invitation->acceptUrl(),
                'expiresAt' => $invitation->expires_at?->timezone(config('app.timezone'))->format('M j, Y'),
            ],
        );
    }
}
