// server/src/config/config.js
/**
 * Application configuration
 */
const path = require('path');

// Default configuration values
const defaults = {
  environment: 'development',
  server: {
    port: 4000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }
  },
  database: {
    uri: 'mongodb://localhost:27017/console-ext'
  },
  auth: {
    jwtSecret: 'dev-jwt-secret',
    jwtExpiresIn: '7d',
    bcryptRounds: 12
  },
  twilio: {
    accountSid: '',
    authToken: '',
    phoneNumber: ''
  },
  security: {
    encryptionKey: 'abcdefghijklmnopqrstuvwxyz123456',
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // 100 requests per windowMs
    }
  },
  notifications: {
    rateLimit: 5, // minutes between notifications
    retryDelay: 5 // minutes before retry
  }
};

// Load environment variables
const config = {
  environment: process.env.NODE_ENV || defaults.environment,
  server: {
    port: parseInt(process.env.PORT) || defaults.server.port,
    cors: {
      origin: process.env.CORS_ORIGINS ? 
        process.env.CORS_ORIGINS.split(',') : 
        defaults.server.cors.origin,
      methods: defaults.server.cors.methods,
      allowedHeaders: defaults.server.cors.allowedHeaders
    }
  },
  database: {
    uri: process.env.MONGODB_URI || defaults.database.uri
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || defaults.auth.jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || defaults.auth.jwtExpiresIn,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || defaults.auth.bcryptRounds
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || defaults.twilio.accountSid,
    authToken: process.env.TWILIO_AUTH_TOKEN || defaults.twilio.authToken,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || defaults.twilio.phoneNumber
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || defaults.security.encryptionKey,
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || defaults.security.rateLimiting.windowMs,
      max: parseInt(process.env.RATE_LIMIT_MAX) || defaults.security.rateLimiting.max
    }
  },
  notifications: {
    rateLimit: parseInt(process.env.NOTIFICATION_RATE_LIMIT) || defaults.notifications.rateLimit,
    retryDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY) || defaults.notifications.retryDelay
  }
};

// Validate critical config settings
function validateConfig() {
  const errors = [];

  // In production, we need real JWT secret
  if (config.environment === 'production' && config.auth.jwtSecret === defaults.auth.jwtSecret) {
    errors.push('JWT_SECRET must be set in production');
  }

  // In production, we need real encryption key
  if (config.environment === 'production' && config.security.encryptionKey === defaults.security.encryptionKey) {
    errors.push('ENCRYPTION_KEY must be set in production');
  }

  // Twilio settings required for notifications
  if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
    errors.push('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) must be set');
  }

  if (errors.length) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`- ${error}`));
    
    if (config.environment === 'production') {
      process.exit(1); // Exit in production
    }
  }
}

// Only validate in production
if (config.environment === 'production') {
  validateConfig();
}

module.exports = config;