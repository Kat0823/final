<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordSetup
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->password_setup_complete) {

            $currentPath = $request->path();

            $isStudentSetup =
                $currentPath === 'api/student/setup-password';

            $isInstructorSetup =
                $currentPath === 'api/instructor/setup-password';

            if (
                !$isStudentSetup &&
                !$isInstructorSetup
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'You must set your new password before accessing this resource.',
                    'first_login' => true,
                    'password_setup_required' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}