const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * verifyToken
 * Reads Authorization: Bearer <token>, verifies it, and attaches
 * req.user = { id: payload.userId } for downstream handlers.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

/**
 * requireAdmin
 * Must be used AFTER verifyToken.
 * Loads the full user from DB; rejects with 403 if role !== 'admin'.
 */
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    req.userRole = 'admin';
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during role check.' });
  }
};

/**
 * loadUser
 * Optional helper — loads the full user document (no password) into req.fullUser.
 * Use after verifyToken when you need full user data in a handler.
 */
const loadUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    req.fullUser = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error loading user.' });
  }
};

module.exports = { verifyToken, requireAdmin, loadUser };
