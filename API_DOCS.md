# API Documentation — Instant Wellness Kits Backend

> **Base URL:** `http://localhost:8443`
>
> **Authentication:** All endpoints except `/api/auth/**` and OAuth2 flows require a valid JWT token with `ROLE_ADMIN`.
> Pass the token in the `Authorization` header: `Authorization: Bearer <token>`

---

## Table of Contents

1. [Authentication](#1-authentication)
   - [POST /api/auth/login](#post-apiauthlogin)
   - [OAuth2 Login (Google)](#oauth2-login-google)
2. [Orders — Custom Endpoints](#2-orders--custom-endpoints)
   - [POST /orders/import](#post-ordersimport)
   - [GET /orders/stats](#get-ordersstats)
3. [Orders — Spring Data REST (auto-generated CRUD)](#3-orders--spring-data-rest-auto-generated-crud)
   - [GET /orders](#get-orders)
   - [GET /orders/{id}](#get-ordersid)
   - [POST /orders](#post-orders)
   - [PUT /orders/{id}](#put-ordersid)
   - [PATCH /orders/{id}](#patch-ordersid)
   - [DELETE /orders/{id}](#delete-ordersid)
   - [GET /orders/search/findByTaxDetailsJurisdictionName](#get-orderssearchfindbytaxdetailsjurisdictionname)
4. [Users — Spring Data REST (auto-generated CRUD)](#4-users--spring-data-rest-auto-generated-crud)
   - [GET /users](#get-users)
   - [GET /users/{username}](#get-usersusername)
   - [POST /users](#post-users)
   - [PUT /users/{username}](#put-usersusername)
   - [PATCH /users/{username}](#patch-usersusername)
   - [DELETE /users/{username}](#delete-usersusername)
   - [GET /users/search/findByEmail](#get-userssearchfindbyemail)
5. [Jurisdictions — Admin Endpoints](#5-jurisdictions--admin-endpoints)
   - [POST /jurisdictions/import](#post-jurisdictionsimport)
   - [DELETE /jurisdictions/all](#delete-jurisdictionsall)
6. [Data Models](#6-data-models)

---

## 1. Authentication

### `POST /api/auth/login`

Authenticate with username & password and receive a JWT token.

**Auth required:** No

**Request Body** (`application/json`):

```json
{
  "username": "string",
  "password": "string"
}
```

**Response** `200 OK` (`application/json`):

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Invalid credentials |

---

### OAuth2 Login (Google)

Initiate a Google OAuth2 login flow. This is a browser-redirect flow, not a JSON API call.

**Auth required:** No

1. **Redirect the user to:** `GET /api/auth/login/oauth2/google`
2. Google consent screen is shown.
3. On success, the callback hits `/login/oauth2/code/google` internally.
4. The server responds with a JSON body containing the JWT:

**Response** (`application/json`):

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

> **Note:** The OAuth2 user must already exist in the `users` collection (matched by email), otherwise a `500` error is returned.

---

## 2. Orders — Custom Endpoints

### `POST /orders/import`

Bulk-import orders from a CSV file. Each order is geocoded to a tax jurisdiction, tax is calculated, and the results are saved to MongoDB. Returns import statistics and a result CSV (base64-encoded) with tax columns appended.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request:** `multipart/form-data`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `MultipartFile` | CSV file (max 50 MB) |

**Expected CSV format:**

```
id,longitude,latitude,timestamp,subtotal
order-001,-73.935242,40.730610,2025-11-04 10:17:04.915257248,49.99
```

**Response** `200 OK` (`application/json`):

```json
{
  "importedCount": 142,
  "unsupportedCount": 3,
  "unsupportedOrders": [
    {
      "id": "order-999",
      "longitude": -155.5,
      "latitude": 19.9,
      "timestamp": "2025-11-04 10:17:04.915257248",
      "subtotal": 29.99,
      "reason": "No jurisdiction found for coordinates (19.9, -155.5)"
    }
  ],
  "resultCsv": "aWQsbG9uZ2l0dWRlLGxhdGl0dWRlLHRpbWVzdGFtcCxzdWJ0b3RhbCx0YXgsdG90YWwK..."
}
```

> **`resultCsv`** is a Base64-encoded CSV string. Decoded, it has columns: `id,longitude,latitude,timestamp,subtotal,tax,total`

**Error responses:**

| Status | Description |
|--------|-------------|
| `401 Unauthorized` | Missing or invalid JWT |

---

### `GET /orders/stats`

Get aggregate statistics for all imported orders.

**Auth required:** Yes (`ROLE_ADMIN`)

**Response** `200 OK` (`application/json`):

```json
{
  "totalOrders": 1450,
  "totalRevenue": 72453.87,
  "totalTax": 5791.12
}
```

> `totalRevenue` is the sum of all `subtotal` fields. `totalTax` is the sum of all `taxDetails.taxAmount` fields.

---

## 3. Orders — Spring Data REST (auto-generated CRUD)

The `OrderRepository` is annotated with `@RepositoryRestResource(path = "orders")`, so Spring Data REST automatically exposes a full HAL+JSON CRUD API. An `OrderEventHandler` automatically calculates tax before create/save operations.

### `GET /orders`

List all orders (paginated).

**Auth required:** Yes (`ROLE_ADMIN`)

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | `0` | Page number (0-indexed) |
| `size` | int | `20` | Page size |
| `sort` | string | — | Sort field and direction, e.g. `subtotal,desc` |

**Response** `200 OK` (`application/hal+json`):

```json
{
  "_embedded": {
    "orders": [
      {
        "id": "order-001",
        "longitude": -73.935242,
        "latitude": 40.730610,
        "subtotal": 49.99,
        "wellnessType": "massage",
        "timestamp": "2025-11-04 10:17:04.915257248",
        "taxDetails": {
          "compositeTaxRate": 0.08875,
          "taxAmount": 4.44,
          "totalAmount": 54.43,
          "jurisdiction": {
            "id": "64a1...",
            "name": "New York",
            "code": "NEW_YORK",
            "breakdown": {
              "stateRate": 0.04,
              "countyRate": 0.045,
              "cityRate": 0.00375,
              "specialRate": 0.0
            }
          }
        },
        "_links": {
          "self": { "href": "http://localhost:8443/orders/order-001" },
          "order": { "href": "http://localhost:8443/orders/order-001" }
        }
      }
    ]
  },
  "_links": {
    "self": { "href": "http://localhost:8443/orders?page=0&size=20" },
    "profile": { "href": "http://localhost:8443/profile/orders" }
  },
  "page": {
    "size": 20,
    "totalElements": 1450,
    "totalPages": 73,
    "number": 0
  }
}
```

---

### `GET /orders/{id}`

Get a single order by ID.

**Auth required:** Yes (`ROLE_ADMIN`)

**Response** `200 OK` (`application/hal+json`):

```json
{
  "id": "order-001",
  "longitude": -73.935242,
  "latitude": 40.730610,
  "subtotal": 49.99,
  "wellnessType": "massage",
  "timestamp": "2025-11-04 10:17:04.915257248",
  "taxDetails": {
    "compositeTaxRate": 0.08875,
    "taxAmount": 4.44,
    "totalAmount": 54.43,
    "jurisdiction": {
      "id": "64a1...",
      "name": "New York",
      "code": "NEW_YORK",
      "breakdown": {
        "stateRate": 0.04,
        "countyRate": 0.045,
        "cityRate": 0.00375,
        "specialRate": 0.0
      }
    }
  },
  "_links": {
    "self": { "href": "http://localhost:8443/orders/order-001" },
    "order": { "href": "http://localhost:8443/orders/order-001" }
  }
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| `404 Not Found` | Order with given ID does not exist |

---

### `POST /orders`

Create a new order. Tax is automatically calculated via `OrderEventHandler` before saving.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request Body** (`application/json`):

```json
{
  "id": "order-new-001",
  "longitude": -73.935242,
  "latitude": 40.730610,
  "subtotal": 49.99,
  "wellnessType": "massage",
  "timestamp": "2025-11-04 10:17:04.915257248"
}
```

> `taxDetails` is **not** required in the request — it is calculated automatically based on the order's coordinates.

**Response** `201 Created` (`application/hal+json`): Same structure as `GET /orders/{id}` (with populated `taxDetails`).

**Error responses:**

| Status | Description |
|--------|-------------|
| `500 Internal Server Error` | Jurisdiction not found for the given coordinates |

---

### `PUT /orders/{id}`

Replace an existing order. Tax is recalculated.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request Body:** Same as `POST /orders`.

**Response** `200 OK`: Updated order (same structure as `GET /orders/{id}`).

---

### `PATCH /orders/{id}`

Partially update an existing order. Tax is recalculated if coordinates change.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request Body** (`application/json`): Any subset of order fields.

```json
{
  "subtotal": 59.99
}
```

**Response** `200 OK`: Updated order.

---

### `DELETE /orders/{id}`

Delete an order.

**Auth required:** Yes (`ROLE_ADMIN`)

**Response** `204 No Content`

---

### `GET /orders/search/findByTaxDetailsJurisdictionName`

Find an order by jurisdiction name.

**Auth required:** Yes (`ROLE_ADMIN`)

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `jurisdictionName` | string | Name of the jurisdiction to search for |

**Response** `200 OK` (`application/hal+json`): Single order (same structure as `GET /orders/{id}`).

---

## 4. Users — Spring Data REST (auto-generated CRUD)

The `UserRepository` is annotated with `@RepositoryRestResource(path = "users")`, exposing a HAL+JSON CRUD API.

### `GET /users`

List all users (paginated).

**Auth required:** Yes (`ROLE_ADMIN`)

**Response** `200 OK` (`application/hal+json`):

```json
{
  "_embedded": {
    "users": [
      {
        "username": "admin",
        "email": "admin@example.com",
        "_links": {
          "self": { "href": "http://localhost:8443/users/admin" },
          "user": { "href": "http://localhost:8443/users/admin" }
        }
      }
    ]
  },
  "page": {
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "number": 0
  }
}
```

> **Note:** The `password` field is **not** exposed in responses (Spring Data REST respects Jackson serialization; passwords are typically excluded or write-only).

---

### `GET /users/{username}`

Get a single user by username (which is the `@Id`).

**Auth required:** Yes (`ROLE_ADMIN`)

**Response** `200 OK`:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "_links": {
    "self": { "href": "http://localhost:8443/users/admin" },
    "user": { "href": "http://localhost:8443/users/admin" }
  }
}
```

---

### `POST /users`

Create a new user.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request Body** (`application/json`):

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "encoded-password-here"
}
```

> **Warning:** The password should be BCrypt-encoded before insertion, as the app uses `BCryptPasswordEncoder`.

**Response** `201 Created`: Created user resource.

---

### `PUT /users/{username}`

Replace a user.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request Body:** Same as `POST /users`.

**Response** `200 OK`

---

### `PATCH /users/{username}`

Partially update a user.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request Body** (`application/json`): Any subset of user fields.

**Response** `200 OK`

---

### `DELETE /users/{username}`

Delete a user.

**Auth required:** Yes (`ROLE_ADMIN`)

**Response** `204 No Content`

---

### `GET /users/search/findByEmail`

Find a user by email address.

**Auth required:** Yes (`ROLE_ADMIN`)

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | Email address to search for |

**Response** `200 OK` (`application/hal+json`): Single user resource.

---

## 5. Jurisdictions — Admin Endpoints

### `POST /jurisdictions/import`

Import tax jurisdictions from a semicolon-delimited CSV file.

**Auth required:** Yes (`ROLE_ADMIN`)

**Request:** `multipart/form-data`

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `MultipartFile` | Semicolon-delimited CSV file |

**Expected CSV format:**

```
county_name;state_rate;county_rate
New York;4%;4.5%
Los Angeles;7.25%;0.25%
```

> Rates can include `%` signs — they are parsed and converted to decimals (e.g. `4%` → `0.04`). `cityRate` and `specialRate` default to `0`.

**Response** `200 OK` (`text/plain`):

```
Successfully imported jurisdictions from CSV.
```

**Error responses:**

| Status | Body |
|--------|------|
| `400 Bad Request` | `"Please upload a valid CSV file."` |
| `500 Internal Server Error` | `"Failed to process the CSV file: <error message>"` |

---

### `DELETE /jurisdictions/all`

Delete all jurisdictions from the database.

**Auth required:** Yes (`ROLE_ADMIN`)

**Response** `200 OK` (`text/plain`):

```
All jurisdictions deleted.
```

---

## 6. Data Models

### Order

```json
{
  "id": "string",
  "longitude": 0.0,
  "latitude": 0.0,
  "subtotal": 0.0,
  "wellnessType": "string | null",
  "timestamp": "string",
  "taxDetails": { /* TaxDetails */ }
}
```

### TaxDetails

```json
{
  "compositeTaxRate": 0.0,
  "taxAmount": 0.0,
  "totalAmount": 0.0,
  "jurisdiction": { /* Jurisdiction */ }
}
```

### Jurisdiction

```json
{
  "id": "string",
  "name": "string",
  "code": "string",
  "breakdown": { /* Breakdown */ }
}
```

### Breakdown

```json
{
  "stateRate": 0.0,
  "countyRate": 0.0,
  "cityRate": 0.0,
  "specialRate": 0.0
}
```

> The **composite tax rate** is calculated as: `stateRate + countyRate + cityRate + specialRate`

### User

```json
{
  "username": "string",
  "email": "string",
  "password": "string (BCrypt-encoded, write-only)"
}
```

### LoginRequest

```json
{
  "username": "string",
  "password": "string"
}
```

### LoginResponse

```json
{
  "token": "string (JWT)"
}
```

### ImportResponse (POST /orders/import)

```json
{
  "importedCount": 0,
  "unsupportedCount": 0,
  "unsupportedOrders": [ /* UnsupportedOrder[] */ ],
  "resultCsv": "string (Base64-encoded CSV)"
}
```

### UnsupportedOrder

```json
{
  "id": "string",
  "longitude": 0.0,
  "latitude": 0.0,
  "timestamp": "string",
  "subtotal": 0.0,
  "reason": "string"
}
```

### OrderStats (GET /orders/stats)

```json
{
  "totalOrders": 0,
  "totalRevenue": 0.0,
  "totalTax": 0.0
}
```
