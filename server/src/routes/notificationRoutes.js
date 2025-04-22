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