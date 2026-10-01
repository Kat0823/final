<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/student/courses', [StudentController::class, 'courses']);

Route::get('/student/courses/{courseId}', [StudentController::class, 'course']);