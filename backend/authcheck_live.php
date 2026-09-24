<?php

/**
 * TEMPORARY live verification (deleted at the end of the auth fix).
 *
 * Exercises the real running API (php artisan serve on 127.0.0.1:8000) so the
 * login / logout / role-routing decisions the React apps depend on are proven
 * end to end - including CORS, which the Laravel test kernel doesn't cover.
 *
 * Usage: php authcheck_live.php
 */

require __DIR__ . '/vendor/autoload.php';

use GuzzleHttp\Client;

$api = new Client(['baseUrl' => 'http://127.0.0.1:8000/api']);
$PASSWORD = 'AuthCheck!2026';
$failures = [];
$checks = 0;

function check(string $label, bool $passed, string $detail = ''): void
{
    global $failures, $checks;

    $checks++;

    if (! $passed) {
        $failures[] = $label . ($detail !== '' ? ' -> ' . $detail : '');
    }

    echo ($passed ? '  PASS  ' : '  FAIL  ') . $label . ($detail !== '' ? '  [' . $detail . ']' : '') . PHP_EOL;
}

function login(Client $api, string $email, string $password): array
{
    $response = $api->post('login', [
        'json' => ['email' => $email, 'password' => $password],
    ]);

    $payload = json_decode((string) $response->getBody(), true);

    return [
        'status' => $response->getStatusCode(),
        'token' => $payload['data']['token'] ?? null,
        'role' => $payload['data']['user']['role'] ?? null,
        'role_key' => $payload['data']['user']['role_key'] ?? null,
    ];
}

function request(Client $api, string $method, string $path, ?string $token = null): array
{
    $options = ['http_errors' => false];

    if ($token !== null) {
        $options['headers'] = ['Authorization' => 'Bearer ' . $token];
    }

    $response = $api->request($method, ltrim($path, '/'), $options);
    $body = json_decode((string) $response->getBody(), true);

    return [
        'status' => $response->getStatusCode(),
        'role' => $body['data']['user']['role'] ?? null,
        'role_key' => $body['data']['user']['role_key'] ?? null,
    ];
}

echo 'LIVE API CHECK - http://127.0.0.1:8000/api' . PHP_EOL . PHP_EOL;

echo 'A) CUSTOMER' . PHP_EOL;
$customer = login($api, 'authcheck.customer@authcheck.example.com', $PASSWORD);
check('customer login reports the database role', $customer['role'] === 'customer' && $customer['role_key'] === 'user', $customer['role'] . '/' . $customer['role_key']);

$me = request($api, 'GET', 'user', $customer['token']);
check('GET /user returns the customer role (startup/refresh)', $me['status'] === 200 && $me['role_key'] === 'user', $me['status'] . '/' . (string) $me['role_key']);
check('customer cannot reach restaurant APIs', request($api, 'GET', 'restaurant/orders', $customer['token'])['status'] === 403);
check('customer cannot reach restaurant-owner profile API', request($api, 'GET', 'restaurant/profile', $customer['token'])['status'] === 403);
check('customer cannot reach admin APIs', request($api, 'GET', 'admin/users', $customer['token'])['status'] === 403);
check('customer cannot reach rider APIs', request($api, 'GET', 'rider/profile', $customer['token'])['status'] === 403);
check('customer cannot reach rider dashboard API', request($api, 'GET', 'driver/orders', $customer['token'])['status'] === 403);

check('customer logout revokes the token', request($api, 'POST', 'logout', $customer['token'])['status'] === 200);
check('revoked token is rejected on the next request', request($api, 'GET', 'user', $customer['token'])['status'] === 401);

echo PHP_EOL . 'B) RESTAURANT OWNER' . PHP_EOL;
$owner = login($api, 'authcheck.owner@authcheck.example.com', $PASSWORD);
check('owner login reports the database role', $owner['role'] === 'restaurant' && $owner['role_key'] === 'restaurant_owner', $owner['role'] . '/' . $owner['role_key']);

$me = request($api, 'GET', 'user', $owner['token']);
check('GET /user returns the owner role (startup/refresh)', $me['status'] === 200 && $me['role_key'] === 'restaurant_owner', $me['status'] . '/' . (string) $me['role_key']);
check('owner can reach the restaurant order API', request($api, 'GET', 'restaurant/orders', $owner['token'])['status'] === 200);
check('owner can reach the restaurant profile API', request($api, 'GET', 'restaurant/profile', $owner['token'])['status'] === 200);
check('owner cannot reach admin APIs', request($api, 'GET', 'admin/users', $owner['token'])['status'] === 403);
check('owner cannot reach rider APIs', request($api, 'GET', 'rider/deliveries', $owner['token'])['status'] === 403);

check('owner logout revokes the token', request($api, 'POST', 'logout', $owner['token'])['status'] === 200);
check('revoked owner token is rejected', request($api, 'GET', 'user', $owner['token'])['status'] === 401);

echo PHP_EOL . 'C) RIDER' . PHP_EOL;
$rider = login($api, 'authcheck.rider@authcheck.example.com', $PASSWORD);
check('rider login reports the database role', $rider['role'] === 'rider' && $rider['role_key'] === 'rider', $rider['role'] . '/' . $rider['role_key']);
check('rider can reach the rider dashboard API', request($api, 'GET', 'driver/orders', $rider['token'])['status'] === 200);
check('rider cannot reach restaurant-owner APIs', request($api, 'GET', 'restaurant/orders', $rider['token'])['status'] === 403);
check('rider cannot reach admin APIs', request($api, 'GET', 'admin/users', $rider['token'])['status'] === 403);

echo PHP_EOL . 'D) ADMIN' . PHP_EOL;
$admin = login($api, 'authcheck.admin@authcheck.example.com', $PASSWORD);
check('admin login reports the database role', $admin['role'] === 'admin' && $admin['role_key'] === 'admin', $admin['role'] . '/' . $admin['role_key']);
check('admin can reach the admin dashboard API', request($api, 'GET', 'admin/dashboard/stats', $admin['token'])['status'] === 200);
check('admin can reach admin user management', request($api, 'GET', 'admin/users', $admin['token'])['status'] === 200);
check('admin can reach rider management', request($api, 'GET', 'drivers', $admin['token'])['status'] === 200);

echo PHP_EOL . 'E) CROSS-ROLE SWITCHING (the original bug)' . PHP_EOL;
$again = login($api, 'authcheck.owner@authcheck.example.com', $PASSWORD);
check('owner re-login after a customer session still reports restaurant_owner', $again['role_key'] === 'restaurant_owner', (string) $again['role_key']);
check('that token can reach the restaurant API', request($api, 'GET', 'restaurant/orders', $again['token'])['status'] === 200);
check('...and still cannot reach admin APIs', request($api, 'GET', 'admin/users', $again['token'])['status'] === 403);
request($api, 'POST', 'logout', $again['token']);

$againCustomer = login($api, 'authcheck.customer@authcheck.example.com', $PASSWORD);
check('customer login after an owner session reports user', $againCustomer['role_key'] === 'user', (string) $againCustomer['role_key']);
check('that token still cannot reach restaurant APIs', request($api, 'GET', 'restaurant/orders', $againCustomer['token'])['status'] === 403);

echo PHP_EOL . 'F) CORS (two frontend ports)' . PHP_EOL;
$cors = new Client(['baseUrl' => 'http://127.0.0.1:8000/api', 'http_errors' => false]);

foreach (['http://localhost:5173', 'http://localhost:5174'] as $origin) {
    $response = $cors->options('user', [
        'headers' => [
            'Origin' => $origin,
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'authorization,content-type',
        ],
    ]);

    check(
        'preflight allowed for ' . $origin,
        $response->getHeaderLine('Access-Control-Allow-Origin') === $origin && $response->getStatusCode() < 300,
        $response->getStatusCode() . ':' . $response->getHeaderLine('Access-Control-Allow-Origin')
    );
}

echo PHP_EOL . str_repeat('-', 60) . PHP_EOL;
printf('%d checks, %d failed%s', $checks, count($failures), PHP_EOL);

foreach ($failures as $failure) {
    echo '  FAILED: ' . $failure . PHP_EOL;
}

exit($failures === [] ? 0 : 1);