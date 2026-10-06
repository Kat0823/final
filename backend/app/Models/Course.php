<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'program',
        'instructor_id',
        'is_active',
    ];

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'instructor_id'
        );
    }

    public function modules(): HasMany
    {
        return $this->hasMany(
            Module::class
        );
    }

    public function learners(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'course_user'
        );
    }
}