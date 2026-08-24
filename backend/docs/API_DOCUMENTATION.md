# API Documentation

This document currently covers only the authentication endpoints.

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
