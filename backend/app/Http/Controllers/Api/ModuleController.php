<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ModuleController extends Controller
{
    public function show(Request $request, $moduleId): JsonResponse
    {
        $learner = $request->user();

        $module = Module::with([
            'course.instructor'
        ])
            ->where('id', $moduleId)
            ->where('is_published', true)
            ->first();

        if (!$module) {
            return response()->json([
                'success' => false,
                'message' => 'Module not found.',
            ], 404);
        }

        /*
         * Make sure the learner is enrolled
         * in the module's course.
         */
        $enrolled = $learner->courses()
            ->where(
                'courses.id',
                $module->course_id
            )
            ->exists();

        if (!$enrolled) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'module' => $module,
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

        $enrolled = $learner->courses()
            ->where('courses.id', $module->course_id)
            ->exists();

        if (!$enrolled) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course.',
            ], 403);
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
