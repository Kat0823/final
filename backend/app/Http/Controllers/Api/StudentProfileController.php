<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * The learner's own profile. Name, school ID and program are managed by
 * the Academic Admin; the learner can update their email and contact
 * number and profile picture. Passwords change through
 * PUT /api/account/password.
 */
class StudentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => $this->profile($request->user()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $learner = $request->user();

        $validated = $request->validate([
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($learner->id),
            ],
            'contact' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+()\-\s]*$/'],
        ], [
            'contact.regex' => 'The contact number may only contain numbers, spaces, +, - and brackets.',
        ]);

        $learner->update([
            'email' => $validated['email'] ?? null,
            'contact' => $validated['contact'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => $this->profile($learner->fresh()),
        ]);
    }

    /**
     * Upload or replace the profile picture (JPG, PNG or WEBP, up to
     * 2 MB), the same way the Academic Admin's works.
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        $learner = $request->user();
        $oldPath = $learner->profile_photo_path;

        $learner->profile_photo_path = $request->file('photo')->store('profile-photos', 'public');
        $learner->save();

        if ($oldPath && str_starts_with($oldPath, 'profile-photos/')) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile picture updated successfully.',
            'user' => $this->profile($learner->fresh()),
        ]);
    }

    private function profile(User $learner): array
    {
        return [
            'id' => $learner->id,
            'name' => $learner->name,
            'school_id' => $learner->school_id,
            'program' => $learner->program,
            'email' => $learner->email,
            'contact' => $learner->contact,
            'role' => $learner->role,
            'profile_photo_url' => $learner->profile_photo_path
                ? url(Storage::disk('public')->url($learner->profile_photo_path))
                : null,
            'class_count' => $learner->courses()->where('is_active', true)->count(),
            'created_at' => $learner->created_at,
        ];
    }
}
