<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function show(Request $request, $moduleId): JsonResponse
    {
        $learner = $request->user();

        $module = Module::with([
            'course.instructor'
        ])
            ->where('id', $moduleId)
            ->where('is_published', true)
            ->first();

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

        return response()->json([
            'success' => true,
            'module' => $module,
        ]);
    }
}