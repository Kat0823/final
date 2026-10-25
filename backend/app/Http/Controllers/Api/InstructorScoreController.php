<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The class grade book for the instructor: every module, every enrolled
 * learner, and each learner's submission and grade per module. Used for
 * the learner score cards on the class page.
 */
class InstructorScoreController extends Controller
{
    public function index(Request $request, int $courseId): JsonResponse
    {
        $course = Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->where('is_active', true)
            ->with([
                'modules' => fn ($query) => $query->orderBy('module_order')->orderBy('id'),
                'learners' => fn ($query) => $query->orderBy('name'),
            ])
            ->first();

        if (!$course) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found or not assigned to you.',
            ], 404);
        }

        $submissions = Submission::whereIn('module_id', $course->modules->pluck('id'))
            ->whereIn('learner_id', $course->learners->pluck('id'))
            ->with('grade')
            ->get()
            ->groupBy('learner_id');

        return response()->json([
            'success' => true,
            'modules' => $course->modules->map(fn ($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'module_order' => $module->module_order,
                'is_published' => (bool) $module->is_published,
            ])->values(),
            'learners' => $course->learners->map(function ($learner) use ($submissions) {
                $mine = $submissions->get($learner->id, collect());

                return [
                    'id' => $learner->id,
                    'name' => $learner->name,
                    'school_id' => $learner->school_id,
                    'program' => $learner->program,
                    'submissions' => $mine->map(fn ($submission) => [
                        'id' => $submission->id,
                        'module_id' => $submission->module_id,
                        'file_name' => $submission->file_name,
                        'comment' => $submission->comment,
                        'submitted_at' => $submission->submitted_at,
                        'grade' => $submission->grade ? [
                            'score' => (float) $submission->grade->score,
                            'max_score' => (float) $submission->grade->max_score,
                            'percentage' => $submission->grade->max_score > 0
                                ? round(($submission->grade->score / $submission->grade->max_score) * 100, 2)
                                : null,
                            'feedback' => $submission->grade->feedback,
                            'graded_at' => $submission->grade->graded_at,
                        ] : null,
                    ])->values(),
                ];
            })->values(),
        ]);
    }
}
