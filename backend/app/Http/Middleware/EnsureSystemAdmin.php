<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSystemAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== 'system_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only System Administrators can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
