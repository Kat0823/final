
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasColumn('users', 'student_id') &&
            !Schema::hasColumn('users', 'school_id')
        ) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('student_id', 'school_id');
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasColumn('users', 'school_id') &&
            !Schema::hasColumn('users', 'student_id')
        ) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('school_id', 'student_id');
            });
        }
    }
};