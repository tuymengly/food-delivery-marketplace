<?php

namespace Tests\Unit;

use App\Services\OrderFinanceCalculator;
use Tests\TestCase;

class OrderFinanceCalculatorTest extends TestCase
{
    public function test_breakdown_matches_the_platform_commission_example(): void
    {
        // Food subtotal $20, delivery fee $2, customer total $22.
        // Restaurant keeps $18 (subtotal minus 10% commission), the rider
        // keeps the full $2 delivery fee, and the platform's profit is the
        // $2 commission - not the customer's full $22 payment.
        $breakdown = OrderFinanceCalculator::breakdown(20.00, 2.00, 22.00);

        $this->assertSame(18.00, $breakdown['restaurant_amount']);
        $this->assertSame(2.00, $breakdown['rider_amount']);
        $this->assertSame(2.00, $breakdown['platform_fee']);
        $this->assertSame(2.00, $breakdown['platform_profit']);

        // Sanity check: the three shares always add back up to the customer's total.
        $sum = $breakdown['restaurant_amount'] + $breakdown['rider_amount'] + $breakdown['platform_profit'];
        $this->assertEqualsWithDelta(22.00, $sum, 0.001);
    }

    public function test_breakdown_accounts_for_service_fees_and_discounts_in_platform_profit(): void
    {
        // subtotal $20, delivery fee $2, but total is $22.30 (a $0.30 service
        // fee) minus a $1.00 discount = $21.30. Restaurant/rider shares are
        // unaffected; the platform absorbs the discount and keeps the service fee.
        $breakdown = OrderFinanceCalculator::breakdown(20.00, 2.00, 21.30);

        $this->assertSame(18.00, $breakdown['restaurant_amount']);
        $this->assertSame(2.00, $breakdown['rider_amount']);
        $this->assertSame(1.30, $breakdown['platform_profit']);
    }
}
