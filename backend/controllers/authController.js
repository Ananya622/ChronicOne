/**
 * authController.js
 * Controller handling user registration, authentication, and profile lookup.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'chronicone_token';
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Helper to sign JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing from environment variables');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d'
  });
};

/**
 * @desc    Register a new user & set secure HttpOnly cookie
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, conditions, habits, theme, preferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      conditions: Array.isArray(conditions) ? conditions : [],
      habits: Array.isArray(habits) ? habits : [],
      theme: theme || 'dark',
      preferences: preferences || {}
    });

    const token = generateToken(user._id);

    // Issue secure HttpOnly cookie
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(201).json({
  message: 'User registered successfully',
  token: token,
  user: user.toJSON()
});
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

/**
 * @desc    Authenticate user & set secure HttpOnly cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    // Issue secure HttpOnly cookie
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
  message: 'Login successful',
  token: token,
  user: user.toJSON()
});
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

/**
 * @desc    Logout user & clear HttpOnly cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user
    });
  } catch (error) {
    console.error('getMe error:', error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * @desc    Update user profile, theme, or preferences in MongoDB
 * @route   PATCH /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, theme, conditions, habits, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (theme && ['dark', 'light'].includes(theme)) user.theme = theme;
    if (Array.isArray(conditions)) user.conditions = conditions;
    if (Array.isArray(habits)) user.habits = habits;
    if (preferences && typeof preferences === 'object') {
      user.preferences = { ...(user.preferences || {}), ...preferences };
    }

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    return res.status(500).json({ error: 'Internal server error while updating profile.' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile
};
