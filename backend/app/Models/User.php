<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\UserRoles;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
    'name',
    'email',
    'email_verified_at',
    'google_id',
    'password',
    'role',
    'status',
    'location',
    'phone',
    'profile_image',
    'vehicle',
];
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Every user payload the API returns carries both the raw database role
     * (`role`, unchanged so existing consumers keep working) and the
     * normalized, unambiguous `role_key` the frontends route on. Laravel
     * stays the single source of truth for both.
     *
     * @var list<string>
     */
    protected $appends = [
        'role_key',
    ];

    /**
     * Canonical role derived from the database `role` column
     * (see App\Support\UserRoles) - 'user', 'restaurant_owner', 'rider'
     * or 'admin'.
     */
    protected function roleKey(): Attribute
    {
        return Attribute::make(get: fn (): ?string => UserRoles::canonical($this));
    }

    /**
     * True when this user's role is (or is an alias of) any given role.
     */
    public function hasRole(string ...$roles): bool
    {
        return UserRoles::has($this, ...$roles);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function restaurant(): HasOne
    {
        return $this->hasOne(Restaurant::class);
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class);
    }

    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function rider(): HasOne
    {
        return $this->hasOne(Rider::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function otpCodes(): HasMany
    {
        return $this->hasMany(OtpCode::class);
    }
}
