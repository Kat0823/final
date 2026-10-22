<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The scoring card of a grade: one row per activity in the learner's
 * compiled submission (title, score, "over"). The grade's score and
 * max_score hold the totals.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->string('title', 150);
            $table->decimal('score', 8, 2);
            $table->decimal('max_score', 8, 2);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['grade_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_items');
    }
};
