// src/utils/encryption.js
const crypto = require('crypto');

/**
 * Utility for encrypting sensitive data
 */
class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY;
    
    if (!this.secretKey || this.secretKey.length !== 32) {
      throw new Error('Invalid encryption key. Must be 32 bytes (256 bits).');
    }
  }

  /**
   * Encrypt data
   * @param {string} text - Text to encrypt
   * @returns {Object} - Encrypted data with iv and tag
   */
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    
    return {
      iv: iv.toString('hex'),
      encrypted,
      tag
    };
  }

  /**
   * Decrypt data
   * @param {Object} data - Encrypted data with iv and tag
   * @returns {string} - Decrypted text
   */
  decrypt(data) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = new Encryption();