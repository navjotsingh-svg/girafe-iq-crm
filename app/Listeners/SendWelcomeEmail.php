<?php

namespace App\Listeners;

use App\Mail\WelcomeMail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendWelcomeEmail
{
    public function handle(Registered $event): void
    {
        $user = $event->user->loadMissing('company');

        try {
            Mail::to($user->email)->send(new WelcomeMail($user));
        } catch (Throwable $e) {
            Log::warning('Failed to send welcome email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
