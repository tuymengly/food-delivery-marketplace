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
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Kept distinct so a code sent for one purpose can never verify
            // a different flow (e.g. a 'login' code cannot complete a
            // pending 'registration').
            $table->string('purpose');

            // The 6-digit code itself is never stored in plaintext.
            $table->string('otp_hash');

            // Opaque id the frontend holds between "OTP sent" and "OTP
            // verified" - hashed the same way (it's looked up, not decoded),
            // since it's the only thing standing between an OTP request and
            // completing that specific login/registration attempt.
            $table->string('challenge_token_hash')->unique();

            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');

            // Set the moment this row stops being usable, whatever the
            // reason (verified, too many wrong attempts, or superseded by a
            // resend) - a single flag keeps "is this code still active?"
            // one simple null-check instead of combining several columns.
            $table->timestamp('consumed_at')->nullable();

            // Distinct from consumed_at so we can tell *why* a row died:
            // this is only set on a genuinely correct code.
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'purpose']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
