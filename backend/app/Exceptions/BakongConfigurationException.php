<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when Bakong integration cannot proceed because required
 * configuration (BAKONG_TOKEN, BAKONG_ACCOUNT_ID, ...) is missing, or the
 * KHQR SDK rejected the merchant details it was given.
 */
class BakongConfigurationException extends RuntimeException
{
}
