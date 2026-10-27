<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        // The learner each notification is about (name and photo), so the
        // page can show their picture instead of a bell.
        $learnerIds = $notifications
            ->map(fn ($notification) => $notification->data['learner_id'] ?? null)
            ->filter()
            ->unique()
            ->values();

        $learners = $learnerIds->isEmpty()
            ? collect()
            : User::whereIn('id', $learnerIds)
                ->where('role', 'learner')
                ->get(['id', 'name', 'profile_photo_path'])
                ->keyBy('id');

        return response()->json([
            'success' => true,

            'notifications' => $notifications->map(
                function ($notification) use ($learners) {

                    $learner = $learners->get($notification->data['learner_id'] ?? null);

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

                        'learner' => $learner ? [
                            'id' => $learner->id,
                            'name' => $learner->name,
                            'profile_photo_url' => $learner->profile_photo_path
                                ? url(Storage::disk('public')->url($learner->profile_photo_path))
                                : null,
                        ] : null,

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