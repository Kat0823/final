<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorCourseController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | VIEW INSTRUCTOR CLASSES
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
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
                    'Only instructors can view their classes.',

            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | GET CLASSES
        |--------------------------------------------------------------------------
        |
        | Only active classes assigned to the
        | logged-in instructor are returned.
        |
        */

        $courses = Course::where(
            'instructor_id',
            $instructor->id
        )
        ->where(
            'is_active',
            true
        )
        ->withCount([
            'learners',
            'modules',
        ])
        ->orderBy(
            'name'
        )
        ->get();


        /*
        |--------------------------------------------------------------------------
        | FORMAT CLASSES
        |--------------------------------------------------------------------------
        */

        $classes = $courses->map(
            function ($course) {

                return [

                    'id' =>
                        $course->id,

                    'code' =>
                        $course->code,

                    'name' =>
                        $course->name,

                    'program' =>
                        $course->program,

                    'description' =>
                        $course->description,

                    'learner_count' =>
                        $course->learners_count,

                    'module_count' =>
                        $course->modules_count,

                ];

            }
        )->values();


        /*
        |--------------------------------------------------------------------------
        | RETURN RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            'instructor' => [

                'id' =>
                    $instructor->id,

                'name' =>
                    $instructor->name,

                'email' =>
                    $instructor->email,

                'school_id' =>
                    $instructor->school_id,

                'program' =>
                    $instructor->program,

                'contact' =>
                    $instructor->contact,

            ],

            'classes' =>
                $classes,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VIEW ONE CLASS
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        $courseId
    ): JsonResponse {

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
                    'Only instructors can view class details.',

            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | FIND CLASS
        |--------------------------------------------------------------------------
        |
        | The class must:
        |
        | 1. Exist
        | 2. Be assigned to this instructor
        | 3. Be active
        |
        */

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
        ->with([

            /*
            |--------------------------------------------------------------------------
            | MODULES
            |--------------------------------------------------------------------------
            */

            'modules' => function ($query) {

                $query
                    ->orderBy(
                        'module_order'
                    )
                    ->orderBy(
                        'id'
                    );

            },


            /*
            |--------------------------------------------------------------------------
            | LEARNERS
            |--------------------------------------------------------------------------
            */

            'learners' => function ($query) {

                $query->orderBy(
                    'name'
                );

            },

        ])
        ->withCount([

            'learners',

            'modules',

        ])
        ->first();


        /*
        |--------------------------------------------------------------------------
        | CLASS NOT FOUND
        |--------------------------------------------------------------------------
        */

        if (!$course) {

            return response()->json([

                'success' => false,

                'message' =>
                    'Class not found or you are not authorized to view it.',

            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | FORMAT MODULES
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | Database column = title
        |
        | Frontend field = name
        |
        */

        $modules = $course->modules->map(
            function ($module) {

                return [

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

                    'material_name' =>
                        $module->material_name,

                    'has_material' =>
                        $module->has_material,

                ];

            }
        )->values();


        /*
        |--------------------------------------------------------------------------
        | FORMAT LEARNERS
        |--------------------------------------------------------------------------
        */

        $learners = $course->learners->map(
            function ($learner) {

                return [

                    'id' =>
                        $learner->id,

                    'school_id' =>
                        $learner->school_id,

                    'name' =>
                        $learner->name,

                    'email' =>
                        $learner->email,

                    'program' =>
                        $learner->program,

                    'contact' =>
                        $learner->contact,

                ];

            }
        )->values();


        /*
        |--------------------------------------------------------------------------
        | RETURN CLASS DETAILS
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            'instructor' => [

                'id' =>
                    $instructor->id,

                'name' =>
                    $instructor->name,

                'email' =>
                    $instructor->email,

                'school_id' =>
                    $instructor->school_id,

            ],

            'class' => [

                'id' =>
                    $course->id,

                'code' =>
                    $course->code,

                'name' =>
                    $course->name,

                'program' =>
                    $course->program,

                'description' =>
                    $course->description,

                'learner_count' =>
                    $course->learners_count,

                'module_count' =>
                    $course->modules_count,

                'modules' =>
                    $modules,

                'learners' =>
                    $learners,

            ],

        ]);
    }
}