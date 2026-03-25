// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const userFromDb = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!userFromDb) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!userFromDb.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Merge token data (especially role) with DB data
    // This ensures role from Firebase login is respected
    req.user = {
      ...userFromDb.toJSON(),
      role: decoded.role || userFromDb.role || 'user'   // ← Priority to token role
    };

    next();
  } catch (error) {
    console.error('JWT Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Generate JWT Token  ← Also update this to include role
exports.generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = exports.generateToken(user);

  res.status(statusCode).json({
    success: true,
    token,
    user
  });
};