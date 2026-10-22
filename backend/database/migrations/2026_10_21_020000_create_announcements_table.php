<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Announcements an instructor posts to one of their classes.
 * Enrolled learners see them on the class page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            // Removed with the class.
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            // Kept if the instructor account is later deleted.
            $table->foreignId('instructor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 150);
            $table->text('message');
            $table->timestamps();

            $table->index(['course_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
