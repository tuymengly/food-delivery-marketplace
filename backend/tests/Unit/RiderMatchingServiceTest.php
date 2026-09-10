<?php

namespace Tests\Unit;

use App\Services\RiderMatchingService;
use PHPUnit\Framework\TestCase;

class RiderMatchingServiceTest extends TestCase
{
    public function test_distance_between_identical_points_is_zero(): void
    {
        $service = new RiderMatchingService();

        $this->assertEqualsWithDelta(0.0, $service->haversineKm(11.5564, 104.9282, 11.5564, 104.9282), 0.0001);
    }

    public function test_distance_along_the_equator_matches_expected_km_per_degree(): void
    {
        $service = new RiderMatchingService();

        // One degree of longitude at the equator is ~111.19km on a sphere with
        // Earth's mean radius (6371km) — a known closed-form case for haversine.
        $this->assertEqualsWithDelta(111.19, $service->haversineKm(0, 0, 0, 1), 0.05);
    }

    public function test_distance_is_symmetric(): void
    {
        $service = new RiderMatchingService();

        $a = $service->haversineKm(11.5564, 104.9282, 11.5625, 104.9160);
        $b = $service->haversineKm(11.5625, 104.9160, 11.5564, 104.9282);

        $this->assertEqualsWithDelta($a, $b, 0.0001);
    }
}
