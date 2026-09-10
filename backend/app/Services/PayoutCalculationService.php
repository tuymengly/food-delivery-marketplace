<?php

namespace App\Services;

use InvalidArgumentException;

class PayoutCalculationService
{
    /**
     * Calculate a rider statement from an auditable list of delivery records.
     * Values remain unrounded until the final statement total.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function calculateRider(array $payload): array
    {
        $baseRate = $this->number($payload['base_rate'] ?? 0, 'base_rate');
        $distanceRate = $this->number($payload['distance_rate'] ?? 0, 'distance_rate');
        $questBonus = !empty($payload['quest_completed'])
            ? $this->number($payload['quest_bonus'] ?? 0, 'quest_bonus')
            : 0.0;
        $items = [];
        $total = 0.0;

        foreach ($payload['orders'] as $index => $order) {
            $distance = $this->number($order['distance_km'] ?? 0, "orders.{$index}.distance_km");
            $surge = $this->number($order['peak_surge_bonus'] ?? 0, "orders.{$index}.peak_surge_bonus");
            $tip = $this->number($order['customer_tip'] ?? 0, "orders.{$index}.customer_tip");
            $cancelled = strtolower((string) ($order['status'] ?? '')) === 'cancelled';
            $afterPickup = !empty($order['picked_up']) || !empty($order['picked_up_at']);
            $riderFault = !empty($order['rider_at_fault']);

            if ($cancelled && $afterPickup && !$riderFault) {
                $gross = $baseRate;
                $description = 'Cancelled after pickup: base rate';
            } else {
                $distancePay = $distance * $distanceRate;
                $gross = $baseRate + $distancePay + $surge;
                $description = 'Base rate + distance pay + peak surge';
            }

            $total += $gross + $tip;
            $items[] = [
                'reference' => $order['reference'] ?? ('Order ' . ($index + 1)),
                'description' => $description,
                'additions' => [
                    ['label' => 'Gross delivery pay', 'amount' => $gross],
                    ['label' => 'Customer tip', 'amount' => $tip],
                ],
                'deductions' => [],
                'gross' => $gross,
                'tip' => $tip,
                'total' => $gross + $tip,
            ];
        }

        if ($questBonus !== 0.0) {
            $total += $questBonus;
        }

        return [
            'statement' => $this->statement($payload, 'rider'),
            'items' => $items,
            'additions' => [
                ['label' => 'Quest bonus', 'amount' => $questBonus],
            ],
            'deductions' => [],
            'final_pay_total' => round($total, 2),
            'currency' => $payload['currency'] ?? 'USD',
        ];
    }

    /**
     * Calculate a merchant statement. Tax is excluded from commission by default;
     * net_of_tax can be selected when the contract defines commission on net sales.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function calculateMerchant(array $payload): array
    {
        $grossSales = $this->number($payload['gross_sales'] ?? 0, 'gross_sales');
        $platformDiscounts = $this->number($payload['platform_discounts'] ?? 0, 'platform_discounts');
        $merchantDiscounts = $this->number($payload['merchant_discounts'] ?? 0, 'merchant_discounts');
        $commissionRate = $this->number($payload['commission_rate_percentage'] ?? 0, 'commission_rate_percentage');
        $processingRate = $this->number($payload['payment_processing_fee_percentage'] ?? 0, 'payment_processing_fee_percentage');
        $taxRate = $this->number($payload['tax_rate'] ?? 0, 'tax_rate');
        $taxMode = $payload['tax_mode'] ?? 'excluded';

        if (!in_array($taxMode, ['excluded', 'net_of_tax'], true)) {
            throw new InvalidArgumentException('tax_mode must be excluded or net_of_tax.');
        }

        $taxAmount = $grossSales * ($taxRate / 100);
        $commissionBase = $taxMode === 'net_of_tax'
            ? $grossSales / (1 + ($taxRate / 100))
            : $grossSales;
        $commission = $commissionBase * ($commissionRate / 100);
        $processingFee = $grossSales * ($processingRate / 100);
        $net = ($grossSales + $platformDiscounts) - ($commission + $merchantDiscounts + $processingFee);

        return [
            'statement' => $this->statement($payload, 'merchant'),
            'items' => [],
            'additions' => [
                ['label' => 'Gross sales', 'amount' => $grossSales],
                ['label' => 'Platform discounts', 'amount' => $platformDiscounts],
            ],
            'deductions' => [
                ['label' => "Commission ({$commissionRate}%)", 'amount' => $commission],
                ['label' => 'Merchant discounts', 'amount' => $merchantDiscounts],
                ['label' => "Payment processing fee ({$processingRate}%)", 'amount' => $processingFee],
                ['label' => "Tax ({$taxRate}%, {$taxMode})", 'amount' => $taxAmount, 'informational' => true],
            ],
            'tax' => [
                'rate' => $taxRate,
                'amount' => round($taxAmount, 2),
                'commission_base' => round($commissionBase, 2),
                'mode' => $taxMode,
            ],
            'final_pay_total' => round($net, 2),
            'currency' => $payload['currency'] ?? 'USD',
        ];
    }

    private function number(mixed $value, string $field): float
    {
        if (!is_numeric($value) || (float) $value < 0) {
            throw new InvalidArgumentException("{$field} must be a non-negative number.");
        }

        return (float) $value;
    }

    /** @param array<string, mixed> $payload */
    private function statement(array $payload, string $type): array
    {
        return [
            'entity_type' => $type,
            'entity_name' => $payload['entity_name'] ?? null,
            'entity_id' => $payload['entity_id'] ?? null,
            'period' => $payload['period'] ?? null,
        ];
    }
}