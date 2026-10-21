<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Allows the request only for the listed roles, e.g.
 *   ->middleware(EnsureRole::class . ':learner')
 */
class EnsureRole
{
    private const LABELS = [
        'learner' => 'learners',
        'instructor' => 'instructors',
        'academic_admin' => 'Academic Administrators',
        'system_admin' => 'System Administrators',
    ];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles, true)) {
            $who = implode(' and ', array_map(
                fn (string $role): string => self::LABELS[$role] ?? $role,
                $roles
            ));

            return response()->json([
                'success' => false,
                'message' => "Only {$who} can access this resource.",
            ], 403);
        }

        return $next($request);
    }
}
