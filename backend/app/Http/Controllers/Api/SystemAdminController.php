<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemAdminAuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class SystemAdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $statistics = [
            'total_users' => 0,
            'learners' => 0,
            'instructors' => 0,
            'academic_admins' => 0,
            'system_admins' => 0,
            'active_accounts' => 0,
            'inactive_accounts' => 0,
        ];

        $usersByRoleAndStatus = User::query()
            ->selectRaw('role, is_active, COUNT(*) as aggregate')
            ->groupBy('role', 'is_active')
            ->get();

        foreach ($usersByRoleAndStatus as $group) {
            $count = (int) $group->aggregate;
            $statistics['total_users'] += $count;
            $statistics[$group->is_active ? 'active_accounts' : 'inactive_accounts'] += $count;

            $roleStatistic = match ($group->role) {
                'learner' => 'learners',
                'instructor' => 'instructors',
                'academic_admin' => 'academic_admins',
                'system_admin' => 'system_admins',
                default => null,
            };

            if ($roleStatistic !== null) {
                $statistics[$roleStatistic] += $count;
            }
        }

        return response()->json([
            'success' => true,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Newest audit entries first. The page filters and paginates these
     * in the browser, so this returns a bounded list.
     */
    public function auditLogs(): JsonResponse
    {
        $entries = SystemAdminAuditLog::query()
            ->latest('id')
            ->limit(self::AUDIT_LOG_LIMIT)
            ->get();

        // Current roles of actors, for older entries that didn't store one.
        $actorRoles = User::query()
            ->whereIn('id', $entries->pluck('actor_id')->filter()->unique())
            ->pluck('role', 'id');

        $logs = $entries->map(function (SystemAdminAuditLog $log) use ($actorRoles): array {
            $details = is_array($log->details) ? $log->details : [];
            $actorRole = $details['actor_role'] ?? $actorRoles[$log->actor_id] ?? null;
            $ip = $details['ip'] ?? null;
            unset($details['actor_role'], $details['ip']);

            return [
                'id' => $log->id,
                'action' => $log->action,
                'module' => self::AUDIT_MODULES[$log->action] ?? 'Academic Admin Accounts',
                'actor_id' => $log->actor_id,
                'actor_name' => $log->actor_name,
                'actor_role' => $actorRole,
                'target_id' => $log->target_id,
                'target_name' => $log->target_name,
                'ip' => $ip,
                'details' => $details,
                'created_at' => $log->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'logs' => $logs,
            'limit' => self::AUDIT_LOG_LIMIT,
        ]);
    }

    private const AUDIT_LOG_LIMIT = 1000;

    // Which part of the system each action belongs to (the page's Module
    // column). Anything not listed is an Academic Admin account change.
    private const AUDIT_MODULES = [
        'login' => 'Sign-in',
        'login_failed' => 'Sign-in',
        'login_blocked' => 'Sign-in',
        'account_locked' => 'Sign-in',
        'logout' => 'Sign-in',
        'profile_update' => 'Own Account',
        'password_change' => 'Own Account',
        'password_setup' => 'Own Account',
    ];
}
