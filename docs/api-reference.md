// docs/api-reference.md
# Console.ext API Reference

This document provides comprehensive information about the Console.ext API endpoints.

## Authentication

### API Key Authentication

For notification endpoints, authenticate using an API key in the request header:

```
X-API-Key: your-api-key-here
```

### JWT Authentication

For dashboard and management endpoints, authenticate using a JWT token in the Authorization header:

```
Authorization: Bearer your-jwt-token-here
```

## Base URL

All API endpoints are relative to the base URL:

```
https://api.console-ext.com
```

## Endpoints

### Authentication

#### Register a new user

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "apiKey": "api-key-here",
    "settings": {
      "rateLimit": 5,
      "callEnabled": false,
      "retryEnabled": true,
      "retryDelay": 5
    }
  }
}
```

#### Login

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "apiKey": "api-key-here",
    "settings": {
      "rateLimit": 5,
      "callEnabled": false,
      "retryEnabled": true,
      "retryDelay": 5
    }
  }
}
```

#### Get User Profile

```
GET /api/auth/profile
```

**Headers:**

```
Authorization: Bearer your-jwt-token-here
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "apiKey": "api-key-here",
    "settings": {
      "rateLimit": 5,
      "callEnabled": false,
      "retryEnabled": true,
      "retryDelay": 5
    }
  }
}
```

### Notifications

#### Create a Notification

```
POST /api/notifications
```

**Headers:**

```
X-API-Key: your-api-key-here
```

**Request Body:**

```json
{
  "message": "Payment processing failed: Connection timeout",
  "stackTrace": "Error: Connection timeout\n    at processPayment (/app/payments.js:42:7)\n    at checkout (/app/checkout.js:13:5)",
  "context": {
    "userId": "user_123",
    "amount": 99.99,
    "environment": "production"
  }
}
```

**Response:**

```json
{
  "success": true,
  "notification": {
    "id": "notification-id",
    "message": "Payment processing failed: Connection timeout",
    "status": "pending"
  }
}
```

#### Get Notifications

```
GET /api/notifications
```

**Headers:**

```
Authorization: Bearer your-jwt-token-here
```

**Query Parameters:**

- `limit` (optional): Maximum number of notifications to return (default: 100)
- `page` (optional): Page number for pagination (default: 1)
- `status` (optional): Filter by status ('sent', 'rate-limited', 'failed', 'pending')

**Response:**

```json
{
  "notifications": [
    {
      "_id": "notification-id-1",
      "message": "Payment processing failed: Connection timeout",
      "status": "sent",
      "createdAt": "2025-04-20T12:00:00Z",
      "context": {
        "userId": "user_123",
        "amount": 99.99
      }
    },
    {
      "_id": "notification-id-2",
      "message": "Database connection error",
      "status": "sent",
      "createdAt": "2025-04-19T10:30:00Z",
      "context": {
        "server": "db-main-01"
      }
    }
  ],
  "pagination": {
    "total": 245,
    "page": 1,
    "pages": 25,
    "limit": 10
  }
}
```

### Applications

#### Get All Applications

```
GET /api/applications
```

**Headers:**

```
Authorization: Bearer your-jwt-token-here
```

**Response:**

```json
{
  "applications": [
    {
      "_id": "app-id-1",
      "name": "E-commerce Backend",
      "recipients": [
        {
          "_id": "recipient-id-1",
          "name": "John Doe",
          "phone": "+1234567890",
          "isActive": true
        },
        {
          "_id": "recipient-id-2",
          "name": "Jane Smith",
          "phone": "+1987654321",
          "isActive": false
        }
      ],
      "createdAt": "2025-01-15T08:00:00Z"
    },
    {
      "_id": "app-id-2",
      "name": "User API",
      "recipients": [
        {
          "_id": "recipient-id-3",
          "name": "John Doe",
          "phone": "+1234567890",
          "isActive": true
        }
      ],
      "createdAt": "2025-02-20T09:30:00Z"
    }
  ]
}
```

#### Create Application

```
POST /api/applications
```

**Headers:**

```
Authorization: Bearer your-jwt-token-here
```

**Request Body:**

```json
{
  "name": "Payment Service"
}
```

**Response:**

```json
{
  "application": {
    "_id": "app-id-3",
    "name": "Payment Service",
    "recipients": [],
    "createdAt": "2025-04-21T15:30:00Z"
  }
}
```

#### Add Recipient to Application

```
POST /api/applications/:id/recipients
```

**Headers:**

```
Authorization: Bearer your-jwt-token-here
```

**Request Body:**

```json
{
  "name": "Alex Johnson",
  "phone": "+1234567890",
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "application": {
    "_id": "app-id-3",
    "name": "Payment Service",
    "recipients": [
      {
        "_id": "recipient-id-4",
        "name": "Alex Johnson",
        "phone": "+1234567890",
        "isActive": true
      }
    ],
    "createdAt": "2025-04-21T15:30:00Z"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Invalid data provided"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

or

```json
{
  "error": "Invalid API key"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Server Error

```json
{
  "error": "Server error"
}
```

## Rate Limiting

API requests are rate limited to 100 requests per 15-minute window per IP address. Notification rate limiting is configured per user account (default: one notification per 5 minutes for the same error).
