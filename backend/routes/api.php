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
use App\Http\Controllers\Api\AcademicAdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Login
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
        '/instructor/setup-password',
        [PasswordController::class, 'setupInstructor']
    );

    Route::get(
        '/instructor/submissions',
        [InstructorController::class, 'submissions']
    );

    Route::get(
        '/instructor/submissions',
        [SubmissionController::class, 'instructorIndex']
    );

    Route::post(
        '/instructor/submissions/{submissionId}/grade',
        [GradeController::class, 'store']
    );


    /*
    |--------------------------------------------------------------------------
    | Academic Admin Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Dashboard
        |--------------------------------------------------------------------------
        */
        Route::get(
    '/classes/{id}/modules',
    [AcademicAdminController::class, 'classModules']
);

Route::post(
    '/classes/{id}/modules',
    [AcademicAdminController::class, 'storeModule']
);

Route::put(
    '/classes/{id}/modules/sync',
    [AcademicAdminController::class, 'syncClassModules']
);
        Route::get(
            '/dashboard',
            [AcademicAdminController::class, 'dashboard']
        );


        /*
        |--------------------------------------------------------------------------
        | Learners
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/learners',
            [AcademicAdminController::class, 'learners']
        );

        Route::post(
            '/learners',
            [AcademicAdminController::class, 'storeLearner']
        );

                Route::post(
            '/learners/import',
            [AcademicAdminController::class, 'importLearners']
        );

        Route::put(
            '/learners/{id}',
            [AcademicAdminController::class, 'updateLearner']
        );

        Route::delete(
            '/learners/{id}',
            [AcademicAdminController::class, 'destroyLearner']
        );

        // Class Enrollment
Route::get(
    '/classes/{id}/learners',
    [AcademicAdminController::class, 'classLearners']
);

Route::post(
    '/classes/{id}/learners',
    [AcademicAdminController::class, 'enrollLearner']
);

Route::delete(
    '/classes/{id}/learners/{learnerId}',
    [AcademicAdminController::class, 'removeLearner']
);
        /*
        |--------------------------------------------------------------------------
        | Instructors
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/instructors',
            [AcademicAdminController::class, 'instructors']
        );

        Route::post(
            '/instructors',
            [AcademicAdminController::class, 'storeInstructor']
        );

        Route::put(
            '/instructors/{id}',
            [AcademicAdminController::class, 'updateInstructor']
        );

        Route::delete(
            '/instructors/{id}',
            [AcademicAdminController::class, 'destroyInstructor']
        );



        /*
        |--------------------------------------------------------------------------
        | Classes
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/classes',
            [AcademicAdminController::class, 'classes']
        );

        Route::post(
            '/classes',
            [AcademicAdminController::class, 'storeClass']
        );

        Route::put(
            '/classes/{id}',
            [AcademicAdminController::class, 'updateClass']
        );

        Route::delete(
            '/classes/{id}',
            [AcademicAdminController::class, 'destroyClass']
        );
    });
    // Class Enrollment
Route::get(
    '/classes/{id}/learners',
    [AcademicAdminController::class, 'classLearners']
);

Route::post(
    '/classes/{id}/learners',
    [AcademicAdminController::class, 'enrollLearner']
);

Route::delete(
    '/classes/{id}/learners/{learnerId}',
    [AcademicAdminController::class, 'removeLearner']
    
);


});