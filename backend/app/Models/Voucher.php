<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    use HasFactory;

    public const DISCOUNT_TYPES = [
        'fixed',
        'percent',
    ];

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'min_subtotal',
        'max_discount',
        'usage_limit',
        'times_used',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_subtotal' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'usage_limit' => 'integer',
            'times_used' => 'integer',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Check whether this voucher can be applied to an order of the given
     * subtotal, and compute the discount if so. Used by both the
     * validate-code endpoint and order creation, so a code can never behave
     * differently between preview and submit.
     *
     * @return array{valid: bool, message: ?string, discount: float}
     */
    public function evaluate(float $subtotal): array
    {
        if (! $this->is_active) {
            return ['valid' => false, 'message' => 'This voucher is no longer active.', 'discount' => 0.0];
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return ['valid' => false, 'message' => 'This voucher has expired.', 'discount' => 0.0];
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'This voucher has reached its usage limit.', 'discount' => 0.0];
        }

        if ($this->min_subtotal !== null && $subtotal < (float) $this->min_subtotal) {
            return [
                'valid' => false,
                'message' => sprintf('Minimum order of $%.2f required for this voucher.', (float) $this->min_subtotal),
                'discount' => 0.0,
            ];
        }

        $discount = $this->discount_type === 'percent'
            ? $subtotal * ((float) $this->discount_value / 100)
            : (float) $this->discount_value;

        if ($this->max_discount !== null) {
            $discount = min($discount, (float) $this->max_discount);
        }

        $discount = min($discount, $subtotal);

        return ['valid' => true, 'message' => null, 'discount' => round($discount, 2)];
    }
}
