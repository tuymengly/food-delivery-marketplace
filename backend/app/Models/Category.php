<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'description',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function foods(): HasMany
    {
        return $this->hasMany(Food::class);
    }
}
