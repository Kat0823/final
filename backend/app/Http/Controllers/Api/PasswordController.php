<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    public function setup(Request $request): JsonResponse
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

        // Only allow password setup for first-time accounts
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

        // Revoke the temporary login token
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password setup completed successfully.',
        ]);
    }
}