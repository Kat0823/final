<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Notification;
use App\Models\Submission;
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
                'grade.instructor'
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
            $instructor
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
            |--------------------------------------------------------------------------
            | Mark submission as graded
            |--------------------------------------------------------------------------
            */

            $submission->update([
                'status' => 'graded',
            ]);


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

            'grade' => $result['grade'],
        ]);
    }
}