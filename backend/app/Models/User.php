<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'student_id',
        'program',
        'contact',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Course Relationships
    |--------------------------------------------------------------------------
    */

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_user');
    }

    public function instructedCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Submission and Grade Relationships
    |--------------------------------------------------------------------------
    */

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'learner_id');
    }

    public function gradesGiven(): HasMany
    {
        return $this->hasMany(Grade::class, 'instructor_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Notification and Progress Relationships
    |--------------------------------------------------------------------------
    */

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(Progress::class, 'learner_id');
    }
}