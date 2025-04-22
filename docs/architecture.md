// docs/architecture.md
# Console.ext Architecture

This document outlines the architecture of the Console.ext system, explaining how the various components interact and the design decisions behind them.

## System Overview

Console.ext consists of three main components:

1. **Client Library**: JavaScript library that overrides the console object
2. **Backend API**: Node.js/Express server for processing notifications and managing user data
3. **Dashboard**: React frontend for user interaction with the service

```
┌─────────────────┐                       ┌────────────────┐
│                 │                       │                │
│  Client App     │                       │  Dashboard     │
│  (with JS lib)  │                       │  (React)       │
│                 │                       │                │
└────────┬────────┘                       └────────┬───────┘
         │                                         │
         │                                         │
         │ HTTP/API                                │ HTTP/API
         │                                         │
         ▼                                         ▼
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    Backend API Server                    │
│                    (Node.js/Express)                     │
│                                                          │
└───────────────────────────┬──────────────────────────────┘
                            │
                            │
                            ▼
                 ┌─────────────────────┐
                 │                     │
                 │     MongoDB         │
                 │                     │
                 └──────────┬──────────┘
                            │
                            │
                            ▼
                 ┌─────────────────────┐
                 │                     │
                 │    Twilio API       │
                 │                     │
                 └─────────────────────┘
```

## Client Library

The client library is designed to be lightweight, with minimal dependencies, and compatible with both browser and Node.js environments.

### Key Components

1. **Console Override**: Extends the native console object with an `ext` method
2. **API Client**: Handles communication with the Console.ext API
3. **Context Provider**: Collects application context for notifications

### Design Decisions

- **Build Process**: Uses Rollup to create multiple distribution formats (UMD, CommonJS, ESM)
- **Browser Compatibility**: Targets modern browsers while maintaining IE11 compatibility through Babel
- **Dependency Management**: Minimizes dependencies to reduce bundle size

## Backend API

The backend is built with Node.js and Express, using MongoDB for data storage.

### Key Components

1. **API Routes**: RESTful endpoints for client communication
2. **Authentication System**: Handles user authentication and API key validation
3. **Notification Service**: Processes notifications and handles SMS delivery
4. **Rate Limiting**: Prevents notification floods
5. **Database Models**: Mongoose schemas for data storage

### Design Decisions

- **Stateless Architecture**: API servers are stateless for horizontal scaling
- **Middleware Pattern**: Extensive use of Express middleware for authorization, validation, etc.
- **Service Layer**: Business logic separated from controllers for better testability
- **Async/Await**: Modern JavaScript syntax for improved readability and error handling

## Dashboard Frontend

The frontend dashboard is built with React and uses modern frontend practices.

### Key Components

1. **Authentication**: JWT-based authentication system
2. **Notification Views**: Displays notification history and status
3. **Application Management**: UI for managing notification recipients
4. **Settings**: User account and notification settings

### Design Decisions

- **Component Architecture**: Modular React components for better maintainability
- **Responsive Design**: Tailwind CSS for responsive UI across devices
- **State Management**: React Context API for state management
- **API Communication**: Axios for API requests with interceptors for auth

## Database Schema

Console.ext uses MongoDB with the following main collections:

### Users

```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "phone": "String",
  "password": "String (hashed)",
  "apiKey": "String",
  "settings": {
    "rateLimit": "Number",
    "callEnabled": "Boolean",
    "retryEnabled": "Boolean",
    "retryDelay": "Number"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Applications

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "name": "String",
  "recipients": [
    {
      "name": "String",
      "phone": "String",
      "isActive": "Boolean"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Notifications

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "applicationId": "ObjectId (ref: Application)",
  "message": "String",
  "stackTrace": "String",
  "context": "Object",
  "status": "String (enum: pending, sent, rate-limited, failed)",
  "deliveryAttempts": [
    {
      "timestamp": "Date",
      "status": "String",
      "responseData": "Object"
    }
  ],
  "hash": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Third-Party Integrations

### Twilio

Console.ext uses Twilio for SMS and voice call delivery:

- **SMS Delivery**: Primary notification method
- **Voice Calls**: Optional for urgent notifications
- **Retry Mechanism**: Uses Twilio to retry notifications if no response

### Authentication

- **JWT**: Used for dashboard authentication
- **bcrypt**: For secure password hashing
- **API Keys**: For client library authentication

## Deployment Architecture

Console.ext is deployed using a cloud-native approach:

- **Containerization**: Docker containers for all components
- **Orchestration**: Kubernetes for container management
- **Load Balancing**: Nginx for traffic distribution
- **Monitoring**: Prometheus and Grafana for system monitoring
- **Logging**: ELK stack for centralized logging

## Security Considerations

- **Data Encryption**: Sensitive data encrypted at rest
- **HTTPS**: All API communication over HTTPS
- **API Key Security**: API keys are randomly generated and securely stored
- **Rate Limiting**: Prevents abuse and brute force attacks
- **Input Validation**: Thorough validation of all user inputs
- **XSS Protection**: Content Security Policy (CSP) headers
- **CSRF Protection**: Anti-CSRF tokens for dashboard requests

## Scalability

The system is designed for horizontal scalability:

- **Stateless Servers**: API servers maintain no session state
- **Database Scaling**: MongoDB replication and sharding
- **Rate Limiting**: Distributed rate limiting using Redis
- **Caching**: Response caching for high-traffic endpoints
- **CDN Integration**: Static assets served through CDN