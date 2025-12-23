const express = require('express');
const router = express.Router();

// Import controllers
const {
  globalSearch,
  quickSearch,
  searchStudents,
  searchTutors,
  searchCourses
} = require('../controllers/searchController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// @desc    Global search across all entities
// @route   GET /api/search/global
// @access  Private
router.get('/global', authenticateToken, globalSearch);

// @desc    Quick search for auto-complete
// @route   GET /api/search/quick
// @access  Private
router.get('/quick', authenticateToken, quickSearch);

// @desc    Search students
// @route   GET /api/search/students
// @access  Private
router.get('/students', authenticateToken, searchStudents);

// @desc    Search tutors
// @route   GET /api/search/tutors
// @access  Private
router.get('/tutors', authenticateToken, searchTutors);

// @desc    Search courses
// @route   GET /api/search/courses
// @access  Private
router.get('/courses', authenticateToken, searchCourses);

module.exports = router;
