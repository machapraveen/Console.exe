// src/models/User.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  apiKey: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  settings: {
    rateLimit: {
      type: Number,
      default: 5, // minutes between notifications
      min: 1,
      max: 60
    },
    callEnabled: {
      type: Boolean,
      default: false
    },
    retryEnabled: {
      type: Boolean, 
      default: true
    },
    retryDelay: {
      type: Number,
      default: 5, // minutes before retry
      min: 1,
      max: 30
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);