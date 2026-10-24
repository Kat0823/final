<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AnnouncementPosted;
use App\Models\Announcement;
use App\Models\Course;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Class announcements. An instructor can only see and change the
 * announcements of their own active classes.
 */
class InstructorAnnouncementController extends Controller
{
    public function index(Request $request, int $courseId): JsonResponse
    {
        $course = $this->ownClass($request, $courseId);

        if (!$course) {
            return $this->classNotFound();
        }

        $instructor = $request->user();

        return response()->json([
            'success' => true,
            'announcements' => $course->announcements()
                ->with(['instructor:id,name', 'replies.user:id,name,role'])
                ->latest()
                ->latest('id')
                ->get()
                ->map(function ($announcement) use ($instructor) {
                    $data = $announcement->only(['id', 'course_id', 'title', 'message', 'created_at', 'updated_at']);
                    $data['instructor'] = $announcement->instructor?->only(['id', 'name']);
                    $data['replies'] = $announcement->replies
                        ->map(fn ($reply) => $reply->toViewArray($instructor))
                        ->values();
                    return $data;
                })
                ->values(),
        ]);
    }

    /**
     * Post an announcement and notify every learner in the class.
     */
    public function store(Request $request, int $courseId): JsonResponse
    {
        $course = $this->ownClass($request, $courseId);

        if (!$course) {
            return $this->classNotFound();
        }

        $validated = $this->validateAnnouncement($request);

        $announcement = DB::transaction(function () use ($request, $course, $validated) {
            $announcement = $course->announcements()->create([
                'instructor_id' => $request->user()->id,
                'title' => $validated['title'],
                'message' => $validated['message'],
            ]);

            foreach ($course->learners()->pluck('users.id') as $learnerId) {
                Notification::create([
                    'user_id' => $learnerId,
                    'title' => 'New announcement in ' . $course->name,
                    'message' => Str::limit($validated['title'] . ': ' . $validated['message'], 250),
                    'type' => 'announcement',
                    'data' => [
                        'course_id' => $course->id,
                        'announcement_id' => $announcement->id,
                    ],
                    'is_read' => false,
                ]);
            }

            return $announcement;
        });

        $this->emailLearners($course, $announcement, (string) $request->user()->name);

        return response()->json([
            'success' => true,
            'message' => 'Announcement posted.',
            'announcement' => $announcement->load('instructor:id,name'),
        ], 201);
    }

    public function update(Request $request, int $announcementId): JsonResponse
    {
        $announcement = $this->ownAnnouncement($request, $announcementId);

        if (!$announcement) {
            return $this->announcementNotFound();
        }

        $announcement->update($this->validateAnnouncement($request));

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated.',
            'announcement' => $announcement->load('instructor:id,name'),
        ]);
    }

    public function destroy(Request $request, int $announcementId): JsonResponse
    {
        $announcement = $this->ownAnnouncement($request, $announcementId);

        if (!$announcement) {
            return $this->announcementNotFound();
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted.',
        ]);
    }

    /**
     * Email the announcement to the class's active learners who have an
     * email address. It is sent after the response, so posting stays
     * fast; learners are in BCC, 50 per email. A mail problem is logged
     * and never stops the announcement.
     */
    private function emailLearners(Course $course, Announcement $announcement, string $instructorName): void
    {
        $emails = $course->learners()
            ->where('users.is_active', true)
            ->whereNotNull('users.email')
            ->where('users.email', '!=', '')
            ->pluck('users.email')
            ->unique()
            ->values();

        if ($emails->isEmpty()) {
            return;
        }

        app()->terminating(function () use ($emails, $course, $announcement, $instructorName) {
            foreach ($emails->chunk(50) as $group) {
                try {
                    Mail::bcc($group->values()->all())
                        ->send(new AnnouncementPosted($course, $announcement, $instructorName));
                } catch (\Throwable $error) {
                    Log::error('Announcement email could not be sent.', [
                        'announcement_id' => $announcement->id,
                        'recipients' => $group->count(),
                        'error' => $error->getMessage(),
                    ]);
                }
            }
        });
    }

    private function validateAnnouncement(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:5000'],
        ]);
    }

    private function ownClass(Request $request, int $courseId): ?Course
    {
        return Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->where('is_active', true)
            ->first();
    }

    private function ownAnnouncement(Request $request, int $announcementId): ?Announcement
    {
        return Announcement::where('id', $announcementId)
            ->whereHas('course', function ($query) use ($request) {
                $query->where('instructor_id', $request->user()->id)
                    ->where('is_active', true);
            })
            ->first();
    }

    private function classNotFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Class not found or not assigned to you.',
        ], 404);
    }

    private function announcementNotFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Announcement not found.',
        ], 404);
    }
}
