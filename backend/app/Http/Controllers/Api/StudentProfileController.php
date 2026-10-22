<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The learner's own profile. Name, school ID and program are managed by
 * the Academic Admin; the learner can update their email and contact
 * number. Passwords change through PUT /api/account/password.
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
            'class_count' => $learner->courses()->where('is_active', true)->count(),
            'created_at' => $learner->created_at,
        ];
    }
}
