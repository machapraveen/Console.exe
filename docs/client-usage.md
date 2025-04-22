// docs/client-usage.md
# Console.ext Client Library Usage Guide

This guide provides detailed instructions for integrating and using the Console.ext client library in your applications.

## Installation

### NPM / Yarn

```bash
# Using npm
npm install console-ext

# Using yarn
yarn add console-ext
```

### CDN

```html

```

## Basic Usage

### Initialize the Library

Before using Console.ext, you need to initialize it with your API key:

```javascript
// ES Modules
import consoleExt from 'console-ext';
consoleExt.init('your-api-key-here');

// CommonJS
const consoleExt = require('console-ext');
consoleExt.init('your-api-key-here');

// Or use the shorthand on the console object
console.setKey('your-api-key-here');
```

### Sending Notifications

Once initialized, you can use `console.ext()` to log errors and send notifications:

```javascript
try {
  // Your critical code here
  throw new Error('Payment gateway connection failed');
} catch (error) {
  // This logs to console AND sends a text message
  console.ext('Payment processing failed:', error);
}
```

### Adding Context

You can include additional context with your notifications:

```javascript
try {
  // Critical code
} catch (error) {
  console.ext('Checkout failed:', error, {
    userId: 'user_123',
    orderId: 'order_456',
    amount: 99.99
  });
}
```

## Advanced Configuration

### Configuration Options

The `init()` function accepts an options object as the second parameter:

```javascript
consoleExt.init('your-api-key-here', {
  // API endpoint (defaults to Console.ext servers)
  apiUrl: 'https://api.console-ext.com',
  
  // Enable/disable notifications (useful for development)
  enabled: true,
  
  // Function that returns context to include with every notification
  contextProvider: () => ({
    environment: process.env.NODE_ENV,
    version: '1.2.3',
    hostname: window.location.hostname
  })
});
```

### Environment-based Configuration

For applications with different environments:

```javascript
// Only enable in production
consoleExt.init('your-api-key-here', {
  enabled: process.env.NODE_ENV === 'production'
});

// Use different API keys per environment
const API_KEYS = {
  development: 'dev-api-key',
  staging: 'staging-api-key',
  production: 'prod-api-key'
};

consoleExt.init(API_KEYS[process.env.NODE_ENV] || API_KEYS.development);
```

## Framework Integration

### React

```jsx
import React, { useEffect } from 'react';
import consoleExt from 'console-ext';

function App() {
  // Initialize on component mount
  useEffect(() => {
    console.setKey('your-api-key-here', {
      contextProvider: () => ({
        route: window.location.pathname
      })
    });
  }, []);
  
  return (
    
      {/* Your app components */}
    
  );
}
```

### Express.js

```javascript
const express = require('express');
const consoleExt = require('console-ext');

const app = express();

// Initialize Console.ext
consoleExt.init(process.env.CONSOLE_EXT_API_KEY);

// Add error handling middleware
app.use((err, req, res, next) => {
  // Log the error and send notification
  console.ext('Express server error:', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  // Standard error response
  res.status(500).json({ error: 'Server error' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Next.js

```javascript
// pages/_app.js
import { useEffect } from 'react';
import consoleExt from 'console-ext';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Console.ext
    console.setKey(process.env.NEXT_PUBLIC_CONSOLE_EXT_API_KEY);
    
    // Add global error handler
    const originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      console.ext('Unhandled error:', error || message);
      
      // Call original handler if it exists
      if (typeof originalErrorHandler === 'function') {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
    };
    
    // Cleanup on unmount
    return () => {
      window.onerror = originalErrorHandler;
    };
  }, []);
  
  return ;
}

export default MyApp;
```

## Best Practices

### Error Filtering

Only send notifications for critical errors:

```javascript
try {
  // Critical operation
} catch (error) {
  if (isCriticalError(error)) {
    console.ext('Critical error:', error);
  } else {
    // Just log to console without notification
    console.error('Non-critical error:', error);
  }
}

function isCriticalError(error) {
  // Define your criteria for critical errors
  return (
    error.code === 'PAYMENT_FAILURE' ||
    error.message.includes('database') ||
    error.status === 500
  );
}
```

### Batch Processing

For batch operations, consider deduplicating errors:

```javascript
async function processBatch(items) {
  const errors = [];
  
  for (const item of items) {
    try {
      await processItem(item);
    } catch (error) {
      errors.push({ item, error });
    }
  }
  
  if (errors.length > 0) {
    // Group similar errors
    const errorGroups = groupErrors(errors);
    
    // Send one notification per error type
    for (const [errorType, items] of Object.entries(errorGroups)) {
      console.ext(
        `Batch processing error (${items.length} items affected):`, 
        items[0].error,
        { errorType, affectedIds: items.map(e => e.item.id) }
      );
    }
  }
}

function groupErrors(errors) {
  // Group by error message or code
  const groups = {};
  for (const { item, error } of errors) {
    const key = error.code || error.message;
    groups[key] = groups[key] || [];
    groups[key].push({ item, error });
  }
  return groups;
}
```

## Troubleshooting

### Notifications Not Being Sent

1. Check if `console.ext` is being called correctly
2. Verify that your API key is valid
3. Check that `enabled` is not set to `false` in the options
4. Check the browser console for any errors related to the API requests
5. Verify that your server can reach the Console.ext API endpoint

### Rate Limiting

By default, Console.ext applies rate limiting to prevent notification floods:

- Similar errors within 5 minutes are deduplicated
- Check your dashboard for rate-limited notifications

### Multiple Initializations

If you initialize Console.ext multiple times, only the last configuration will be active:

```javascript
// This will be overridden
console.setKey('first-api-key');

// This is the active configuration
console.setKey('second-api-key', { enabled: false });

// This won't send a notification because enabled is false
console.ext('Error message');
```

For any other issues, please check the dashboard or contact support at support@console-ext.com.