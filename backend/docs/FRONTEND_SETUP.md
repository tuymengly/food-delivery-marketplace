# Frontend Setup Guide

This guide helps frontend developers connect to the Laravel backend for the Food Delivery Marketplace.

## 1. Clone The Repository

```bash
git clone <repository-url>
cd food-delivery-marketplace
```

Backend code is in:

```text
backend/
```

Frontend apps should not need to edit backend business logic to consume the API.

## 2. Find The API Documentation

Read the main API handoff document:

```text
backend/docs/API_DOCUMENTATION.md
```

It lists every currently implemented API route, including:

- HTTP method
- URL
- authentication requirement
- required role
- request body
- required fields
- example response
- important error responses

## 3. Import The Postman Collection

The Postman collection is located at:

```text
backend/docs/postman/Food-Delivery-Marketplace.postman_collection.json
```

To import it:

1. Open Postman.
2. Click `Import`.
3. Select the JSON collection file.
4. Confirm the import.
5. Open the collection variables.
6. Confirm `base_url` is set to:

```text
http://127.0.0.1:8000/api
```

The collection also uses `token` for bearer authentication. Login requests save this automatically when the API returns `data.token`.

## 4. How The Local API Works

The local API root is:

```text
http://127.0.0.1:8000/api
```

Typical backend startup from the `backend/` directory:

```bash
composer install
php artisan migrate
php artisan serve
```

The development server usually runs at:

```text
http://127.0.0.1:8000
```

API endpoints are under `/api`, for example:

```text
http://127.0.0.1:8000/api/foods
```

## 5. Configure The Frontend API Base URL

Use one frontend environment variable for the API base URL.

Example:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Fetch example:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const response = await fetch(`${API_BASE_URL}/foods`, {
  headers: {
    Accept: "application/json",
  },
});
```

For authenticated requests:

```js
const response = await fetch(`${API_BASE_URL}/user`, {
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  },
});
```

## 6. Bearer Authentication

The backend uses Laravel Sanctum API tokens.

Login and register responses include:

```json
{
  "data": {
    "token": "1|example-token",
    "token_type": "Bearer"
  }
}
```

Frontend flow:

1. User logs in or registers.
2. Store `data.token` in the frontend auth state.
3. Send authenticated requests with:

```http
Authorization: Bearer <token>
```

Do not hardcode tokens in frontend source files.

## 7. Public APIs

These APIs do not require authentication:

- `POST /api/register`
- `POST /api/login`
- `GET /api/restaurants`
- `GET /api/restaurants/{restaurant}`
- `GET /api/categories`
- `GET /api/categories/{category}`
- `GET /api/foods`
- `GET /api/foods/{food}`

## 8. APIs That Require Authentication

These APIs require a bearer token:

- `POST /api/logout`
- `GET /api/user`
- Restaurant create/update/delete
- Category create/update/delete
- Food create/update/delete
- All address APIs
- All cart APIs
- All order APIs
- All rider profile APIs
- All rider delivery APIs

Address, cart, and order APIs are scoped to the authenticated user.

## 9. APIs That Require Specific Roles

Rider-only APIs:

- `GET /api/rider/profile`
- `POST /api/rider/profile`
- `PUT /api/rider/profile`
- `PUT /api/rider/availability`
- `GET /api/rider/deliveries`
- `GET /api/rider/deliveries/{delivery}`
- `POST /api/rider/deliveries/{delivery}/accept`
- `POST /api/rider/deliveries/{delivery}/pickup`
- `POST /api/rider/deliveries/{delivery}/start`
- `POST /api/rider/deliveries/{delivery}/deliver`

Restaurant/admin API:

- `POST /api/orders/{order}/assign-rider`

Current backend caveat:

- Restaurant/category/food write APIs require authentication, but do not currently enforce a specific role.
- Public registration does not allow users to create an `admin` account.
