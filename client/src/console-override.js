// src/console-override.js
/**
 * Console.ext - Critical error notification system
 * Overrides the console object to include a text notification function
 */

const axios = require('axios');

// Default configuration
const defaultConfig = {
  apiUrl: 'https://api.console-ext.com',
  apiKey: null,
  enabled: true,
  contextProvider: null
};

let config = { ...defaultConfig };

/**
 * Initialize Console.ext with API key and options
 * @param {string} apiKey - Your Console.ext API key
 * @param {Object} options - Configuration options
 */
function initConsoleExt(apiKey, options = {}) {
  if (!apiKey) {
    console.warn('Console.ext: API key is required');
    return false;
  }

  config = {
    ...defaultConfig,
    ...options,
    apiKey
  };

  // Override console methods
  installConsoleOverride();
  
  return true;
}

/**
 * Install the console.ext method
 */
function installConsoleOverride() {
  if (typeof console === 'undefined') {
    return false;
  }

  // Store original console methods
  const originalConsole = {
    error: console.error,
    log: console.log,
    warn: console.warn,
    info: console.info
  };

  // Add console.ext method
  console.ext = function(...args) {
    // Call original console.error
    originalConsole.error.apply(console, args);
    
    // Skip sending if disabled
    if (!config.enabled) {
      return;
    }
    
    // Send text notification
    sendNotification(args);
  };

  // Add console.setKey method for easy initialization
  console.setKey = function(apiKey, options = {}) {
    return initConsoleExt(apiKey, options);
  };

  return true;
}

/**
 * Send notification to Console.ext API
 * @param {Array} args - Arguments passed to console.ext
 */
async function sendNotification(args) {
  if (!config.apiKey) {
    return;
  }

  try {
    // Format message from args
    const message = formatMessage(args);
    
    // Get stack trace (excluding this file)
    const stackTrace = getStackTrace();
    
    // Get context if provided
    const context = getContext();
    
    // Send to API
    await axios({
      method: 'post',
      url: `${config.apiUrl}/api/notifications`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey
      },
      data: {
        message,
        stackTrace,
        context
      }
    });
  } catch (error) {
    // Don't use console.error here to avoid infinite loop
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`Console.ext error: ${error.message}\n`);
    }
  }
}

/**
 * Format message from arguments
 * @param {Array} args - Arguments passed to console.ext
 * @returns {string} - Formatted message
 */
function formatMessage(args) {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return arg;
    }
    if (arg instanceof Error) {
      return arg.message;
    }
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  }).join(' ');
}

/**
 * Get stack trace excluding this file
 * @returns {string} - Formatted stack trace
 */
function getStackTrace() {
  const error = new Error();
  const stack = error.stack || '';
  
  // Split the stack by lines and remove the first two lines
  // (Error and this function call)
  const lines = stack.split('\n');
  
  // Filter out lines from this file
  const filteredLines = lines.filter(line => 
    !line.includes('console-override.js') && 
    !line.includes('getStackTrace')
  );
  
  return filteredLines.join('\n');
}

/**
 * Get execution context if context provider is set
 * @returns {Object} - Context object
 */
function getContext() {
  if (typeof config.contextProvider === 'function') {
    try {
      return config.contextProvider();
    } catch (error) {
      // Silent fail
      return {};
    }
  }
  
  return {};
}

// Export for Node.js / bundler environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init: initConsoleExt
  };
}