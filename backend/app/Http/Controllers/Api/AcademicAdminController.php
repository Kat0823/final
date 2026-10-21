<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\Storage;

use App\Models\Module;
use App\Models\Progress;
use App\Models\Submission;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicAdminController extends Controller
{
    /**
     * A module's material_path must be a file uploaded through
     * POST /admin/module-files (module-materials/<random>.<ext>) that still
     * exists. A display name such as "notes.pdf" is refused.
     */
    private function materialPathRules(): array
    {
        return [
            'nullable',
            'string',
            'max:2048',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if ($value === null || $value === '') {
                    return;
                }

                if (!Module::isStoredMaterialPath($value)) {
                    $fail('The module file must be uploaded again; the saved file reference is not valid.');
                    return;
                }

                if (!Storage::disk('local')->exists(str_replace('\\', '/', $value))) {
                    $fail('The module file was not found on the server. Upload it again.');
                }
            },
        ];
    }

    /**
     * Each Academic Admin manages only the learners, instructors and classes
     * they created (owner_admin_id). These start every such query.
     */
    private function adminId(Request $request): int
    {
        return (int) $request->user()->id;
    }

    private function ownedUsers(Request $request, string $role)
    {
        return User::where('role', $role)
            ->where('owner_admin_id', $this->adminId($request));
    }

    private function ownedClasses(Request $request)
    {
        return Course::where('owner_admin_id', $this->adminId($request));
    }

    /**
     * Check if the authenticated user is an Academic Administrator.
     */
    private function checkAdmin(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->role !== 'academic_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only Academic Administrators can access this resource.',
            ], 403);
        }

        return null;
    }

    /**
     * Academic Admin Dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        return response()->json([
            'success' => true,
            'statistics' => [
                'learners' => $this->ownedUsers($request, 'learner')->count(),
                'instructors' => $this->ownedUsers($request, 'instructor')->count(),
                'classes' => $this->ownedClasses($request)->count(),
                'active_classes' => $this->ownedClasses($request)->where('is_active', true)->count(),
                'awaiting_grade' => Submission::where('status', 'submitted')
                    ->whereHas('module.course', fn ($query) => $query->where('owner_admin_id', $this->adminId($request)))
                    ->whereDoesntHave('grade')
                    ->count(),
            ],
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $classes = $this->ownedClasses($request)->with([
            'instructor:id,name,program,is_active',
            'learners:id,name,school_id,program,is_active,role',
            'modules.progress',
            'modules.submissions.grade',
        ])->get([
            'id',
            'name',
            'code',
            'subject_code',
            'program',
            'instructor_id',
            'is_active',
        ]);

        $learnerModules = [];
        $classRecords = [];
        $libraryModules = [];

        foreach ($classes as $class) {
            $learnerIds = $class->learners
                ->where('role', 'learner')
                ->pluck('id')
                ->values();

            $modules = $class->modules
                ->map(function (Module $module) use (
                    $class,
                    $learnerIds,
                    &$learnerModules
                ) {
                    foreach ($class->learners->where('role', 'learner') as $learner) {
                        $progress = $module->progress
                            ->firstWhere('learner_id', $learner->id);
                        $submission = $module->submissions
                            ->firstWhere('learner_id', $learner->id);

                        $status = match (true) {
                            $submission?->status === 'submitted' && !$submission->grade => 'awaiting grade',
                            $submission?->status === 'graded',
                            $progress?->status === 'completed',
                            (float) ($progress?->completion_percentage ?? 0) >= 100 => 'completed',
                            $submission?->status === 'submitted' => 'submitted',
                            $progress?->status === 'in_progress' => 'in progress',
                            default => 'not started',
                        };

                        $learnerModules[$learner->id][] = [
                            'moduleId' => $module->id,
                            'title' => $module->title,
                            'course' => $class->code ?: $class->name,
                            'classId' => $class->id,
                            'status' => $status,
                            'completionPercentage' => (float) ($progress?->completion_percentage ?? 0),
                        ];
                    }

                    return [
                        'id' => $module->id,
                        'title' => $module->title,
                        'course' => $class->code ?: $class->name,
                        'program' => $class->program,
                    ];
                });

            $libraryModules = array_merge($libraryModules, $modules->all());

            $classRecords[] = [
                'id' => $class->id,
                'classCode' => $class->code,
                'courseCode' => $class->subject_code ?: $class->code,
                'courseName' => $class->name,
                'program' => $class->program,
                'instructorId' => $class->instructor_id,
                'instructorName' => $class->instructor?->name,
                'learnerIds' => $learnerIds,
                'moduleIds' => $modules->pluck('id')->values(),
                'status' => $class->is_active ? 'Active' : 'Inactive',
            ];
        }

        $learners = $this->ownedUsers($request, 'learner')
            ->with('progress')
            ->latest()
            ->get([
                'id',
                'name',
                'school_id',
                'program',
                'is_active',
            ])
            ->map(function (User $learner) use ($learnerModules) {
                $modules = $learnerModules[$learner->id] ?? [];
                $progressByModule = $learner->progress->keyBy('module_id');
                $progressValues = array_map(
                    fn (array $module) => (float) (
                        $progressByModule->get($module['moduleId'])
                            ?->completion_percentage ?? 0
                    ),
                    $modules
                );

                return [
                    'id' => $learner->id,
                    'name' => $learner->name,
                    'school_id' => $learner->school_id,
                    'program' => $learner->program,
                    'status' => $learner->is_active ? 'Active' : 'Inactive',
                    'modulesAssigned' => count($modules),
                    'progress' => count($progressValues)
                        ? round(array_sum($progressValues) / count($progressValues))
                        : null,
                ];
            });

        $instructors = $this->ownedUsers($request, 'instructor')
            ->latest()
            ->get([
                'id',
                'name',
                'program',
                'is_active',
            ])
            ->map(fn (User $instructor) => [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'program' => $instructor->program,
                'status' => $instructor->is_active ? 'Active' : 'Inactive',
            ]);

        return response()->json([
            'success' => true,
            'learners' => $learners,
            'classes' => $classRecords,
            'instructors' => $instructors,
            'modules' => $learnerModules,
            'libraryModules' => $libraryModules,
        ]);
    }

            /**
     * Get the authenticated Academic Admin's profile.
     */
    public function profile(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $user = $request->user();

        return response()->json([
            'success' => true,
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'school_id' => $user->school_id,
                'program' => $user->program,
                'contact' => $user->contact,
                'role' => $user->role,
                'profile_photo_path' => $user->profile_photo_path,
'profile_photo_url' => $user->profile_photo_path
    ? url(Storage::disk('public')->url($user->profile_photo_path))
    : null,
            ],
        ]);
    }
    
/**
 * Update the authenticated Academic Admin's profile.
 */
public function updateProfile(Request $request): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $user = $request->user();

   $validated = $request->validate([
    'name' => ['required', 'string', 'max:255'],
]);

$user->name = $validated['name'];
$user->save();

    return response()->json([
        'success' => true,
        'message' => 'Profile updated successfully.',
        'profile' => [
            'name' => $user->name,
            'email' => $user->email,
            'school_id' => $user->school_id,
            'role' => $user->role,
        ],
    ]);
}

    /**
     * Get all learners.
     */
   public function learners(Request $request): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $learners = $this->ownedUsers($request, 'learner')
        ->with([
            'courses.modules',
            'progress',
        ])
        ->latest()
        ->get([
            'id',
            'name',
            'email',
            'school_id',
            'program',
            'contact',
            'password_setup_complete',
            'is_active',
            'created_at',
        ])
        ->map(function (User $learner) {
            $assignedModules = $learner->courses
                ->flatMap(function ($course) {
                    return $course->modules;
                })
                ->unique('id')
                ->values();

            $modulesAssigned = $assignedModules->count();

            $progressByModule = $learner->progress
                ->keyBy('module_id');

            $progressPercentage = null;

            if ($modulesAssigned > 0) {
                $totalCompletion = $assignedModules->sum(
                    function ($module) use ($progressByModule) {
                        $progress = $progressByModule->get($module->id);

                        return $progress
                            ? (float) $progress->completion_percentage
                            : 0;
                    }
                );

                $progressPercentage = round(
                    $totalCompletion / $modulesAssigned
                );
            }

            $latestProgress = $learner->progress
                ->sortByDesc('updated_at')
                ->first();

            return [
                'id' => $learner->id,
                'name' => $learner->name,
                'email' => $learner->email,
                'school_id' => $learner->school_id,
                'program' => $learner->program,
                'contact' => $learner->contact,
                'password_setup_complete' =>
                    $learner->password_setup_complete,
                'is_active' => $learner->is_active,
                'created_at' => $learner->created_at,

                'modules_assigned' => $modulesAssigned,
                'progress' => $progressPercentage,

                'last_activity' => $latestProgress?->updated_at,
            ];
        });

    return response()->json([
        'success' => true,
        'learners' => $learners,
    ]);
}
    /**
     * Create a learner.
     */
    public function storeLearner(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }
$validated = $request->validate([
    'name' => ['required', 'string', 'max:255'],

    'email' => [
        'nullable',
        'email',
        'max:255',
        'unique:users,email',
    ],

    'school_id' => [
        'required',
        'string',
        'regex:/^\d{2}-\d{5}$/',
        'max:100',
        'unique:users,school_id',
    ],

    'program' => ['nullable', 'string', 'max:255'],
    'contact' => ['nullable', 'string', 'max:50'],
    'password' => ['required', 'string', 'min:8'],
    'is_active' => ['sometimes', 'boolean'],
]);

$learner = User::create([
    'owner_admin_id' => $this->adminId($request),
    'name' => $validated['name'],
    'email' => $validated['email'] ?? null,
    'school_id' => $validated['school_id'],
    'program' => $validated['program'] ?? null,
    'contact' => $validated['contact'] ?? null,
    'password' => Hash::make($validated['password']),
    'role' => 'learner',
    // The admin chose this password, so the learner must replace it.
    'password_setup_complete' => false,
    'is_active' => $validated['is_active'] ?? true,
]);
        return response()->json([
            'success' => true,
            'message' => 'Learner created successfully.',
            'learner' => $learner->only([
                'id',
                'name',
                'email',
                'school_id',
                'program',
                'contact',
                'password_setup_complete',
                'is_active',
                'created_at',
            ]),
        ], 201);
    }

    /**
     * Update a learner.
     */
    public function updateLearner(Request $request, int $id): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $learner = $this->ownedUsers($request, 'learner')->find($id);

        if (!$learner) {
            return response()->json([
                'success' => false,
                'message' => 'Learner not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],

            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($learner->id),
            ],

            'school_id' => [
                'sometimes',
                'required',
                'string',
                'regex:/^\d{2}-\d{5}$/',
                'max:100',
                Rule::unique('users', 'school_id')->ignore($learner->id),
            ],

            'program' => ['nullable', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $passwordReset = !empty($validated['password']);

        if ($passwordReset) {
            $validated['password'] = Hash::make($validated['password']);
            // Admin reset: the learner must choose a new password at next login.
            $validated['password_setup_complete'] = false;
        } else {
            unset($validated['password']);
        }

        $learner->update($validated);

        if ($passwordReset || (array_key_exists('is_active', $validated) && !$learner->is_active)) {
            $learner->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Learner updated successfully.',
            'learner' => $learner->fresh()->only([
                'id',
                'name',
                'email',
                'school_id',
                'program',
                'contact',
                'password_setup_complete',
                'is_active',
                'created_at',
                'updated_at',
            ]),
        ]);
    }

    /**
     * Delete a learner.
     */
    public function destroyLearner(Request $request, int $id): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $learner = $this->ownedUsers($request, 'learner')->find($id);

        if (!$learner) {
            return response()->json([
                'success' => false,
                'message' => 'Learner not found.',
            ], 404);
        }

        // The database cascades a user delete to their submissions, grades
        // and progress, so refuse when any exist. Deactivating keeps them.
        if ($learner->submissions()->exists() || $learner->progress()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This learner has submissions or progress records and cannot be deleted. Deactivate the account instead.',
            ], 409);
        }

        DB::transaction(function () use ($learner): void {
            $learner->tokens()->delete();
            $learner->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Learner deleted successfully.',
        ]);
    }

    /**
     * Get all instructors.
     */
    public function instructors(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $instructors = $this->ownedUsers($request, 'instructor')
            ->latest()
            ->get([
                'id',
                'name',
                'email',
                'school_id',
                'program',
                'contact',
                'password_setup_complete',
                'is_active',
                'created_at',
            ]);

        return response()->json([
            'success' => true,
            'instructors' => $instructors,
        ]);
    }

    /**
     * Create an instructor.
     */
    public function storeInstructor(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'school_id' => ['required', 'string', 'max:255', 'unique:users,school_id'],
            'program' => ['nullable', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $instructor = User::create([
            'owner_admin_id' => $this->adminId($request),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'school_id' => $validated['school_id'],
            'program' => $validated['program'] ?? null,
            'contact' => $validated['contact'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'instructor',
            // The admin chose this password, so the instructor must replace it.
            'password_setup_complete' => false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Instructor created successfully.',
            'instructor' => $instructor->only([
                'id',
                'name',
                'email',
                'school_id',
                'program',
                'contact',
                'password_setup_complete',
                'is_active',
                'created_at',
            ]),
        ], 201);
    }

    /**
     * Update an instructor.
     */
    public function updateInstructor(Request $request, int $id): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $instructor = $this->ownedUsers($request, 'instructor')->find($id);

        if (!$instructor) {
            return response()->json([
                'success' => false,
                'message' => 'Instructor not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($instructor->id),
            ],

            'school_id' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'school_id')->ignore($instructor->id),
            ],

            'program' => ['nullable', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $updateData = [
            'name' => $validated['name'] ?? $instructor->name,
            'email' => $validated['email'] ?? $instructor->email,
            'school_id' => $validated['school_id'] ?? $instructor->school_id,
            'program' => array_key_exists('program', $validated)
                ? $validated['program']
                : $instructor->program,
            'contact' => array_key_exists('contact', $validated)
                ? $validated['contact']
                : $instructor->contact,
            'is_active' => $validated['is_active'] ?? $instructor->is_active,
        ];

        $passwordReset = !empty($validated['password']);

        if ($passwordReset) {
            $updateData['password'] = Hash::make($validated['password']);
            // Admin reset: the instructor must choose a new password at next login.
            $updateData['password_setup_complete'] = false;
        }

        $instructor->update($updateData);

        if ($passwordReset || (array_key_exists('is_active', $validated) && !$instructor->is_active)) {
            $instructor->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Instructor updated successfully.',
            'instructor' => $instructor->fresh()->only([
                'id',
                'name',
                'email',
                'school_id',
                'program',
                'contact',
                'password_setup_complete',
                'is_active',
                'created_at',
                'updated_at',
            ]),
        ]);
    }

    /**
     * Delete an instructor.
     */
    public function destroyInstructor(Request $request, int $id): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $instructor = $this->ownedUsers($request, 'instructor')->find($id);

        if (!$instructor) {
            return response()->json([
                'success' => false,
                'message' => 'Instructor not found.',
            ], 404);
        }

        // Deleting an instructor would erase every grade they gave and leave
        // their classes without an instructor, so refuse when either exists.
        if ($instructor->gradesGiven()->exists() || $instructor->instructedCourses()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This instructor is assigned to classes or has graded work and cannot be deleted. Deactivate the account instead.',
            ], 409);
        }

        DB::transaction(function () use ($instructor): void {
            $instructor->tokens()->delete();
            $instructor->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Instructor deleted successfully.',
        ]);
    }

    /**
     * Get all classes.
     */
    public function classes(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $classes = $this->ownedClasses($request)->with([
            'instructor:id,name,school_id',
            'learners:id,name,school_id',
        ])
            ->withCount([
                'learners',
                'modules',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'classes' => $classes,
        ]);
        
    }
    /**
 * Create a class.
 */
public function storeClass(Request $request): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'code' => ['required', 'string', 'max:100', 'unique:courses,code'],
        'subject_code' => ['nullable', 'string', 'max:100'],
        'program' => ['nullable', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'instructor_id' => [
            'nullable',
            'integer',
            Rule::exists('users', 'id')->where(function ($query) use ($request) {
                $query->where('role', 'instructor')
                    ->where('owner_admin_id', $this->adminId($request));
            }),
        ],
        'is_active' => ['sometimes', 'boolean'],
    ]);

    $class = Course::create([
        'owner_admin_id' => $this->adminId($request),
        'name' => $validated['name'],
        'code' => $validated['code'],
        'subject_code' => $validated['subject_code'] ?? null,
        'program' => $validated['program'] ?? null,
        'description' => $validated['description'] ?? null,
        'instructor_id' => $validated['instructor_id'] ?? null,
        'is_active' => $validated['is_active'] ?? true,
    ]);

    $class->load([
        'instructor:id,name,school_id',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Class created successfully.',
        'class' => $class,
    ], 201);
}

/**
 * Update a class.
 */
public function updateClass(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    $validated = $request->validate([
        'name' => ['sometimes', 'required', 'string', 'max:255'],

        'code' => [
            'sometimes',
            'required',
            'string',
            'max:100',
            Rule::unique('courses', 'code')->ignore($class->id),
        ],

        'program' => ['nullable', 'string', 'max:255'],
        'description' => ['nullable', 'string'],

        'instructor_id' => [
            'nullable',
            'integer',
            Rule::exists('users', 'id')->where(function ($query) use ($request) {
                $query->where('role', 'instructor')
                    ->where('owner_admin_id', $this->adminId($request));
            }),
        ],

        'is_active' => ['sometimes', 'boolean'],
    ]);

    $class->update($validated);

    $class->load([
        'instructor:id,name,school_id',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Class updated successfully.',
        'class' => $class,
    ]);
}

/**
 * Delete a class.
 */
public function destroyClass(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    // Deleting a class cascades to its modules (including soft-deleted ones)
    // and from there to submissions, grades and progress.
    $moduleIds = Module::withTrashed()
        ->where('course_id', $class->id)
        ->select('id');

    if (
        Submission::whereIn('module_id', $moduleIds)->exists()
        || Progress::whereIn('module_id', $moduleIds)->exists()
    ) {
        return response()->json([
            'success' => false,
            'message' => 'This class has learner submissions or progress records and cannot be deleted. Mark the class inactive instead.',
        ], 409);
    }

    $class->delete();

    return response()->json([
        'success' => true,
        'message' => 'Class deleted successfully.',
    ]);
}

public function classLearners(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->with([
        'learners:id,name,email,school_id,program'
    ])->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    return response()->json([
        'success' => true,
        'class' => [
            'id' => $class->id,
            'name' => $class->name,
            'code' => $class->code,
        ],
        'learners' => $class->learners,
    ]);
}


public function enrollLearner(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    $validated = $request->validate([
        'learner_id' => [
            'required',
            'integer',
            Rule::exists('users', 'id')->where(function ($query) use ($request) {
                $query->where('role', 'learner')
                    ->where('owner_admin_id', $this->adminId($request));
            }),
        ],
    ]);

    $alreadyEnrolled = $class->learners()
        ->where('users.id', $validated['learner_id'])
        ->exists();

    if ($alreadyEnrolled) {
        return response()->json([
            'success' => false,
            'message' => 'Learner is already enrolled in this class.',
        ], 409);
    }

    $class->learners()->attach($validated['learner_id']);

    $learner = User::find($validated['learner_id']);

    return response()->json([
        'success' => true,
        'message' => 'Learner enrolled successfully.',
        'learner' => $learner,
    ], 201);
}


public function removeLearner(
    Request $request,
    int $id,
    int $learnerId
): JsonResponse {
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    $isEnrolled = $class->learners()
        ->where('users.id', $learnerId)
        ->exists();

    if (!$isEnrolled) {
        return response()->json([
            'success' => false,
            'message' => 'Learner is not enrolled in this class.',
        ], 404);
    }

    $class->learners()->detach($learnerId);

    return response()->json([
        'success' => true,
        'message' => 'Learner removed from class successfully.',
    ]);
}
public function uploadModuleFile(Request $request): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $request->validate([
        // Module materials must open in any browser: PDF or an image.
        // (Save Word/PowerPoint files as PDF before uploading.)
        'file' => [
            'required',
            'file',
            'max:25600',
            'mimes:pdf,jpg,jpeg,png',
        ],
    ], [
        'file.mimes' => 'Upload a PDF or an image (JPG, PNG). Save Word or PowerPoint files as PDF first.',
        'file.max' => 'The file must be 25 MB or smaller.',
    ]);

    $file = $request->file('file');

    // Store the actual file on Laravel's private local disk.
    $path = $file->store('module-materials', 'local');

    return response()->json([
        'success' => true,
        'file_path' => $path,
        'file_name' => $file->getClientOriginalName(),
        'file_size' => $file->getSize(),
        'file_type' => $file->getClientOriginalExtension(),
    ], 201);
}


public function showModuleFile(Request $request)
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $path = str_replace(
        '\\',
        '/',
        (string) $request->query('path', '')
    );

    // Only allow files stored in the module-materials directory.
    if (
        !str_starts_with($path, 'module-materials/') ||
        str_contains($path, '..')
    ) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid module file path.',
        ], 403);
    }

    if (!Storage::disk('local')->exists($path)) {
        return response()->json([
            'success' => false,
            'message' => 'Module file not found. Please upload it again.',
        ], 404);
    }

    $fileName = basename(
        (string) $request->query('name', basename($path))
    );

    $fileName = preg_replace('/[\r\n"]/', '_', $fileName)
        ?: basename($path);

    $mimeType = Storage::disk('local')->mimeType($path)
        ?: 'application/octet-stream';

    return Storage::disk('local')->response(
        $path,
        $fileName,
        [
            'Content-Type' => $mimeType,
            'X-Content-Type-Options' => 'nosniff',
        ],
        'inline'
    );
}
public function classModules(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    $modules = Module::where('course_id', $class->id)
        ->orderBy('module_order')
        ->orderBy('id')
        ->get([
            'id',
            'course_id',
            'library_key',
            'title',
            'description',
            'material_path',
            'material_name',
            'module_order',
            'is_published',
            'created_at',
            'updated_at',
        ]);

    return response()->json([
        'success' => true,
        'class' => [
            'id' => $class->id,
            'name' => $class->name,
            'code' => $class->code,
        ],
        'modules' => $modules,
    ]);
}

public function storeModule(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    $validated = $request->validate([
        'title' => ['required', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'material_path' => $this->materialPathRules(),
        'material_name' => ['nullable', 'string', 'max:255'],
        'module_order' => ['nullable', 'integer', 'min:1'],
        'is_published' => ['nullable', 'boolean'],
    ]);

    $module = Module::create([
        'course_id' => $class->id,
        'title' => $validated['title'],
        'description' => $validated['description'] ?? null,
        'material_path' => $validated['material_path'] ?? null,
        'material_name' => $validated['material_name'] ?? null,
        'module_order' => $validated['module_order'] ?? 1,
        'is_published' => $validated['is_published'] ?? false,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Module created successfully.',
        'module' => $module,
    ], 201);
}

public function updateModule(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $module = Module::whereHas('course', fn ($query) => $query->where('owner_admin_id', $this->adminId($request)))
        ->find($id);

    if (!$module) {
        return response()->json([
            'success' => false,
            'message' => 'Module not found.',
        ], 404);
    }

    $validated = $request->validate([
        'title' => ['sometimes', 'required', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'material_path' => $this->materialPathRules(),
        'material_name' => ['nullable', 'string', 'max:255'],
        'module_order' => ['nullable', 'integer', 'min:1'],
        'is_published' => ['nullable', 'boolean'],
    ]);

    $module->fill($validated);
    $module->save();

    return response()->json([
        'success' => true,
        'message' => 'Module updated successfully.',
        'module' => $module,
    ]);
}

public function destroyModule(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $module = Module::whereHas('course', fn ($query) => $query->where('owner_admin_id', $this->adminId($request)))
        ->find($id);

    if (!$module) {
        return response()->json([
            'success' => false,
            'message' => 'Module not found.',
        ], 404);
    }

    $module->delete();

    return response()->json([
        'success' => true,
        'message' => 'Module deleted successfully.',
    ]);
}

/**
 * A module's file was replaced in the module library: point every one of
 * this admin's classes that uses the module (same library_key) at the new
 * file. The old file is kept, so nothing already handed out breaks.
 */
public function replaceLibraryMaterial(Request $request, string $libraryKey): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $validated = $request->validate([
        'material_path' => array_merge(['required'], array_slice($this->materialPathRules(), 1)),
        'material_name' => ['nullable', 'string', 'max:255'],
    ]);

    $updated = Module::where('library_key', $libraryKey)
        ->whereHas('course', fn ($query) => $query->where('owner_admin_id', $this->adminId($request)))
        ->update([
            'material_path' => $validated['material_path'],
            'material_name' => $validated['material_name'] ?? null,
            'updated_at' => now(),
        ]);

    return response()->json([
        'success' => true,
        'updated_classes' => $updated,
    ]);
}

public function syncClassModules(Request $request, int $id): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $class = $this->ownedClasses($request)->find($id);

    if (!$class) {
        return response()->json([
            'success' => false,
            'message' => 'Class not found.',
        ], 404);
    }

    $validated = $request->validate([
        'modules' => ['required', 'array'],
        'modules.*.library_key' => ['required', 'string', 'max:255'],
        'modules.*.title' => ['required', 'string', 'max:255'],
        'modules.*.description' => ['nullable', 'string'],
        'modules.*.material_path' => $this->materialPathRules(),
        'modules.*.material_name' => ['nullable', 'string', 'max:255'],
        'modules.*.module_order' => ['nullable', 'integer', 'min:1'],
        'modules.*.is_published' => ['nullable', 'boolean'],
    ]);

    $selectedModules = collect($validated['modules']);

    $selectedKeys = $selectedModules
        ->pluck('library_key')
        ->map(fn ($key) => (string) $key)
        ->values();

    /*
     * Soft-delete modules that were previously assigned
     * to this class but are no longer selected.
     *
     * The module record is preserved so related academic
     * history such as progress and submissions is not lost.
     */
    $modulesToRemove = Module::where('course_id', $class->id)
        ->whereNotNull('library_key');

    if ($selectedKeys->isEmpty()) {
        $modulesToRemove->delete();
    } else {
        $modulesToRemove
            ->whereNotIn('library_key', $selectedKeys)
            ->delete();
    }

    /*
     * Create/update selected modules.
     *
     * withTrashed() allows a previously removed module
     * to be restored instead of creating a duplicate.
     */
    foreach ($selectedModules as $moduleData) {
        $module = Module::withTrashed()->firstOrNew([
            'course_id' => $class->id,
            'library_key' => $moduleData['library_key'],
        ]);

        $module->title =
            $moduleData['title'];

        $module->description =
            $moduleData['description'] ?? null;

        $module->material_path =
            $moduleData['material_path'] ?? null;

        $module->material_name =
            $moduleData['material_name'] ?? null;

        $module->module_order =
            $moduleData['module_order'] ?? 1;

        $module->is_published =
            $moduleData['is_published'] ?? false;

        if ($module->trashed()) {
            $module->restore();
        }

        $module->save();
    }

    /*
     * Return only currently active modules.
     */
    $modules = Module::where('course_id', $class->id)
        ->orderBy('module_order')
        ->orderBy('id')
        ->get([
            'id',
            'course_id',
            'library_key',
            'title',
            'description',
            'material_path',
            'material_name',
            'module_order',
            'is_published',
            'created_at',
            'updated_at',
        ]);

    return response()->json([
        'success' => true,
        'message' => 'Class modules synchronized successfully.',
        'modules' => $modules,
    ]);
}

    /**
     * Import learner accounts from an Excel .xlsx file.
     * Required columns: Student Name, School ID.
     * Optional columns: Email, Program, Contact.
     */
    public function importLearners(Request $request): JsonResponse
    {
        if ($response = $this->checkAdmin($request)) {
            return $response;
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx', 'max:10240'],
        ]);

        try {
            $spreadsheet = IOFactory::load(
                $request->file('file')->getRealPath()
            );

            $rows = $spreadsheet->getActiveSheet()
                ->toArray(null, true, true, true);

            $spreadsheet->disconnectWorksheets();
            unset($spreadsheet);

            if (count($rows) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'The spreadsheet contains no learner records.',
                ], 422);
            }

            $headers = array_shift($rows);
            $columns = [];

            foreach ($headers as $column => $header) {
                $key = strtolower(trim((string) $header));
                $key = preg_replace('/\s+/', ' ', $key);
                $columns[$key] = $column;
            }

            if (
                !isset($columns['student name']) ||
                !isset($columns['school id'])
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Required columns: Student Name and School ID.',
                ], 422);
            }

            $prepared = [];
            $errors = [];
            $seenIds = [];
            $seenEmails = [];

            foreach ($rows as $index => $row) {
                $excelRow = $index + 2;
                $name = trim((string) ($row[$columns['student name']] ?? ''));
                $schoolId = trim((string) ($row[$columns['school id']] ?? ''));

                if ($name === '' && $schoolId === '') {
                    continue;
                }

                if ($name === '' || $schoolId === '') {
                    $errors[] = [
                        'row' => $excelRow,
                        'message' => 'Student Name and School ID are both required.',
                    ];
                    continue;
                }

                if (!preg_match('/^\d{2}-\d{5}$/', $schoolId)) {
                    $errors[] = [
                        'row' => $excelRow,
                        'school_id' => $schoolId,
                        'message' => 'School ID must use the format 00-00000 (two digits, a hyphen, and five digits).',
                    ];
                    continue;
                }

                $idKey = strtolower($schoolId);

                if (isset($seenIds[$idKey])) {
                    $errors[] = [
                        'row' => $excelRow,
                        'school_id' => $schoolId,
                        'message' => 'Duplicate School ID in the spreadsheet.',
                    ];
                    continue;
                }

                $seenIds[$idKey] = true;

                $getOptional = function (string $header) use ($columns, $row) {
                    if (!isset($columns[$header])) {
                        return null;
                    }

                    $value = trim((string) ($row[$columns[$header]] ?? ''));

                    return $value === '' ? null : $value;
                };

                $email = $getOptional('email');

                if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = [
                        'row' => $excelRow,
                        'message' => 'Invalid email address.',
                    ];
                    continue;
                }

                if ($email !== null) {
                    $emailKey = strtolower($email);

                    if (isset($seenEmails[$emailKey])) {
                        $errors[] = [
                            'row' => $excelRow,
                            'message' => 'Duplicate email address in the spreadsheet.',
                        ];
                        continue;
                    }

                    $seenEmails[$emailKey] = true;
                }

                if ($email !== null && User::where('email', $email)->exists()) {
                    $errors[] = [
                        'row' => $excelRow,
                        'message' => 'Email address already exists.',
                    ];
                    continue;
                }

                $prepared[] = [
                    'row' => $excelRow,
                    'name' => $name,
                    'school_id' => $schoolId,
                    'email' => $email,
                    'program' => $getOptional('program'),
                    'contact' => $getOptional('contact'),
                ];
            }

            $existingIds = User::whereIn(
                'school_id',
                collect($prepared)->pluck('school_id')
            )->pluck('school_id')->map(
                fn ($id) => strtolower(trim($id))
            )->all();

            foreach ($prepared as $learner) {
                if (in_array(strtolower($learner['school_id']), $existingIds, true)) {
                    $errors[] = [
                        'row' => $learner['row'],
                        'school_id' => $learner['school_id'],
                        'message' => 'School ID already exists in the system.',
                    ];
                }
            }

            if ($errors) {
                return response()->json([
                    'success' => false,
                    'message' => 'No accounts were created. Fix the spreadsheet errors and try again.',
                    'errors' => $errors,
                ], 422);
            }

            if (!$prepared) {
                return response()->json([
                    'success' => false,
                    'message' => 'No learner records were found.',
                ], 422);
            }

            $created = DB::transaction(function () use ($prepared) {
                $results = [];

                foreach ($prepared as $row) {
                    // Random, unguessable temporary credential.
                    $temporaryPassword = bin2hex(random_bytes(8));

                    $learner = User::create([
                        'owner_admin_id' => auth()->id(),
                        'name' => $row['name'],
                        'school_id' => $row['school_id'],
                        'email' => $row['email'],
                        'program' => $row['program'],
                        'contact' => $row['contact'],
                        'password' => Hash::make($temporaryPassword),
                        'role' => 'learner',
                        'password_setup_complete' => false,
                    ]);

                    $results[] = [
                        'id' => $learner->id,
                        'name' => $learner->name,
                        'school_id' => $learner->school_id,
                        'email' => $learner->email,
                        'program' => $learner->program,
                        'temporary_password' => $temporaryPassword,
                    ];
                }

                return $results;
            });

            $emailSummary = [
                'sent' => 0,
                'skipped_no_email' => 0,
                'failed' => 0,
                'not_configured' => 0,
            ];

            $mailer = (string) config('mail.default');
            $mailConfigured = false;

            if ($mailer === 'smtp') {
                $smtpHost = strtolower(trim((string) config('mail.mailers.smtp.host')));
                $smtpUsername = trim((string) config('mail.mailers.smtp.username'));
                $senderAddress = trim((string) config('mail.from.address'));

                $mailConfigured =
                    $smtpHost !== ''
                    && !in_array($smtpHost, [
                        'localhost', '127.0.0.1', '::1',
                    ], true)
                    && $senderAddress !== ''
                    && filter_var($senderAddress, FILTER_VALIDATE_EMAIL) !== false;
            } elseif (in_array($mailer, [
                'sendmail', 'mailgun', 'ses', 'ses-v2',
                'postmark', 'resend',
            ], true)) {
                $mailConfigured = true;
            }

            foreach ($created as &$learnerData) {
                if (empty($learnerData['email'])) {
                    $learnerData['email_status'] = 'skipped_no_email';
                    $emailSummary['skipped_no_email']++;
                    continue;
                }

                if (!$mailConfigured) {
                    $learnerData['email_status'] = 'not_configured';
                    $emailSummary['not_configured']++;
                    continue;
                }

                try {
                    Mail::raw(
                        "Hello {$learnerData['name']},\n\n"
                        . "Your learner account has been created.\n\n"
                        . "School ID: {$learnerData['school_id']}\n"
                        . "Temporary password: {$learnerData['temporary_password']}\n\n"
                        . "Please sign in and change your temporary password. "
                        . "Keep these credentials private.",
                        function ($message) use ($learnerData) {
                            $message->to($learnerData['email'])
                                ->subject('Your learner account credentials');
                        }
                    );

                    $learnerData['email_status'] = 'sent';
                    $emailSummary['sent']++;
                } catch (\Throwable $mailError) {
                    report($mailError);
                    $learnerData['email_status'] = 'failed';
                    $emailSummary['failed']++;
                }
            }
            unset($learnerData);

            return response()->json([
                'success' => true,
                'message' => count($created) . ' learner account(s) imported.',
                'imported_count' => count($created),
                'email_summary' => $emailSummary,
                'learners' => $created,
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Unable to process the Excel file. Check the server log for details.',
            ], 422);
        }
    }

    
/**
 * Import instructor accounts from an Excel spreadsheet.
 *
 * Required columns: Instructor Name, School ID.
 * Optional columns: Email, Program, Contact.
 */
public function importInstructors(Request $request): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $request->validate([
        'file' => ['required', 'file', 'mimes:xlsx', 'max:10240'],
    ]);

    try {
        $spreadsheet = IOFactory::load(
            $request->file('file')->getRealPath()
        );

        $rows = $spreadsheet->getActiveSheet()
            ->toArray(null, true, true, true);

        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);

        if (count($rows) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'The spreadsheet contains no instructor records.',
            ], 422);
        }

        $headers = array_shift($rows);
        $columns = [];

        foreach ($headers as $column => $header) {
            $key = strtolower(trim((string) $header));
            $key = preg_replace('/\s+/', ' ', $key);
            $columns[$key] = $column;
        }

        if (
            !isset($columns['instructor name']) ||
            !isset($columns['school id'])
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Required columns: Instructor Name and School ID.',
            ], 422);
        }

        $prepared = [];
        $errors = [];
        $seenIds = [];
        $seenEmails = [];

        foreach ($rows as $index => $row) {
            $excelRow = $index + 2;

            $name = trim((string) ($row[$columns['instructor name']] ?? ''));
            $schoolId = trim((string) ($row[$columns['school id']] ?? ''));

            if ($name === '' && $schoolId === '') {
                continue;
            }

            if ($name === '' || $schoolId === '') {
                $errors[] = [
                    'row' => $excelRow,
                    'message' => 'Instructor Name and School ID are both required.',
                ];
                continue;
            }

            // Instructor IDs use INS-001, INS-002, etc.
            if (!preg_match('/^INS-\d{3,}$/i', $schoolId)) {
                $errors[] = [
                    'row' => $excelRow,
                    'school_id' => $schoolId,
                    'message' => 'School ID must use the format INS-001.',
                ];
                continue;
            }

            $schoolId = strtoupper($schoolId);
            $idKey = strtolower($schoolId);

            if (isset($seenIds[$idKey])) {
                $errors[] = [
                    'row' => $excelRow,
                    'school_id' => $schoolId,
                    'message' => 'Duplicate School ID in the spreadsheet.',
                ];
                continue;
            }

            $seenIds[$idKey] = true;

            $getOptional = function (string $header) use ($columns, $row) {
                if (!isset($columns[$header])) {
                    return null;
                }

                $value = trim((string) ($row[$columns[$header]] ?? ''));

                return $value === '' ? null : $value;
            };

            $email = $getOptional('email');

            if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = [
                    'row' => $excelRow,
                    'message' => 'Invalid email address.',
                ];
                continue;
            }

            if ($email !== null) {
                $email = strtolower($email);
                $emailKey = $email;

                if (isset($seenEmails[$emailKey])) {
                    $errors[] = [
                        'row' => $excelRow,
                        'message' => 'Duplicate email address in the spreadsheet.',
                    ];
                    continue;
                }

                $seenEmails[$emailKey] = true;

                if (User::where('email', $email)->exists()) {
                    $errors[] = [
                        'row' => $excelRow,
                        'message' => 'Email address already exists.',
                    ];
                    continue;
                }
            }

            $prepared[] = [
                'row' => $excelRow,
                'name' => $name,
                'school_id' => $schoolId,
                'email' => $email,
                'program' => $getOptional('program'),
                'contact' => $getOptional('contact'),
            ];
        }

        $existingIds = User::whereIn(
            'school_id',
            collect($prepared)->pluck('school_id')
        )->pluck('school_id')->map(
            fn ($id) => strtolower(trim($id))
        )->all();

        foreach ($prepared as $instructor) {
            if (in_array(strtolower($instructor['school_id']), $existingIds, true)) {
                $errors[] = [
                    'row' => $instructor['row'],
                    'school_id' => $instructor['school_id'],
                    'message' => 'School ID already exists in the system.',
                ];
            }
        }

        if ($errors) {
            return response()->json([
                'success' => false,
                'message' => 'No accounts were created. Fix the spreadsheet errors and try again.',
                'errors' => $errors,
            ], 422);
        }

        if (!$prepared) {
            return response()->json([
                'success' => false,
                'message' => 'No instructor records were found.',
            ], 422);
        }

        $created = DB::transaction(function () use ($prepared) {
            $results = [];

            foreach ($prepared as $row) {
                $temporaryPassword = bin2hex(random_bytes(8));

                $instructor = User::create([
                    'owner_admin_id' => auth()->id(),
                    'name' => $row['name'],
                    'school_id' => $row['school_id'],
                    'email' => $row['email'],
                    'program' => $row['program'],
                    'contact' => $row['contact'],
                    'password' => Hash::make($temporaryPassword),
                    'role' => 'instructor',
                    'password_setup_complete' => false,
                ]);

                $results[] = [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'school_id' => $instructor->school_id,
                    'email' => $instructor->email,
                    'temporary_password' => $temporaryPassword,
                ];
            }

            return $results;
        });

        return response()->json([
            'success' => true,
            'message' => count($created) . ' instructor account(s) imported successfully.',
            'count' => count($created),
            'instructors' => $created,
        ]);
    } catch (\Throwable $e) {
        report($e);

        return response()->json([
            'success' => false,
            'message' => 'Unable to import instructors. Check the spreadsheet format and server logs.',
        ], 500);
    }
}

public function uploadProfilePhoto(Request $request): JsonResponse
{
    if ($response = $this->checkAdmin($request)) {
        return $response;
    }

    $request->validate([
        'photo' => 'required|image|mimes:jpeg,png,webp|max:2048',
    ]);

    $user = $request->user();

    if (!$user) {
        return response()->json([
            'message' => 'Unauthenticated.',
        ], 401);
    }

    $oldPath = $user->profile_photo_path;

    $path = $request->file('photo')->store('profile-photos', 'public');

    $user->profile_photo_path = $path;
    $user->save();

    if ($oldPath && str_starts_with($oldPath, 'profile-photos/')) {
        Storage::disk('public')->delete($oldPath);
    }

    return response()->json([
        'message' => 'Profile picture updated successfully.',
        'profile_photo_path' => $path,
        'profile_photo_url' => url(Storage::disk('public')->url($path)),
    ]);
}


}
