<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Order extends Model
{
    use HasFactory;
    protected $fillable = ['restaurant_id', 'user_id', 'total_price', 'status'];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
 
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
