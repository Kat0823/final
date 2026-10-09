<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'module_id' => 'required|exists:modules,id',
            'file' => 'required|file|max:10240',
            'comment' => 'nullable|string',
        ]);

        $learner = $request->user();

        if ($learner->role !== 'learner') {
            return response()->json([
                'success' => false,
                'message' => 'Only learners can submit files.',
            ], 403);
        }

        $module = Module::with('course')->findOrFail(
            $request->module_id
        );

        $enrolled = $learner->courses()
            ->where('courses.id', $module->course_id)
            ->exists();

        if (!$enrolled) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

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
                'message' => 'You have already submitted this module.',
            ], 409);
        }

        $file = $request->file('file');

        $path = $file->store(
            'submissions/' . $learner->school_id,
            'public'
        );

        $submission = Submission::create([
            'module_id' => $module->id,
            'learner_id' => $learner->id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'comment' => $request->comment,
            'submitted_at' => now(),
            'status' => 'submitted',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Submission uploaded successfully.',
            'submission' => $submission,
        ], 201);
    }

    public function instructorIndex(Request $request): JsonResponse
    {
        $instructor = $request->user();

        if ($instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can view submissions.',
            ], 403);
        }

        $submissions = Submission::with([
            'learner',
            'module.course',
            'grade',
        ])
        ->whereHas('module.course', function ($query) use ($instructor) {
            $query->where('instructor_id', $instructor->id);
        })
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
                'id' => $submission->id,

                'student' => [
                    'id' => $submission->learner->id,
                    'student_id' => $submission->learner->school_id,
                    'name' => $submission->learner->name,
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
                'file_path' => $submission->file_path,
                'comment' => $submission->comment,
                'submitted_at' => $submission->submitted_at,
                'status' => $submission->status,

                'grade' => $grade ? [
                    'score' => $grade->score,
                    'max_score' => $grade->max_score,
                    'percentage' => round($percentage, 2),
                    'feedback' => $grade->feedback,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'submissions' => $submissions,
        ]);
    }
}