// src/models/Notification.js
const mongoose = require('mongoose');

const deliveryAttemptSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  stackTrace: String,
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'rate-limited', 'failed'],
    default: 'pending'
  },
  deliveryAttempts: [deliveryAttemptSchema],
  hash: {
    type: String,
    index: true
  }
}, { timestamps: true });

// Create hash for deduplication
notificationSchema.pre('save', function(next) {
  if (!this.hash) {
    const hashInput = `${this.applicationId}-${this.message}-${JSON.stringify(this.context)}`;
    this.hash = require('crypto').createHash('md5').update(hashInput).digest('hex');
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);