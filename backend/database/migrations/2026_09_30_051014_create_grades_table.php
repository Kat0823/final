<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();

            $table->foreignId('submission_id')
                ->constrained('submissions')
                ->cascadeOnDelete();

            $table->foreignId('instructor_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->decimal('score', 5, 2)->nullable();

            $table->decimal('max_score', 5, 2)->default(100);

            $table->text('feedback')->nullable();

            $table->timestamp('graded_at')->nullable();

            $table->timestamps();

            $table->unique('submission_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};