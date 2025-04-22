// client/examples/node-example.js
const consoleExt = require('console-ext');

// Initialize with API key
consoleExt.init('your-api-key-here', {
  contextProvider: () => ({
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  })
});

// Example function with error
function processPayment(userId, amount) {
  try {
    // Simulate a critical error
    throw new Error('Payment gateway connection failed');
    
    // This code would never execute due to the error
    return { success: true, transactionId: 'tx_123' };
  } catch (error) {
    // Log to console and send notification
    console.ext('Payment processing failed:', error, { 
      userId, 
      amount, 
      timestamp: new Date().toISOString() 
    });
    
    return { success: false, error: error.message };
  }
}

// Run example
console.log('Processing payment...');
const result = processPayment('user_123', 99.99);
console.log('Result:', result);