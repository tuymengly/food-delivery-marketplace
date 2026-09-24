# Food Delivery Marketplace API Documentation

Professional frontend handoff for the Laravel 12 backend.

Base URL:

```text
http://127.0.0.1:8000/api
```

Postman variables:

```text
{{base_url}} = http://127.0.0.1:8000/api
{{token}} = Sanctum bearer token returned by login/register
```

Authenticated requests use:

```http
Authorization: Bearer {{token}}
Accept: application/json
Content-Type: application/json
```

Success responses generally use:

```json
{
  "success": true,
  "message": "Message text.",
  "data": {}
}
```

Validation errors generally use:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "field": ["The field is required."]
  }
}
```

## Access Summary

Public endpoints:

- `POST /register`
- `POST /login`
- `GET /restaurants`
- `GET /restaurants/{restaurant}`
- `GET /categories`
- `GET /categories/{category}`
- `GET /foods`
- `GET /foods/{food}`

Authenticated endpoints without a specific role check in the current backend:

- `POST /logout`
- `GET /user`
- Restaurant create/update/delete
- Category create/update/delete
- Food create/update/delete
- Address endpoints
- Cart endpoints
- Customer order endpoints

Role-specific endpoints:

- Rider profile and rider delivery endpoints require role `rider`.
- `POST /orders/{order}/assign-rider` requires role `restaurant` or `admin`, and the order must already be READY_FOR_PICKUP.
- Transforming an order (Accept/Preparing/Ready/Reject) uses `PATCH /restaurant/orders/{id}/status` with role `restaurant_owner` or `admin`.

Important implementation notes:

- Public registration allows `customer`, `restaurant`, and `rider`.
- Public registration rejects `admin`.
- Restaurant, category, and food write endpoints require a token, but currently do not enforce ownership or a specific role.
- Addresses, cart items, and customer orders are scoped to the authenticated user.
- Rider deliveries are scoped to the authenticated user's rider profile.

## Authentication

### Register

Method: `POST`

URL: `/register`

Authentication: No

Required role: None

Request body:

```json
{
  "name": "Test Customer",
  "email": "customer@example.com",
  "password": "{{auth_password}}",
  "password_confirmation": "{{auth_password}}",
  "role": "customer"
}
```

Required fields:

- `name`: string, max 255
- `email`: valid email, unique, max 255
- `password`: string, min 8, confirmed
- `password_confirmation`: must match `password`

Optional fields:

- `role`: `customer`, `restaurant`, or `rider`; defaults to `customer`

Example response, `201`:

```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@example.com",
      "role": "customer"
    },
    "token": "1|example-token",
    "token_type": "Bearer"
  }
}
```

Important errors:

- `422` validation error for missing fields, duplicate email, password mismatch, invalid role, or attempted `admin` registration.

### Login

Method: `POST`

URL: `/login`

Authentication: No

Required role: None

Request body:

```json
{
  "email": "customer@example.com",
  "password": "{{auth_password}}"
}
```

Required fields:

- `email`: valid email
- `password`: string

Example response, `200`:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@example.com",
      "role": "customer"
    },
    "token": "1|example-token",
    "token_type": "Bearer"
  }
}
```

Important errors:

- `422` validation error.
- `401` invalid email or password.

### Get Current User

Method: `GET`

URL: `/user`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Authenticated user retrieved successfully.",
  "data": {
    "user": {
      "id": 1,
      "name": "Test Customer",
      "email": "customer@example.com",
      "role": "customer"
    }
  }
}
```

Important errors:

- `401` missing or invalid token.

### Logout

Method: `POST`

URL: `/logout`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null
}
```

Important errors:

- `401` missing or invalid token.

## Restaurants

### List Restaurants

Method: `GET`

URL: `/restaurants`

Authentication: No

Required role: None

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Restaurants retrieved successfully.",
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "name": "City Bites",
      "description": "Simple local food.",
      "address": "100 Main Road",
      "phone": "012345678",
      "image": null,
      "status": "active",
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

URL: `/restaurants/{restaurant}`

Authentication: No

Required role: None

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Restaurant retrieved successfully.",
  "data": {
    "id": 1,
    "name": "City Bites",
    "status": "active",
    "foods": []
  }
}
```

Important errors:

- `404` restaurant not found.

### Create Restaurant

Method: `POST`

URL: `/restaurants`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body:

```json
{
  "name": "City Bites",
  "description": "Simple local food.",
  "address": "100 Main Road",
  "phone": "012345678",
  "image": null,
  "status": "active"
}
```

Required fields:

- `name`: string, max 255
- `address`: string, max 255
- `phone`: string, max 50

Optional fields:

- `description`: string or null
- `image`: string or null, max 255
- `status`: `active` or `inactive`
- `latitude`: numeric (-90 to 90) or null - used by RiderMatchingService to find the nearest rider
- `longitude`: numeric (-180 to 180) or null

Example response, `201`:

```json
{
  "success": true,
  "message": "Restaurant created successfully.",
  "data": {
    "id": 1,
    "user_id": 2,
    "name": "City Bites",
    "status": "active"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `422` validation error.

### Update Restaurant

Method: `PUT`

URL: `/restaurants/{restaurant}`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body: Same as create restaurant.

Required fields: `name`, `address`, `phone`

Example response, `200`:

```json
{
  "success": true,
  "message": "Restaurant updated successfully.",
  "data": {
    "id": 1,
    "name": "Updated City Bites",
    "status": "inactive"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` restaurant not found.
- `422` validation error.

### Delete Restaurant

Method: `DELETE`

URL: `/restaurants/{restaurant}`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Restaurant deleted successfully.",
  "data": null
}
```

Important errors:

- `401` missing or invalid token.
- `404` restaurant not found.

## Categories

### List Categories

Method: `GET`

URL: `/categories`

Authentication: No

Required role: None

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Categories retrieved successfully.",
  "data": [
    {
      "id": 1,
      "name": "Rice",
      "description": "Rice dishes."
    }
  ]
}
```

### Show Category

Method: `GET`

URL: `/categories/{category}`

Authentication: No

Required role: None

Request body: None

Example response, `200`:

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

Important errors:

- `404` category not found.

### Create Category

Method: `POST`

URL: `/categories`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body:

```json
{
  "name": "Rice",
  "description": "Rice dishes."
}
```

Required fields:

- `name`: string, max 255

Optional fields:

- `description`: string or null

Example response, `201`:

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

Important errors:

- `401` missing or invalid token.
- `422` validation error.

### Update Category

Method: `PUT`

URL: `/categories/{category}`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body: Same as create category.

Required fields: `name`

Example response, `200`:

```json
{
  "success": true,
  "message": "Category updated successfully.",
  "data": {
    "id": 1,
    "name": "Noodles",
    "description": "Noodle bowls."
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` category not found.
- `422` validation error.

### Delete Category

Method: `DELETE`

URL: `/categories/{category}`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Category deleted successfully.",
  "data": null
}
```

Important errors:

- `401` missing or invalid token.
- `404` category not found.

## Foods

### List Foods

Method: `GET`

URL: `/foods`

Authentication: No

Required role: None

Request body: None

Example response, `200`:

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
        "name": "City Bites"
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

URL: `/foods/{food}`

Authentication: No

Required role: None

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Food retrieved successfully.",
  "data": {
    "id": 1,
    "name": "Chicken Rice",
    "price": "4.50",
    "status": "available",
    "restaurant": {},
    "category": {}
  }
}
```

Important errors:

- `404` food not found.

### Create Food

Method: `POST`

URL: `/foods`

Authentication: Yes

Required role: Any authenticated user in the current backend

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

Required fields:

- `restaurant_id`: integer, existing restaurant
- `category_id`: integer, existing category
- `name`: string, max 255
- `price`: numeric, minimum 0

Optional fields:

- `description`: string or null
- `image`: string or null, max 255
- `status`: `available` or `unavailable`

Example response, `201`:

```json
{
  "success": true,
  "message": "Food created successfully.",
  "data": {
    "id": 1,
    "name": "Chicken Rice",
    "price": "4.50",
    "status": "available",
    "restaurant": {},
    "category": {}
  }
}
```

Important errors:

- `401` missing or invalid token.
- `422` validation error.

### Update Food

Method: `PUT`

URL: `/foods/{food}`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body: Same as create food.

Required fields: `restaurant_id`, `category_id`, `name`, `price`

Example response, `200`:

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

Important errors:

- `401` missing or invalid token.
- `404` food not found.
- `422` validation error.

### Delete Food

Method: `DELETE`

URL: `/foods/{food}`

Authentication: Yes

Required role: Any authenticated user in the current backend

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Food deleted successfully.",
  "data": null
}
```

Important errors:

- `401` missing or invalid token.
- `404` food not found.

## Addresses

All address endpoints require authentication. Users can only access their own addresses.

### List Addresses

Method: `GET`

URL: `/addresses`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Addresses retrieved successfully.",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "label": "Home",
      "recipient_name": "Test Customer",
      "phone": "012345678",
      "address": "100 Main Road",
      "latitude": "11.5564000",
      "longitude": "104.9282000",
      "is_default": true
    }
  ]
}
```

Important errors:

- `401` missing or invalid token.

### Create Address

Method: `POST`

URL: `/addresses`

Authentication: Yes

Required role: Any authenticated user

Request body:

```json
{
  "label": "Home",
  "recipient_name": "Test Customer",
  "phone": "012345678",
  "address": "100 Main Road",
  "latitude": 11.5564,
  "longitude": 104.9282,
  "is_default": true
}
```

Required fields:

- `label`: string, max 255
- `recipient_name`: string, max 255
- `phone`: string, max 50
- `address`: string

Optional fields:

- `latitude`: numeric or null
- `longitude`: numeric or null
- `is_default`: boolean

Example response, `201`:

```json
{
  "success": true,
  "message": "Address created successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "label": "Home",
    "recipient_name": "Test Customer",
    "phone": "012345678",
    "address": "100 Main Road",
    "is_default": true
  }
}
```

Important errors:

- `401` missing or invalid token.
- `422` validation error.

### Show Address

Method: `GET`

URL: `/addresses/{address}`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Address retrieved successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "label": "Home"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` address not found or belongs to another user.

### Update Address

Method: `PUT`

URL: `/addresses/{address}`

Authentication: Yes

Required role: Any authenticated user

Request body: Same as create address.

Required fields: `label`, `recipient_name`, `phone`, `address`

Example response, `200`:

```json
{
  "success": true,
  "message": "Address updated successfully.",
  "data": {
    "id": 1,
    "label": "Office",
    "is_default": false
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` address not found or belongs to another user.
- `422` validation error.

### Delete Address

Method: `DELETE`

URL: `/addresses/{address}`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Address deleted successfully.",
  "data": null
}
```

Important errors:

- `401` missing or invalid token.
- `404` address not found or belongs to another user.

## Cart

All cart endpoints require authentication. The backend creates a user's cart on first access.

### Get Cart

Method: `GET`

URL: `/cart`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Cart retrieved successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "items": [],
    "subtotal": "0.00"
  }
}
```

Important errors:

- `401` missing or invalid token.

### Add Cart Item

Method: `POST`

URL: `/cart/items`

Authentication: Yes

Required role: Any authenticated user

Request body:

```json
{
  "food_id": 1,
  "quantity": 2
}
```

Required fields:

- `food_id`: integer, existing record in table `food`
- `quantity`: integer, minimum 1

Example response, `201`:

```json
{
  "success": true,
  "message": "Cart item added successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "items": [
      {
        "id": 1,
        "food_id": 1,
        "quantity": 2,
        "food": {
          "id": 1,
          "name": "Chicken Rice",
          "price": "4.50",
          "status": "available"
        }
      }
    ],
    "subtotal": "9.00"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `422` validation error.
- `422` unavailable food cannot be added.

### Update Cart Item

Method: `PUT`

URL: `/cart/items/{cartItem}`

Authentication: Yes

Required role: Any authenticated user

Request body:

```json
{
  "quantity": 3
}
```

Required fields:

- `quantity`: integer, minimum 1

Example response, `200`:

```json
{
  "success": true,
  "message": "Cart item updated successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "subtotal": "13.50"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` cart item not found or belongs to another user's cart.
- `422` validation error.

### Remove Cart Item

Method: `DELETE`

URL: `/cart/items/{cartItem}`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Cart item removed successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "items": [],
    "subtotal": "0.00"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` cart item not found or belongs to another user's cart.

### Clear Cart

Method: `DELETE`

URL: `/cart`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Cart cleared successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "items": [],
    "subtotal": "0.00"
  }
}
```

Important errors:

- `401` missing or invalid token.

## Orders

Order list, create, show, and cancel endpoints require authentication and are scoped to the authenticated user's own orders.

Order statuses:

- `pending` - PENDING_RESTAURANT: placed (and, for KHQR, paid) and waiting for the restaurant to accept or reject
- `accepted` - legacy intermediate state; the restaurant's Accept now writes `preparing` directly
- `preparing` - PREPARING: the restaurant accepted and is cooking
- `ready` - READY_FOR_PICKUP: food is ready; this is the only state a rider may be assigned in
- `delivering` - picked up and on the way to the customer
- `delivered`
- `completed`
- `cancelled` - REJECTED (by the restaurant) or cancelled (by the customer/admin)

Rider assignment is tracked separately on the delivery (`deliveries.status` = `assigned` = RIDER_ASSIGNED), so an order can be `ready` while `delivery_status` is already `assigned`.

### List Orders

Method: `GET`

URL: `/orders`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Orders retrieved successfully.",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "address_id": 1,
      "status": "pending",
      "subtotal": "9.00",
      "delivery_fee": "1.50",
      "total": "10.50"
    }
  ]
}
```

Important errors:

- `401` missing or invalid token.

### Create Order

Method: `POST`

URL: `/orders`

Authentication: Yes

Required role: Any authenticated user

Request body:

```json
{
  "address_id": 1
}
```

Required fields:

- `address_id`: integer, existing address owned by the authenticated user

Notes:

- Uses the authenticated user's current cart.
- Cart must not be empty.
- Food items must have status `available`.
- Fixed delivery fee is `1.50`.
- Creates a delivery record with status `pending`.
- Clears cart items after order creation.

Example response, `201`:

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "id": 1,
    "user_id": 1,
    "address_id": 1,
    "status": "pending",
    "subtotal": "9.00",
    "delivery_fee": "1.50",
    "total": "10.50",
    "address": {},
    "items": [],
    "delivery": {
      "id": 1,
      "order_id": 1,
      "rider_id": null,
      "status": "pending",
      "picked_up_at": null,
      "delivered_at": null
    }
  }
}
```

Important errors:

- `401` missing or invalid token.
- `422` validation error.
- `422` address belongs to another user.
- `422` cart is empty.
- `422` cart contains unavailable food.

### Show Order

Method: `GET`

URL: `/orders/{order}`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Order retrieved successfully.",
  "data": {
    "id": 1,
    "status": "pending",
    "address": {},
    "items": [],
    "delivery": {}
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` order not found or belongs to another user.

### Cancel Order

Method: `POST`

URL: `/orders/{order}/cancel`

Authentication: Yes

Required role: Any authenticated user

Request body: None

Notes:

- Only `pending`, `accepted`, `preparing` or `ready` orders can be cancelled.
- If the order delivery is `pending` or `assigned`, the delivery is cancelled.
- If an assigned rider exists, that rider is made available again.
- No rider is ever assigned to a cancelled order, and the customer's payment record is left untouched for the refund follow-up.

Example response, `200`:

```json
{
  "success": true,
  "message": "Order cancelled successfully.",
  "data": {
    "id": 1,
    "status": "cancelled",
    "delivery": {
      "status": "cancelled"
    }
  }
}
```

Important errors:

- `401` missing or invalid token.
- `404` order not found or belongs to another user.
- `422` order cannot be cancelled.

### Assign Rider

Method: `POST`

URL: `/orders/{order}/assign-rider`

Authentication: Yes

Required role: `restaurant` or `admin`

Request body:

```json
{
  "rider_id": 1
}
```

Required fields:

- `rider_id`: integer, existing rider profile

Notes:

- The order must be `ready`/READY_FOR_PICKUP first - restaurant acceptance and preparation come before any rider assignment, so this endpoint rejects an order that is still `pending`, `accepted` or `preparing` with a `422` (`status` validation error).
- Rider must be `active`.
- Rider must be eligible exactly like automatic matching: online, available, and with a location fix no older than 5 minutes (`422` `rider_id` otherwise). Skipping a busy rider is intentional - they must finish their current delivery first.
- The order must not already have a rider (`422` `rider_id`) - this is what prevents two riders being attached to the same order.
- Sets delivery status to `assigned`.
- Sets rider `is_available` to `false` and notifies that rider.
- `orders.status` is left at `ready`; the assignment lives on the delivery.
- Assigning automatically happens anyway when the restaurant marks the order ready; this endpoint only exists for an admin manually overriding the choice. A customer can never call it (`403`).

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider assigned successfully.",
  "data": {
    "id": 1,
    "status": "pending",
    "delivery": {
      "id": 1,
      "order_id": 1,
      "rider_id": 1,
      "status": "assigned",
      "rider": {
        "id": 1,
        "vehicle_type": "motorcycle",
        "status": "active",
        "is_available": false
      }
    }
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `restaurant` or `admin`.
- `422` validation error.
- `422` rider inactive, suspended, or unavailable.
- `422` order cannot be assigned.

## Rider

Rider profile endpoints require authentication and role `rider`.

Rider statuses:

- `active`
- `inactive`
- `suspended`

Vehicle types:

- `bicycle`
- `motorcycle`
- `car`

### Get Rider Profile

Method: `GET`

URL: `/rider/profile`

Authentication: Yes

Required role: `rider`

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider profile retrieved successfully.",
  "data": {
    "id": 1,
    "user_id": 3,
    "vehicle_type": "motorcycle",
    "vehicle_number": "PP-1234",
    "phone": "012345678",
    "status": "active",
    "is_available": true
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile not found.

### Create Rider Profile

Method: `POST`

URL: `/rider/profile`

Authentication: Yes

Required role: `rider`

Request body:

```json
{
  "vehicle_type": "motorcycle",
  "vehicle_number": "PP-1234",
  "phone": "012345678",
  "status": "active",
  "is_available": true
}
```

Required fields:

- `vehicle_type`: `bicycle`, `motorcycle`, or `car`
- `vehicle_number`: string, max 50
- `phone`: string, max 50

Optional fields:

- `status`: `active`, `inactive`, or `suspended`
- `is_available`: boolean

Example response, `201`:

```json
{
  "success": true,
  "message": "Rider profile created successfully.",
  "data": {
    "id": 1,
    "user_id": 3,
    "vehicle_type": "motorcycle",
    "vehicle_number": "PP-1234",
    "phone": "012345678",
    "status": "active",
    "is_available": true
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `422` validation error.
- `422` rider profile already exists.

### Update Rider Profile

Method: `PUT`

URL: `/rider/profile`

Authentication: Yes

Required role: `rider`

Request body: Same as create rider profile.

Required fields: `vehicle_type`, `vehicle_number`, `phone`

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider profile updated successfully.",
  "data": {
    "id": 1,
    "vehicle_type": "car",
    "vehicle_number": "CAR-7788",
    "phone": "098765432",
    "status": "active",
    "is_available": true
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile not found.
- `422` validation error.

### Update Rider Availability

Method: `PUT`

URL: `/rider/availability`

Authentication: Yes

Required role: `rider`

Request body:

```json
{
  "is_available": false
}
```

Required fields:

- `is_available`: boolean

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider availability updated successfully.",
  "data": {
    "id": 1,
    "is_available": false
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile not found.
- `422` validation error.

Side effect: if this call sets `is_available` to `true`, Laravel immediately retries matching this rider against any delivery still waiting for a rider (see "Automatic rider assignment" below) - a nearby waiting order can be assigned in the same request/response cycle that flips this flag.

### Update Rider Location

Method: `PUT`

URL: `/rider/location`

Authentication: Yes

Required role: `rider`

Request body:

```json
{
  "latitude": 11.5600,
  "longitude": 104.9200
}
```

Required fields:

- `latitude`: numeric, -90 to 90
- `longitude`: numeric, -180 to 180

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider location updated successfully.",
  "data": {
    "id": 1,
    "current_latitude": "11.5600000",
    "current_longitude": "104.9200000",
    "location_updated_at": "2026-09-23T09:00:00.000000Z"
  }
}
```

This updates the rider's single current-location row in place (`riders.current_latitude/current_longitude/location_updated_at`) - it does not create a location history table. A rider's location is only considered "fresh" for matching purposes for 5 minutes after this call (see `RiderMatchingService::ONLINE_STALE_AFTER_MINUTES`); the frontend should call this endpoint periodically (every ~20 seconds) while the rider is online.

Side effect: if this rider is otherwise eligible (online, available, active), Laravel retries matching them against any delivery still waiting for a rider.

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile not found.
- `422` validation error.

### Update Rider Online Status

Method: `PUT`

URL: `/rider/online-status`

Authentication: Yes

Required role: `rider`

Request body:

```json
{
  "is_online": true
}
```

Required fields:

- `is_online`: boolean

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider online status updated successfully.",
  "data": {
    "id": 1,
    "is_online": true
  }
}
```

Side effect: same retry as above when this turns the rider online while they are otherwise eligible.

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile not found.
- `422` validation error.

## Automatic Rider Assignment

`App\Services\RiderMatchingService` decides which rider gets a delivery - the frontend never chooses a rider directly, and nothing about the decision (identity, ordering, device, port) can come from the browser or from `localStorage`.

### Order lifecycle this service enforces

```text
customer places order -> payment confirmed -> orders.status = pending       (PENDING_RESTAURANT)
restaurant accepts                          -> orders.status = preparing      (straight from Accept)
restaurant finishes                         -> orders.status = ready          (READY_FOR_PICKUP)
nearest eligible rider matched              -> deliveries.status = assigned   (RIDER_ASSIGNED)
rider confirms pickup                       -> orders.status = delivering     (PICKED_UP -> DELIVERING)
rider completes                             -> orders.status = delivered      (DELIVERED)

failure path: pending/accepted/preparing -> cancelled  (REJECTED - never a rider)
```

`orders.status` stays `ready` after a rider is assigned; the assignment itself lives on `deliveries.status`. That is why the rider dashboard and the restaurant order list both read `delivery_status` / `rider` in addition to `status`.

### When assignment runs

Assignment runs in exactly one place - the moment the restaurant marks an order `ready`/`READY_FOR_PICKUP` (the `PATCH /restaurant/orders/{id}/status` call). Before that point no rider is matched, no rider is notified, and the order is invisible to every rider's dashboard.

If no rider is eligible, the order stays `ready` with an unassigned (`pending`) delivery. It is never assigned to an arbitrary rider. It is retried automatically the moment a rider's own eligibility improves (goes online, comes back available, reports a fresh location, or finishes a delivery - see the endpoints above and `PATCH /driver/orders/{id}/status`); there is no separate polling job. Riders can also claim it first-come-first-served from the open pool.

Eligible rider (all must be true):

- `role` = `rider`
- `riders.status` = `active`
- `riders.is_online` = `true`
- `riders.is_available` = `true` (busy riders are always skipped, even when closer)
- `riders.current_latitude`/`current_longitude` are set
- `riders.location_updated_at` is within the last 5 minutes (stale fixes are skipped)

Distance is the Haversine great-circle distance between the rider's current location and the restaurant - the pickup leg is what decides, with the rider's distance to the delivery address used only as a deterministic tie-breaker. Never string/address comparison. The eligible rider with the lowest pickup distance is assigned.

Assignment is safe under concurrency: the delivery row, the order row and the matched rider row are locked for the duration of the assigning transaction (`SELECT ... FOR UPDATE`) and re-checked after locking, so two orders racing for the same rider - or two riders claiming the same pool order - cannot both win. `deliveries.rider_id` is only ever written when it is still `null` and `deliveries.status` is still `pending`.

## Delivery

Delivery APIs currently exist as rider-facing endpoints. There is no general admin delivery list endpoint.

Delivery statuses:

- `pending`
- `assigned`
- `picked_up`
- `delivering`
- `delivered`
- `cancelled`

Implemented delivery flow:

```text
order created (PENDING_RESTAURANT) -> delivery pending
restaurant accepts + marks ready   -> delivery still pending (open pool)
nearest eligible rider matched     -> delivery assigned   (RIDER_ASSIGNED)
rider accept                       -> delivery assigned   (rider confirmed)
pickup                             -> delivery picked_up
start                              -> delivery delivering
deliver                            -> delivery delivered
restaurant rejects / cancel        -> delivery cancelled  (rider freed, never notified)
```

### List Rider Deliveries

Method: `GET`

URL: `/rider/deliveries`

Authentication: Yes

Required role: `rider`

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider deliveries retrieved successfully.",
  "data": [
    {
      "id": 1,
      "order_id": 1,
      "rider_id": 1,
      "status": "assigned",
      "picked_up_at": null,
      "delivered_at": null,
      "order": {
        "id": 1,
        "status": "pending",
        "address": {},
        "items": []
      }
    }
  ]
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile not found.

### Show Rider Delivery

Method: `GET`

URL: `/rider/deliveries/{delivery}`

Authentication: Yes

Required role: `rider`

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "message": "Rider delivery retrieved successfully.",
  "data": {
    "id": 1,
    "order_id": 1,
    "rider_id": 1,
    "status": "assigned",
    "order": {}
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile not found, delivery not found, or delivery assigned to another rider.

### Accept Delivery

Method: `POST`

URL: `/rider/deliveries/{delivery}/accept`

Authentication: Yes

Required role: `rider`

Request body: None

Notes:

- Only status `assigned` can be accepted.
- The order must be `ready`/READY_FOR_PICKUP - a delivery on an order that is still `pending`, `accepted` or `preparing` can never be accepted.
- Status remains `assigned`.

Example response, `200`:

```json
{
  "success": true,
  "message": "Delivery accepted successfully.",
  "data": {
    "id": 1,
    "status": "assigned"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile or assigned delivery not found.
- `422` invalid delivery status transition.

### Pick Up Delivery

Method: `POST`

URL: `/rider/deliveries/{delivery}/pickup`

Authentication: Yes

Required role: `rider`

Request body: None

Notes:

- Only status `assigned` can be picked up.
- Sets delivery status to `picked_up`.
- Sets `picked_up_at`.
- Sets order status to `preparing`.

Example response, `200`:

```json
{
  "success": true,
  "message": "Delivery picked up successfully.",
  "data": {
    "id": 1,
    "status": "picked_up",
    "picked_up_at": "2026-08-25T10:15:00.000000Z"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile or assigned delivery not found.
- `422` invalid delivery status transition.

### Start Delivery

Method: `POST`

URL: `/rider/deliveries/{delivery}/start`

Authentication: Yes

Required role: `rider`

Request body: None

Notes:

- Only status `picked_up` can be started.
- Sets delivery status to `delivering`.
- Sets order status to `delivering`.

Example response, `200`:

```json
{
  "success": true,
  "message": "Delivery started successfully.",
  "data": {
    "id": 1,
    "status": "delivering"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile or assigned delivery not found.
- `422` invalid delivery status transition.

### Complete Delivery

Method: `POST`

URL: `/rider/deliveries/{delivery}/deliver`

Authentication: Yes

Required role: `rider`

Request body: None

Notes:

- Only status `delivering` can be completed.
- Sets delivery status to `delivered`.
- Sets `delivered_at`.
- Sets order status to `delivered`.
- Sets rider `is_available` to `true`.

Example response, `200`:

```json
{
  "success": true,
  "message": "Delivery completed successfully.",
  "data": {
    "id": 1,
    "status": "delivered",
    "delivered_at": "2026-08-25T10:35:00.000000Z"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`.
- `404` rider profile or assigned delivery not found.
- `422` invalid delivery status transition.

## Driver (Pool-Claim Endpoints)

The admin-restaurant rider dashboard UI calls these two endpoints, not the `Rider`/`Delivery` endpoints above directly. Only orders the restaurant has already accepted, prepared and marked `ready`/`READY_FOR_PICKUP` that `RiderMatchingService` could not auto-assign (see "Automatic Rider Assignment") show up here as an open request any online, approved rider can claim first-come-first-served; an order still with the restaurant (pending/preparing) never appears, and a delivery already auto-assigned shows up as that specific rider's `active_order` instead. Claiming is safe under concurrency the same way automatic assignment is (locked, re-checked inside a transaction) - two riders tapping "Accept" on the same order cannot both win it.

### List Driver Orders

Method: `GET`

URL: `/driver/orders`

Authentication: Yes

Required role: `rider` (Driver/rider account, not pending admin approval)

Request body: None

Example response, `200`:

```json
{
  "success": true,
  "data": {
    "available_requests": [
      {
        "id": "#BR-0007",
        "real_id": 7,
        "price": "$12.50",
        "restaurant": "City Bites",
        "pickup": "100 Main Road",
        "restaurant_lat": 11.5564,
        "restaurant_lng": 104.9282,
        "dropoff_lat": 11.5625,
        "dropoff_lng": 104.916,
        "customer": "Jane Doe",
        "phone": "012345678",
        "dropoff": "22 Riverside Ave",
        "items": "Chicken Rice x 2",
        "time": "5 minutes ago",
        "status": "Pending",
        "delivery_status": "pending"
      }
    ],
    "active_order": null,
    "history": [],
    "summary": {
      "today_deliveries": 0,
      "today_earnings": "$0.00",
      "week_earnings": "$0.00",
      "month_earnings": "$0.00"
    }
  }
}
```

`restaurant_lat`/`restaurant_lng`/`dropoff_lat`/`dropoff_lng` are `null` when that restaurant or delivery address has no coordinates yet - the rider dashboard map only renders a marker/route when its coordinates are present.

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`, or the rider's account is still pending admin approval.

### Update Driver Order Status

Method: `PATCH` or `PUT`

URL: `/driver/orders/{id}/status`

Authentication: Yes

Required role: `rider` (approved)

Request body:

```json
{
  "status": "accepted"
}
```

Required fields:

- `status`: one of `accepted`, `picked_up`, `delivering`, `completed`, `delivered`, `cancelled`

`accepted` claims an open pool order (the order must currently be `ready`/READY_FOR_PICKUP with an unassigned/`pending` delivery) for the calling rider - claiming keeps `orders.status` at `ready`, only the delivery becomes `assigned`. Every other status requires the delivery already be assigned to the calling rider. `cancelled` releases an assigned-but-not-yet-picked-up delivery back to the open pool and frees the rider.

Example response, `200`:

```json
{
  "success": true,
  "message": "Driver order status updated successfully.",
  "data": {
    "id": "#BR-0007",
    "real_id": 7,
    "delivery_status": "assigned"
  }
}
```

Important errors:

- `401` missing or invalid token.
- `403` user role is not `rider`, rider pending approval, or delivery assigned to a different rider.
- `422` order already claimed by another rider, pickup order (no rider needed), or invalid status transition.

## Recommended Manual Test Flow

1. Register customer: `POST /register`
2. Login customer: `POST /login`; save `data.token` as `{{token}}`
3. Get current user: `GET /user`
4. Browse public restaurants, categories, and foods
5. Create address: `POST /addresses`
6. Add food to cart: `POST /cart/items`
7. Review cart: `GET /cart`
8. Create order: `POST /orders` (order is `pending`/PENDING_RESTAURANT; no rider yet)
9. Register/login rider, create rider profile: `POST /rider/profile`, come online: `PUT /rider/online-status`, push a location: `PUT /rider/location`
10. Login as restaurant user; confirm the order listing shows it: `GET /restaurant/orders`
11. Restaurant rejects: `PATCH /restaurant/orders/{id}/status` `{"status":"Cancelled"}` - the order is cancelled, the delivery is cancelled and no rider sees anything
12. For the happy path, instead: Accept `{"status":"Preparing"}` -> `{"status":"Ready"}`; the response's `assigned_rider_id` is the nearest eligible rider (or `null` when nobody is eligible - the order then stays `ready`)
13. Login as rider; the delivery appears as `data.active_order` (`GET /driver/orders`) or as their own `GET /rider/deliveries`
14. Accept delivery, pick up delivery, start delivery, complete delivery

## Endpoint Count

This document covers all 44 routes currently registered by `php artisan route:list --path=api`.
