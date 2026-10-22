<?php

namespace App\Support;

use App\Models\SystemAdminAuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Writes entries to the audit log (system_admin_audit_logs).
 *
 * Every entry stores who did it (actor), what (action), to whom (target),
 * and details. The actor's role and the request's IP address are added to
 * the details automatically. Never pass passwords in $details.
 */
class AuditLog
{
    public const LOGIN = 'login';
    public const LOGIN_FAILED = 'login_failed';
    public const LOGIN_BLOCKED = 'login_blocked';
    public const ACCOUNT_LOCKED = 'account_locked';
    public const LOGOUT = 'logout';
    public const PROFILE_UPDATE = 'profile_update';
    public const PASSWORD_CHANGE = 'password_change';
    public const PASSWORD_SETUP = 'password_setup';
    public const PASSWORD_RESET_REQUEST = 'password_reset_request';
    public const PASSWORD_RESET_EMAIL = 'password_reset_email';

    public static function record(
        ?User $actor,
        string $action,
        ?User $target,
        array $details = [],
        ?Request $request = null,
        ?string $actorName = null,
        ?string $targetName = null
    ): void {
        if ($actor) {
            $details['actor_role'] = $actor->role;
        }

        if ($request) {
            $details['ip'] = $request->ip();
        }

        SystemAdminAuditLog::create([
            'actor_id' => $actor?->id,
            'actor_name' => Str::limit($actorName ?? $actor?->name ?? 'Unknown', 250, ''),
            'action' => $action,
            'target_id' => $target?->id,
            'target_name' => Str::limit($targetName ?? $target?->name ?? '—', 250, ''),
            'details' => $details,
        ]);
    }

    /**
     * A user acting on their own account (sign-in, password change...).
     */
    public static function self(User $user, string $action, Request $request, array $details = []): void
    {
        self::record($user, $action, $user, ['school_id' => $user->school_id] + $details, $request);
    }
}
