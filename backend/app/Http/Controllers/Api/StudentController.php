<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;

class StudentController extends Controller
{
    public function courses(): JsonResponse
    {
        $courses = Course::with('instructor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'courses' => $courses,
        ]);
    }

    public function course($courseId): JsonResponse
    {
        $course = Course::with([
            'modules' => function ($query) {
                $query->where('is_published', true)
                    ->orderBy('module_order');
            }
        ])->findOrFail($courseId);

        return response()->json([
            'success' => true,
            'course' => $course,
        ]);
    }
}