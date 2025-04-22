// src/middleware/auth.js (enhanced security)
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

// Helper to securely compare API keys in constant time (prevent timing attacks)
const secureCompare = (a, b) => {
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
};

// JWT token blacklist for immediate revocation
// In production, this should be stored in Redis or similar
const tokenBlacklist = new Set();

exports.generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      jwtid: crypto.randomBytes(16).toString('hex') // unique token ID
    }
  );
};

exports.authenticateUser = async (req, res, next) => {
  try {
    // 1) Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2) Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    
    // 3) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4) Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    // 5) Check if user changed password after token was issued
    if (user.passwordChangedAt && user.passwordChangedAfter(decoded.iat)) {
      return res.status(401).json({ error: 'Password changed, please login again' });
    }
    
    // Grant access
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

exports.authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    // Find user by API key
    // Use projection to only retrieve necessary fields
    const user = await User.findOne(
      { apiKey }, 
      'apiKey _id name email settings'
    );
    
    if (!user || !user.apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Constant-time comparison to prevent timing attacks
    try {
      if (!secureCompare(apiKey, user.apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
    } catch (error) {
      // Handle case when strings are not the same length
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

exports.revokeToken = (token) => {
  tokenBlacklist.add(token);
  
  // In a real implementation, you'd also:
  // 1. Store revoked tokens in a database or Redis
  // 2. Implement cleanup of expired tokens from the blacklist
};

// Example usage of token revocation
exports.logout = (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      exports.revokeToken(token);
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
};