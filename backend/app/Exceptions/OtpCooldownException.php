<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when an OTP resend is requested before OtpCode::RESEND_COOLDOWN_SECONDS
 * has elapsed since the last code was sent. Rendered as HTTP 429 (see
 * bootstrap/app.php), never as a plain validation error, since this isn't a
 * bad request - it's "you already have a valid code, wait to ask again".
 */
class OtpCooldownException extends RuntimeException
{
    public function __construct(public readonly int $retryAfterSeconds)
    {
        parent::__construct('Please wait before requesting another code.');
    }
}
