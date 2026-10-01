<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    // Student password setup
    public function setup(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is for students only.',
            ], 403);
        }

        return $this->completeSetup($request);
    }

    // Instructor password setup
    public function setupInstructor(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'instructor') {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is for instructors only.',
            ], 403);
        }

        return $this->completeSetup($request);
    }

    // Shared password setup logic
    private function completeSetup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $user = $request->user();

        if ($user->password_setup_complete) {
            return response()->json([
                'success' => false,
                'message' => 'Password setup has already been completed.',
            ], 403);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'password_setup_complete' => true,
        ]);

        // Issue a replacement token so the user stays logged in.
        $newToken = $user->createToken('auth_token')->plainTextToken;

        // Revoke the temporary login token.
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password setup completed successfully.',
            'token' => $newToken,
        ]);
    }
}