<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
class Order extends Model
{
    use HasFactory;
    protected $fillable = [
        'restaurant_id',
        'user_id',
        'address_id',
        'subtotal',
        'delivery_fee',
        'total',
        'total_price',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'total' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
 
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    public function delivery(): HasOne
    {
        return $this->hasOne(Delivery::class);
    }
}
