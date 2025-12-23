const express = require('express');
const router = express.Router();

// Import controllers
const {
  getTutors,
  getTutorById,
  updateTutor,
  deleteTutor,
  getTutorCourses,
  getTutorStudents,
  getTutorSubmissions,
  getTutorDashboardStats
} = require('../controllers/tutorController');

// Import middleware
const { validateTutorUpdate, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get all tutors
// @route   GET /api/tutors
// @access  Private
router.get('/', authenticateToken, validatePagination, getTutors);

// @desc    Get tutor by ID
// @route   GET /api/tutors/:id
// @access  Private
router.get('/:id', authenticateToken, validateId, getTutorById);

// @desc    Update tutor profile
// @route   PUT /api/tutors/:id
// @access  Private
router.put('/:id', authenticateToken, validateId, validateTutorUpdate, updateTutor);

// @desc    Delete tutor
// @route   DELETE /api/tutors/:id
// @access  Private/Admin
router.delete('/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteTutor);

// @desc    Get tutor's courses
// @route   GET /api/tutors/:id/courses
// @access  Private
router.get('/:id/courses', authenticateToken, validateId, getTutorCourses);

// @desc    Get tutor's students
// @route   GET /api/tutors/:id/students
// @access  Private
router.get('/:id/students', authenticateToken, validateId, getTutorStudents);

// @desc    Get tutor's submissions
// @route   GET /api/tutors/:id/submissions
// @access  Private
router.get('/:id/submissions', authenticateToken, validateId, getTutorSubmissions);

// @desc    Get tutor dashboard stats
// @route   GET /api/tutors/:id/dashboard-stats
// @access  Private
router.get('/:id/dashboard-stats', authenticateToken, validateId, getTutorDashboardStats);

module.exports = router;
