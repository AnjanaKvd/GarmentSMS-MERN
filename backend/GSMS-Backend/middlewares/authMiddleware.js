const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Check user role
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const hasRole = Array.isArray(roles) 
      ? roles.includes(req.user.role)
      : req.user.role === roles;
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  };
}; 