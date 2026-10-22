<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ResetPasswordLink;
use App\Support\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

/**
 * "Forgot password" by email, for every role.
 *
 * 1. POST /api/password/forgot  {login: school ID or email}
 *    Emails a one-time link (60 minutes) when an active account with an
 *    email address matches. The answer is the same either way, so the
 *    page can't be used to find out which accounts exist.
 * 2. POST /api/password/reset   {token, email, password, password_confirmation}
 *    Sets the new password and signs the account out everywhere.
 */
class PasswordResetController extends Controller
{
    private const SENT_MESSAGE =
        'If an account with an email address matches, a reset link has been sent to it. '
        . 'Check your inbox (and spam folder). The link expires in 60 minutes.';

    private const INVALID_LINK =
        'This reset link is invalid or has expired. Please request a new one.';

    public function forgot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string', 'max:255'],
        ], [
            'login.required' => 'Please enter your School ID or email address.',
        ]);

        $login = trim($validated['login']);

        $user = User::query()
            ->where(function ($query) use ($login) {
                $query->whereRaw('LOWER(school_id) = ?', [mb_strtolower($login)])
                    ->orWhereRaw('LOWER(email) = ?', [mb_strtolower($login)]);
            })
            ->first();

        if ($user && $user->is_active && filled($user->email)) {
            try {
                $status = Password::broker()->sendResetLink(
                    ['email' => $user->email],
                    function (User $account, string $token) {
                        $account->notify(new ResetPasswordLink($token));
                    }
                );

                if ($status === Password::RESET_LINK_SENT) {
                    AuditLog::self($user, AuditLog::PASSWORD_RESET_REQUEST, $request);
                }
            } catch (\Throwable $error) {
                // Mail server problems are logged for the administrator; the
                // person still gets the same answer.
                Log::error('Password reset email could not be sent.', [
                    'user_id' => $user->id,
                    'error' => $error->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'The reset email could not be sent right now. Please try again later or contact your administrator.',
                ], 503);
            }
        }

        return response()->json([
            'success' => true,
            'message' => self::SENT_MESSAGE,
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->input('email'))->first();

        if (!$user || !$user->is_active) {
            return response()->json(['success' => false, 'message' => self::INVALID_LINK], 422);
        }

        // System Administrators need a longer password, as elsewhere.
        $minimum = $user->role === 'system_admin' ? 15 : 8;

        $request->validate([
            'password' => ['required', 'string', "min:{$minimum}", 'max:255', 'confirmed'],
        ], [
            'password.min' => "The new password must be at least {$minimum} characters.",
            'password.confirmed' => 'The new passwords do not match.',
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $account, string $password) {
                $account->password = $password; // hashed by the model
                $account->password_setup_complete = true;
                $account->save();

                // Sign out every device that was using the old password.
                $account->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['success' => false, 'message' => self::INVALID_LINK], 422);
        }

        AuditLog::self($user, AuditLog::PASSWORD_RESET_EMAIL, $request);

        return response()->json([
            'success' => true,
            'message' => 'Your password has been reset. You can now log in with your new password.',
        ]);
    }
}
