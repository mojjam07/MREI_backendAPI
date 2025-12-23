const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStudentDashboard,
  getTutorDashboard,
  getAdminDashboard,
  getDashboardStats
} = require('../controllers/dashboardController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get student dashboard
// @route   GET /api/dashboard/student
// @access  Private/Student
router.get('/student', authenticateToken, authorizeRoles('student'), getStudentDashboard);

// @desc    Get tutor dashboard
// @route   GET /api/dashboard/tutor
// @access  Private/Tutor
router.get('/tutor', authenticateToken, authorizeRoles('tutor'), getTutorDashboard);

// @desc    Get admin dashboard
// @route   GET /api/dashboard/admin
// @access  Private/Admin
router.get('/admin', authenticateToken, authorizeRoles('admin'), getAdminDashboard);

// @desc    Get dashboard statistics
// @route   GET /api/dashboard-stats
// @access  Private
router.get('/stats', authenticateToken, getDashboardStats);

module.exports = router;
