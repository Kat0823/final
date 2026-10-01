<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\InstructorController;


/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Student Routes
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/student/courses',
        [StudentController::class, 'courses']
    );

    Route::get(
        '/student/courses/{courseId}',
        [StudentController::class, 'course']
    );

    Route::post(
        '/student/setup-password',
        [PasswordController::class, 'setup']
    );

    Route::get(
        '/student/modules/{moduleId}',
        [ModuleController::class, 'show']
    );

    Route::post(
        '/student/submissions',
        [SubmissionController::class, 'store']
    );

    Route::get(
        '/student/grades',
        [GradeController::class, 'index']
    );

    Route::get(
        '/student/notifications',
        [NotificationController::class, 'index']
    );


    /*
    |--------------------------------------------------------------------------
    | Instructor Routes
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/instructor/submissions/{submissionId}/grade',
        [GradeController::class, 'store']
    );
    Route::get(
    '/instructor/submissions',
    [InstructorController::class, 'submissions']
);
Route::post(
    '/instructor/setup-password',
    [PasswordController::class, 'setupInstructor']
);
});