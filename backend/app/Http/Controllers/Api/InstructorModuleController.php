<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorModuleController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Add Module
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request,
        $courseId
    ): JsonResponse {
        $instructor = $request->user();

        if ($instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can add modules.',
            ], 403);
        }

        $course = Course::where(
            'id',
            $courseId
        )
        ->where(
            'instructor_id',
            $instructor->id
        )
        ->where(
            'is_active',
            true
        )
        ->first();

        if (!$course) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Class not found or you are not authorized to add a module.',
            ], 404);
        }

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'is_published' => [
                'nullable',
                'boolean',
            ],
        ]);

        $lastModuleOrder = Module::where(
            'course_id',
            $course->id
        )
        ->max('module_order');

        $nextModuleOrder =
            $lastModuleOrder
            ? $lastModuleOrder + 1
            : 1;

        $module = Module::create([
            'course_id' =>
                $course->id,

            'title' =>
                $validated['title'],

            'description' =>
                $validated['description'] ?? null,

            'material_path' =>
                null,

            'module_order' =>
                $nextModuleOrder,

            'is_published' =>
                $validated['is_published'] ?? false,
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'Module added successfully.',

            'module' => [
                'id' =>
                    $module->id,

                'name' =>
                    $module->title,

                'description' =>
                    $module->description,

                'module_order' =>
                    $module->module_order,

                'is_published' =>
                    (bool) $module->is_published,

                'material_path' =>
                    $module->material_path,
            ],
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | Edit / Update Module
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        $moduleId
    ): JsonResponse {
        $instructor = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Check instructor role
        |--------------------------------------------------------------------------
        */

        if ($instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' =>
                    'Only instructors can edit modules.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | Find module
        |--------------------------------------------------------------------------
        */

        $module = Module::with('course')
            ->where('id', $moduleId)
            ->first();

        if (!$module) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Module not found.',
            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | Check course ownership
        |--------------------------------------------------------------------------
        |
        | The instructor can only edit modules belonging
        | to their own class.
        |
        */

        if (
            !$module->course ||
            $module->course->instructor_id !== $instructor->id
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'You are not authorized to edit this module.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | Validate request
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'is_published' => [
                'required',
                'boolean',
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | Update module
        |--------------------------------------------------------------------------
        */

        $module->update([
            'title' =>
                $validated['title'],

            'description' =>
                $validated['description'] ?? null,

            'is_published' =>
                $validated['is_published'],
        ]);


        /*
        |--------------------------------------------------------------------------
        | Return updated module
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'message' =>
                'Module updated successfully.',

            'module' => [
                'id' =>
                    $module->id,

                'name' =>
                    $module->title,

                'description' =>
                    $module->description,

                'module_order' =>
                    $module->module_order,

                'is_published' =>
                    (bool) $module->is_published,

                'material_path' =>
                    $module->material_path,
            ],
        ]);
    }
}