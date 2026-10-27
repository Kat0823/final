<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LessonResource;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Lesson resources: links and files (PPT, video, PDF...) an instructor
 * adds to a class. Instructors manage the resources of their own active
 * classes; enrolled learners can open them.
 */
class LessonResourceController extends Controller
{
    /** File types an instructor may upload. */
    private const FILE_TYPES = 'ppt,pptx,pdf,doc,docx,xls,xlsx,mp4,webm,mov,m4v,mp3,wav,png,jpg,jpeg,gif';

    /** Largest upload, in kilobytes (100 MB). */
    private const MAX_FILE_KB = 102400;

    public function index(Request $request, int $courseId): JsonResponse
    {
        $course = $this->ownClass($request, $courseId);

        if (!$course) {
            return $this->classNotFound();
        }

        return response()->json([
            'success' => true,
            'resources' => self::listFor($course),
        ]);
    }

    public function store(Request $request, int $courseId): JsonResponse
    {
        $course = $this->ownClass($request, $courseId);

        if (!$course) {
            return $this->classNotFound();
        }

        $validated = $request->validate([
            'type' => ['required', Rule::in([LessonResource::TYPE_LINK, LessonResource::TYPE_FILE])],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'module_id' => [
                'nullable',
                'integer',
                Rule::exists('modules', 'id')->where('course_id', $course->id)->whereNull('deleted_at'),
            ],
            'url' => [
                'required_if:type,' . LessonResource::TYPE_LINK,
                'nullable',
                'url:http,https',
                'max:2048',
            ],
            'file' => [
                'required_if:type,' . LessonResource::TYPE_FILE,
                'nullable',
                'file',
                'mimes:' . self::FILE_TYPES,
                'max:' . self::MAX_FILE_KB,
            ],
        ], [
            'url.required_if' => 'Please enter the link.',
            'url.url' => 'Please enter a full link that starts with http:// or https://.',
            'file.required_if' => 'Please choose a file to upload.',
            'file.mimes' => 'Allowed files: PowerPoint, PDF, Word, Excel, video (MP4, WebM, MOV), audio and images.',
            'file.max' => 'The file may not be larger than 100 MB.',
        ]);

        $data = [
            'course_id' => $course->id,
            'module_id' => $validated['module_id'] ?? null,
            'instructor_id' => $request->user()->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
        ];

        if ($validated['type'] === LessonResource::TYPE_LINK) {
            $data['url'] = $validated['url'];
        } else {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
            $data['file_path'] = $file->storeAs(
                rtrim(LessonResource::FOLDER, '/'),
                Str::random(40) . '.' . $extension,
                'local'
            );
            $data['file_name'] = Str::limit($file->getClientOriginalName(), 250, '');
            $data['mime_type'] = $file->getMimeType();
            $data['file_size'] = $file->getSize();
        }

        $resource = LessonResource::create($data);

        AuditLogger::log('create', AuditLogger::MODULES, [
            'target' => $resource,
            'target_label' => $resource->title,
            'new' => ['class' => $course->code, 'title' => $resource->title, 'type' => $resource->type],
            'details' => "Added lesson resource \"{$resource->title}\" to {$course->code}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Resource added.',
            'resource' => $resource->load('module:id,title')->toViewArray(),
        ], 201);
    }

    public function destroy(Request $request, int $resourceId): JsonResponse
    {
        $resource = $this->ownResource($request, $resourceId);

        if (!$resource) {
            return $this->resourceNotFound();
        }

        if ($resource->file_path && Storage::disk('local')->exists($resource->file_path)) {
            Storage::disk('local')->delete($resource->file_path);
        }

        $title = $resource->title;
        $resource->delete();

        AuditLogger::log('delete', AuditLogger::MODULES, [
            'target' => $resource,
            'target_label' => $title,
            'details' => "Removed lesson resource \"{$title}\"",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Resource removed.',
        ]);
    }

    /** The instructor opens or downloads one of their class files. */
    public function instructorFile(Request $request, int $resourceId)
    {
        $resource = $this->ownResource($request, $resourceId);

        return $resource ? self::sendFile($request, $resource) : $this->resourceNotFound();
    }

    /** An enrolled learner opens or downloads a class file. */
    public function studentFile(Request $request, int $resourceId)
    {
        $resource = LessonResource::where('id', $resourceId)
            ->whereHas('course', function ($query) use ($request) {
                $query->where('is_active', true)
                    ->whereHas('learners', fn ($learners) => $learners->where('users.id', $request->user()->id));
            })
            ->first();

        return $resource ? self::sendFile($request, $resource) : $this->resourceNotFound();
    }

    /** Resources of a class, newest first, as the pages show them. */
    public static function listFor(Course $course): array
    {
        return LessonResource::where('course_id', $course->id)
            ->with('module:id,title')
            ->latest()
            ->latest('id')
            ->get()
            ->map(fn (LessonResource $resource) => $resource->toViewArray())
            ->values()
            ->all();
    }

    private static function sendFile(Request $request, LessonResource $resource)
    {
        $path = str_replace('\\', '/', (string) $resource->file_path);

        if (
            $resource->type !== LessonResource::TYPE_FILE
            || !str_starts_with($path, LessonResource::FOLDER)
            || str_contains($path, '..')
            || !Storage::disk('local')->exists($path)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'The file could not be found.',
            ], 404);
        }

        $fileName = trim(preg_replace('/[\x00-\x1F\x7F"\\\\\/:*?<>|]+/', '_', (string) $resource->file_name));
        if ($fileName === '') {
            $fileName = Str::slug($resource->title ?: 'resource') . '.' . pathinfo($path, PATHINFO_EXTENSION);
        }

        if ($request->query('disposition') === 'inline') {
            return Storage::disk('local')->response($path, $fileName, [
                'Content-Type' => Storage::disk('local')->mimeType($path) ?: 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
            ], 'inline');
        }

        return Storage::disk('local')->download($path, $fileName);
    }

    private function ownClass(Request $request, int $courseId): ?Course
    {
        return Course::where('id', $courseId)
            ->where('instructor_id', $request->user()->id)
            ->where('is_active', true)
            ->first();
    }

    private function ownResource(Request $request, int $resourceId): ?LessonResource
    {
        return LessonResource::where('id', $resourceId)
            ->whereHas('course', function ($query) use ($request) {
                $query->where('instructor_id', $request->user()->id)
                    ->where('is_active', true);
            })
            ->first();
    }

    private function classNotFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Class not found or not assigned to you.',
        ], 404);
    }

    private function resourceNotFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Resource not found.',
        ], 404);
    }
}
