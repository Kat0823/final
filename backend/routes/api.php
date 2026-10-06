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


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Siknayan API routes
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
| These routes are accessible after the user's first login
| before the password setup is completed.
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
| All routes below require:
|
| 1. Sanctum authentication
| 2. Completed password setup
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


    /*
    |----------------------------------------------------------------------
    | Student Courses
    |----------------------------------------------------------------------
    */

    // View all courses/classes of the logged-in learner
    Route::get('/student/courses', [
        StudentController::class,
        'courses'
    ]);

    // View a specific course/class
    Route::get('/student/courses/{courseId}', [
        StudentController::class,
        'course'
    ]);


    /*
    |----------------------------------------------------------------------
    | Student Modules
    |----------------------------------------------------------------------
    */

    // View a specific module
    Route::get('/student/modules/{moduleId}', [
        ModuleController::class,
        'show'
    ]);


    /*
    |----------------------------------------------------------------------
    | Student Submissions
    |----------------------------------------------------------------------
    */

    // Submit an activity
    Route::post('/student/submissions', [
        SubmissionController::class,
        'store'
    ]);


    /*
    |----------------------------------------------------------------------
    | Student Grades
    |----------------------------------------------------------------------
    */

    // View grades
    Route::get('/student/grades', [
        GradeController::class,
        'index'
    ]);


    /*
    |----------------------------------------------------------------------
    | Student Notifications
    |----------------------------------------------------------------------
    */

    // View notifications
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
    | INSTRUCTOR ROUTES
    |--------------------------------------------------------------------------
    */


    /*
    |----------------------------------------------------------------------
    | Instructor Dashboard
    |----------------------------------------------------------------------
    |
    | The dashboard displays:
    | - Total learners
    | - Total classes
    | - Total modules
    | - Pending submissions
    | - Graded submissions
    | - Learner progress
    |
    */

    Route::get('/instructor/dashboard', [
        InstructorDashboardController::class,
        'index'
    ]);


    /*
    |----------------------------------------------------------------------
    | Instructor Classes
    |----------------------------------------------------------------------
    |
    | IMPORTANT:
    | Instructors do NOT create classes or modules.
    |
    | These routes are READ-ONLY.
    |
    | Instructor can:
    | - View assigned classes
    | - Open a class
    | - View existing modules
    | - View enrolled learners
    |
    */

    // View all classes assigned to instructor
    Route::get('/instructor/classes', [
        InstructorCourseController::class,
        'index'
    ]);

    // View a specific assigned class
    Route::get('/instructor/classes/{courseId}', [
        InstructorCourseController::class,
        'show'
    ]);


    /*
    |----------------------------------------------------------------------
    | Instructor Submissions
    |----------------------------------------------------------------------
    |
    | Instructor can:
    | - View learner submissions
    | - Open submitted files
    | - Grade submissions
    |
    */

    // View learner submissions
    Route::get('/instructor/submissions', [
        InstructorController::class,
        'submissions'
    ]);

    // View/download submitted file
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
    |----------------------------------------------------------------------
    | Instructor Notifications
    |----------------------------------------------------------------------
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
    |----------------------------------------------------------------------
    | Instructor Profile
    |----------------------------------------------------------------------
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