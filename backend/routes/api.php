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
use App\Http\Controllers\Api\InstructorModuleController;
use App\Http\Controllers\Api\InstructorNotificationController;
use App\Http\Controllers\Api\InstructorProfileController;


// =====================================================
// PUBLIC ROUTES
// =====================================================

// Learner Login
Route::post(
    '/login',
    [AuthController::class, 'login']
);

// Instructor Login
Route::post(
    '/instructor/login',
    [AuthController::class, 'instructorLogin']
);


// =====================================================
// PASSWORD SETUP ROUTES
// =====================================================
//
// These routes require authentication,
// but they are NOT protected by password.setup.
//
// This allows first-time users to change
// their default password.
//

Route::middleware('auth:sanctum')->group(function () {

    // Student first-login password setup
    Route::post(
        '/student/setup-password',
        [PasswordController::class, 'setup']
    );

    // Instructor first-login password setup
    Route::post(
        '/instructor/setup-password',
        [PasswordController::class, 'setupInstructor']
    );
});


// =====================================================
// NORMAL AUTHENTICATED ROUTES
// =====================================================
//
// Users must:
//
// 1. Be authenticated
// 2. Have completed password setup
//
// First-time users who have not changed their password
// will receive a 403 response.
//

Route::middleware([
    'auth:sanctum',
    'password.setup',
])->group(function () {


    // =================================================
    // STUDENT ROUTES
    // =================================================

    // View enrolled courses
    Route::get(
        '/student/courses',
        [StudentController::class, 'courses']
    );

    // View one course
    Route::get(
        '/student/courses/{courseId}',
        [StudentController::class, 'course']
    );

    // View module
    Route::get(
        '/student/modules/{moduleId}',
        [ModuleController::class, 'show']
    );

    // Submit activity
    Route::post(
        '/student/submissions',
        [SubmissionController::class, 'store']
    );

    // View grades
    Route::get(
        '/student/grades',
        [GradeController::class, 'index']
    );


    // =================================================
    // STUDENT NOTIFICATIONS
    // =================================================

    // View notifications
    Route::get(
        '/student/notifications',
        [NotificationController::class, 'index']
    );

    // Mark one notification as read
    Route::post(
        '/student/notifications/{notificationId}/read',
        [NotificationController::class, 'markAsRead']
    );

    // Mark all notifications as read
    Route::post(
        '/student/notifications/read-all',
        [NotificationController::class, 'markAllAsRead']
    );


    // =================================================
    // INSTRUCTOR ROUTES
    // =================================================

    // -------------------------
    // Instructor Dashboard
    // -------------------------

    Route::get(
        '/instructor/dashboard',
        [InstructorDashboardController::class, 'index']
    );


    // -------------------------
    // Instructor Classes
    // -------------------------

    // View all assigned classes
    Route::get(
        '/instructor/classes',
        [InstructorCourseController::class, 'index']
    );

    // View one assigned class
    Route::get(
        '/instructor/classes/{courseId}',
        [InstructorCourseController::class, 'show']
    );

    // Add module to a class
    Route::post(
        '/instructor/classes/{courseId}/modules',
        [InstructorModuleController::class, 'store']
    );

    // Edit existing module
    Route::put(
        '/instructor/modules/{moduleId}',
        [InstructorModuleController::class, 'update']
    );


    // -------------------------
    // Instructor Submissions
    // -------------------------

    // View learner submissions
    Route::get(
        '/instructor/submissions',
        [InstructorController::class, 'submissions']
    );

    // View submitted file
    Route::get(
        '/instructor/submissions/{submissionId}/file',
        [InstructorController::class, 'file']
    );

    // Grade learner submission
    Route::post(
        '/instructor/submissions/{submissionId}/grade',
        [GradeController::class, 'store']
    );
    Route::get(
    '/instructor/notifications',
    [InstructorNotificationController::class, 'index']
);

Route::post(
    '/instructor/notifications/{notificationId}/read',
    [InstructorNotificationController::class, 'markAsRead']
);

Route::post(
    '/instructor/notifications/read-all',
    [InstructorNotificationController::class, 'markAllAsRead']
);

Route::get(
    '/instructor/profile',
    [InstructorProfileController::class, 'show']
);

Route::put(
    '/instructor/profile',
    [InstructorProfileController::class, 'update']
);

Route::post(
    '/instructor/profile/password',
    [InstructorProfileController::class, 'changePassword']
);

});