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
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('module_id')
                ->constrained('modules')
                ->cascadeOnDelete();

            $table->foreignId('learner_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();

            $table->text('comment')->nullable();

            $table->timestamp('submitted_at')->nullable();

            $table->enum('status', [
                'draft',
                'submitted',
                'graded'
            ])->default('draft');

            $table->timestamps();

            $table->unique(['module_id', 'learner_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};