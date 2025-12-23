const express = require('express');
const router = express.Router();

// Import controllers
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAssignments,
  getAssignmentById,
  createAssignment,
  getEnrollments,
  createEnrollment,
  getSubmissions,
  createSubmission,
  getAttendance,
  createAttendance,
  getStudentEnrollments,
  getStudentAssignments,
  getStudentAttendance,
  getStudentClassSchedules
} = require('../controllers/academicController');

// Import middleware
const { validateCourse, validateAssignment, validateSubmission, validateEnrollment, validateAttendance, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get all courses
// @route   GET /api/academics/courses
// @access  Private
router.get('/courses', authenticateToken, validatePagination, getCourses);

// @desc    Get course by ID
// @route   GET /api/academics/courses/:id
// @access  Private
router.get('/courses/:id', authenticateToken, validateId, getCourseById);

// @desc    Create course
// @route   POST /api/academics/courses
// @access  Private/Tutor
router.post('/courses', authenticateToken, authorizeRoles('tutor', 'admin'), validateCourse, createCourse);

// @desc    Update course
// @route   PUT /api/academics/courses/:id
// @access  Private/Tutor
router.put('/courses/:id', authenticateToken, authorizeRoles('tutor', 'admin'), validateId, validateCourse, updateCourse);

// @desc    Delete course
// @route   DELETE /api/academics/courses/:id
// @access  Private/Tutor
router.delete('/courses/:id', authenticateToken, authorizeRoles('tutor', 'admin'), validateId, deleteCourse);

// @desc    Get all assignments
// @route   GET /api/academics/assignments
// @access  Private
router.get('/assignments', authenticateToken, validatePagination, getAssignments);

// @desc    Get assignment by ID
// @route   GET /api/academics/assignments/:id
// @access  Private
router.get('/assignments/:id', authenticateToken, validateId, getAssignmentById);

// @desc    Create assignment
// @route   POST /api/academics/assignments
// @access  Private/Tutor
router.post('/assignments', authenticateToken, authorizeRoles('tutor', 'admin'), validateAssignment, createAssignment);

// @desc    Get all enrollments
// @route   GET /api/academics/enrollments
// @access  Private
router.get('/enrollments', authenticateToken, validatePagination, getEnrollments);

// @desc    Create enrollment
// @route   POST /api/academics/enrollments
// @access  Private
router.post('/enrollments', authenticateToken, validateEnrollment, createEnrollment);

// @desc    Get all submissions
// @route   GET /api/academics/submissions
// @access  Private
router.get('/submissions', authenticateToken, validatePagination, getSubmissions);

// @desc    Create submission
// @route   POST /api/academics/submissions
// @access  Private/Student
router.post('/submissions', authenticateToken, validateSubmission, createSubmission);

// @desc    Get all attendance records
// @route   GET /api/academics/attendance
// @access  Private
router.get('/attendance', authenticateToken, validatePagination, getAttendance);

// @desc    Create attendance record
// @route   POST /api/academics/attendance
// @access  Private/Tutor
router.post('/attendance', authenticateToken, authorizeRoles('tutor', 'admin'), validateAttendance, createAttendance);

// @desc    Get student enrollments (for authenticated student)
// @route   GET /api/academics/enrollments/student
// @access  Private/Student
router.get('/enrollments/student', authenticateToken, authorizeRoles('student'), getStudentEnrollments);

// @desc    Get student assignments (for authenticated student)
// @route   GET /api/academics/assignments/student
// @access  Private/Student
router.get('/assignments/student', authenticateToken, authorizeRoles('student'), getStudentAssignments);

// @desc    Get student attendance (for authenticated student)
// @route   GET /api/academics/attendance/student
// @access  Private/Student
router.get('/attendance/student', authenticateToken, authorizeRoles('student'), getStudentAttendance);

// @desc    Get student class schedules (for authenticated student)
// @route   GET /api/academics/class-schedules/student
// @access  Private/Student
router.get('/class-schedules/student', authenticateToken, authorizeRoles('student'), getStudentClassSchedules);

module.exports = router;
