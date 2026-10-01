<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        // Validate login inputs
        $validated = $request->validate([
            'school_id' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Find the account using the school ID
        $user = User::where('school_id', $validated['school_id'])
            ->first();

        // Check whether the account and password are valid
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid ID or password.',
            ], 401);
        }

        // Create an authentication token
        $token = $user->createToken('siknayan-login')->plainTextToken;

        // Return login information
        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'first_login' => !$user->password_setup_complete,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'school_id' => $user->school_id,
                'program' => $user->program,
                'contact' => $user->contact,
                'role' => $user->role,
            ],
        ]);
    }
}

