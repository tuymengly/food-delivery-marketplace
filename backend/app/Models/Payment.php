<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'payment_method',
        'provider',
        'provider_transaction_id',
        'amount',
        'currency',
        'status',
        'qr_string',
        'checkout_url',
        'checkout_html',
        'deeplink',
        'qr_image',
        'md5',
        'bakong_transaction_hash',
        'bakong_from_account_id',
        'bakong_to_account_id',
        'bakong_response',
        'gateway_response',
        'callback_payload',
        'failed_reason',
        'expires_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'bakong_response' => 'array',
            'gateway_response' => 'array',
            'callback_payload' => 'array',
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
