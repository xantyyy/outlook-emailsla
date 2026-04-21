const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers.Authorization || req.get('Authorization');

    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let account = null;

    // ── Check accountType from token to know which collection to query ──
    if (decoded.accountType === 'user') {
      account = await User.findById(decoded.id).select('-password');
    } else {
      // Default: check Admin collection (covers 'admin' and legacy tokens)
      account = await Admin.findById(decoded.id).select('-password');
    }

    if (!account) {
      return res.status(401).json({ message: 'Account not found' });
    }

    if (!account.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // ✅ FIX — store decoded token on req so accountType is always reliable
    // Mongoose documents don't accept arbitrary properties not in schema,
    // so req.admin.accountType would be lost. Use req.decoded instead.
    req.decoded = decoded;

    // Keep attaching to req.admin for backwards compatibility
    req.admin = account;
    req.user  = account;

    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if account has specific role
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.',
        yourRole: req.admin.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};

module.exports = { auth, checkRole };