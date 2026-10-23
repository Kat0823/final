<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instructor = $request->user();

        /*
        |--------------------------------------------------------------------------
        | CHECK USER ROLE
        |--------------------------------------------------------------------------
        */

        if (!$instructor || $instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can access the dashboard.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | INSTRUCTOR'S COURSES
        |--------------------------------------------------------------------------
        */

        $courses = Course::where(
            'instructor_id',
            $instructor->id
        )
        ->where('is_active', true)
        ->withCount('learners')
        ->withCount('modules')
        ->with([
            'modules' => function ($query) {
                $query->where('is_published', true)
                    ->orderBy('module_order');
            }
        ])
        ->orderBy('name')
        ->get();

        /*
        |--------------------------------------------------------------------------
        | BASIC STATISTICS
        |--------------------------------------------------------------------------
        */

        // Total active classes handled by the instructor
        $totalClasses = $courses->count();

        // Total learners enrolled in the instructor's courses
        $totalLearners = User::where(
            'role',
            'learner'
        )
        ->whereHas('courses', function ($query) use ($instructor) {

            $query->where(
                'courses.instructor_id',
                $instructor->id
            );

        })
        ->count();

        // Total modules belonging to the instructor's courses
        $totalModules = Module::whereHas(
            'course',
            function ($query) use ($instructor) {

                $query->where(
                    'instructor_id',
                    $instructor->id
                );

            }
        )
        ->count();

        // Submissions waiting for grading
        $pendingSubmissions = Submission::where(
            'status',
            'submitted'
        )
        ->whereHas(
            'module.course',
            function ($query) use ($instructor) {

                $query->where(
                    'instructor_id',
                    $instructor->id
                );

            }
        )
        ->count();

        // Submissions already graded
        $gradedSubmissions = Submission::where(
            'status',
            'graded'
        )
        ->whereHas(
            'module.course',
            function ($query) use ($instructor) {

                $query->where(
                    'instructor_id',
                    $instructor->id
                );

            }
        )
        ->count();

        /*
        |--------------------------------------------------------------------------
        | GET LEARNERS
        |--------------------------------------------------------------------------
        */

        $learners = User::where(
            'role',
            'learner'
        )
        ->whereHas('courses', function ($query) use ($instructor) {

            $query->where(
                'courses.instructor_id',
                $instructor->id
            );

        })
        ->with([

            /*
            |----------------------------------------------------------------------
            | Learner's courses handled by this instructor
            |----------------------------------------------------------------------
            */

            'courses' => function ($query) use ($instructor) {

                $query->where(
                    'courses.instructor_id',
                    $instructor->id
                )
                ->where(
                    'courses.is_active',
                    true
                )
                ->with('modules');

            },

            /*
            |----------------------------------------------------------------------
            | Learner's progress records
            |----------------------------------------------------------------------
            */

            'progress.module.course',

        ])
        ->orderBy('name')
        ->get();

        /*
        |--------------------------------------------------------------------------
        | CALCULATE LEARNER PROGRESS
        |--------------------------------------------------------------------------
        */

        // Submissions still waiting for a grade, per learner (this
        // instructor's active classes only).
        $instructorModuleIds = $learners
            ->flatMap(fn ($learner) => $learner->courses)
            ->flatMap(fn ($course) => $course->modules)
            ->pluck('id')
            ->unique()
            ->values();

        $pendingByLearner = \App\Models\Submission::whereIn('module_id', $instructorModuleIds)
            ->whereIn('learner_id', $learners->pluck('id'))
            ->whereDoesntHave('grade')
            ->selectRaw('learner_id, COUNT(*) AS pending')
            ->groupBy('learner_id')
            ->pluck('pending', 'learner_id');

        $learnerProgress = $learners->map(
            function ($learner) use ($pendingByLearner) {

                /*
                |--------------------------------------------------------------------------
                | Get all modules assigned through the instructor's courses
                |--------------------------------------------------------------------------
                */

                $modules = $learner->courses
                    ->flatMap(function ($course) {

                        return $course->modules;

                    });

                $moduleCount = $modules->count();

                /*
                |--------------------------------------------------------------------------
                | Get module IDs
                |--------------------------------------------------------------------------
                */

                $moduleIds = $modules->pluck('id');

                /*
                |--------------------------------------------------------------------------
                | Get progress records for these modules
                |--------------------------------------------------------------------------
                */

                $progressRecords = $learner->progress
                    ->whereIn(
                        'module_id',
                        $moduleIds
                    );

                /*
                |--------------------------------------------------------------------------
                | Calculate average progress
                |--------------------------------------------------------------------------
                */

                $progressPercentage = 0;

                if ($moduleCount > 0) {

                    $totalProgress = 0;

                    foreach ($modules as $module) {

                        $progress = $progressRecords
                            ->firstWhere(
                                'module_id',
                                $module->id
                            );

                        if ($progress) {

                            /*
                            | IMPORTANT:
                            | Progress model uses completion_percentage
                            */

                            $totalProgress += (float)
                                $progress->completion_percentage;
                        }
                    }

                    $progressPercentage = round(
                        $totalProgress / $moduleCount
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Determine learner status
                |--------------------------------------------------------------------------
                */

                if ($moduleCount === 0) {

                    $status = 'Pending Plan';

                } elseif ($progressPercentage >= 100) {

                    $status = 'Completed';

                } elseif ($progressPercentage > 0) {

                    $status = 'Active';

                } else {

                    $status = 'Pending Plan';
                }

                /*
                |--------------------------------------------------------------------------
                | Get Class Codes
                |--------------------------------------------------------------------------
                */

                $classCodes = $learner->courses
                    ->pluck('code')
                    ->filter()
                    ->values();

                /*
                |--------------------------------------------------------------------------
                | Return Learner Data
                |--------------------------------------------------------------------------
                */

                return [

                    'id' => $learner->id,

                    'school_id' => $learner->school_id,

                    'name' => $learner->name,

                    'class_codes' => $classCodes,

                    'class_code' => $classCodes->first(),

                    'modules_assigned' => $moduleCount,

                    'progress' => $progressPercentage,

                    'pending_submissions' => (int) ($pendingByLearner[$learner->id] ?? 0),

                    'status' => $status,

                ];
            }
        )
        ->values();

        /*
        |--------------------------------------------------------------------------
        | COURSE DATA
        |--------------------------------------------------------------------------
        */

        $courseData = $courses->map(
            function ($course) {

                return [

                    'id' => $course->id,

                    'name' => $course->name,

                    'code' => $course->code,

                    'program' => $course->program,

                    'description' => $course->description,

                    'learner_count' =>
                        $course->learners_count,

                    'module_count' =>
                        $course->modules_count,

                ];
            }
        )
        ->values();

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            /*
            |--------------------------------------------------------------------------
            | Instructor Information
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | Dashboard Statistics
            |--------------------------------------------------------------------------
            */

            'statistics' => [

                'total_learners' =>
                    $totalLearners,

                'total_classes' =>
                    $totalClasses,

                'total_modules' =>
                    $totalModules,

                'pending_submissions' =>
                    $pendingSubmissions,

                'graded_submissions' =>
                    $gradedSubmissions,

            ],

            /*
            |--------------------------------------------------------------------------
            | Instructor Courses
            |--------------------------------------------------------------------------
            */

            'courses' =>
                $courseData,

            /*
            |--------------------------------------------------------------------------
            | Learner Progress
            |--------------------------------------------------------------------------
            */

            'learners' =>
                $learnerProgress,

        ]);
    }
}