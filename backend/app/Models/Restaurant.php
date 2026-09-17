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
        'opening_hours',
        'image',
        'photos',
        'documents',
        'status',
        'rejection_reason',
        'accepts_vouchers',
    ];

    // Submitted documents (business license, ID, etc.) can contain sensitive
    // files, so they're hidden by default and only exposed to the owner and
    // admins via makeVisible() in RestaurantController.
    protected $hidden = [
        'documents',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'accepts_vouchers' => 'boolean',
            'opening_hours' => 'array',
            'photos' => 'array',
            'documents' => 'array',
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
