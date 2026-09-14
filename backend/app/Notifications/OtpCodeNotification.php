<?php

namespace App\Notifications;

use App\Models\OtpCode;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Delivers a one-time verification code for any OtpCode::PURPOSES value.
 * The plaintext code only ever exists here and in OtpService, which
 * generates it and immediately discards it after sending - it is never
 * logged and never returned by any API response (see OtpService).
 */
class OtpCodeNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $code,
    ) {
    }

    /**
     * Only meant for Notification::fake()-based test assertions (which
     * capture this object but never the plaintext code from anywhere else
     * - see OtpService, which never returns or logs it). Not called from
     * any production code path.
     */
    public function code(): string
    {
        return $this->code;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your 24Hour Food verification code')
            ->view('emails.otp-code', [
                'code' => $this->code,
                'ttlMinutes' => OtpCode::TTL_MINUTES,
            ]);
    }
}
