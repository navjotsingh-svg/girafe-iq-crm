<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        $appName = config('girafe.name', config('app.name'));

        return new Envelope(
            subject: "Welcome to {$appName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.welcome',
            with: [
                'userName' => $this->user->name,
                'companyName' => $this->user->company?->name ?? 'your company',
                'appName' => config('girafe.name', config('app.name')),
                'loginUrl' => url('/login'),
                'dashboardUrl' => url('/dashboard'),
            ],
        );
    }
}
