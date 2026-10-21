<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AdminNotifier;
use App\Support\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Sanctum\TransientToken;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS_PER_ACCOUNT = 5;
    private const MAX_ATTEMPTS_PER_IP = 20;
    private const LOCKOUT_SECONDS = 60;

    // bcrypt hash of a random string; used only to keep timing constant.
    private const DUMMY_HASH = '$2y$12$xbCXUaGCC.0LUYG6tdx2ieIdxF74k0gojg.JWYBBqiu57UccNNLqq';

    public function login(Request $request): JsonResponse
    {
        // Validate login inputs
        $validated = $request->validate([
            'school_id' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Limit failed attempts: per account+IP, and per IP across accounts.
        $accountKey = 'login:' . Str::lower(trim($validated['school_id'])) . '|' . $request->ip();
        $ipKey = 'login-ip:' . $request->ip();

        if (
            RateLimiter::tooManyAttempts($accountKey, self::MAX_ATTEMPTS_PER_ACCOUNT)
            || RateLimiter::tooManyAttempts($ipKey, self::MAX_ATTEMPTS_PER_IP)
        ) {
            $seconds = max(
                RateLimiter::availableIn($accountKey),
                RateLimiter::availableIn($ipKey)
            );

            return response()->json([
                'success' => false,
                'message' => "Too many failed login attempts. Please try again in {$seconds} seconds.",
                'retry_after' => $seconds,
            ], 429);
        }

        // Find the account using the school ID
        $user = User::where('school_id', $validated['school_id'])
            ->first();

        // Check the password even when the ID doesn't exist, so response
        // time doesn't reveal which school IDs are registered.
        $passwordValid = Hash::check(
            $validated['password'],
            $user?->password ?? self::DUMMY_HASH
        );

        if (!$user || !$passwordValid) {
            $attempts = RateLimiter::hit($accountKey, self::LOCKOUT_SECONDS);
            RateLimiter::hit($ipKey, self::LOCKOUT_SECONDS);

            // Audit: the person trying is unknown, so the actor is "Unknown".
            AuditLog::record(
                null,
                AuditLog::LOGIN_FAILED,
                $user,
                [
                    'school_id' => Str::limit(trim($validated['school_id']), 100, ''),
                    'account_exists' => (bool) $user,
                    'attempt' => $attempts,
                ],
                $request,
                'Unknown',
                $user?->name ?? Str::limit(trim($validated['school_id']), 100, '')
            );

            // Tell the admins once, on the attempt that starts the lockout.
            if ($user && $attempts === self::MAX_ATTEMPTS_PER_ACCOUNT) {
                AdminNotifier::accountLocked($user, self::LOCKOUT_SECONDS);

                AuditLog::record(
                    null,
                    AuditLog::ACCOUNT_LOCKED,
                    $user,
                    [
                        'school_id' => $user->school_id,
                        'target_role' => $user->role,
                        'seconds' => self::LOCKOUT_SECONDS,
                    ],
                    $request,
                    'System'
                );
            }

            return response()->json([
                'success' => false,
                'message' => 'Invalid ID or password.',
            ], 401);
        }

        RateLimiter::clear($accountKey);

        if (!$user->is_active) {
            AuditLog::self($user, AuditLog::LOGIN_BLOCKED, $request, ['reason' => 'deactivated']);

            return response()->json([
                'success' => false,
                'message' => 'This account is deactivated. Please contact your administrator.',
            ], 403);
        }

        // Create an authentication token
        $token = $user->createToken('siknayan-login')->plainTextToken;

        AuditLog::self($user, AuditLog::LOGIN, $request, [
            'first_login' => !$user->password_setup_complete,
        ]);

        // Return login information
        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'first_login' => !$user->password_setup_complete,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'school_id' => $user->school_id,
                'program' => $user->program,
                'contact' => $user->contact,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $currentAccessToken = $request->user()->currentAccessToken();

        if ($currentAccessToken instanceof TransientToken) {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        } else {
            $currentAccessToken?->delete();
        }

        AuditLog::self($request->user(), AuditLog::LOGOUT, $request);

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
