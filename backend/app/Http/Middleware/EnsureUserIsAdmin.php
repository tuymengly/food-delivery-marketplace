<?php

namespace App\Http\Middleware;

use App\Support\UserRoles;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Role aliases live in App\Support\UserRoles (the same resolver
        // EnsureUserHasRole uses), so 'super_admin' etc. stay recognised
        // in one place instead of being duplicated per middleware.
        if (! UserRoles::isAdmin($request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}

