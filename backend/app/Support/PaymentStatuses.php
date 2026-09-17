<?php

namespace App\Support;

/**
 * Canonical payment-status vocabulary for the `payments` table, orthogonal
 * to the delivery-lifecycle statuses in OrderStatuses. Mirrors its style.
 */
final class PaymentStatuses
{
    public const PENDING = 'pending';
    public const PAID = 'paid';
    public const FAILED = 'failed';
    public const EXPIRED = 'expired';

    public const ALL = [
        self::PENDING,
        self::PAID,
        self::FAILED,
        self::EXPIRED,
    ];

    /** Once in one of these, a payment never changes state again. */
    public const TERMINAL = [self::PAID, self::FAILED, self::EXPIRED];

    public static function isTerminal(?string $status): bool
    {
        return in_array($status, self::TERMINAL, true);
    }
}
