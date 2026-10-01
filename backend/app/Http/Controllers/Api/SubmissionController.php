<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => [
                'required',
                'integer',
                'exists:modules,id',
            ],

            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx',
                'max:10240',
            ],

            'comment' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $learner = $request->user();

        /*
         * Make sure the module exists.
         */
        $module = Module::with('course')
            ->find($validated['module_id']);

        if (!$module) {
            return response()->json([
                'success' => false,
                'message' => 'Module not found.',
            ], 404);
        }

        /*
         * Make sure the learner is enrolled
         * in the module's course.
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
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        /*
         * Check if the learner already submitted
         * this module.
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
                'message' => 'You have already submitted this activity.',
            ], 409);
        }

        /*
         * Store the uploaded file.
         *
         * Example:
         * submissions/26-00123/filename.pdf
         */
        $path = $request->file('file')->store(
            'submissions/' . $learner->student_id,
            'local'
        );

        /*
         * Create the submission record.
         */
        $submission = Submission::create([
            'module_id' => $module->id,
            'learner_id' => $learner->id,
            'file_path' => $path,
            'file_name' => $request->file('file')->getClientOriginalName(),
            'comment' => $validated['comment'] ?? null,
            'submitted_at' => now(),
            'status' => 'submitted',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Submission uploaded successfully.',
            'submission' => $submission,
        ], 201);
    }
}