<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'school_id',
        'program',
        'contact',
        'password_setup_complete',
        'is_active',
        'profile_photo_path',
        // For learners and instructors: the Academic Admin who manages them.
        'owner_admin_id',
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
            'password_setup_complete' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Learners, instructors and academic admins must add their own
     * email after setting their password, before using the LMS.
     */
    public function needsEmail(): bool
    {
        return in_array($this->role, ['learner', 'instructor', 'academic_admin'], true)
            && (bool) $this->password_setup_complete
            && trim((string) $this->email) === '';
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_user');
    }

    public function instructedCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'learner_id');
    }

    public function gradesGiven(): HasMany
    {
        return $this->hasMany(Grade::class, 'instructor_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(Progress::class, 'learner_id');
    }
}