// src/index.js
const consoleExt = require('./console-override');

// Auto-initialize if API key is provided in environment
if (typeof process !== 'undefined' && process.env.CONSOLE_EXT_API_KEY) {
  consoleExt.init(process.env.CONSOLE_EXT_API_KEY);
}

module.exports = consoleExt;

// usage-example.js
// How developers would use Console.ext in their applications

// Method 1: Import and initialize
const consoleExt = require('console-ext');
consoleExt.init('your-api-key-here', {
  contextProvider: () => ({
    userId: getCurrentUser()?.id,
    environment: process.env.NODE_ENV
  })
});

// Method 2: One-liner setup
console.setKey('your-api-key-here');

// Using console.ext in a try-catch block
try {
  // Application code
  processPayment(user, amount);
} catch (error) {
  // This will log to console AND send a text notification
  console.ext('Payment processing failed:', error, { userId: user.id, amount });
}

// Usage in React application
function CheckoutForm() {
  React.useEffect(() => {
    console.setKey('your-api-key-here');
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      const result = await processPayment();
      // Handle success
    } catch (error) {
      // Send alert notification to developers
      console.ext('Checkout failed:', error, { 
        formData: getFormData(), 
        userId: currentUser.id 
      });
      
      // Show user-friendly error
      setError('Payment failed, please try again later.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}