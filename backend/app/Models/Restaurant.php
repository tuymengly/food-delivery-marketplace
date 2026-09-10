<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Restaurant extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'name',
        'cuisine',
        'description',
        'address',
        'latitude',
        'longitude',
        'phone',
        'delivery_fee',
        'min_order',
        'avg_delivery_time',
        'image',
        'status',
        'accepts_vouchers',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'accepts_vouchers' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function foods(): HasMany
    {
        return $this->hasMany(Food::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
