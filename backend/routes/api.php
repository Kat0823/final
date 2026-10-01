<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\InstructorController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/student/courses', [StudentController::class, 'courses']);
Route::get('/student/courses/{courseId}', [StudentController::class, 'course']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/instructor/profile', [InstructorController::class, 'profile']);

    Route::get('/instructor/courses', [InstructorController::class, 'courses']);

    Route::get('/instructor/courses/{courseId}', [InstructorController::class, 'course']);

    Route::get('/instructor/courses/{courseId}/modules', [InstructorController::class, 'modules']);
});