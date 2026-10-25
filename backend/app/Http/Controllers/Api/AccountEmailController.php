<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The step after setting a new password: the person adds their own
 * email address (used for "Forgot Password?" codes and announcements).
 * Until they do, every other request is refused (see
 * EnsurePasswordSetupComplete).
 */
class AccountEmailController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ], [
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'That email address is already used by another account.',
        ]);

        $email = strtolower(trim($validated['email']));
        $old = $user->email;

        $user->update(['email' => $email]);

        AuditLogger::log('email_added', AuditLogger::OWN_ACCOUNT, [
            'actor' => $user,
            'target' => $user,
            'old' => ['email' => $old],
            'new' => ['email' => $email],
            'details' => 'Added their email address after setting a new password',
            'request' => $request,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your email address has been saved.',
            'user' => $user->only(['id', 'name', 'email', 'school_id', 'program', 'contact', 'role']),
        ]);
    }
}
