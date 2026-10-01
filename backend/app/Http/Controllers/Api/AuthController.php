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
        $validated = $request->validate([
            'student_id' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

<<<<<<< HEAD
        // Find the user without restricting the role to learner
        $user = User::where('student_id', $validated['student_id'])
=======
        $user = User::where('student_id', $validated['student_id'])
            ->where('role', 'learner')
>>>>>>> 253e8325fb03187f0b8023923cf451930cf6214a
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Student ID or password.',
            ], 401);
        }

<<<<<<< HEAD
        // Create Sanctum token
=======
>>>>>>> 253e8325fb03187f0b8023923cf451930cf6214a
        $token = $user->createToken('siknayan-login')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'first_login' => !$user->password_setup_complete,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'program' => $user->program,
                'contact' => $user->contact,
                'role' => $user->role,
            ],
        ]);
    }
}