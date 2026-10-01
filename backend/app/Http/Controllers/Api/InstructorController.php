<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function submissions(Request $request): JsonResponse
    {
        $instructor = $request->user();

        if ($instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can view submissions.',
            ], 403);
        }

        $submissions = \App\Models\Submission::with([
            'learner',
            'module.course',
            'grade'
        ])
        ->whereHas('module.course', function ($query) use ($instructor) {
            $query->where('instructor_id', $instructor->id);
        })
        ->latest('submitted_at')
        ->get()
        ->map(function ($submission) {

            return [
                'id' => $submission->id,

                'learner' => [
                    'id' => $submission->learner->id,
                    'name' => $submission->learner->name,
                    'school_id' => $submission->learner->school_id,
                ],

                'course' => [
                    'id' => $submission->module->course->id,
                    'name' => $submission->module->course->name,
                    'code' => $submission->module->course->code,
                ],

                'module' => [
                    'id' => $submission->module->id,
                    'name' => $submission->module->name,
                ],

                'file_name' => $submission->file_name,

                'path' => $submission->path,

                'comment' => $submission->comment,

                'submitted_at' => $submission->submitted_at,

                'status' => $submission->status,

                'grade' => $submission->grade
                    ? [
                        'score' => $submission->grade->score,
                        'max_score' => $submission->grade->max_score,
                        'feedback' => $submission->grade->feedback,
                    ]
                    : null,
            ];
        });

        return response()->json([
            'success' => true,
            'submissions' => $submissions,
        ]);
    }
}
