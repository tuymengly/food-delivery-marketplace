<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array(strtolower((string) $request->user()?->role), ['admin', 'super_admin', 'super admin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
