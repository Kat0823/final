<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AuditLog;
use App\Support\Backup\BackupManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Data Backup page (System Admin only; see routes/api.php).
 * Every backup made, downloaded or deleted is recorded in the Audit Logs.
 */
class SystemAdminBackupController extends Controller
{
    public function __construct(private BackupManager $backups)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'backups' => $this->backups->list(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Optional: protects the zip (AES-256). Not stored anywhere.
            'password' => ['nullable', 'string', 'min:8', 'max:100', 'confirmed'],
        ], [
            'password.min' => 'The backup password must be at least 8 characters.',
            'password.confirmed' => 'The two backup passwords do not match.',
        ]);

        @set_time_limit((int) config('backup.timeout', 300) + 60);

        try {
            $backup = $this->backups->create($request->user(), $validated['password'] ?? null);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'success' => false,
                'message' => $error instanceof \RuntimeException
                    ? $error->getMessage()
                    : 'The backup could not be made. Please try again.',
            ], 500);
        }

        AuditLog::record($request->user(), 'backup', null, [
            'event' => 'created',
            'file' => $backup['name'],
            'size' => $backup['size'],
            'encrypted' => $backup['encrypted'],
        ], $request, null, $backup['name']);

        return response()->json([
            'success' => true,
            'message' => 'Backup created.',
            'backup' => $backup,
        ], 201);
    }

    public function download(Request $request, string $name): BinaryFileResponse|JsonResponse
    {
        $path = $this->backups->path($name);

        if (!$path) {
            return response()->json(['success' => false, 'message' => 'Backup not found.'], 404);
        }

        AuditLog::record($request->user(), 'backup', null, [
            'event' => 'downloaded',
            'file' => $name,
        ], $request, null, $name);

        return response()->download($path, $name, [
            'Content-Type' => 'application/zip',
            'Cache-Control' => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function destroy(Request $request, string $name): JsonResponse
    {
        if (!$this->backups->delete($name)) {
            return response()->json(['success' => false, 'message' => 'Backup not found.'], 404);
        }

        AuditLog::record($request->user(), 'backup', null, [
            'event' => 'deleted',
            'file' => $name,
        ], $request, null, $name);

        return response()->json(['success' => true, 'message' => 'Backup deleted.']);
    }
}
