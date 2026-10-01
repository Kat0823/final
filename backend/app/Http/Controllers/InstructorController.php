<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;

class InstructorController extends Controller
{
    // Get the logged-in instructor's profile
    public function profile(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => $request->user()
        ]);
    }

    // Get all courses assigned to the logged-in instructor
    public function courses(Request $request)
    {
        $courses = Course::where('instructor_id', $request->user()->id)
            ->withCount('learners')
            ->withCount('modules')
            ->get();

        return response()->json([
            'status' => 'success',
            'courses' => $courses
        ]);
    }

    // Get details of one course
    public function course(Request $request, $courseId)
    {
        $course = Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->with([
                'modules' => function ($query) {
                    $query->orderBy('module_order');
                },
                'learners:id,name,email,student_id'
            ])
            ->withCount('learners')
            ->withCount('modules')
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 'error',
                'message' => 'Course not found or you are not assigned to this course.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'course' => $course
        ]);
    }

    // Get modules for an instructor's course
    public function modules(Request $request, $courseId)
    {
        $course = Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->first();

        if (!$course) {
            return response()->json([
                'status' => 'error',
                'message' => 'Course not found or you are not assigned to this course.'
            ], 404);
        }

        $modules = $course->modules()
            ->orderBy('module_order')
            ->get();

        return response()->json([
            'status' => 'success',
            'course' => [
                'id' => $course->id,
                'name' => $course->name,
                'code' => $course->code,
            ],
            'modules' => $modules
        ]);
    }
}