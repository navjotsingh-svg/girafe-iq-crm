<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TeamInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $invitee,
        public User $inviter,
        public string $role,
        public string $temporaryPassword,
    ) {}

    public function envelope(): Envelope
    {
        $companyName = $this->invitee->company?->name ?? config('girafe.name', config('app.name'));

        return new Envelope(
            subject: "You're invited to join {$companyName}",
        );
    }

    public function content(): Content
    {
        $roleLabel = str_replace('_', ' ', ucwords($this->role, '_'));

        return new Content(
            markdown: 'emails.team-invite',
            with: [
                'inviteeName' => $this->invitee->name,
                'inviterName' => $this->inviter->name,
                'companyName' => $this->invitee->company?->name ?? 'the team',
                'roleLabel' => $roleLabel,
                'email' => $this->invitee->email,
                'temporaryPassword' => $this->temporaryPassword,
                'appName' => config('girafe.name', config('app.name')),
                'loginUrl' => url('/login'),
            ],
        );
    }
}
