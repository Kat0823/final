<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Each Academic Admin owns the learners, instructors and classes they
 * create (owner_admin_id). Records that existed before this change are
 * given to ADMIN-001, or to the oldest Academic Admin if it doesn't exist.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('owner_admin_id')
                ->nullable()
                ->after('role')
                ->constrained('users')
                ->nullOnDelete();
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('owner_admin_id')
                ->nullable()
                ->after('instructor_id')
                ->constrained('users')
                ->nullOnDelete();
        });

        $ownerId = DB::table('users')
            ->where('role', 'academic_admin')
            ->where('school_id', 'ADMIN-001')
            ->value('id')
            ?? DB::table('users')
                ->where('role', 'academic_admin')
                ->orderBy('id')
                ->value('id');

        if ($ownerId !== null) {
            DB::table('users')
                ->whereIn('role', ['learner', 'instructor'])
                ->whereNull('owner_admin_id')
                ->update(['owner_admin_id' => $ownerId]);

            DB::table('courses')
                ->whereNull('owner_admin_id')
                ->update(['owner_admin_id' => $ownerId]);
        }
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_admin_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_admin_id');
        });
    }
};
