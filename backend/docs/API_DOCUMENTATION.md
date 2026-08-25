# API Documentation

This document covers the authentication and marketplace foundation endpoints.

Base URL: `/api`

## Register

Method: `POST`

URL: `/api/register`

Authentication required: No

Request body:

```json
{
  "name": "Test Customer",
  "email": "customer@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "customer"
}
```

Notes:

- `role` is optional.
- Allowed public registration roles are `customer`, `restaurant`, and `rider`.
- If `role` is not sent, it defaults to `customer`.
- Users cannot register themselves as `admin`.

Example success response, `201`:

```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@example.com",
      "role": "customer",
      "created_at": "2026-08-24T16:31:00.000000Z",
      "updated_at": "2026-08-24T16:31:00.000000Z"
    },
    "token": "1|example-token",
    "token_type": "Bearer"
  }
}
```

Possible errors:

- `422` validation error when required fields are missing, email is already used, passwords do not match, or role is invalid.

Example error response:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": [
      "The email has already been taken."
    ]
  }
}
```

## Login

Method: `POST`

URL: `/api/login`

Authentication required: No

Request body:

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

Example success response, `200`:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@example.com",
      "role": "customer",
      "created_at": "2026-08-24T16:31:00.000000Z",
      "updated_at": "2026-08-24T16:31:00.000000Z"
    },
    "token": "1|example-token",
    "token_type": "Bearer"
  }
}
```

Possible errors:

- `422` validation error when email or password is missing.
- `401` when the email or password is incorrect.

Example invalid credentials response:

```json
{
  "success": false,
  "message": "Invalid email or password.",
  "errors": {
    "email": [
      "The provided credentials are incorrect."
    ]
  }
}
```

## Logout

Method: `POST`

URL: `/api/logout`

Authentication required: Yes, Sanctum bearer token

Headers:

```http
Authorization: Bearer 1|example-token
Accept: application/json
```

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.

## Restaurants

### List Restaurants

Method: `GET`

URL: `/api/restaurants`

Authentication required: No

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Restaurants retrieved successfully.",
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "name": "Market Kitchen",
      "description": "Fresh everyday meals.",
      "address": "12 Market Street",
      "phone": "012345678",
      "image": "restaurants/market-kitchen.jpg",
      "status": "active",
      "created_at": "2026-08-25T10:00:00.000000Z",
      "updated_at": "2026-08-25T10:00:00.000000Z",
      "user": {
        "id": 2,
        "name": "Restaurant Owner",
        "email": "owner@example.com",
        "role": "restaurant"
      }
    }
  ]
}
```

### Show Restaurant

Method: `GET`

URL: `/api/restaurants/{id}`

Authentication required: No

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Restaurant retrieved successfully.",
  "data": {
    "id": 1,
    "user_id": 2,
    "name": "Market Kitchen",
    "description": "Fresh everyday meals.",
    "address": "12 Market Street",
    "phone": "012345678",
    "image": "restaurants/market-kitchen.jpg",
    "status": "active",
    "foods": []
  }
}
```

Possible errors:

- `404` when the restaurant does not exist.

### Create Restaurant

Method: `POST`

URL: `/api/restaurants`

Authentication required: Yes, Sanctum bearer token

Request body:

```json
{
  "name": "Market Kitchen",
  "description": "Fresh everyday meals.",
  "address": "12 Market Street",
  "phone": "012345678",
  "image": "restaurants/market-kitchen.jpg",
  "status": "active"
}
```

Example success response, `201`:

```json
{
  "success": true,
  "message": "Restaurant created successfully.",
  "data": {
    "id": 1,
    "user_id": 2,
    "name": "Market Kitchen",
    "status": "active"
  }
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `422` when `name`, `address`, or `phone` is missing, or `status` is not `active` or `inactive`.

### Update Restaurant

Method: `PUT`

URL: `/api/restaurants/{id}`

Authentication required: Yes, Sanctum bearer token

Request body: Same fields as create restaurant.

Example success response, `200`:

```json
{
  "success": true,
  "message": "Restaurant updated successfully.",
  "data": {
    "id": 1,
    "name": "Updated Market Kitchen",
    "status": "inactive"
  }
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `404` when the restaurant does not exist.
- `422` when required fields are missing or status is invalid.

### Delete Restaurant

Method: `DELETE`

URL: `/api/restaurants/{id}`

Authentication required: Yes, Sanctum bearer token

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Restaurant deleted successfully.",
  "data": null
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `404` when the restaurant does not exist.

## Categories

### List Categories

Method: `GET`

URL: `/api/categories`

Authentication required: No

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Categories retrieved successfully.",
  "data": [
    {
      "id": 1,
      "name": "Rice",
      "description": "Rice dishes.",
      "created_at": "2026-08-25T10:00:00.000000Z",
      "updated_at": "2026-08-25T10:00:00.000000Z"
    }
  ]
}
```

### Show Category

Method: `GET`

URL: `/api/categories/{id}`

Authentication required: No

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Category retrieved successfully.",
  "data": {
    "id": 1,
    "name": "Rice",
    "description": "Rice dishes.",
    "foods": []
  }
}
```

Possible errors:

- `404` when the category does not exist.

### Create Category

Method: `POST`

URL: `/api/categories`

Authentication required: Yes, Sanctum bearer token

Request body:

```json
{
  "name": "Rice",
  "description": "Rice dishes."
}
```

Example success response, `201`:

```json
{
  "success": true,
  "message": "Category created successfully.",
  "data": {
    "id": 1,
    "name": "Rice",
    "description": "Rice dishes."
  }
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `422` when `name` is missing.

### Update Category

Method: `PUT`

URL: `/api/categories/{id}`

Authentication required: Yes, Sanctum bearer token

Request body: Same fields as create category.

Example success response, `200`:

```json
{
  "success": true,
  "message": "Category updated successfully.",
  "data": {
    "id": 1,
    "name": "Noodles",
    "description": "Noodle bowls and soups."
  }
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `404` when the category does not exist.
- `422` when `name` is missing.

### Delete Category

Method: `DELETE`

URL: `/api/categories/{id}`

Authentication required: Yes, Sanctum bearer token

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Category deleted successfully.",
  "data": null
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `404` when the category does not exist.
- Delete may fail if food items still reference the category.

## Foods

### List Foods

Method: `GET`

URL: `/api/foods`

Authentication required: No

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Foods retrieved successfully.",
  "data": [
    {
      "id": 1,
      "restaurant_id": 1,
      "category_id": 1,
      "name": "Chicken Rice",
      "description": "Steamed chicken with rice.",
      "price": "4.50",
      "image": null,
      "status": "available",
      "restaurant": {
        "id": 1,
        "name": "Market Kitchen"
      },
      "category": {
        "id": 1,
        "name": "Rice"
      }
    }
  ]
}
```

### Show Food

Method: `GET`

URL: `/api/foods/{id}`

Authentication required: No

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Food retrieved successfully.",
  "data": {
    "id": 1,
    "restaurant_id": 1,
    "category_id": 1,
    "name": "Chicken Rice",
    "description": "Steamed chicken with rice.",
    "price": "4.50",
    "status": "available"
  }
}
```

Possible errors:

- `404` when the food item does not exist.

### Create Food

Method: `POST`

URL: `/api/foods`

Authentication required: Yes, Sanctum bearer token

Request body:

```json
{
  "restaurant_id": 1,
  "category_id": 1,
  "name": "Chicken Rice",
  "description": "Steamed chicken with rice.",
  "price": 4.5,
  "image": null,
  "status": "available"
}
```

Example success response, `201`:

```json
{
  "success": true,
  "message": "Food created successfully.",
  "data": {
    "id": 1,
    "restaurant_id": 1,
    "category_id": 1,
    "name": "Chicken Rice",
    "price": "4.50",
    "status": "available"
  }
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `422` when `restaurant_id`, `category_id`, `name`, or `price` is missing.
- `422` when `restaurant_id` or `category_id` does not exist.
- `422` when `price` is not numeric or is less than `0`.
- `422` when `status` is not `available` or `unavailable`.

### Update Food

Method: `PUT`

URL: `/api/foods/{id}`

Authentication required: Yes, Sanctum bearer token

Request body: Same fields as create food.

Example success response, `200`:

```json
{
  "success": true,
  "message": "Food updated successfully.",
  "data": {
    "id": 1,
    "name": "Chicken Rice Special",
    "price": "5.00",
    "status": "available"
  }
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `404` when the food item does not exist.
- `422` for missing fields, invalid foreign keys, invalid price, or invalid status.

### Delete Food

Method: `DELETE`

URL: `/api/foods/{id}`

Authentication required: Yes, Sanctum bearer token

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Food deleted successfully.",
  "data": null
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
- `404` when the food item does not exist.

## Authenticated User

Method: `GET`

URL: `/api/user`

Authentication required: Yes, Sanctum bearer token

Headers:

```http
Authorization: Bearer 1|example-token
Accept: application/json
```

Request body: None

Example success response, `200`:

```json
{
  "success": true,
  "message": "Authenticated user retrieved successfully.",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@example.com",
      "role": "customer",
      "created_at": "2026-08-24T16:31:00.000000Z",
      "updated_at": "2026-08-24T16:31:00.000000Z"
    }
  }
}
```

Possible errors:

- `401` when the bearer token is missing or invalid.
