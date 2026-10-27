<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A pending "change my email" request. The account's email stays the
 * same until the code sent to the new address is entered. One request
 * per account; the code is stored hashed, never in plain text.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('new_email');
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->dateTime('expires_at');
            $table->dateTime('last_sent_at');
            $table->timestamps();

            $table->index('new_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_change_requests');
    }
};
