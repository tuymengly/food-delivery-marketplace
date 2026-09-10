<?php

namespace Tests\Unit;

use App\Services\PayoutCalculationService;
use Tests\TestCase;

class PayoutCalculationServiceTest extends TestCase
{
    public function test_rider_payout_applies_base_rate_after_no_fault_cancellation_and_keeps_tips(): void
    {
        $result = (new PayoutCalculationService())->calculateRider([
            'entity_type' => 'rider',
            'entity_name' => 'Rider One',
            'period' => '2026-09-01 to 2026-09-07',
            'base_rate' => 2.50,
            'distance_rate' => 0.75,
            'quest_completed' => true,
            'quest_bonus' => 10,
            'orders' => [
                ['reference' => 'ORD-1', 'distance_km' => 4, 'peak_surge_bonus' => 1, 'customer_tip' => 2],
                ['reference' => 'ORD-2', 'distance_km' => 10, 'peak_surge_bonus' => 4, 'customer_tip' => 1.25, 'status' => 'cancelled', 'picked_up' => true],
            ],
        ]);

        $this->assertSame(22.25, $result['final_pay_total']);
        $this->assertSame(2.50, $result['items'][1]['gross']);
        $this->assertSame(1.25, $result['items'][1]['tip']);
    }

    public function test_merchant_payout_reports_tax_and_deductions(): void
    {
        $result = (new PayoutCalculationService())->calculateMerchant([
            'entity_type' => 'merchant',
            'gross_sales' => 1000,
            'commission_rate_percentage' => 10,
            'platform_discounts' => 50,
            'merchant_discounts' => 25,
            'payment_processing_fee_percentage' => 2,
            'tax_rate' => 10,
            'tax_mode' => 'excluded',
        ]);

        $this->assertSame(905.0, $result['final_pay_total']);
        $this->assertSame(100.0, $result['tax']['amount']);
        $this->assertSame(1000.0, $result['tax']['commission_base']);
    }
}