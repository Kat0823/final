<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Notification;
use App\Models\Progress;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function store(
        Request $request
    ): JsonResponse {

        $validated = $request->validate([

            'module_id' => [
                'required',
                'integer',
                'exists:modules,id'
            ],

            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240'
            ],

            'comment' => [
                'nullable',
                'string',
                'max:2000'
            ],

        ]);


        /*
         * Get the currently logged-in learner.
         */

        $learner = $request->user();


        /*
         * Only learners can submit activities.
         */

        if ($learner->role !== 'learner') {

            return response()->json([

                'success' => false,

                'message' =>
                    'Only learners can submit activities.',

            ], 403);

        }


        /*
         * Find the module and its course.
         * Also load the course instructor.
         */

        $module = Module::with([
            'course',
            'course.instructor'
        ])->find(
            $validated['module_id']
        );


        /*
         * Make sure the module exists.
         */

        if (!$module) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Module not found.',

            ], 404);

        }


        /*
         * Check whether the learner
         * is enrolled in the course.
         */

        $enrolled = $learner->courses()
            ->where(
                'courses.id',
                $module->course_id
            )
            ->exists();


        if (!$enrolled) {

            return response()->json([

                'success' => false,

                'message' =>
                    'You are not enrolled in this course.',

            ], 403);

        }


        /*
         * Prevent duplicate submissions.
         */

        $existingSubmission = Submission::where(
            'module_id',
            $module->id
        )
        ->where(
            'learner_id',
            $learner->id
        )
        ->first();


        if ($existingSubmission) {

            return response()->json([

                'success' => false,

                'message' =>
                    'You have already submitted this activity.',

                'submission_id' =>
                    $existingSubmission->id,

            ], 409);

        }


        /*
         * Store the uploaded file.
         */

        $path = $request
            ->file('file')
            ->store(
                'submissions/' .
                $learner->school_id,
                'local'
            );


        /*
         * Create the submission.
         */

        $submission = Submission::create([

            'module_id' =>
                $module->id,

            'learner_id' =>
                $learner->id,

            'file_path' =>
                $path,

            'file_name' =>
                $request
                    ->file('file')
                    ->getClientOriginalName(),

            'comment' =>
                $validated['comment'] ?? null,

            'submitted_at' =>
                now(),

            'status' =>
                'submitted',

        ]);


        /*
         * Record progress: the module is now in progress for this learner.
         */

        Progress::updateOrCreate(
            [
                'learner_id' => $learner->id,
                'module_id' => $module->id,
            ],
            [
                'status' => 'in_progress',
                'completion_percentage' => 50,
                'started_at' => now(),
                'completed_at' => null,
            ]
        );


        /*
         * =====================================================
         * CREATE INSTRUCTOR NOTIFICATION
         * =====================================================
         */

        $instructor =
            $module->course->instructor;


        /*
         * Only create the notification if
         * the course has an assigned instructor.
         */

        if ($instructor) {

            Notification::create([

                'user_id' =>
                    $instructor->id,

                'title' =>
                    'New Submission',

                'message' =>
                    $learner->name .
                    ' submitted "' .
                    $module->title .
                    '" for ' .
                    $module->course->name .
                    '.',

                'type' =>
                    'submission',

                'is_read' =>
                    false,

            ]);

        }


        /*
         * Return successful response.
         */

        return response()->json([

            'success' => true,

            'message' =>
                'Activity submitted successfully.',

            'submission' => [

                'id' =>
                    $submission->id,

                'module_id' =>
                    $submission->module_id,

                'file_name' =>
                    $submission->file_name,

                'file_path' =>
                    $submission->file_path,

                'comment' =>
                    $submission->comment,

                'submitted_at' =>
                    $submission->submitted_at,

                'status' =>
                    $submission->status,

            ],

        ], 201);
    }
}