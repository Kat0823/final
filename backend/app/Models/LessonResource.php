<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A link or file an instructor adds to a class to support the lessons.
 */
class LessonResource extends Model
{
    public const TYPE_LINK = 'link';
    public const TYPE_FILE = 'file';

    /** Uploaded files live on the private disk under this folder. */
    public const FOLDER = 'lesson-resources/';

    protected $fillable = [
        'course_id',
        'module_id',
        'instructor_id',
        'type',
        'title',
        'description',
        'url',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
    ];

    /** The storage location is internal. */
    protected $hidden = ['file_path'];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /** What the class pages show. */
    public function toViewArray(): array
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'module_id' => $this->module_id,
            'module_title' => $this->module?->title,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,
            'url' => $this->type === self::TYPE_LINK ? $this->url : null,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'created_at' => $this->created_at,
        ];
    }
}
