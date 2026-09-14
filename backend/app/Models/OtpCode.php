<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtpCode extends Model
{
    public const PURPOSE_REGISTRATION = 'registration';
    public const PURPOSE_GOOGLE_LOGIN = 'google_login';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    // Email/password login is single-factor (see AuthController::login())
    // and no longer has an OTP purpose of its own - only registration,
    // Google sign-in, and password reset go through an OTP challenge.
    public const PURPOSES = [
        self::PURPOSE_REGISTRATION,
        self::PURPOSE_GOOGLE_LOGIN,
        self::PURPOSE_PASSWORD_RESET,
    ];

    public const MAX_ATTEMPTS = 5;
    public const TTL_MINUTES = 5;
    public const RESEND_COOLDOWN_SECONDS = 60;

    protected $fillable = [
        'user_id',
        'purpose',
        'otp_hash',
        'challenge_token_hash',
        'attempts',
        'expires_at',
        'consumed_at',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isActive(): bool
    {
        return $this->consumed_at === null && ! $this->isExpired();
    }
}
