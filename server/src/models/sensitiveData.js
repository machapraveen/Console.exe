// src/models/sensitiveData.js
// Example of storing sensitive data with encryption
const mongoose = require('mongoose');
const encryption = require('../utils/encryption');

const sensitiveDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Store encrypted API keys or tokens for third-party services
  dataType: {
    type: String,
    required: true,
    enum: ['apiKey', 'accessToken', 'serviceCredential']
  },
  // Encrypted data
  encryptedData: {
    iv: String,
    encrypted: String,
    tag: String
  },
  // Service this data belongs to
  service: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Virtual getter for decrypted data
sensitiveDataSchema.virtual('decryptedValue').get(function() {
  if (!this.encryptedData) return null;
  return encryption.decrypt(this.encryptedData);
});

// Method to set encrypted value
sensitiveDataSchema.methods.setEncryptedValue = function(value) {
  this.encryptedData = encryption.encrypt(value);
};

const SensitiveData = mongoose.model('SensitiveData', sensitiveDataSchema);

module.exports = SensitiveData;