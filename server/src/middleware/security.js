// src/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

/**
 * Configure application security middleware
 * @param {Object} app - Express application instance
 */
const configureSecurity = (app) => {
  // 1. Set security HTTP headers
  app.use(helmet());

  // 2. Implement CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://console-ext.com', 'https://dashboard.console-ext.com']
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true
  }));

  // 3. Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.'
    }
  });
  app.use('/api/', apiLimiter);

  // Special rate limit for auth endpoints to prevent brute force
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour
    message: {
      status: 'error',
      message: 'Too many login attempts, please try again later.'
    }
  });
  app.use('/api/auth/login', authLimiter);

  // 4. Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // 5. Data sanitization against XSS
  app.use(xss());

  // 6. Prevent parameter pollution
  app.use(hpp({
    whitelist: ['status', 'sort', 'page', 'limit'] // Allow duplicate query parameters for these
  }));

  // 7. Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https://api.console-ext.com']
        }
      })
    );
  }
};

module.exports = configureSecurity;