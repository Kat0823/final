<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A message an instructor posts to one of their classes.
 */
class Announcement extends Model
{
    protected $fillable = [
        'course_id',
        'instructor_id',
        'title',
        'message',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /** Oldest first, like a conversation. */
    public function replies(): HasMany
    {
        return $this->hasMany(AnnouncementReply::class)->oldest()->oldest('id');
    }
}
