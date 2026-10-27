<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A pending email change (see EmailChangeController). The code is kept
 * only as a hash and is hidden from any JSON output.
 */
class EmailChangeRequest extends Model
{
    protected $fillable = [
        'user_id',
        'new_email',
        'code_hash',
        'attempts',
        'expires_at',
        'last_sent_at',
    ];

    protected $hidden = [
        'code_hash',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'expires_at' => 'datetime',
            'last_sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
