<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * The learner's classes. Only active classes the learner is enrolled in,
 * and only published modules. Instructors are shown by name only.
 */
class StudentController extends Controller
{
    public function courses(Request $request): JsonResponse
    {
        $learner = $request->user();

        $courses = $learner->courses()
            ->with('instructor:id,name')
            ->withCount(['modules' => fn ($query) => $query->where('is_published', true)])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // How many of each class's published modules this learner has
        // submitted, and how many of those are graded.
        $submissions = Submission::where('learner_id', $learner->id)
            ->whereHas('module', fn ($query) => $query
                ->where('is_published', true)
                ->whereIn('course_id', $courses->pluck('id')))
            ->with(['module:id,course_id', 'grade:id,submission_id'])
            ->get()
            ->groupBy(fn ($submission) => $submission->module->course_id);

        return response()->json([
            'success' => true,
            'courses' => $courses->map(function (Course $course) use ($submissions) {
                $mine = $submissions->get($course->id, collect());

                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'code' => $course->code,
                    'subject_code' => $course->subject_code,
                    'program' => $course->program,
                    'description' => $course->description,
                    'instructor' => self::person($course->instructor),
                    'module_count' => $course->modules_count,
                    'submitted_count' => $mine->count(),
                    'graded_count' => $mine->filter(fn ($submission) => $submission->grade)->count(),
                ];
            })->values(),
        ]);
    }

    public function course(Request $request, $courseId): JsonResponse
    {
        $learner = $request->user();

        $course = $learner->courses()
            ->with([
                'instructor:id,name',
                'modules' => fn ($query) => $query
                    ->where('is_published', true)
                    ->orderBy('module_order')
                    ->orderBy('id'),
                // Newest first, with who posted it.
                'announcements' => fn ($query) => $query
                    ->with(['instructor:id,name', 'replies.user:id,name,role'])
                    ->latest()
                    ->latest('id'),
            ])
            ->where('courses.id', $courseId)
            ->where('courses.is_active', true)
            ->first();

        if (!$course) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found or you are not enrolled in this course.',
            ], 404);
        }

        $submissions = self::submissionsFor($learner, $course->modules->pluck('id'));

        return response()->json([
            'success' => true,
            'course' => [
                'id' => $course->id,
                'name' => $course->name,
                'code' => $course->code,
                'subject_code' => $course->subject_code,
                'program' => $course->program,
                'description' => $course->description,
                'instructor' => self::person($course->instructor),
                'modules' => $course->modules
                    ->map(fn (Module $module) => self::module($module, $submissions->get($module->id)))
                    ->values(),
                'announcements' => $course->announcements->map(fn ($announcement) => [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'message' => $announcement->message,
                    'instructor' => self::person($announcement->instructor),
                    'created_at' => $announcement->created_at,
                    'updated_at' => $announcement->updated_at,
                    'replies' => $announcement->replies
                        ->map(fn ($reply) => $reply->toViewArray($learner))
                        ->values(),
                ])->values(),
            ],
        ]);
    }

    /**
     * A module as the learner sees it, with their own submission (if any).
     */
    public static function module(Module $module, ?Submission $submission): array
    {
        return [
            'id' => $module->id,
            'course_id' => $module->course_id,
            'title' => $module->title,
            'description' => $module->description,
            'module_order' => $module->module_order,
            'has_material' => $module->has_material,
            'material_name' => $module->has_material ? $module->material_name : null,
            'my_submission' => self::submission($submission),
        ];
    }

    public static function submission(?Submission $submission): ?array
    {
        if (!$submission) {
            return null;
        }

        $grade = $submission->grade;

        return [
            'id' => $submission->id,
            'file_name' => $submission->file_name,
            'comment' => $submission->comment,
            'submitted_at' => $submission->submitted_at,
            'status' => $grade ? 'graded' : 'submitted',
            'grade' => $grade ? [
                'score' => $grade->score,
                'max_score' => $grade->max_score,
                'percentage' => $grade->max_score > 0
                    ? round(($grade->score / $grade->max_score) * 100, 2)
                    : null,
                'feedback' => $grade->feedback,
                'graded_at' => $grade->graded_at,
            ] : null,
        ];
    }

    /**
     * This learner's submissions for the given modules, keyed by module id.
     */
    public static function submissionsFor(User $learner, Collection $moduleIds): Collection
    {
        return Submission::where('learner_id', $learner->id)
            ->whereIn('module_id', $moduleIds)
            ->with('grade')
            ->get()
            ->keyBy('module_id');
    }

    private static function person(?User $user): ?array
    {
        return $user ? ['id' => $user->id, 'name' => $user->name] : null;
    }
}
