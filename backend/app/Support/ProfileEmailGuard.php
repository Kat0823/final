<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The email address is not a normal profile field: it changes only through
 * the verified "Change Email" steps (EmailChangeController). Profile forms
 * may still send the current email back unchanged.
 */
class ProfileEmailGuard
{
    public const MESSAGE = 'To change your email address, use "Change Email". The new address must be verified with a code first.';

    /** An error response when the request tries to change the email, else null. */
    public static function refuseChange(Request $request, User $user): ?JsonResponse
    {
        if (!$request->exists('email')) {
            return null;
        }

        $sent = mb_strtolower(trim((string) $request->input('email')));
        $current = mb_strtolower(trim((string) $user->email));

        if ($sent === $current) {
            return null;
        }

        return response()->json([
            'success' => false,
            'message' => self::MESSAGE,
            'errors' => ['email' => [self::MESSAGE]],
        ], 422);
    }
}
