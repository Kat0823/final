<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorNotificationController extends Controller
{
    /**
     * Get notifications for the logged-in instructor.
     */
    public function index(Request $request): JsonResponse
    {
        $instructor = $request->user();

        if (!$instructor || $instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can view notifications.',
            ], 403);
        }

        $notifications = Notification::where(
            'user_id',
            $instructor->id
        )
        ->latest()
        ->get();

        return response()->json([
            'success' => true,

            'notifications' => $notifications->map(
                function ($notification) {

                    return [
                        'id' => $notification->id,

                        'title' =>
                            $notification->title,

                        'message' =>
                            $notification->message,

                        'type' =>
                            $notification->type,

                        // What it is about (class, learner, ...), when known.
                        'data' =>
                            $notification->data,

                        'is_read' =>
                            (bool) $notification->is_read,

                        'created_at' =>
                            $notification->created_at,
                    ];
                }
            ),
        ]);
    }


    /**
     * Mark one notification as read.
     */
    public function markAsRead(
        Request $request,
        $notificationId
    ): JsonResponse {

        $instructor = $request->user();

        if (!$instructor || $instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' =>
                    'Only instructors can update notifications.',
            ], 403);
        }


        $notification = Notification::where(
            'id',
            $notificationId
        )
        ->where(
            'user_id',
            $instructor->id
        )
        ->first();


        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Notification not found.',
            ], 404);
        }


        if (!$notification->is_read) {

            $notification->update([
                'is_read' => true,
            ]);

        }


        return response()->json([
            'success' => true,

            'message' =>
                'Notification marked as read.',
        ]);
    }


    /**
     * Mark all instructor notifications as read.
     */
    public function markAllAsRead(
        Request $request
    ): JsonResponse {

        $instructor = $request->user();

        if (!$instructor || $instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' =>
                    'Only instructors can update notifications.',
            ], 403);
        }


        Notification::where(
            'user_id',
            $instructor->id
        )
        ->where(
            'is_read',
            false
        )
        ->update([
            'is_read' => true,
        ]);


        return response()->json([
            'success' => true,

            'message' =>
                'All notifications marked as read.',
        ]);
    }
}