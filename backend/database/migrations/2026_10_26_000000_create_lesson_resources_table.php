<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extra materials an instructor adds to a class to support the lessons:
 * a web link (e.g. a YouTube video) or an uploaded file (PPT, video, PDF...).
 * Enrolled learners see them on the class page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_resources', function (Blueprint $table) {
            $table->id();
            // Removed with the class.
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            // Optional: the module the resource supports.
            $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
            // Kept if the instructor account is later deleted.
            $table->foreignId('instructor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 10); // link | file
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('url', 2048)->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_resources');
    }
};
