<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    use HasFactory;

    public const STATUSES = [
        'pending',
        'assigned',
        'picked_up',
        'delivering',
        'delivered',
        'cancelled',
    ];

    protected $fillable = [
        'order_id',
        'rider_id',
        'status',
        'picked_up_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'picked_up_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }
}
