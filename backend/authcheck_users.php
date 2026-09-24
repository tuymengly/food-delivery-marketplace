<?php

/**
 * TEMPORARY verification helper (deleted at the end of the auth fix).
 *
 * Creates or removes the four throwaway accounts used to exercise the
 * login/logout/role flows against a real `php artisan serve` instance.
 *
 * Usage: php authcheck_users.php seed | php authcheck_users.php cleanup
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

const AUTHCHECK_DOMAIN = '@authcheck.example.com';
const AUTHCHECK_PASSWORD = 'AuthCheck!2026';

$accounts = [
    'customer' => ['role' => 'customer', 'name' => 'Auth Check Customer'],
    'owner' => ['role' => 'restaurant', 'name' => 'Auth Check Owner'],
    'rider' => ['role' => 'rider', 'name' => 'Auth Check Rider'],
    'admin' => ['role' => 'admin', 'name' => 'Auth Check Admin'],
];

$action = $argv[1] ?? 'seed';

$emails = array_map(
    static fn (string $slug): string => 'authcheck.' . $slug . AUTHCHECK_DOMAIN,
    array_keys($accounts)
);

if ($action === 'cleanup') {
    DB::transaction(function () use ($emails): void {
        $ids = User::whereIn('email', $emails)->pluck('id');
        DB::table('personal_access_tokens')->whereIn('tokenable_id', $ids)->delete();
        Restaurant::whereIn('user_id', $ids)->delete();
        User::whereIn('email', $emails)->delete();
    });

    echo 'cleaned: ' . User::whereIn('email', $emails)->count() . ' remaining' . PHP_EOL;

    exit(0);
}

DB::transaction(function () use ($accounts, $emails): void {
    // Start from a clean slate so re-runs are idempotent.
    $existing = User::whereIn('email', $emails)->pluck('id');
    DB::table('personal_access_tokens')->whereIn('tokenable_id', $existing)->delete();
    Restaurant::whereIn('user_id', $existing)->delete();
    User::whereIn('email', $emails)->delete();

    foreach ($accounts as $slug => $account) {
        $user = User::create([
            'name' => $account['name'],
            'email' => 'authcheck.' . $slug . AUTHCHECK_DOMAIN,
            'password' => Hash::make(AUTHCHECK_PASSWORD),
            'role' => $account['role'],
            'status' => 'Active',
            'email_verified_at' => now(),
        ]);

        if ($slug === 'owner') {
            Restaurant::create([
                'user_id' => $user->id,
                'name' => 'Auth Check Kitchen',
                'address' => '1 Auth Check Street',
                'phone' => '010000000',
                'status' => 'active',
            ]);
        }

        echo $slug . ': id=' . $user->id . ' role=' . $user->role . ' role_key=' . $user->role_key . PHP_EOL;
    }
});