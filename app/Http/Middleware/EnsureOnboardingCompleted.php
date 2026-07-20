<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingCompleted
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->company && $user->company->needsOnboarding()) {
            return redirect()->route('onboarding.show');
        }

        return $next($request);
    }
}
