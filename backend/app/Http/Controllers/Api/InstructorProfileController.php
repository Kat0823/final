<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class InstructorProfileController extends Controller
{
    /**
     * Get the logged-in instructor's profile.
     */
    public function show(Request $request): JsonResponse
    {
        $instructor = $request->user();

        if (!$instructor || $instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can view this profile.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'email' => $instructor->email,
                'school_id' => $instructor->school_id,
                'program' => $instructor->program,
                'contact' => $instructor->contact,
                'role' => $instructor->role,
            ],
        ]);
    }

    /**
     * Update the logged-in instructor's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $instructor = $request->user();

        if (!$instructor || $instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can update this profile.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($instructor->id),
            ],

            'contact' => [
                'nullable',
                'string',
                'max:30',
            ],
        ]);

        $instructor->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'contact' => $validated['contact'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'email' => $instructor->email,
                'school_id' => $instructor->school_id,
                'program' => $instructor->program,
                'contact' => $instructor->contact,
                'role' => $instructor->role,
            ],
        ]);
    }

    /**
     * Change the logged-in instructor's password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $instructor = $request->user();

        if (!$instructor || $instructor->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'Only instructors can change their password.',
            ], 403);
        }

        $validated = $request->validate([
            'current_password' => [
                'required',
                'string',
            ],

            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        if (!Hash::check(
            $validated['current_password'],
            $instructor->password
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $instructor->update([
            'password' => $validated['new_password'],
        ]);

        // Log out every other session; keep the one making this request.
        $currentTokenId = $instructor->currentAccessToken()?->id;
        $instructor->tokens()
            ->when($currentTokenId, fn ($query) => $query->whereKeyNot($currentTokenId))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}