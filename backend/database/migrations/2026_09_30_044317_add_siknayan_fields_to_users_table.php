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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', [
                'learner',
                'instructor',
                'administrator',
                'director'
            ])->default('learner')->after('email');

            $table->string('student_id')->nullable()->unique()->after('role');
            $table->string('program')->nullable()->after('student_id');
            $table->string('contact')->nullable()->after('program');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['student_id']);

            $table->dropColumn([
                'role',
                'student_id',
                'program',
                'contact'
            ]);
        });
    }
};