const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout
} = require('../controllers/authController');

// Import middleware
const { validateRegister, validateLogin, validateTokenRefresh } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, register);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, login);

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', validateTokenRefresh, refreshToken);

// @desc    Get current user
// @route   GET /api/auth/user
// @access  Private
router.get('/user', authenticateToken, getCurrentUser);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticateToken, logout);

module.exports = router;
