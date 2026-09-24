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

    /**
     * Historical/frontend synonyms mapped onto the canonical value above.
     *
     * The marketplace lifecycle names are accepted here too, so a caller that
     * speaks the documented vocabulary ("PENDING_RESTAURANT", "REJECTED",
     * "READY_FOR_PICKUP") writes exactly the same canonical value as a caller
     * using the short internal names.
     *
     * Note: "RIDER_ASSIGNED" is NOT an order status here. Rider assignment is
     * tracked on the delivery row (deliveries.status = 'assigned') while the
     * order itself stays READY_FOR_PICKUP until the rider actually picks it
     * up - see RiderMatchingService.
     */
    private const ALIASES = [
        'placed' => self::PENDING,
        'new' => self::PENDING,
        'pending_restaurant' => self::PENDING,
        'processing' => self::PREPARING,
        'out_for_delivery' => self::DELIVERING,
        'picked_up' => self::DELIVERING,
        'ready_for_pickup' => self::READY,
        'rejected' => self::CANCELLED,
    ];

    private const TRANSITIONS = [
        // Accept takes the order straight to PREPARING (restaurant UI "Accept"),
        // while the two-step accepted -> preparing path stays valid for orders
        // that were accepted before preparing started.
        self::PENDING => [self::ACCEPTED, self::PREPARING, self::CANCELLED],
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
     * The restaurant has not accepted the order yet - the customer placed it
     * (and, for KHQR, paid it) and it is waiting for the restaurant to
     * accept or reject. Rider assignment must never happen in this state.
     */
    public static function isAwaitingRestaurant(?string $status): bool
    {
        return ($status ? self::normalize($status) : self::PENDING) === self::PENDING;
    }

    /**
     * The restaurant finished preparing and the order can be collected. This
     * is the ONLY state in which a rider may be assigned or may accept a
     * delivery (see RiderMatchingService / DriverController).
     */
    public static function isReadyForPickup(?string $status): bool
    {
        return $status !== null && self::normalize($status) === self::READY;
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
