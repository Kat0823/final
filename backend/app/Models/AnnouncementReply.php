<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A reply to a class announcement (by a learner or the instructor).
 */
class AnnouncementReply extends Model
{
    protected $fillable = [
        'announcement_id',
        'user_id',
        'message',
    ];

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * How the reply is shown to the person viewing it.
     */
    public function toViewArray(?User $viewer): array
    {
        return [
            'id' => $this->id,
            'message' => $this->message,
            'author' => [
                'name' => $this->user?->name ?? 'Former member',
                'role' => $this->user?->role,
            ],
            'is_mine' => $viewer !== null && $this->user_id === $viewer->id,
            'created_at' => $this->created_at,
        ];
    }
}
