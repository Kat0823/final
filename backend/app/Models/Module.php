<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'material_path',
        'module_order',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'module_order' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(
            Course::class
        );
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(
            Submission::class
        );
    }

    public function progress(): HasMany
    {
        return $this->hasMany(
            Progress::class
        );
    }
}