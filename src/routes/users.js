const express = require('express');
const router = express.Router();

// Import controllers
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword
} = require('../controllers/userController');

// Import middleware
const { validateUserUpdate, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', authenticateToken, authorizeRoles('admin'), validatePagination, getUsers);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', authenticateToken, validateId, getUserById);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', authenticateToken, validateId, validateUserUpdate, updateUser);

// @desc    Change password
// @route   PUT /api/users/:id/password
// @access  Private
router.put('/:id/password', authenticateToken, validateId, changePassword);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteUser);

module.exports = router;
