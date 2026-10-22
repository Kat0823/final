<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Notification;
use App\Models\Progress;
use App\Models\Submission;
use App\Support\AdminNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Learner: View Grades
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $learner = $request->user();

        $grades = $learner->submissions()
            ->with([
                'module.course',
                'grade.instructor',
                'grade.items',
            ])
            ->whereHas('grade')
            ->latest('submitted_at')
            ->get()
            ->map(function ($submission) {

                $grade = $submission->grade;

                $percentage = null;

                if ($grade && $grade->max_score > 0) {
                    $percentage =
                        ($grade->score / $grade->max_score) * 100;
                }

                return [
                    'submission_id' => $submission->id,

                    'module' => [
                        'id' => $submission->module->id,
                        'name' => $submission->module->title,
                    ],

                    'course' => [
                        'id' => $submission->module->course->id,
                        'name' => $submission->module->course->name,
                        'code' => $submission->module->course->code,
                    ],

                    'file_name' => $submission->file_name,

                    'submitted_at' => $submission->submitted_at,

                    'score' => $grade->score,

                    'max_score' => $grade->max_score,

                    'percentage' => round($percentage, 2),

                    'feedback' => $grade->feedback,
                    // Scoring card rows (empty for a single score).
                    'items' => $grade->items->map->toCardArray()->values(),

                    'instructor' => $grade->instructor
                        ? $grade->instructor->name
                        : 'Instructor',

                    'graded_at' => $grade->graded_at,
                ];
            });

        return response()->json([
            'success' => true,
            'grades' => $grades,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Instructor: Grade Submission
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request,
        $submissionId
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | Scoring card or a single score
        |--------------------------------------------------------------------------
        |
        | A submission is one compiled file that can hold several activities.
        | With "items", each activity gets its own row (title, score, over)
        | and the grade stores the totals. Without "items", a single score
        | and maximum are accepted as before.
        |
        */

        $items = null;

        if ($request->has('items')) {
            $validated = $request->validate([
                'items' => ['required', 'array', 'min:1', 'max:30'],
                'items.*.title' => ['required', 'string', 'max:150'],
                'items.*.score' => ['required', 'numeric', 'min:0', 'max:100000'],
                'items.*.max_score' => ['required', 'numeric', 'gt:0', 'max:100000'],
                'feedback' => ['nullable', 'string', 'max:2000'],
            ], [
                'items.required' => 'Add at least one activity to the scoring card.',
                'items.max' => 'A scoring card can have up to 30 activities.',
                'items.*.title.required' => 'Every activity needs a title.',
                'items.*.score.required' => 'Every activity needs a score.',
                'items.*.max_score.required' => 'Every activity needs the total it is scored over.',
                'items.*.max_score.gt' => 'The total of an activity must be greater than zero.',
            ]);

            $items = collect($validated['items'])->values()->map(fn ($item, $index) => [
                'title' => trim($item['title']),
                'score' => round((float) $item['score'], 2),
                'max_score' => round((float) $item['max_score'], 2),
                'position' => $index,
            ]);

            foreach ($items as $item) {
                if ($item['title'] === '') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Every activity needs a title.',
                    ], 422);
                }

                if ($item['score'] > $item['max_score']) {
                    return response()->json([
                        'success' => false,
                        'message' => "The score of \"{$item['title']}\" cannot be greater than {$item['max_score']}.",
                    ], 422);
                }
            }

            $validated['score'] = round($items->sum('score'), 2);
            $validated['max_score'] = round($items->sum('max_score'), 2);
        } else {
            $validated = $request->validate([
                'score' => [
                    'required',
                    'numeric',
                    'min:0',
                ],

                'max_score' => [
                    'required',
                    'numeric',
                    'min:1',
                ],

                'feedback' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],
            ]);
        }

        $instructor = $request->user();


        /*
        |--------------------------------------------------------------------------
        | Check instructor role
        |--------------------------------------------------------------------------
        */

        if ($instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can grade submissions.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | Find submission
        |--------------------------------------------------------------------------
        */

        $submission = Submission::with([
            'learner',
            'module.course'
        ])->find($submissionId);

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'Submission not found.',
            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | Check course instructor
        |--------------------------------------------------------------------------
        */

        if (
            !$submission->module ||
            !$submission->module->course ||
            $submission->module->course->instructor_id
                !== $instructor->id
        ) {
            return response()->json([
                'success' => false,
                'message' => 'You are not assigned to this course.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | Check score
        |--------------------------------------------------------------------------
        */

        if ($validated['score'] > $validated['max_score']) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Score cannot be greater than the maximum score.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | Save grade and notification
        |--------------------------------------------------------------------------
        */

        $result = DB::transaction(function () use (
            $validated,
            $submission,
            $instructor,
            $items
        ) {

            /*
            |--------------------------------------------------------------------------
            | Check whether this submission already has a grade
            |--------------------------------------------------------------------------
            */

            $existingGrade = Grade::where(
                'submission_id',
                $submission->id
            )->first();


            /*
            |--------------------------------------------------------------------------
            | Create or update grade
            |--------------------------------------------------------------------------
            */

            $grade = Grade::updateOrCreate(
                [
                    'submission_id' => $submission->id,
                ],
                [
                    'instructor_id' => $instructor->id,
                    'score' => $validated['score'],
                    'max_score' => $validated['max_score'],
                    'feedback' => $validated['feedback'] ?? null,
                    'graded_at' => now(),
                ]
            );

            /*
            | Replace the scoring card rows (a single score clears them).
            */
            $grade->items()->delete();

            if ($items) {
                $grade->items()->createMany($items->all());
            }


            /*
            |--------------------------------------------------------------------------
            | Mark submission as graded
            |--------------------------------------------------------------------------
            */

            $submission->update([
                'status' => 'graded',
            ]);


            /*
            |--------------------------------------------------------------------------
            | Mark the module as completed for this learner
            |--------------------------------------------------------------------------
            */

            $progress = Progress::firstOrNew([
                'learner_id' => $submission->learner_id,
                'module_id' => $submission->module_id,
            ]);

            $progress->status = 'completed';
            $progress->completion_percentage = 100;

            if (!$progress->started_at) {
                $progress->started_at = $submission->submitted_at ?? now();
            }

            $progress->completed_at = now();
            $progress->save();


            /*
            |--------------------------------------------------------------------------
            | Create notification only for a new grade
            |--------------------------------------------------------------------------
            */

            if (!$existingGrade) {

                Notification::create([
                    'user_id' => $submission->learner_id,

                    'title' => 'Activity Graded',

                    'message' =>
                        'Your activity "' .
                        $submission->module->title .
                        '" has been graded. Score: ' .
                        $validated['score'] .
                        '/' .
                        $validated['max_score'] .
                        '.',

                    'type' => 'grade',

                    'is_read' => false,
                ]);

                AdminNotifier::submissionGraded(
                    $instructor,
                    $submission->learner,
                    $submission->module->title,
                    $submission->module->course->name,
                    $validated['score'],
                    $validated['max_score'],
                    $submission->module->course->owner_admin_id
                );
            }


            return [
                'grade' => $grade,
                'new_grade' => !$existingGrade,
            ];
        });


        return response()->json([
            'success' => true,

            'message' =>
                $result['new_grade']
                    ? 'Submission graded successfully.'
                    : 'Grade updated successfully.',

            'grade' => $result['grade']->load('items'),
        ]);
    }
}