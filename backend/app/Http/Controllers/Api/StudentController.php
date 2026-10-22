<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function courses(Request $request): JsonResponse
    {
        $student = $request->user();

        $courses = $student->courses()
            ->with('instructor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
        ]);
    }

    public function course(Request $request, $courseId): JsonResponse
    {
        $student = $request->user();

        $course = $student->courses()
            ->with([
                'modules' => function ($query) {
                    $query->where('is_published', true)
                        ->orderBy('module_order');
                },
                // Newest first, with who posted it.
                'announcements' => function ($query) {
                    $query->with('instructor:id,name')
                        ->latest()
                        ->latest('id');
                },
            ])
            ->where('courses.id', $courseId)
            ->where('courses.is_active', true)
            ->first();

        if (!$course) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found or you are not enrolled in this course.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'course' => $course,
        ]);
    }
}