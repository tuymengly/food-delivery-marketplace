<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (strtolower((string) $request->user()?->role) !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
