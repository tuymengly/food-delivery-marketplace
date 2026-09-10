<?php

namespace App\Support;

/**
 * Canonical order-status vocabulary shared by every controller that writes
 * to orders.status (OrderController, DriverController, RiderDeliveryController).
 *
 * Before this class existed, orders.status was a free string with no
 * whitelist and no transition rules, so the restaurant/admin-facing
 * "update status" endpoint accepted any value. This class normalizes the
 * handful of synonymous labels that had accumulated across the frontend
 * (e.g. "Placed"/"New" for pending, "Out For Delivery" for delivering) and
 * defines the one legal forward path so invalid jumps can be rejected.
 */
final class OrderStatuses
{
    public const PENDING = 'pending';
    public const ACCEPTED = 'accepted';
    public const PREPARING = 'preparing';
    public const READY = 'ready';
    public const DELIVERING = 'delivering';
    public const DELIVERED = 'delivered';
    public const COMPLETED = 'completed';
    public const CANCELLED = 'cancelled';

    public const ALL = [
        self::PENDING,
        self::ACCEPTED,
        self::PREPARING,
        self::READY,
        self::DELIVERING,
        self::DELIVERED,
        self::COMPLETED,
        self::CANCELLED,
    ];

    /**
     * Statuses that mean the order is fully settled and its stored
     * financial breakdown should be treated as final.
     */
    public const SETTLED = [self::DELIVERED, self::COMPLETED];

    /** Historical/frontend synonyms mapped onto the canonical value above. */
    private const ALIASES = [
        'placed' => self::PENDING,
        'new' => self::PENDING,
        'processing' => self::PREPARING,
        'out_for_delivery' => self::DELIVERING,
        'picked_up' => self::DELIVERING,
    ];

    private const TRANSITIONS = [
        self::PENDING => [self::ACCEPTED, self::CANCELLED],
        self::ACCEPTED => [self::PREPARING, self::CANCELLED],
        self::PREPARING => [self::READY, self::CANCELLED],
        self::READY => [self::DELIVERING, self::COMPLETED, self::CANCELLED],
        self::DELIVERING => [self::DELIVERED, self::CANCELLED],
        self::DELIVERED => [self::COMPLETED],
        self::COMPLETED => [],
        self::CANCELLED => [],
    ];

    /** Ordinal position of each non-terminal status along the happy path. */
    private const RANK = [
        self::PENDING => 0,
        self::ACCEPTED => 1,
        self::PREPARING => 2,
        self::READY => 3,
        self::DELIVERING => 4,
        self::DELIVERED => 5,
        self::COMPLETED => 6,
    ];

    public static function normalize(string $status): string
    {
        $key = strtolower(str_replace(' ', '_', trim($status)));

        return self::ALIASES[$key] ?? $key;
    }

    public static function isValid(string $status): bool
    {
        return in_array(self::normalize($status), self::ALL, true);
    }

    public static function canTransition(?string $from, string $to): bool
    {
        $to = self::normalize($to);

        if (!in_array($to, self::ALL, true)) {
            return false;
        }

        $from = $from ? self::normalize($from) : self::PENDING;

        if ($from === $to) {
            return true;
        }

        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    public static function isSettled(?string $status): bool
    {
        return in_array($status ? self::normalize($status) : '', self::SETTLED, true);
    }

    /**
     * Looser check used when a rider/delivery-driven action (pickup, start,
     * deliver) mirrors its progress onto orders.status. Unlike canTransition()
     * this doesn't require strict adjacency - many orders never go through
     * every restaurant-side step explicitly (e.g. a rider is auto-assigned
     * the moment the order is placed, while it's still 'pending') - it only
     * guarantees the order never moves backwards along the happy path.
     * Cancelled/completed orders are terminal and never advance further.
     */
    public static function isForwardOrSame(?string $from, string $to): bool
    {
        $to = self::normalize($to);

        if (!in_array($to, self::ALL, true) || $to === self::CANCELLED) {
            return false;
        }

        $from = $from ? self::normalize($from) : self::PENDING;

        if (in_array($from, [self::CANCELLED, self::COMPLETED], true)) {
            return false;
        }

        return (self::RANK[$to] ?? 0) >= (self::RANK[$from] ?? 0);
    }
}
