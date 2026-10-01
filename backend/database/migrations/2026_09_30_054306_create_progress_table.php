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
        Schema::create('progress', function (Blueprint $table) {
            $table->id();

            $table->foreignId('learner_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('module_id')
                ->constrained('modules')
                ->cascadeOnDelete();

            $table->enum('status', [
                'not_started',
                'in_progress',
                'completed'
            ])->default('not_started');

            $table->decimal('completion_percentage', 5, 2)->default(0);

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->unique(['learner_id', 'module_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('progress');
    }
};