<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementReply;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Replies to class announcements.
 *
 * Learners reply to announcements of active classes they are enrolled
 * in, and can delete their own replies. The class instructor can reply
 * too and can remove any reply in their class. Everyone in the class
 * sees the replies.
 */
class AnnouncementReplyController extends Controller
{
    /* ---------------- Learners ---------------- */

    public function studentStore(Request $request, int $announcementId): JsonResponse
    {
        $learner = $request->user();
        $announcement = $this->announcementForLearner($learner, $announcementId);

        if (!$announcement) {
            return $this->notFound('Announcement not found or you are not enrolled in its class.');
        }

        $reply = $this->createReply($request, $announcement, $learner);

        // Let the instructor know a learner replied.
        $instructorId = $announcement->course->instructor_id;
        if ($instructorId) {
            Notification::create([
                'user_id' => $instructorId,
                'title' => 'New reply in ' . $announcement->course->name,
                'message' => Str::limit($learner->name . ' replied to "' . $announcement->title . '": ' . $reply->message, 250),
                'type' => 'announcement_reply',
                // Opens the class's announcements at this one.
                'data' => [
                    'course_id' => $announcement->course_id,
                    'announcement_id' => $announcement->id,
                    'reply_id' => $reply->id,
                    'learner_id' => $learner->id,
                ],
                'is_read' => false,
            ]);
        }

        return $this->created($reply, $learner);
    }

    public function studentDestroy(Request $request, int $replyId): JsonResponse
    {
        $reply = AnnouncementReply::where('id', $replyId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$reply) {
            return $this->notFound('Reply not found.');
        }

        $reply->delete();

        return response()->json(['success' => true, 'message' => 'Reply deleted.']);
    }

    /* ---------------- Instructors ---------------- */

    public function instructorStore(Request $request, int $announcementId): JsonResponse
    {
        $instructor = $request->user();
        $announcement = Announcement::where('id', $announcementId)
            ->whereHas('course', fn ($query) => $query
                ->where('instructor_id', $instructor->id)
                ->where('is_active', true))
            ->first();

        if (!$announcement) {
            return $this->notFound('Announcement not found.');
        }

        return $this->created($this->createReply($request, $announcement, $instructor), $instructor);
    }

    public function instructorDestroy(Request $request, int $replyId): JsonResponse
    {
        $reply = AnnouncementReply::where('id', $replyId)
            ->whereHas('announcement.course', fn ($query) => $query
                ->where('instructor_id', $request->user()->id)
                ->where('is_active', true))
            ->first();

        if (!$reply) {
            return $this->notFound('Reply not found.');
        }

        $reply->delete();

        return response()->json(['success' => true, 'message' => 'Reply removed.']);
    }

    /* ---------------- Helpers ---------------- */

    private function announcementForLearner(User $learner, int $announcementId): ?Announcement
    {
        return Announcement::where('id', $announcementId)
            ->whereHas('course', fn ($query) => $query
                ->where('is_active', true)
                ->whereHas('learners', fn ($learners) => $learners->where('users.id', $learner->id)))
            ->with('course')
            ->first();
    }

    private function createReply(Request $request, Announcement $announcement, User $author): AnnouncementReply
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ], [
            'message.required' => 'Please write your reply.',
            'message.max' => 'Replies can be up to 2,000 characters.',
        ]);

        $message = trim($validated['message']);
        if ($message === '') {
            abort(response()->json([
                'success' => false,
                'message' => 'Please write your reply.',
                'errors' => ['message' => ['Please write your reply.']],
            ], 422));
        }

        return $announcement->replies()->create([
            'user_id' => $author->id,
            'message' => $message,
        ])->load('user:id,name,role');
    }

    private function created(AnnouncementReply $reply, User $viewer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Reply posted.',
            'reply' => $reply->toViewArray($viewer),
        ], 201);
    }

    private function notFound(string $message): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 404);
    }
}
