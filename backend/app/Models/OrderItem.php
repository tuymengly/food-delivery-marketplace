<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class OrderItem extends Model
{
    use HasFactory;
    protected $fillable = ['order_id', 'food_id', 'quantity', 'price'];

    public function food()
    {
        return $this->belongsTo(Food::class);
    }
}
