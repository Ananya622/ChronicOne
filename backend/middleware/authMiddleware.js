/**
 * authMiddleware.js
 * JWT Authentication Middleware for protecting routes.
 * Extracts Bearer token from Authorization header and attaches req.user.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Primary: Extract Bearer token from Authorization header
if (
  req.headers.authorization &&
  req.headers.authorization.startsWith('Bearer ')
) {
  token = req.headers.authorization.split(' ')[1];
}
// 2. Fallback: Extract from secure HttpOnly cookie
else if (req.cookies && req.cookies.chronicone_token) {
  token = req.cookies.chronicone_token;
}

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No session token provided.' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured in environment variables.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User session no longer valid.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

module.exports = { protect };
