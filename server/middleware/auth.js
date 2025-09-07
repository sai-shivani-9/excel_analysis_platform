const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Bearer token)
      token = req.headers.authorization.split(' ')[1];
    } catch (error) {
      console.error('Error extracting Bearer token:', error);
    }
  }

  // Check for token in x-auth-token header (legacy support)
  if (!token && req.header('x-auth-token')) {
    token = req.header('x-auth-token');
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ 
      success: false,
      msg: 'Not authorized, no token provided' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: 'Not authorized, user not found' 
      });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    next();

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Not authorized, token expired' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      msg: 'Not authorized, invalid token' 
    });
  }
};

module.exports = { protect };