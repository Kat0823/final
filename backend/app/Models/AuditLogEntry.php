<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LogicException;

/**
 * One audit trail entry (table audit_logs). Write-once: entries can be
 * added, never changed or deleted (there is no route for it either).
 * Use App\Support\AuditLogger::log() to add one.
 */
class AuditLogEntry extends Model
{
    protected $table = 'audit_logs';

    public const UPDATED_AT = null;

    protected $fillable = [
        'actor_id',
        'actor_name',
        'actor_role',
        'action',
        'module',
        'target_type',
        'target_id',
        'target_label',
        'old_values',
        'new_values',
        'result',
        'ip_address',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function () {
            throw new LogicException('Audit log entries cannot be changed.');
        });

        static::deleting(function () {
            throw new LogicException('Audit log entries cannot be deleted.');
        });
    }
}
