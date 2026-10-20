<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemAdminAuditLog extends Model
{
    protected $fillable = [
        'actor_id',
        'actor_name',
        'action',
        'target_id',
        'target_name',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }
}
