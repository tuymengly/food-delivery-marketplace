<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when the KHQR.LINK integration cannot proceed because required
 * configuration (KHQR_BAKONG_ID, ...) is missing, or the KHQR.LINK API
 * itself failed or returned something we can't act on (e.g. no MD5 hash to
 * verify payment against).
 */
class KhqrConfigurationException extends RuntimeException
{
}
