<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemAdminAuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class SystemAdminAcademicAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $administrators = User::query()
            ->where('role', 'academic_admin')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'email',
                'school_id',
                'role',
                'is_active',
                'password_setup_complete',
                'profile_photo_path',
                'created_at',
                'updated_at',
            ])
            ->map(fn (User $user): array => $this->resource($user));

        return response()->json([
            'success' => true,
            'administrators' => $administrators,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'school_id' => ['required', 'string', 'max:255', Rule::unique('users', 'school_id')],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpeg,png', 'max:2048'],
        ]);

        $photoPath = $request->file('profile_photo')?->store('profile-photos', 'public');

        try {
            $administrator = DB::transaction(function () use (
                $request,
                $validated,
                $photoPath
            ): User {
                $administrator = User::create([
                    'name' => $validated['name'],
                    'school_id' => $validated['school_id'],
                    'email' => $validated['email'] ?? null,
                    'password' => $validated['password'],
                    'role' => 'academic_admin',
                    'password_setup_complete' => false,
                    'is_active' => $validated['is_active'] ?? true,
                    'profile_photo_path' => $photoPath,
                ]);

                $this->recordAudit(
                    $request->user(),
                    'create',
                    $administrator,
                    [
                        'school_id' => $administrator->school_id,
                        'name' => $administrator->name,
                        'email' => $administrator->email,
                        'is_active' => $administrator->is_active,
                    ]
                );

                return $administrator;
            });
        } catch (Throwable $error) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            throw $error;
        }

        return response()->json([
            'success' => true,
            'administrator' => $this->resource($administrator),
        ], Response::HTTP_CREATED);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $administrator = $this->findAcademicAdmin($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'school_id' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'school_id')->ignore($administrator->id),
            ],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($administrator->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'remove_profile_photo' => ['sometimes', 'boolean'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpeg,png', 'max:2048'],
        ]);

        if (
            $administrator->is_active
            && array_key_exists('is_active', $validated)
            && !$validated['is_active']
            && $this->activeAcademicAdminCount() <= 1
        ) {
            return $this->lastActiveAdministratorResponse();
        }

        $newPhotoPath = $request->file('profile_photo')?->store(
            'profile-photos',
            'public'
        );
        $oldPhotoPath = $administrator->profile_photo_path;

        try {
            $administrator = DB::transaction(function () use (
                $request,
                $administrator,
                $validated,
                $newPhotoPath,
                $oldPhotoPath
            ): User {
                $changes = [];

                foreach (['name', 'school_id', 'email', 'is_active'] as $field) {
                    if (
                        array_key_exists($field, $validated)
                        && $administrator->{$field} !== $validated[$field]
                    ) {
                        $changes[$field] = [
                            'from' => $administrator->{$field},
                            'to' => $validated[$field],
                        ];
                        $administrator->{$field} = $validated[$field];
                    }
                }

                if ($newPhotoPath) {
                    $administrator->profile_photo_path = $newPhotoPath;
                    $changes['profile_photo'] = ['changed' => true];
                } elseif (
                    ($validated['remove_profile_photo'] ?? false)
                    && $administrator->profile_photo_path
                ) {
                    $administrator->profile_photo_path = null;
                    $changes['profile_photo'] = ['removed' => true];
                }

                if ($changes !== []) {
                    $administrator->save();
                    if (
                        isset($changes['is_active'])
                        && !$administrator->is_active
                    ) {
                        $administrator->tokens()->delete();
                    }

                    $action = isset($changes['is_active'])
                        ? ($administrator->is_active ? 'activate' : 'deactivate')
                        : 'update';

                    $this->recordAudit(
                        $request->user(),
                        $action,
                        $administrator,
                        $changes
                    );
                }

                return $administrator;
            });
        } catch (Throwable $error) {
            if ($newPhotoPath) {
                Storage::disk('public')->delete($newPhotoPath);
            }

            throw $error;
        }

        if (
            $oldPhotoPath
            && $oldPhotoPath !== $administrator->profile_photo_path
            && str_starts_with($oldPhotoPath, 'profile-photos/')
        ) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return response()->json([
            'success' => true,
            'administrator' => $this->resource($administrator),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $administrator = $this->findAcademicAdmin($id);

        if ($administrator->is($request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], Response::HTTP_CONFLICT);
        }

        if ($administrator->is_active && $this->activeAcademicAdminCount() <= 1) {
            return $this->lastActiveAdministratorResponse();
        }

        if (
            $administrator->courses()->exists()
            || $administrator->instructedCourses()->exists()
            || $administrator->submissions()->exists()
            || $administrator->gradesGiven()->exists()
            || $administrator->progress()->exists()
        ) {
            return response()->json([
                'success' => false,
                'message' => 'This account is linked to learning records and cannot be deleted.',
            ], Response::HTTP_CONFLICT);
        }

        $oldPhotoPath = $administrator->profile_photo_path;

        DB::transaction(function () use ($request, $administrator): void {
            $this->recordAudit(
                $request->user(),
                'delete',
                $administrator,
                [
                    'school_id' => $administrator->school_id,
                    'name' => $administrator->name,
                    'email' => $administrator->email,
                    'is_active' => $administrator->is_active,
                ]
            );
            $administrator->tokens()->delete();
            $administrator->delete();
        });

        if ($oldPhotoPath && str_starts_with($oldPhotoPath, 'profile-photos/')) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return response()->json([
            'success' => true,
        ]);
    }

    private function findAcademicAdmin(int $id): User
    {
        return User::query()
            ->where('role', 'academic_admin')
            ->findOrFail($id);
    }

    private function activeAcademicAdminCount(): int
    {
        return User::query()
            ->where('role', 'academic_admin')
            ->where('is_active', true)
            ->count();
    }

    private function lastActiveAdministratorResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'At least one active Academic Admin account must remain.',
        ], Response::HTTP_CONFLICT);
    }

    private function resource(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'school_id' => $user->school_id,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'password_setup_complete' => $user->password_setup_complete,
            'profile_photo_url' => $user->profile_photo_path
                ? url(Storage::disk('public')->url($user->profile_photo_path))
                : null,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }

    private function recordAudit(
        User $actor,
        string $action,
        User $target,
        array $details
    ): void {
        SystemAdminAuditLog::create([
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'action' => $action,
            'target_id' => $target->id,
            'target_name' => $target->name,
            'details' => $details,
        ]);
    }
}
