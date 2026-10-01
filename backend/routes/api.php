<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StudentController;

Route::get('/student/courses', [StudentController::class, 'courses']);

Route::get('/student/courses/{courseId}', [StudentController::class, 'course']);