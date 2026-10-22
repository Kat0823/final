<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ModuleController extends Controller
{
    /**
     * A published module in an active class the learner is enrolled in,
     * or null. Used for viewing, downloading and submitting.
     */
    public static function findForLearner(User $learner, $moduleId): ?Module
    {
        return Module::where('id', $moduleId)
            ->where('is_published', true)
            ->whereHas('course', fn ($query) => $query
                ->where('is_active', true)
                ->whereHas('learners', fn ($learners) => $learners->where('users.id', $learner->id)))
            ->with('course.instructor:id,name')
            ->first();
    }

    public function show(Request $request, $moduleId): JsonResponse
    {
        $learner = $request->user();
        $module = self::findForLearner($learner, $moduleId);

        if (!$module) {
            return response()->json([
                'success' => false,
                'message' => 'Module not found or you are not enrolled in its class.',
            ], 404);
        }

        $submission = StudentController::submissionsFor($learner, collect([$module->id]))->get($module->id);
        $course = $module->course;

        return response()->json([
            'success' => true,
            'module' => StudentController::module($module, $submission) + [
                'course' => [
                    'id' => $course->id,
                    'name' => $course->name,
                    'code' => $course->code,
                    'instructor' => $course->instructor
                        ? ['id' => $course->instructor->id, 'name' => $course->instructor->name]
                        : null,
                ],
            ],
        ]);
    }

    /**
     * Download the material attached to a module.
     *
     * Learners can only download material for published modules in a
     * course they are enrolled in. The stored path must sit inside the
     * private module-materials folder.
     */
    public function material(Request $request, $moduleId)
    {
        $learner = $request->user();

        if (!$learner || $learner->role !== 'learner') {
            return response()->json([
                'success' => false,
                'message' => 'Only learners can download module materials.',
            ], 403);
        }

        $module = Module::where('id', $moduleId)
            ->where('is_published', true)
            ->first();

        if (!$module || !$module->material_path) {
            return response()->json([
                'success' => false,
                'message' => 'No material is attached to this module.',
            ], 404);
        }

        // Enrolled in the module's class, and the class is still active.
        if (!self::findForLearner($learner, $module->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        return self::sendMaterial($request, $module);
    }

    /**
     * A learner views or downloads the file they submitted themselves.
     */
    public function submissionFile(Request $request, $submissionId)
    {
        $submission = Submission::where('id', $submissionId)
            ->where('learner_id', $request->user()->id)
            ->first();

        $path = $submission ? str_replace('\\', '/', (string) $submission->file_path) : '';

        if (
            !$submission
            || !str_starts_with($path, 'submissions/')
            || str_contains($path, '..')
            || !Storage::disk('local')->exists($path)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'The submitted file could not be found.',
            ], 404);
        }

        $fileName = trim(preg_replace('/[\x00-\x1F\x7F"\\\\\/:*?<>|]+/', '_', (string) $submission->file_name)) ?: basename($path);

        if ($request->query('disposition') === 'inline') {
            return Storage::disk('local')->response($path, $fileName, [
                'Content-Type' => Storage::disk('local')->mimeType($path) ?: 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
            ], 'inline');
        }

        return Storage::disk('local')->download($path, $fileName);
    }

    /**
     * Send a module's stored file: shown in the browser with
     * ?disposition=inline, otherwise downloaded. Callers check access
     * first (learners: enrolled; instructors: their own class).
     */
    public static function sendMaterial(Request $request, Module $module)
    {
        if (!$module->material_path) {
            return response()->json([
                'success' => false,
                'message' => 'No material is attached to this module.',
            ], 404);
        }

        $path = str_replace('\\', '/', (string) $module->material_path);

        if (!Module::isStoredMaterialPath($path)) {
            return response()->json([
                'success' => false,
                'message' => 'The material for this module is not available.',
            ], 404);
        }

        if (!Storage::disk('local')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'The material file could not be found. Please tell your administrator.',
            ], 404);
        }

        // Download under the original file name when known; otherwise use
        // the module title. Strip characters that break download headers.
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $originalName = trim(preg_replace('/[\x00-\x1F\x7F"\\\\\/:*?<>|]+/', '_', (string) $module->material_name));
        $fileName = $originalName !== ''
            ? $originalName
            : Str::slug($module->title ?: 'module-material') . ($extension ? '.' . $extension : '');

        // ?disposition=inline lets the browser show the file (View);
        // otherwise it is sent as a download.
        if ($request->query('disposition') === 'inline') {
            return Storage::disk('local')->response($path, $fileName, [
                'Content-Type' => Storage::disk('local')->mimeType($path) ?: 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
            ], 'inline');
        }

        return Storage::disk('local')->download($path, $fileName);
    }
}
