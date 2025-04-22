// src/controllers/applicationController.js
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Get all applications for the user
 * @route GET /api/applications
 * @access Private
 */
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id });
    
    res.status(200).json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      error: 'Failed to retrieve applications'
    });
  }
};

/**
 * Get a specific application
 * @route GET /api/applications/:id
 * @access Private
 */
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    res.status(200).json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      error: 'Failed to retrieve application'
    });
  }
};

/**
 * Create a new application
 * @route POST /api/applications
 * @access Private
 */
exports.createApplication = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Application name is required'
      });
    }
    
    const application = await Application.create({
      userId: req.user._id,
      name,
      recipients: [{
        name: req.user.name,
        phone: req.user.phone,
        isActive: true
      }]
    });
    
    res.status(201).json({ application });
  } catch (error) {
    console.error('Create application error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: validationErrors.join(', ')
      });
    }
    
    res.status(500).json({
      error: 'Failed to create application'
    });
  }
};

/**
 * Update an application
 * @route PUT /api/applications/:id
 * @access Private
 */
exports.updateApplication = async (req, res) => {
  try {
    const { name } = req.body;
    
    const application = await Application.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      { name },
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    res.status(200).json({ application });
  } catch (error) {
    console.error('Update application error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: validationErrors.join(', ')
      });
    }
    
    res.status(500).json({
      error: 'Failed to update application'
    });
  }
};

/**
 * Delete an application
 * @route DELETE /api/applications/:id
 * @access Private
 */
exports.deleteApplication = async (req, res) => {
  try {
    // Don't allow deleting the default application
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    if (application.name === 'Default Application') {
      return res.status(400).json({
        error: 'Cannot delete the default application'
      });
    }
    
    // Delete associated notifications
    await Notification.deleteMany({ applicationId: application._id });
    
    // Delete the application
    await Application.findByIdAndDelete(application._id);
    
    res.status(200).json({
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({
      error: 'Failed to delete application'
    });
  }
};

/**
 * Add a recipient to an application
 * @route POST /api/applications/:id/recipients
 * @access Private
 */
exports.addRecipient = async (req, res) => {
  try {
    const { name, phone, isActive } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({
        error: 'Recipient name and phone are required'
      });
    }
    
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    // Add recipient
    application.recipients.push({
      name,
      phone,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await application.save();
    
    res.status(201).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Add recipient error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: validationErrors.join(', ')
      });
    }
    
    res.status(500).json({
      error: 'Failed to add recipient'
    });
  }
};

/**
 * Update a recipient
 * @route PUT /api/applications/:id/recipients/:recipientId
 * @access Private
 */
exports.updateRecipient = async (req, res) => {
  try {
    const { name, phone, isActive } = req.body;
    
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    // Find recipient
    const recipient = application.recipients.id(req.params.recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }
    
    // Update recipient fields
    if (name) recipient.name = name;
    if (phone) recipient.phone = phone;
    if (isActive !== undefined) recipient.isActive = isActive;
    
    await application.save();
    
    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Update recipient error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: validationErrors.join(', ')
      });
    }
    
    res.status(500).json({
      error: 'Failed to update recipient'
    });
  }
};

/**
 * Delete a recipient
 * @route DELETE /api/applications/:id/recipients/:recipientId
 * @access Private
 */
exports.deleteRecipient = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    // Don't allow deleting all recipients
    if (application.recipients.length <= 1) {
      return res.status(400).json({
        error: 'Cannot delete the last recipient. Application must have at least one recipient.'
      });
    }
    
    // Find and remove recipient
    const recipient = application.recipients.id(req.params.recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }
    
    recipient.remove();
    await application.save();
    
    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Delete recipient error:', error);
    res.status(500).json({
      error: 'Failed to delete recipient'
    });
  }
};

/**
 * Activate a recipient
 * @route PUT /api/applications/:id/recipients/:recipientId/activate
 * @access Private
 */
exports.activateRecipient = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    // Find recipient
    const recipient = application.recipients.id(req.params.recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }
    
    // Activate recipient
    recipient.isActive = true;
    await application.save();
    
    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Activate recipient error:', error);
    res.status(500).json({
      error: 'Failed to activate recipient'
    });
  }
};

/**
 * Deactivate a recipient
 * @route PUT /api/applications/:id/recipients/:recipientId/deactivate
 * @access Private
 */
exports.deactivateRecipient = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }
    
    // Find recipient
    const recipient = application.recipients.id(req.params.recipientId);
    
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found'
      });
    }
    
    // Make sure at least one recipient remains active
    const activeRecipients = application.recipients.filter(r => 
      r._id.toString() !== req.params.recipientId && r.isActive
    );
    
    if (activeRecipients.length === 0) {
      return res.status(400).json({
        error: 'Cannot deactivate the last active recipient. At least one recipient must be active.'
      });
    }
    
    // Deactivate recipient
    recipient.isActive = false;
    await application.save();
    
    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Deactivate recipient error:', error);
    res.status(500).json({
      error: 'Failed to deactivate recipient'
    });
  }
};