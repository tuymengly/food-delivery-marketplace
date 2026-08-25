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
- `POST /orders/{order}/assign-rider` requires role `restaurant` or `admin`.

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

- `pending`
- `confirmed`
- `preparing`
- `ready`
- `delivering`
- `delivered`
- `cancelled`

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

- Only `pending` and `confirmed` orders can be cancelled.
- If the order delivery is `pending` or `assigned`, the delivery is cancelled.
- If an assigned rider exists, that rider is made available again.

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

- Rider must be `active`.
- Rider must be available.
- Order cannot be `delivered` or `cancelled`.
- Delivery must be `pending` or `assigned`.
- Sets delivery status to `assigned`.
- Sets rider `is_available` to `false`.

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
order created -> pending
assign rider -> assigned
accept -> assigned
pickup -> picked_up
start -> delivering
deliver -> delivered
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

## Recommended Manual Test Flow

1. Register customer: `POST /register`
2. Login customer: `POST /login`; save `data.token` as `{{token}}`
3. Get current user: `GET /user`
4. Browse public restaurants, categories, and foods
5. Create address: `POST /addresses`
6. Add food to cart: `POST /cart/items`
7. Review cart: `GET /cart`
8. Create order: `POST /orders`
9. Register/login rider
10. Create rider profile: `POST /rider/profile`
11. Login as restaurant user
12. Assign rider: `POST /orders/{order}/assign-rider`
13. Login as rider again
14. List rider deliveries: `GET /rider/deliveries`
15. Accept delivery
16. Pick up delivery
17. Start delivery
18. Complete delivery

## Endpoint Count

This document covers all 44 routes currently registered by `php artisan route:list --path=api`.
