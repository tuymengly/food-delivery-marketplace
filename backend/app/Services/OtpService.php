<?php

namespace App\Services;

use App\Exceptions\OtpCooldownException;
use App\Models\OtpCode;
use App\Models\User;
use App\Notifications\OtpCodeNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Single place that owns OTP generation, delivery, and verification for
 * every purpose (OtpCode::PURPOSES) and every caller (AuthController's
 * email/password register+login, password reset, and GoogleAuthController's
 * Google sign-in).
 * Neither controller talks to the otp_codes table directly, so there is
 * exactly one implementation of "how an OTP challenge works".
 */
class OtpService
{
    /**
     * Invalidate any still-active OTP for this user+purpose, generate and
     * email a fresh 6-digit code, and return the challenge payload the
     * frontend needs to reach verify()/resend() - never the code itself.
     */
    public function issueChallenge(User $user, string $purpose): array
    {
        OtpCode::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $challengeToken = Str::random(64);

        $otp = OtpCode::create([
            'user_id' => $user->id,
            'purpose' => $purpose,
            'otp_hash' => Hash::make($code),
            'challenge_token_hash' => $this->hashToken($challengeToken),
            'expires_at' => now()->addMinutes(OtpCode::TTL_MINUTES),
        ]);

        $user->notify(new OtpCodeNotification($code));

        return $this->challengePayload($otp, $challengeToken, $user);
    }

    /**
     * @throws ValidationException if the challenge is unknown or already
     *         completed
     * @throws OtpCooldownException if the resend cooldown hasn't elapsed
     */
    public function resend(string $challengeToken, string $purpose): array
    {
        $otp = $this->findByToken($challengeToken, $purpose);

        if ($otp->verified_at) {
            throw ValidationException::withMessages([
                'challenge_token' => ['This verification has already been completed.'],
            ]);
        }

        $secondsSinceSent = $otp->created_at->diffInSeconds(now());

        if ($secondsSinceSent < OtpCode::RESEND_COOLDOWN_SECONDS) {
            throw new OtpCooldownException(OtpCode::RESEND_COOLDOWN_SECONDS - $secondsSinceSent);
        }

        return $this->issueChallenge($otp->user, $purpose);
    }

    /**
     * @throws ValidationException on an unknown/expired/reused/wrong code,
     *         or once the attempt limit is reached
     */
    public function verify(string $challengeToken, string $purpose, string $code): User
    {
        $otp = $this->findByToken($challengeToken, $purpose);

        if ($otp->verified_at) {
            throw ValidationException::withMessages([
                'code' => ['This code has already been used.'],
            ]);
        }

        if ($otp->consumed_at || $otp->isExpired()) {
            throw ValidationException::withMessages([
                'code' => ['This code has expired. Please request a new code.'],
            ]);
        }

        if ($otp->attempts >= OtpCode::MAX_ATTEMPTS || ! Hash::check($code, $otp->otp_hash)) {
            $otp->increment('attempts');

            if ($otp->attempts >= OtpCode::MAX_ATTEMPTS) {
                $otp->update(['consumed_at' => now()]);

                throw ValidationException::withMessages([
                    'code' => ['Too many attempts. Please request a new code.'],
                ]);
            }

            $remaining = OtpCode::MAX_ATTEMPTS - $otp->attempts;

            throw ValidationException::withMessages([
                'code' => ["Invalid verification code. {$remaining} attempt(s) remaining."],
            ]);
        }

        $otp->update(['consumed_at' => now(), 'verified_at' => now()]);

        $user = $otp->user;

        // Any successfully verified code - registration, login, or Google -
        // proves the user controls this mailbox, so it's a fine time to
        // mark the email verified if it wasn't already (e.g. an abandoned
        // registration that's now completing via a later login attempt).
        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return $user;
    }

    /**
     * Return the user for a password-reset challenge only after its OTP was
     * verified, then immediately burn the challenge so it can never be
     * replayed - without this, a verified challenge_token would stay valid
     * reset authorization forever (verified_at is never cleared), letting
     * anyone who captured it reset the password again at any later time.
     * The challenge token is temporary reset authorization, never an
     * authentication token.
     */
    public function consumePasswordResetChallenge(string $challengeToken): User
    {
        $otp = $this->findByToken($challengeToken, OtpCode::PURPOSE_PASSWORD_RESET);

        if (! $otp->verified_at) {
            throw ValidationException::withMessages([
                'challenge_token' => ['Verify the password reset code before setting a new password.'],
            ]);
        }

        if ($otp->isExpired()) {
            throw ValidationException::withMessages([
                'challenge_token' => ['This password reset session has expired. Please start over.'],
            ]);
        }

        // Force-expire now so this same verified token can never be used to
        // reset the password a second time.
        $otp->update(['expires_at' => now()]);

        return $otp->user;
    }

    /**
     * A well-formed but non-functional challenge for an email with no
     * account, so forgotPassword() can respond identically whether or not
     * the email is registered - avoiding an account-enumeration signal.
     * Any code submitted against it fails the same way any unknown
     * challenge_token always does (see findByToken()).
     */
    public function decoyPasswordResetChallenge(string $email): array
    {
        return [
            'otp_required' => true,
            'challenge_token' => Str::random(64),
            'purpose' => OtpCode::PURPOSE_PASSWORD_RESET,
            'masked_email' => $this->maskEmail($email),
            'expires_in' => OtpCode::TTL_MINUTES * 60,
            'resend_available_in' => OtpCode::RESEND_COOLDOWN_SECONDS,
        ];
    }

    /**
     * @throws ValidationException if the challenge is unknown
     */
    private function findByToken(string $challengeToken, string $purpose): OtpCode
    {
        $otp = OtpCode::where('challenge_token_hash', $this->hashToken($challengeToken))
            ->where('purpose', $purpose)
            ->first();

        if (! $otp) {
            throw ValidationException::withMessages([
                'challenge_token' => ['This verification session is invalid. Please start over.'],
            ]);
        }

        return $otp;
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private function challengePayload(OtpCode $otp, string $challengeToken, User $user): array
    {
        return [
            'otp_required' => true,
            'challenge_token' => $challengeToken,
            'purpose' => $otp->purpose,
            'masked_email' => $this->maskEmail($user->email),
            'expires_in' => OtpCode::TTL_MINUTES * 60,
            'resend_available_in' => OtpCode::RESEND_COOLDOWN_SECONDS,
        ];
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        if ($local === '') {
            return $email;
        }

        $visible = mb_substr($local, 0, 1);
        $masked = $visible . str_repeat('*', max(1, mb_strlen($local) - 1));

        return $domain !== '' ? "{$masked}@{$domain}" : $masked;
    }
}
