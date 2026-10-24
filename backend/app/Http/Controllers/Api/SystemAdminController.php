<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
}
