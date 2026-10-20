<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications belonging to the authenticated learner.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->role !== 'learner') {
            return response()->json([
                'success' => false,
                'message' => 'Only learners can access this resource.',
            ], 403);
        }

        $notifications = $user->notifications()
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Get notifications belonging to the Academic Admin.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark an owned notification as read.
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $notification = $this->findOwnedNotification($request, $id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.',
            ], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'notification' => $notification->fresh(),
        ]);
    }

    /**
     * Mark an owned notification as unread.
     */
    public function markUnread(Request $request, int $id): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $notification = $this->findOwnedNotification($request, $id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.',
            ], 404);
        }

        $notification->update(['is_read' => false]);

        return response()->json([
            'success' => true,
            'notification' => $notification->fresh(),
        ]);
    }

    /**
     * Delete an owned notification.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $notification = $this->findOwnedNotification($request, $id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully.',
        ]);
    }

    // =====================================================
    // LEARNER: MARK ONE NOTIFICATION AS READ
    // =====================================================

    public function markAsRead(Request $request, $notificationId): JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->role !== 'learner') {
            return response()->json([
                'success' => false,
                'message' => 'Only learners can update these notifications.',
            ], 403);
        }

        $notification = $user->notifications()
            ->where('id', $notificationId)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.',
            ], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    // =====================================================
    // LEARNER: MARK ALL NOTIFICATIONS AS READ
    // =====================================================

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->role !== 'learner') {
            return response()->json([
                'success' => false,
                'message' => 'Only learners can update these notifications.',
            ], 403);
        }

        $user->notifications()
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    private function checkAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user() ||
            $request->user()->role !== 'academic_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only Academic Administrators can access this resource.',
            ], 403);
        }

        return null;
    }

    private function findOwnedNotification(
        Request $request,
        int $id
    ): ?Notification {
        return Notification::where('user_id', $request->user()->id)
            ->whereKey($id)
            ->first();
    }
}
