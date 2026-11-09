<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!$request->user() || $request->user()->role !== $role) {
            return response()->json(['error' => $role === 'admin'
                ? 'An administrator must log in to access this data.'
                : 'A guest must log in to access this data.'], 401);
        }

        if ($role === 'guest' && !$request->user()->guestProfile?->active) {
            return response()->json(['error' => 'This guest account is inactive.'], 401);
        }

        return $next($request);
    }
}
