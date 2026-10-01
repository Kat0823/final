<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $learner = $request->user();

        $notifications = $learner->notifications()
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
        ]);
    }
}