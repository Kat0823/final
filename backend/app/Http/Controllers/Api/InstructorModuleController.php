<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InstructorModuleController extends Controller
{
    /**
     * View or download a module's file. Only for modules in the
     * instructor's own active classes (published or not).
     */
    public function material(Request $request, int $moduleId)
    {
        $module = Module::where('id', $moduleId)
            ->whereHas('course', function ($query) use ($request) {
                $query->where('instructor_id', $request->user()->id)
                    ->where('is_active', true);
            })
            ->first();

        if (!$module) {
            return response()->json([
                'success' => false,
                'message' => 'Module not found.',
            ], 404);
        }

        return ModuleController::sendMaterial($request, $module);
    }

    public function store(
        Request $request,
        int $courseId
    ): JsonResponse {
        $instructor = $request->user();

        $course = Course::where(
            'instructor_id',
            $instructor->id
        )
        ->where('is_active', true)
        ->findOrFail($courseId);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $nextOrder = (
            $course->modules()->max('module_order') ?? 0
        ) + 1;

        $module = $course->modules()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'module_order' => $nextOrder,
            'is_published' => $validated['is_published'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Module created successfully.',
            'module' => $module,
        ], 201);
    }

    public function update(
        Request $request,
        int $moduleId
    ): JsonResponse {
        $instructor = $request->user();

        $module = Module::whereHas(
            'course',
            function ($query) use ($instructor) {
                $query->where(
                    'instructor_id',
                    $instructor->id
                );
            }
        )->findOrFail($moduleId);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'module_order' => ['sometimes', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $module->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Module updated successfully.',
            'module' => $module->fresh(),
        ]);
    }
}
