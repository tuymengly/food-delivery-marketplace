<?php

namespace App\Support;

use App\Models\User;

/**
 * Single source of truth for the platform's role vocabulary.
 *
 * The `users.role` column holds the historical strings this app has used
 * since the original schema ('customer', 'restaurant', 'rider', 'admin',
 * plus legacy values like 'Driver', 'Restaurant' or 'super_admin'). Rather
 * than keeping a slightly different alias list in every controller,
 * middleware and React app, every authorization decision resolves the raw
 * database role to one of four canonical roles here.
 *
 * Canonical roles (the vocabulary the frontends route on):
 *   - user              : the customer/marketplace role (stored as 'customer')
 *   - restaurant_owner  : restaurant portal owner (stored as 'restaurant')
 *   - rider             : delivery partner (stored as 'rider'; legacy 'Driver')
 *   - admin             : platform administrator (legacy 'super_admin')
 *
 * Laravel/database remains authoritative: this class never invents a role,
 * it only normalizes what the database actually stores.
 */
final class UserRoles
{
    public const ADMIN = 'admin';

    public const USER = 'user';

    public const RESTAURANT_OWNER = 'restaurant_owner';

    public const RIDER = 'rider';

    /** @var list<string> */
    public const CANONICAL = [self::ADMIN, self::USER, self::RESTAURANT_OWNER, self::RIDER];

    /**
     * Raw stored value (normalized: lowercase, "_"/"-" collapsed to spaces)
     * => canonical role.
     *
     * @var array<string, string>
     */
    private const ALIASES = [
        'customer' => self::USER,
        'user' => self::USER,
        'client' => self::USER,
        'restaurant' => self::RESTAURANT_OWNER,
        'restaurant owner' => self::RESTAURANT_OWNER,
        'restaurant admin' => self::RESTAURANT_OWNER,
        'owner' => self::RESTAURANT_OWNER,
        'rider' => self::RIDER,
        'driver' => self::RIDER,
        'admin' => self::ADMIN,
        'super admin' => self::ADMIN,
        'superadmin' => self::ADMIN,
    ];

    /**
     * Canonical role for a stored user, or null when the value is unknown
     * (an unmapped role is treated as "no access", never as a default role).
     */
    public static function canonical(?User $user): ?string
    {
        return self::forRole($user?->role);
    }

    /**
     * Canonical role for a raw role string - accepts either a stored value
     * ('customer', 'restaurant', 'Driver') or a canonical one
     * ('user', 'restaurant_owner', 'rider', 'admin').
     */
    public static function forRole(?string $role): ?string
    {
        $normalized = self::normalize($role);

        return $normalized === null ? null : (self::ALIASES[$normalized] ?? null);
    }

    /**
     * Lowercase, trim, and treat "_" / "-" as spaces so
     * 'restaurant_owner', 'restaurant-owner' and 'Restaurant Owner' all
     * resolve to the same alias key.
     */
    public static function normalize(?string $role): ?string
    {
        if ($role === null) {
            return null;
        }

        $normalized = preg_replace('/\s+/', ' ', str_replace(['_', '-'], ' ', strtolower(trim($role)))) ?? '';

        return $normalized === '' ? null : $normalized;
    }

    /**
     * True when the user's canonical role is one of the given roles (each
     * argument may be a stored or canonical value).
     */
    public static function has(?User $user, string ...$roles): bool
    {
        $current = self::canonical($user);

        if ($current === null) {
            return false;
        }

        foreach ($roles as $role) {
            if (self::forRole($role) === $current) {
                return true;
            }
        }

        return false;
    }

    public static function isAdmin(?User $user): bool
    {
        return self::canonical($user) === self::ADMIN;
    }

    public static function isRestaurantOwner(?User $user): bool
    {
        return self::canonical($user) === self::RESTAURANT_OWNER;
    }

    public static function isRider(?User $user): bool
    {
        return self::canonical($user) === self::RIDER;
    }

    public static function isCustomer(?User $user): bool
    {
        return self::canonical($user) === self::USER;
    }
}
