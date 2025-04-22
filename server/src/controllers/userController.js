// src/controllers/userController.js (enhanced password handling)
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../middleware/auth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Password security constants
const BCRYPT_SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 10;

// Helper to check password strength
const isStrongPassword = (password) => {
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  
  // Must contain at least one lowercase, one uppercase, one number, and one special char
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasLowercase && hasUppercase && hasNumber && hasSpecialChar;
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate password strength
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include lowercase, uppercase, number, and special character`
      });
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    
    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      apiKey
    });
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Respond without sending back sensitive info
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        apiKey: user.apiKey,
        settings: user.settings
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error (likely email)
      return res.status(400).json({
        error: 'Email is already registered'
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Failed to create account'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Respond without sending back sensitive info
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        apiKey: user.apiKey,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed'
    });
  }
};

// In your app.js file, add this line to configure security
const configureSecurity = require('./middleware/security');

// Add this to app.js before defining routes
configureSecurity(app);