<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rider extends Model
{
    use HasFactory;

    public const STATUSES = [
        'active',
        'inactive',
        'suspended',
    ];

    public const VEHICLE_TYPES = [
        'bicycle',
        'motorcycle',
        'car',
    ];

    protected $fillable = [
        'user_id',
        'vehicle_type',
        'vehicle_number',
        'phone',
        'status',
        'is_available',
        'current_latitude',
        'current_longitude',
        'location_updated_at',
        'is_online',
    ];

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
            'is_online' => 'boolean',
            'current_latitude' => 'decimal:7',
            'current_longitude' => 'decimal:7',
            'location_updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }
}
