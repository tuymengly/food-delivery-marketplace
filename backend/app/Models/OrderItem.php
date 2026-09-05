<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class OrderItem extends Model
{
    use HasFactory;
    protected $fillable = ['order_id', 'food_id', 'food_name', 'quantity', 'price', 'subtotal'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function food()
    {
        return $this->belongsTo(Food::class);
    }
}
