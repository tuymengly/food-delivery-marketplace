<?php

namespace Tests\Concerns;

use App\Models\User;
use App\Notifications\OtpCodeNotification;
use Illuminate\Support\Facades\Notification;

/**
 * Shared by every Feature test that needs to complete a real OTP challenge
 * (register/login/Google) rather than bypass auth via Sanctum::actingAs().
 * Call Notification::fake() before the action that triggers the OTP, then
 * capturedOtpCodeFor() right after to read the code the same way a real
 * inbox would - the plaintext code is never exposed via any HTTP response.
 */
trait InteractsWithOtp
{
    protected function capturedOtpCodeFor(User $user): string
    {
        $code = null;

        Notification::assertSentTo($user, OtpCodeNotification::class, function (OtpCodeNotification $notification) use (&$code): bool {
            $code = $notification->code();

            return true;
        });

        $this->assertNotNull($code, 'Expected an OtpCodeNotification to have been sent to the user.');

        return $code;
    }
}
