<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Storage;

class InstructorController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | VIEW SUBMISSIONS
    |--------------------------------------------------------------------------
    */

    public function submissions(Request $request): JsonResponse
    {
        $instructor = $request->user();

        /*
        |--------------------------------------------------------------------------
        | CHECK ROLE
        |--------------------------------------------------------------------------
        */

        if ($instructor->role !== 'instructor') {

            return response()->json([

                'success' => false,

                'message' =>
                    'Only instructors can view submissions.',

            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | GET SUBMISSIONS
        |--------------------------------------------------------------------------
        |
        | Only submissions belonging to courses handled
        | by the logged-in instructor are returned.
        |
        */

        $submissions = Submission::with([

            'learner',

            'module.course',

            'grade.items',

        ])
        ->whereHas(
            'module.course',
            function ($query) use ($instructor) {

                $query->where(
                    'instructor_id',
                    $instructor->id
                );

            }
        )
        ->latest('submitted_at')
        ->get();


        /*
        |--------------------------------------------------------------------------
        | FORMAT DATA FOR FRONTEND
        |--------------------------------------------------------------------------
        */

        $submissions = $submissions->map(
            function ($submission) {

                /*
                |--------------------------------------------------------------------------
                | CALCULATE PERCENTAGE
                |--------------------------------------------------------------------------
                */

                $percentage = null;

                if ($submission->grade) {

                    $maxScore =
                        (float) $submission
                            ->grade
                            ->max_score;

                    $score =
                        (float) $submission
                            ->grade
                            ->score;


                    if ($maxScore > 0) {

                        $percentage = round(
                            ($score / $maxScore) * 100,
                            2
                        );

                    }
                    else {

                        $percentage = 0;

                    }

                }


                /*
                |--------------------------------------------------------------------------
                | RETURN FRONTEND DATA
                |--------------------------------------------------------------------------
                */

                return [

                    'id' =>
                        $submission->id,


                    /*
                    |--------------------------------------------------------------------------
                    | LEARNER
                    |--------------------------------------------------------------------------
                    */

                    'learner' => [

                        'id' =>
                            $submission
                                ->learner
                                ->id,

                        'school_id' =>
                            $submission
                                ->learner
                                ->school_id,

                        'name' =>
                            $submission
                                ->learner
                                ->name,

                    ],


                    /*
                    |--------------------------------------------------------------------------
                    | COURSE
                    |--------------------------------------------------------------------------
                    */

                    'course' => [

                        'id' =>
                            $submission
                                ->module
                                ->course
                                ->id,

                        'name' =>
                            $submission
                                ->module
                                ->course
                                ->name,

                        'code' =>
                            $submission
                                ->module
                                ->course
                                ->code,

                    ],


                    /*
                    |--------------------------------------------------------------------------
                    | MODULE
                    |--------------------------------------------------------------------------
                    |
                    | Database column:
                    | modules.title
                    |
                    | Frontend field:
                    | module.name
                    |
                    */

                    'module' => [

                        'id' =>
                            $submission
                                ->module
                                ->id,

                        'name' =>
                            $submission
                                ->module
                                ->title,

                    ],


                    /*
                    |--------------------------------------------------------------------------
                    | SUBMISSION FILE
                    |--------------------------------------------------------------------------
                    */

                    'file_name' =>
                        $submission->file_name,

                    'file_path' =>
                        $submission->file_path,


                    /*
                    |--------------------------------------------------------------------------
                    | LEARNER COMMENT
                    |--------------------------------------------------------------------------
                    */

                    'comment' =>
                        $submission->comment,


                    /*
                    |--------------------------------------------------------------------------
                    | SUBMISSION DATE
                    |--------------------------------------------------------------------------
                    */

                    'submitted_at' =>
                        $submission->submitted_at,


                    /*
                    |--------------------------------------------------------------------------
                    | STATUS
                    |--------------------------------------------------------------------------
                    */

                    'status' =>
                        $submission->status,


                    /*
                    |--------------------------------------------------------------------------
                    | GRADE
                    |--------------------------------------------------------------------------
                    */

                    'grade' =>
                        $submission->grade

                            ? [

                                'score' =>
                                    $submission
                                        ->grade
                                        ->score,

                                'max_score' =>
                                    $submission
                                        ->grade
                                        ->max_score,

                                'percentage' =>
                                    $percentage,

                                'feedback' =>
                                    $submission
                                        ->grade
                                        ->feedback,

                                // Scoring card rows (empty for a single score).
                                'items' =>
                                    $submission
                                        ->grade
                                        ->items
                                        ->map
                                        ->toCardArray()
                                        ->values(),

                            ]

                            : null,

                ];

            }
        );


        /*
        |--------------------------------------------------------------------------
        | RETURN RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            'submissions' =>
                $submissions,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VIEW SUBMISSION FILE
    |--------------------------------------------------------------------------
    */

    public function file(
        Request $request,
        $submissionId
    ): Response {

        $instructor = $request->user();


        /*
        |--------------------------------------------------------------------------
        | CHECK ROLE
        |--------------------------------------------------------------------------
        */

        if ($instructor->role !== 'instructor') {

            abort(
                403,
                'Only instructors can access submission files.'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | FIND SUBMISSION
        |--------------------------------------------------------------------------
        */

        $submission =
            Submission::with(
                'module.course'
            )
            ->find($submissionId);


        if (!$submission) {

            abort(
                404,
                'Submission not found.'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK OWNERSHIP
        |--------------------------------------------------------------------------
        |
        | The instructor can only access submissions
        | belonging to their own courses.
        |
        */

        if (
            !$submission->module ||
            !$submission->module->course ||
            $submission
                ->module
                ->course
                ->instructor_id !==
                $instructor->id
        ) {

            abort(
                403,
                'You are not authorized to access this submission.'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK FILE
        |--------------------------------------------------------------------------
        */

        if (
            !$submission->file_path ||
            !Storage::disk('local')->exists(
                $submission->file_path
            )
        ) {

            abort(
                404,
                'Submission file not found.'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | GET FILE PATH
        |--------------------------------------------------------------------------
        */

        $filePath =
            Storage::disk('local')->path(
                $submission->file_path
            );


        /*
        |--------------------------------------------------------------------------
        | GET MIME TYPE
        |--------------------------------------------------------------------------
        */

        $mimeType =
            Storage::disk('local')->mimeType(
                $submission->file_path
            )
            ?? 'application/octet-stream';


        /*
        |--------------------------------------------------------------------------
        | GET ORIGINAL FILE NAME
        |--------------------------------------------------------------------------
        */

        $fileName =
            $submission->file_name
            ?: basename(
                $submission->file_path
            );


        /*
        |--------------------------------------------------------------------------
        | RETURN FILE
        |--------------------------------------------------------------------------
        */

        // Characters that would break the download header become "_".
        $safeName = preg_replace('#[\x00-\x1F\x7F"/\\\\]+#', '_', $fileName) ?: 'submission';

        return response()->file(

            $filePath,

            [

                'Content-Type' =>
                    $mimeType,

                'Content-Disposition' =>
                    'inline; filename="' . $safeName . '"',

                'X-Content-Type-Options' =>
                    'nosniff',

            ]

        );
    }
}