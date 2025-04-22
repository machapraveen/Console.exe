// server/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', authMiddleware.authenticateUser, authMiddleware.logout);

// Protected routes
router.get('/profile', authMiddleware.authenticateUser, userController.getProfile);
router.put('/profile', authMiddleware.authenticateUser, userController.updateProfile);
router.put('/change-password', authMiddleware.authenticateUser, userController.changePassword);
router.post('/regenerate-api-key', authMiddleware.authenticateUser, userController.regenerateApiKey);
router.delete('/account', authMiddleware.authenticateUser, userController.deleteAccount);

module.exports = router;

// server/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// Routes for sending notifications (API key auth)
router.post('/', authMiddleware.authenticateApiKey, notificationController.createNotification);

// Routes for accessing notification data (JWT auth)
router.get('/', authMiddleware.authenticateUser, notificationController.getNotifications);
router.get('/:id', authMiddleware.authenticateUser, notificationController.getNotificationById);
router.delete('/:id', authMiddleware.authenticateUser, notificationController.deleteNotification);
router.get('/stats', authMiddleware.authenticateUser, notificationController.getNotificationStats);

module.exports = router;