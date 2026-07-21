<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TeamInvitation;
use App\Services\Crm\TeamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TeamInviteController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        if (! Schema::hasTable('team_invitations')) {
            return Inertia::render('Auth/AcceptInvite', [
                'token' => $token,
                'status' => 'unavailable',
                'message' => 'Invitations are not set up on this server yet. Ask your admin to run database migrations.',
                'invitation' => null,
            ]);
        }

        try {
            $invitation = TeamInvitation::query()
                ->with(['company:id,name', 'inviter:id,name'])
                ->where('token', $token)
                ->first();
        } catch (Throwable) {
            return Inertia::render('Auth/AcceptInvite', [
                'token' => $token,
                'status' => 'unavailable',
                'message' => 'Unable to load this invitation. Please try again later.',
                'invitation' => null,
            ]);
        }

        if (! $invitation) {
            return Inertia::render('Auth/AcceptInvite', [
                'token' => $token,
                'status' => 'invalid',
                'message' => 'This invite link is invalid or has been cancelled. Ask your admin to send a new invite.',
                'invitation' => null,
            ]);
        }

        if ($invitation->accepted_at) {
            return redirect()->route('login')
                ->with('status', 'This invitation was already accepted. Please log in.');
        }

        if ($invitation->isExpired()) {
            return Inertia::render('Auth/AcceptInvite', [
                'token' => $token,
                'status' => 'expired',
                'message' => 'This invitation has expired. Ask your admin to send a new invite.',
                'invitation' => [
                    'name' => $invitation->name,
                    'email' => $invitation->email,
                    'role' => $invitation->roleLabel(),
                    'company' => $invitation->company?->name,
                    'inviter' => $invitation->inviter?->name,
                    'expires_at' => $invitation->expires_at?->toDateString(),
                ],
            ]);
        }

        return Inertia::render('Auth/AcceptInvite', [
            'token' => $invitation->token,
            'status' => 'ok',
            'message' => null,
            'invitation' => [
                'name' => $invitation->name,
                'email' => $invitation->email,
                'role' => $invitation->roleLabel(),
                'company' => $invitation->company?->name,
                'inviter' => $invitation->inviter?->name,
                'expires_at' => $invitation->expires_at?->toDateString(),
            ],
        ]);
    }

    public function store(string $token, Request $request, TeamService $service): RedirectResponse
    {
        if (! Schema::hasTable('team_invitations')) {
            return back()->withErrors([
                'email' => 'Invitations are not available. Ask your admin to run migrations.',
            ]);
        }

        $invitation = TeamInvitation::query()
            ->where('token', $token)
            ->first();

        if (! $invitation || ! $invitation->isPending()) {
            return redirect()->route('login')
                ->with('status', 'This invitation is invalid or has expired.');
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        if (Auth::check()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $user = $service->accept($invitation, $data);

        Auth::login($user);
        $request->session()->regenerate();

        if ($user->company?->needsOnboarding()) {
            return redirect()->route('onboarding.show')
                ->with('success', 'Welcome! Your staff account is ready.');
        }

        return redirect()->route('dashboard')
            ->with('success', 'Welcome! Your staff account is ready.');
    }
}
