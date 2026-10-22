<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One activity on a grade's scoring card: title, score and "over".
 */
class GradeItem extends Model
{
    protected $fillable = [
        'grade_id',
        'title',
        'score',
        'max_score',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'float',
            'max_score' => 'float',
            'position' => 'integer',
        ];
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function toCardArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'score' => $this->score,
            'max_score' => $this->max_score,
        ];
    }
}
