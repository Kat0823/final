<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'instructor_id',
        'score',
        'max_score',
        'feedback',
        'graded_at',
    ];

    protected $casts = [
        'graded_at' => 'datetime',
        'score' => 'decimal:2',
        'max_score' => 'decimal:2',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }
}