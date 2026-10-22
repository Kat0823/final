<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Replies to class announcements, written by learners in the class or
 * by the class instructor. Everyone in the class can read them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcement_replies', function (Blueprint $table) {
            $table->id();
            // Removed with the announcement (and so with its class).
            $table->foreignId('announcement_id')->constrained('announcements')->cascadeOnDelete();
            // Kept, shown as "Former member", if the account is deleted.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('message');
            $table->timestamps();

            $table->index(['announcement_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcement_replies');
    }
};
