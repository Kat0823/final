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

        // Learner progress is per class: one row for each learner in each
        // of this instructor's active classes, counting only that class's
        // published modules (what the learner can see).
        $publishedModuleIds = $learners
            ->flatMap(fn ($learner) => $learner->courses)
            ->flatMap(fn ($course) => $course->modules->where('is_published', true))
            ->pluck('id')
            ->unique()
            ->values();

        // Submissions still waiting for a grade, per learner and module.
        $pendingSubmissionsList = \App\Models\Submission::whereIn('module_id', $publishedModuleIds)
            ->whereIn('learner_id', $learners->pluck('id'))
            ->whereDoesntHave('grade')
            ->get(['learner_id', 'module_id']);

        $learnerProgress = $learners->flatMap(
            function ($learner) use ($pendingSubmissionsList) {
                return $learner->courses
                    ->sortBy('code')
                    ->map(function ($course) use ($learner, $pendingSubmissionsList) {
                        $modules = $course->modules->where('is_published', true)->values();
                        $moduleCount = $modules->count();
                        $moduleIds = $modules->pluck('id');

                        $progressRecords = $learner->progress->whereIn('module_id', $moduleIds);

                        $progressPercentage = 0;

                        if ($moduleCount > 0) {
                            $total = 0;

                            foreach ($modules as $module) {
                                $total += (float) optional($progressRecords->firstWhere('module_id', $module->id))
                                    ->completion_percentage;
                            }

                            $progressPercentage = round($total / $moduleCount);
                        }

                        if ($moduleCount === 0) {
                            $status = 'Pending';
                        } elseif ($progressPercentage >= 100) {
                            $status = 'Completed';
                        } elseif ($progressPercentage > 0) {
                            $status = 'Active';
                        } else {
                            $status = 'Pending';
                        }

                        $pending = $pendingSubmissionsList
                            ->where('learner_id', $learner->id)
                            ->whereIn('module_id', $moduleIds)
                            ->count();

                        return [
                            'id' => $learner->id,
                            'school_id' => $learner->school_id,
                            'name' => $learner->name,
                            'profile_photo_url' => $learner->profile_photo_path
                                ? url(\Illuminate\Support\Facades\Storage::disk('public')->url($learner->profile_photo_path))
                                : null,
                            'class_id' => $course->id,
                            'class_code' => $course->code,
                            'class_name' => $course->name,
                            'class_codes' => array_values(array_filter([$course->code])),
                            'modules_assigned' => $moduleCount,
                            'progress' => $progressPercentage,
                            'pending_submissions' => $pending,
                            'status' => $status,
                        ];
                    });
            }
        )
        ->sortBy([['class_code', 'asc'], ['name', 'asc']])
        ->values();


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