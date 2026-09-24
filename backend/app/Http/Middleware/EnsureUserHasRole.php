<?php

namespace App\Http\Middleware;

use App\Support\UserRoles;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Parameterised role gate, resolved through App\Support\UserRoles so the
 * alias handling lives in exactly one place.
 *
 * Usage: ->middleware('role:restaurant_owner,admin')
 *
 * Always listed after 'auth:sanctum' so guests get a 401 from the auth
 * middleware and only authenticated users are checked against the role(s).
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (! UserRoles::has($user, ...$roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Your account role is not allowed to access this resource.',
                'errors' => [
                    'role' => ['The authenticated user does not have the required role.'],
                ],
            ], 403);
        }

        return $next($request);
    }
}
