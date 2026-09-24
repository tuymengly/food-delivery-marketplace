<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Rider;
use App\Notifications\DeliveryAssignedNotification;
use App\Support\OrderStatuses;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Decides which rider gets a delivery. This is backend-only by design: the
 * React apps never choose a rider, and no localStorage/device/port value can
 * influence the outcome.
 *
 * Order of operations (the marketplace business rule):
 *
 *   customer places order -> payment confirmed -> PENDING_RESTAURANT
 *   restaurant accepts     -> PREPARING
 *   restaurant finishes    -> READY_FOR_PICKUP   <- only NOW may a rider be matched
 *   nearest eligible rider -> deliveries.status = 'assigned' (RIDER_ASSIGNED)
 *   rider picks up / starts -> orders.status = 'delivering'
 *   rider completes        -> orders.status = 'delivered'
 *
 * While the restaurant is still deciding or preparing, no rider is matched -
 * there is nothing for a rider to accept, and DriverController's open pool
 * only ever contains READY_FOR_PICKUP orders.
 */
class RiderMatchingService
{
    public const ONLINE_STALE_AFTER_MINUTES = 5;

    /**
     * Great-circle distance between two coordinates, in kilometers.
     */
    public function haversineKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadiusKm = 6371;
        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lonDelta / 2) ** 2;

        return $earthRadiusKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Riders who are eligible to be matched to a new order right now:
     * admin-approved, on shift, not mid-delivery, and with a fresh location fix.
     *
     * $forUpdate locks the matching rows for the duration of the caller's
     * transaction (SELECT ... FOR UPDATE) so two orders racing to be assigned
     * at nearly the same moment can't both read the same rider as available
     * before either write commits - the second query blocks until the first
     * transaction finishes, then re-evaluates is_available itself. Only pass
     * true when the result is about to be assigned inside a transaction;
     * read-only call sites (e.g. the "nearby riders" browse list) must not
     * hold a lock they never release promptly.
     */
    public function onlineAvailableRiders(bool $forUpdate = false): Collection
    {
        $query = Rider::with('user')
            ->where('status', 'active')
            ->where('is_online', true)
            ->where('is_available', true)
            ->whereNotNull('current_latitude')
            ->whereNotNull('current_longitude')
            ->where('location_updated_at', '>=', now()->subMinutes(self::ONLINE_STALE_AFTER_MINUTES));

        if ($forUpdate) {
            $query->lockForUpdate();
        }

        return $query->get();
    }

    /**
     * Single-rider version of the same eligibility rules. Used for manual
     * assignment (a restaurant picking a specific rider) and for the
     * "came back available" retry, where the candidate is already known and
     * only needs to be re-validated against the current state.
     */
    public function isEligible(Rider $rider): bool
    {
        return $rider->status === 'active'
            && (bool) $rider->is_online
            && (bool) $rider->is_available
            && $rider->current_latitude !== null
            && $rider->current_longitude !== null
            && $rider->location_updated_at !== null
            && $rider->location_updated_at->greaterThanOrEqualTo(
                now()->subMinutes(self::ONLINE_STALE_AFTER_MINUTES)
            );
    }

    /**
     * Online/available riders near a point, sorted nearest-first.
     */
    public function nearestRiders(float $lat, float $lng, int $limit = 10): Collection
    {
        return $this->onlineAvailableRiders()
            ->map(function (Rider $rider) use ($lat, $lng) {
                $rider->distance_km = round($this->haversineKm(
                    $lat,
                    $lng,
                    (float) $rider->current_latitude,
                    (float) $rider->current_longitude
                ), 2);

                return $rider;
            })
            ->sortBy('distance_km')
            ->take($limit)
            ->values();
    }

    /**
     * The best rider for an order: the closest eligible rider to the
     * RESTAURANT (the pickup point) - the rider has to reach the food, so the
     * pickup leg is what matters. When two riders are equidistant to the
     * restaurant the one closer to the customer's address wins, purely as a
     * deterministic tie-breaker.
     *
     * Returns null when the restaurant isn't geocoded yet or no rider is
     * currently matchable. Never falls back to an arbitrary rider.
     */
    public function findBestForOrder(Restaurant $restaurant, ?Address $address = null, bool $forUpdate = false): ?Rider
    {
        if ($restaurant->latitude === null || $restaurant->longitude === null) {
            return null;
        }

        $restaurantLat = (float) $restaurant->latitude;
        $restaurantLng = (float) $restaurant->longitude;
        $addressLat = $address?->latitude !== null ? (float) $address->latitude : null;
        $addressLng = $address?->longitude !== null ? (float) $address->longitude : null;

        // Distances are computed into a local ranking array rather than onto
        // the rider models: the winning model is saved inside the caller's
        // transaction, and a dynamic attribute would be written to the row
        // ("no such column: distance_km").
        $ranked = $this->onlineAvailableRiders($forUpdate)
            ->map(function (Rider $rider) use ($restaurantLat, $restaurantLng, $addressLat, $addressLng): array {
                $riderLat = (float) $rider->current_latitude;
                $riderLng = (float) $rider->current_longitude;

                return [
                    'rider' => $rider,
                    'to_restaurant' => $this->haversineKm($riderLat, $riderLng, $restaurantLat, $restaurantLng),
                    'to_dropoff' => ($addressLat !== null && $addressLng !== null)
                        ? $this->haversineKm($riderLat, $riderLng, $addressLat, $addressLng)
                        : 0.0,
                ];
            })
            ->sort(fn (array $a, array $b): int => [$a['to_restaurant'], $a['to_dropoff']]
                <=> [$b['to_restaurant'], $b['to_dropoff']])
            ->values();

        return $ranked->first()['rider'] ?? null;
    }

    /**
     * Assigns the nearest eligible rider to an order the restaurant has just
     * marked READY_FOR_PICKUP (or that is already READY_FOR_PICKUP and still
     * unassigned). Returns the delivery when a rider was assigned, or null
     * when:
     *
     *  - the order is not READY_FOR_PICKUP yet (still with the restaurant),
     *  - it already has a rider (never reassign / never double-assign),
     *  - it is a pickup order (no rider needed),
     *  - no rider is eligible right now (busy, offline, stale location).
     *
     * In the last case the order deliberately stays READY_FOR_PICKUP with an
     * unassigned delivery - it is retried whenever a rider becomes available
     * and riders can still claim it from the open pool. It is never assigned
     * at random.
     */
    public function assignBestRider(Order $order, Delivery $delivery, Restaurant $restaurant, ?Address $address = null): ?Delivery
    {
        if ($order->order_type !== 'delivery' || ! OrderStatuses::isReadyForPickup($order->status)) {
            return null;
        }

        return DB::transaction(function () use ($order, $delivery, $restaurant, $address): ?Delivery {
            // Lock the delivery first: the restaurant's "mark ready" request,
            // a rider coming online and a manual assignment can all race for
            // this same order - only one of them may write a rider to it.
            $lockedDelivery = Delivery::whereKey($delivery->id)->lockForUpdate()->first();

            if (
                ! $lockedDelivery
                || $lockedDelivery->rider_id !== null
                || $lockedDelivery->status !== 'pending'
            ) {
                return null;
            }

            // Re-read the order under the same lock: it could have been
            // rejected/cancelled between the caller's read and this write.
            $lockedOrder = Order::whereKey($order->id)->lockForUpdate()->first();

            if (! $lockedOrder || ! OrderStatuses::isReadyForPickup($lockedOrder->status)) {
                return null;
            }

            $rider = $this->findBestForOrder($restaurant, $address, forUpdate: true);

            if (! $rider) {
                return null;
            }

            $lockedDelivery->update(['rider_id' => $rider->id, 'status' => 'assigned']);
            $rider->update(['is_available' => false]);

            // The order itself stays READY_FOR_PICKUP on purpose: the rider
            // still has to collect the food. RIDER_ASSIGNED is represented by
            // deliveries.status = 'assigned'.
            $this->notifyAssignedRider($lockedOrder->fresh());

            return $lockedDelivery->refresh();
        });
    }

    /**
     * Retry point for orders left in READY_FOR_PICKUP without a rider (no
     * rider was eligible when the restaurant marked them ready). Called
     * whenever a rider's own eligibility improves for the better - goes
     * online, comes back available, reports a fresh location, or finishes a
     * delivery - so a waiting order doesn't sit there until someone happens
     * to place a new one.
     *
     * Assigns this rider to whichever waiting READY_FOR_PICKUP delivery is
     * nearest to them (restaurant distance, drop-off as tie-breaker); returns
     * null if the rider isn't eligible right now or nothing is waiting.
     */
    public function assignWaitingDeliveryToRider(Rider $rider): ?Delivery
    {
        return DB::transaction(function () use ($rider): ?Delivery {
            // Re-read and lock this rider's own row - the caller's own update
            // (e.g. is_available => true) may not have been committed yet in
            // a way every connection can see, and locking keeps this rider
            // from being handed a second waiting delivery by a concurrent
            // retry for the same rider.
            $lockedRider = Rider::lockForUpdate()->find($rider->id);

            if (! $lockedRider || ! $this->isEligible($lockedRider)) {
                return null;
            }

            $riderLat = (float) $lockedRider->current_latitude;
            $riderLng = (float) $lockedRider->current_longitude;

            $waiting = Delivery::query()
                ->where('status', 'pending')
                ->whereNull('rider_id')
                // READY_FOR_PICKUP only: an order the restaurant has not
                // finished preparing must never be handed to a rider.
                ->whereHas('order', fn ($query) => $query->where('status', OrderStatuses::READY))
                ->with(['order.restaurant', 'order.address'])
                ->lockForUpdate()
                ->get()
                ->filter(function (Delivery $delivery) {
                    $restaurant = $delivery->order?->restaurant;

                    return $restaurant?->latitude !== null && $restaurant?->longitude !== null;
                })
                ->sortBy(function (Delivery $delivery) use ($riderLat, $riderLng) {
                    $restaurant = $delivery->order->restaurant;
                    $address = $delivery->order->address;

                    $toRestaurant = $this->haversineKm(
                        $riderLat,
                        $riderLng,
                        (float) $restaurant->latitude,
                        (float) $restaurant->longitude
                    );
                    $toDropoff = ($address?->latitude !== null && $address?->longitude !== null)
                        ? $this->haversineKm(
                            $riderLat,
                            $riderLng,
                            (float) $address->latitude,
                            (float) $address->longitude
                        )
                        : 0.0;

                    return $toRestaurant + $toDropoff;
                })
                ->first();

            if (! $waiting) {
                return null;
            }

            $waiting->update(['rider_id' => $lockedRider->id, 'status' => 'assigned']);
            $lockedRider->update(['is_available' => false]);

            // The order stays READY_FOR_PICKUP - the rider still has to pick
            // the food up before the order moves to 'delivering'.
            $this->notifyAssignedRider($waiting->order->fresh());

            return $waiting->refresh();
        });
    }

    /**
     * Notifies (queued mail) the rider who was just assigned this order.
     * Wrapped defensively for the same reason payment notifications are: a
     * slow/unavailable mail server must never roll back or fail an
     * assignment that already committed.
     */
    public function notifyAssignedRider(Order $order): void
    {
        $order->loadMissing(['delivery.rider.user']);

        $riderUser = $order->delivery?->rider?->user;

        if (! $riderUser) {
            return;
        }

        try {
            $riderUser->notify(new DeliveryAssignedNotification($order));
        } catch (Throwable $exception) {
            Log::warning('Failed to notify the assigned rider of a new delivery.', [
                'order_id' => $order->id,
                'rider_id' => $order->delivery?->rider?->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
