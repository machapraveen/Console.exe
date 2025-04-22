// client/README.md
# Console.ext Client Library

A lightweight client library for the Console.ext error notification system.

## Installation

```bash
npm install console-ext
```

## Usage

### Basic Usage

```javascript
// ES Module
import consoleExt from 'console-ext';

// Initialize with your API key
consoleExt.init('your-api-key');

// Or use the console.setKey shorthand
console.setKey('your-api-key');

// Use it in try-catch blocks
try {
  // Your critical code here
} catch (error) {
  // This will log to console AND send a text notification
  console.ext('Payment processing failed:', error);
}
```

### Browser Usage

```html
<script src="https://cdn.jsdelivr.net/npm/console-ext/dist/console-ext.min.js"></script>
<script>
  // Initialize with your API key
  console.setKey('your-api-key');
  
  // Use it to catch errors
  try {
    // Critical code
  } catch (error) {
    console.ext('Critical error:', error);
  }
</script>
```

### Configuration Options

```javascript
consoleExt.init('your-api-key', {
  // API endpoint (defaults to Console.ext servers)
  apiUrl: 'https://api.console-ext.com',
  
  // Enable/disable notifications (useful for development)
  enabled: true,
  
  // Context provider function - adds additional info to notifications
  contextProvider: () => ({
    userId: getCurrentUser()?.id,
    environment: process.env.NODE_ENV,
    version: APP_VERSION
  })
});
```

## Advanced Usage

### React Integration

```jsx
import React, { useEffect } from 'react';
import consoleExt from 'console-ext';

function App() {
  useEffect(() => {
    // Initialize on component mount
    console.setKey('your-api-key', {
      contextProvider: () => ({
        userId: user?.id,
        route: window.location.pathname
      })
    });
    
    // Optional: Disable on unmount
    return () => {
      consoleExt.init('your-api-key', { enabled: false });
    };
  }, []);
  
  return (
    // Your app components
  );
}
```

### Node.js Usage

```javascript
// Load from environment variables
require('dotenv').config();
const consoleExt = require('console-ext');

consoleExt.init(process.env.CONSOLE_EXT_API_KEY, {
  contextProvider: () => ({
    environment: process.env.NODE_ENV,
    server: process.env.SERVER_NAME
  })
});

// Example usage in Express error handler
app.use((err, req, res, next) => {
  console.ext('Express server error:', err, { 
    url: req.url, 
    method: req.method 
  });
  
  res.status(500).json({ error: 'Server error' });
});
```

## License

MIT