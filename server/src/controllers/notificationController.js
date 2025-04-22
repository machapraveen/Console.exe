// src/controllers/notificationController.js
const Notification = require('../models/Notification');
const Application = require('../models/Application');
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');

exports.createNotification = async (req, res) => {
  try {
    const { message, stackTrace, context } = req.body;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Find user by API key
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Find or create default application for this user
    let application = await Application.findOne({ 
      userId: user._id,
      name: 'Default Application'
    });

    if (!application) {
      application = await Application.create({
        userId: user._id,
        name: 'Default Application',
        recipients: [{ name: user.name, phone: user.phone, isActive: true }]
      });
    }

    // Create notification
    const notification = await Notification.create({
      userId: user._id,
      applicationId: application._id,
      message,
      stackTrace,
      context
    });

    // Process notification (send SMS, etc.)
    NotificationService.processNotification(notification);

    return res.status(201).json({ 
      success: true, 
      notification: {
        id: notification._id,
        message,
        status: notification.status
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(100);
      
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};