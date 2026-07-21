<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TeamInvitation;
use App\Services\Crm\TeamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class TeamInviteController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = TeamInvitation::query()
            ->with(['company:id,name', 'inviter:id,name'])
            ->where('token', $token)
            ->firstOrFail();

        if ($invitation->accepted_at) {
            return redirect()->route('login')
                ->with('status', 'This invitation was already accepted. Please log in.');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('login')
                ->with('status', 'This invitation has expired. Ask your admin to send a new invite.');
        }

        return Inertia::render('Auth/AcceptInvite', [
            'token' => $invitation->token,
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
        $invitation = TeamInvitation::query()
            ->where('token', $token)
            ->firstOrFail();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

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
