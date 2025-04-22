// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('./middleware/auth');
const notificationController = require('./controllers/notificationController');
const userController = require('./controllers/userController');
const applicationController = require('./controllers/applicationController');

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
// Public routes
app.post('/api/auth/register', userController.register);
app.post('/api/auth/login', userController.login);

// Notification routes (API key auth)
app.post(
  '/api/notifications', 
  authMiddleware.authenticateApiKey, 
  notificationController.createNotification
);

// Dashboard routes (JWT auth)
app.get(
  '/api/notifications',
  authMiddleware.authenticateUser,
  notificationController.getNotifications
);

app.get(
  '/api/applications',
  authMiddleware.authenticateUser,
  applicationController.getApplications
);

app.post(
  '/api/applications',
  authMiddleware.authenticateUser,
  applicationController.createApplication
);

app.put(
  '/api/applications/:id',
  authMiddleware.authenticateUser,
  applicationController.updateApplication
);

app.post(
  '/api/applications/:id/recipients',
  authMiddleware.authenticateUser,
  applicationController.addRecipient
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;