// server/src/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/auth');

// All routes require JWT authentication
router.use(authMiddleware.authenticateUser);

// Application routes
router.get('/', applicationController.getApplications);
router.get('/:id', applicationController.getApplication);
router.post('/', applicationController.createApplication);
router.put('/:id', applicationController.updateApplication);
router.delete('/:id', applicationController.deleteApplication);

// Recipient routes
router.post('/:id/recipients', applicationController.addRecipient);
router.put('/:id/recipients/:recipientId', applicationController.updateRecipient);
router.delete('/:id/recipients/:recipientId', applicationController.deleteRecipient);
router.put('/:id/recipients/:recipientId/activate', applicationController.activateRecipient);
router.put('/:id/recipients/:recipientId/deactivate', applicationController.deactivateRecipient);

module.exports = router;