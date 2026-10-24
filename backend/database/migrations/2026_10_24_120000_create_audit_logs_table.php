<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One audit trail for the whole system (read only on the System Admin's
 * Audit Logs page; there is no update or delete route for it).
 *
 * Existing entries from system_admin_audit_logs are copied in with the new
 * action names and modules. The old table is left as it is.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('created_at')->useCurrent()->index();   // UTC

            // Who did it (null actor_id: e.g. a failed sign-in by an unknown person)
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name');
            $table->string('actor_role', 50)->nullable()->index();

            $table->string('action', 60)->index();
            $table->string('module', 60)->index();

            // The record acted on (e.g. user SYS-001, grade #142)
            $table->string('target_type', 40)->nullable();
            $table->string('target_id', 100)->nullable();
            $table->string('target_label')->nullable();
            $table->index(['target_type', 'target_id']);

            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            $table->string('result', 10)->default('success')->index();   // success | failed
            $table->string('ip_address', 45)->nullable();
            $table->string('details', 500);                                // short readable sentence
        });

        $this->copyOldEntries();
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }

    /** Old action names -> [new action, module]. */
    private const RENAMES = [
        'login' => ['sign_in', 'Authentication'],
        'login_failed' => ['sign_in_failed', 'Authentication'],
        'login_blocked' => ['sign_in_blocked', 'Authentication'],
        'logout' => ['sign_out', 'Authentication'],
        'account_locked' => ['account_locked', 'Authentication'],
        'password_reset_request' => ['reset_code_sent', 'Authentication'],
        'password_reset_email' => ['password_reset', 'Authentication'],
        'password_setup' => ['password_set', 'Own Account'],
        'password_change' => ['password_change', 'Own Account'],
        'profile_update' => ['update', 'Own Account'],
        'create' => ['create', 'Academic Admin Accounts'],
        'update' => ['update', 'Academic Admin Accounts'],
        'activate' => ['activate', 'Academic Admin Accounts'],
        'deactivate' => ['deactivate', 'Academic Admin Accounts'],
        'reset_password' => ['reset_password', 'Academic Admin Accounts'],
        'delete' => ['delete', 'Academic Admin Accounts'],
    ];

    private function copyOldEntries(): void
    {
        if (!Schema::hasTable('system_admin_audit_logs')) {
            return;
        }

        $roles = DB::table('users')->pluck('role', 'id');
        $schoolIds = DB::table('users')->pluck('school_id', 'id');

        DB::table('system_admin_audit_logs')->orderBy('id')->chunk(500, function ($rows) use ($roles, $schoolIds) {
            $insert = [];

            foreach ($rows as $row) {
                $details = json_decode((string) $row->details, true) ?: [];
                [$action, $module] = self::RENAMES[$row->action] ?? [$row->action, 'Academic Admin Accounts'];

                if ($row->action === 'backup') {
                    $action = ['downloaded' => 'backup_downloaded', 'deleted' => 'backup_deleted'][$details['event'] ?? ''] ?? 'backup_run';
                    $module = 'Data Backup';
                }

                $isBackup = $module === 'Data Backup';
                $targetRole = $row->target_id ? ($roles[$row->target_id] ?? $details['target_role'] ?? null) : null;

                $insert[] = [
                    'id' => $row->id,
                    'created_at' => $row->created_at,
                    'actor_id' => $row->actor_id && isset($roles[$row->actor_id]) ? $row->actor_id : null,
                    'actor_name' => $row->actor_name,
                    'actor_role' => $details['actor_role'] ?? ($row->actor_id ? ($roles[$row->actor_id] ?? null) : null),
                    'action' => $action,
                    'module' => $module,
                    'target_type' => $isBackup ? 'backup' : ($row->target_id || $row->target_name !== '—' ? 'user' : null),
                    'target_id' => $isBackup
                        ? ($details['file'] ?? null)
                        : ($row->target_id ? ($schoolIds[$row->target_id] ?? (string) $row->target_id) : ($details['school_id'] ?? null)),
                    'target_label' => $row->target_name !== '—' ? $row->target_name : null,
                    'old_values' => null,
                    'new_values' => isset($details['changes']) ? json_encode($details['changes']) : null,
                    'result' => in_array($action, ['sign_in_failed', 'sign_in_blocked'], true) ? 'failed' : 'success',
                    'ip_address' => isset($details['ip']) ? substr((string) $details['ip'], 0, 45) : null,
                    'details' => mb_substr($this->sentence($action, $row, $details, $targetRole), 0, 500),
                ];
            }

            DB::table('audit_logs')->insert($insert);
        });
    }

    private function sentence(string $action, object $row, array $details, ?string $targetRole): string
    {
        $target = $row->target_name ?: 'an account';
        $id = !empty($details['school_id']) ? " ({$details['school_id']})" : '';

        return match ($action) {
            'sign_in' => 'Signed in' . (!empty($details['first_login']) ? ' with a temporary password' : ''),
            'sign_out' => 'Signed out',
            'sign_in_failed' => !empty($details['account_exists'])
                ? "Wrong password for {$target}{$id}"
                : 'Sign-in attempt with unknown ID "' . ($details['school_id'] ?? $target) . '"',
            'sign_in_blocked' => 'Sign-in refused: account is deactivated',
            'account_locked' => "Account {$target}{$id} locked after repeated failed sign-ins",
            'reset_code_sent' => 'Asked for a password reset code by email',
            'password_reset' => 'Reset their password with the emailed code',
            'password_set' => 'Replaced the temporary password with their own',
            'password_change' => 'Changed their own password',
            'create' => "Created Academic Admin account {$target}{$id}",
            'update' => $row->actor_id && $row->actor_id === $row->target_id ? 'Updated own profile' : "Updated Academic Admin account {$target}",
            'activate' => "Activated Academic Admin account {$target}",
            'deactivate' => "Deactivated Academic Admin account {$target}",
            'reset_password' => "Gave Academic Admin account {$target} a new temporary password",
            'delete' => "Deleted Academic Admin account {$target}{$id}",
            'backup_run' => 'Made a backup: ' . ($details['file'] ?? $target),
            'backup_downloaded' => 'Downloaded the backup ' . ($details['file'] ?? $target),
            'backup_deleted' => 'Deleted the backup ' . ($details['file'] ?? $target),
            default => ucfirst(str_replace('_', ' ', $action)),
        };
    }
};
