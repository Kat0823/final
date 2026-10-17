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
use App\Http\Controllers\Api\InstructorDashboardController;
use App\Http\Controllers\Api\InstructorCourseController;
use App\Http\Controllers\Api\InstructorNotificationController;
use App\Http\Controllers\Api\InstructorProfileController;
use App\Http\Controllers\Api\InstructorModuleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Siknayan LMS API routes
|
*/

/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

// Learner Login
Route::post('/login', [
    AuthController::class,
    'login'
]);

// Instructor Login
Route::post('/instructor/login', [
    AuthController::class,
    'instructorLogin'
]);

/*
|--------------------------------------------------------------------------
| Password Setup Routes
|--------------------------------------------------------------------------
|
| These routes require authentication but are accessible before
| the user completes the initial password setup.
|
*/

Route::middleware('auth:sanctum')->group(function () {

    // Learner Password Setup
    Route::post('/student/setup-password', [
        PasswordController::class,
        'studentSetupPassword'
    ]);

    // Instructor Password Setup
    Route::post('/instructor/setup-password', [
        PasswordController::class,
        'instructorSetupPassword'
    ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
|
| These routes require Sanctum authentication and completed
| password setup.
|
*/

Route::middleware([
    'auth:sanctum',
    'password.setup',
])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | STUDENT / LEARNER ROUTES
    |--------------------------------------------------------------------------
    */

    // View all courses assigned to the learner
    Route::get('/student/courses', [
        StudentController::class,
        'courses'
    ]);

    // View a specific course
    Route::get('/student/courses/{courseId}', [
        StudentController::class,
        'course'
    ]);

    // View a specific module
    Route::get('/student/modules/{moduleId}', [
        ModuleController::class,
        'show'
    ]);

    // Submit an activity
    Route::post('/student/submissions', [
        SubmissionController::class,
        'store'
    ]);

    // View grades
    Route::get('/student/grades', [
        GradeController::class,
        'index'
    ]);

    /*
    |--------------------------------------------------------------------------
    | STUDENT NOTIFICATIONS
    |--------------------------------------------------------------------------
    */

    // View learner notifications
    Route::get('/student/notifications', [
        NotificationController::class,
        'index'
    ]);

    // Mark one notification as read
    Route::post('/student/notifications/{notificationId}/read', [
        NotificationController::class,
        'markAsRead'
    ]);

    // Mark all notifications as read
    Route::post('/student/notifications/read-all', [
        NotificationController::class,
        'markAllAsRead'
    ]);

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTOR DASHBOARD
    |--------------------------------------------------------------------------
    */

    Route::get('/instructor/dashboard', [
        InstructorDashboardController::class,
        'index'
    ]);

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTOR CLASSES AND MODULES
    |--------------------------------------------------------------------------
    |
    | Instructors can view their assigned classes and manage modules
    | belonging to those classes.
    |
    */

    // View all classes assigned to the instructor
    Route::get('/instructor/classes', [
        InstructorCourseController::class,
        'index'
    ]);

    // View a specific assigned class
    Route::get('/instructor/classes/{courseId}', [
        InstructorCourseController::class,
        'show'
    ]);

    // Add a module to an assigned class
    Route::post('/instructor/classes/{courseId}/modules', [
        InstructorModuleController::class,
        'store'
    ]);

    // Edit an existing module
    Route::put('/instructor/modules/{moduleId}', [
        InstructorModuleController::class,
        'update'
    ]);

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTOR SUBMISSIONS AND GRADING
    |--------------------------------------------------------------------------
    */

    // View learner submissions
    Route::get('/instructor/submissions', [
        InstructorController::class,
        'submissions'
    ]);

    // View or download a submitted file
    Route::get('/instructor/submissions/{submissionId}/file', [
        InstructorController::class,
        'file'
    ]);

    // Grade a learner submission
    Route::post('/instructor/submissions/{submissionId}/grade', [
        GradeController::class,
        'store'
    ]);

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTOR NOTIFICATIONS
    |--------------------------------------------------------------------------
    */

    // View instructor notifications
    Route::get('/instructor/notifications', [
        InstructorNotificationController::class,
        'index'
    ]);

    // Mark one notification as read
    Route::post('/instructor/notifications/{notificationId}/read', [
        InstructorNotificationController::class,
        'markAsRead'
    ]);

    // Mark all notifications as read
    Route::post('/instructor/notifications/read-all', [
        InstructorNotificationController::class,
        'markAllAsRead'
    ]);

    /*
    |--------------------------------------------------------------------------
    | INSTRUCTOR PROFILE
    |--------------------------------------------------------------------------
    */

    // View instructor profile
    Route::get('/instructor/profile', [
        InstructorProfileController::class,
        'show'
    ]);

    // Update instructor profile
    Route::put('/instructor/profile', [
        InstructorProfileController::class,
        'update'
    ]);

    // Change instructor password
    Route::post('/instructor/profile/password', [
        InstructorProfileController::class,
        'changePassword'
    ]);
});
