// README.md
# Console.ext

A simple, powerful notification system for critical errors in your applications.

## Overview

Console.ext helps developers stay on top of critical errors by sending SMS notifications when things go wrong. Unlike complex monitoring solutions, Console.ext is designed to be set up in less than 5 minutes with just one line of code.

### Key Features

- **One-line integration**: `console.setKey('your-api-key')` is all you need
- **SMS notifications**: Get instant alerts when critical errors occur
- **Rate limiting**: No notification floods (max one text per 5 minutes)
- **Call functionality**: Option for phone calls for urgent issues
- **Team management**: Add multiple recipients for on-call rotation
- **Simple dashboard**: Monitor all notifications in one place

## Quick Start

### 1. Install the package

```bash
npm install console-ext
```

### 2. Add one line to your application

```javascript
console.setKey('your-api-key');
```

### 3. Use it to catch critical errors

```javascript
try {
  // Your critical code (payment processing, etc.)
} catch (error) {
  // This will log to console AND send you a text message
  console.ext('Payment processing failed:', error);
}
```

## Dashboard

Access your notification history and manage settings at [https://dashboard.console-ext.com](https://dashboard.console-ext.com)

## Documentation

Full documentation is available in the [docs](./docs) directory.

## Development Setup

### Prerequisites

- Node.js (v14+)
- MongoDB
- Docker & Docker Compose (for containerized deployment)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/console-ext.git
   cd console-ext
   ```

2. Install dependencies for all components
   ```bash
   npm run install:all
   ```

3. Set up environment variables
   ```bash
   cp server/.env.example server/.env
   cp dashboard/.env.example dashboard/.env
   # Edit the .env files with your configuration
   ```

4. Start development servers
   ```bash
   npm run dev
   ```

### Project Structure

- `client/`: JavaScript client library for integration
- `server/`: Backend API service (Node.js/Express)
- `dashboard/`: Frontend application (React)
- `docs/`: Documentation
- `deployment/`: Deployment configurations

## License

MIT License