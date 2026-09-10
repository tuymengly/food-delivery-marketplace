<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Rider;
use Illuminate\Support\Collection;

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
     */
    public function onlineAvailableRiders(): Collection
    {
        return Rider::with('user')
            ->where('status', 'active')
            ->where('is_online', true)
            ->where('is_available', true)
            ->whereNotNull('current_latitude')
            ->whereNotNull('current_longitude')
            ->where('location_updated_at', '>=', now()->subMinutes(self::ONLINE_STALE_AFTER_MINUTES))
            ->get();
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
     * The best rider for an order: lowest combined distance to the restaurant
     * (pickup) and the delivery address (dropoff). Returns null if either
     * location is not geocoded yet, or no rider is currently matchable.
     */
    public function findBestForOrder(Restaurant $restaurant, Address $address): ?Rider
    {
        if ($restaurant->latitude === null || $restaurant->longitude === null) {
            return null;
        }

        if ($address->latitude === null || $address->longitude === null) {
            return null;
        }

        $restaurantLat = (float) $restaurant->latitude;
        $restaurantLng = (float) $restaurant->longitude;
        $addressLat = (float) $address->latitude;
        $addressLng = (float) $address->longitude;

        return $this->onlineAvailableRiders()
            ->sortBy(function (Rider $rider) use ($restaurantLat, $restaurantLng, $addressLat, $addressLng) {
                $riderLat = (float) $rider->current_latitude;
                $riderLng = (float) $rider->current_longitude;

                return $this->haversineKm($riderLat, $riderLng, $restaurantLat, $restaurantLng)
                    + $this->haversineKm($riderLat, $riderLng, $addressLat, $addressLng);
            })
            ->first();
    }

    /**
     * Find and assign the best rider for an order, applying every side
     * effect the manual "accept" flow (DriverController::updateOrderStatus)
     * applies together, so the order shows up correctly in the rider's
     * dashboard. Returns false (without throwing) if no rider was matched.
     */
    public function assignBestRider(Order $order, Delivery $delivery, Restaurant $restaurant, Address $address): bool
    {
        $rider = $this->findBestForOrder($restaurant, $address);

        if (!$rider) {
            return false;
        }

        $delivery->update(['rider_id' => $rider->id, 'status' => 'assigned']);
        $rider->update(['is_available' => false]);
        $order->update(['status' => 'accepted']);

        return true;
    }
}
