const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStudents,
  getTutors,
  updateStudentStatus,
  updateTutorStatus,
  getSystemOverview,
  getUserStats,
  moderateContent
} = require('../controllers/adminController');

// Import middleware
const { validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get all students for admin management
// @route   GET /api/admin/students
// @access  Private/Admin
router.get('/students', authenticateToken, authorizeRoles('admin'), validatePagination, getStudents);

// @desc    Get all tutors for admin management
// @route   GET /api/admin/tutors
// @access  Private/Admin
router.get('/tutors', authenticateToken, authorizeRoles('admin'), validatePagination, getTutors);

// @desc    Update student status
// @route   PUT /api/admin/students/:id/status
// @access  Private/Admin
router.put('/students/:id/status', authenticateToken, authorizeRoles('admin'), validateId, updateStudentStatus);

// @desc    Update tutor status
// @route   PUT /api/admin/tutors/:id/status
// @access  Private/Admin
router.put('/tutors/:id/status', authenticateToken, authorizeRoles('admin'), validateId, updateTutorStatus);

// @desc    Get system overview
// @route   GET /api/admin/overview
// @access  Private/Admin
router.get('/overview', authenticateToken, authorizeRoles('admin'), getSystemOverview);

// @desc    Get user statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', authenticateToken, authorizeRoles('admin'), getUserStats);

// @desc    Moderate content
// @route   PUT /api/admin/moderate/:type/:id
// @access  Private/Admin
router.put('/moderate/:type/:id', authenticateToken, authorizeRoles('admin'), moderateContent);

module.exports = router;
