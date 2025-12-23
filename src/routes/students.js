const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentCourses,
  getStudentAssignments,
  getStudentAttendance
} = require('../controllers/studentController');

// Import middleware
const { validateStudentUpdate, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
router.get('/', authenticateToken, validatePagination, getStudents);

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', authenticateToken, validateId, getStudentById);

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private
router.put('/:id', authenticateToken, validateId, validateStudentUpdate, updateStudent);

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
router.delete('/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteStudent);

// @desc    Get student's courses
// @route   GET /api/students/:id/courses
// @access  Private
router.get('/:id/courses', authenticateToken, validateId, getStudentCourses);

// @desc    Get student's assignments
// @route   GET /api/students/:id/assignments
// @access  Private
router.get('/:id/assignments', authenticateToken, validateId, getStudentAssignments);

// @desc    Get student's attendance
// @route   GET /api/students/:id/attendance
// @access  Private
router.get('/:id/attendance', authenticateToken, validateId, getStudentAttendance);

module.exports = router;
