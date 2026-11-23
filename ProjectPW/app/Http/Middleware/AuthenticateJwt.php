<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateJwt
{
    public function handle(Request $request, Closure $next, string $optional = ''): Response
    {
        $token = $request->bearerToken();
        if (! $token && $optional === 'optional') {
            return $next($request);
        }
        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $authenticated = app(JwtService::class)->authenticate($token);
        if (! $authenticated) {
            return response()->json(['message' => 'Token is invalid.'], 401);
        }

        $request->attributes->set('jwt_jti', $authenticated['jti']);
        $request->setUserResolver(fn () => $authenticated['user']);

        return $next($request);
    }
}
