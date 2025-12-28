const express = require('express');
const router = express.Router();

// Import controllers
const {
  getContentOverview,
  getStats,
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getEvents,
  createEvent,
  getTestimonials,
  createTestimonial,
  getCampusLife,
  getHomeContent
} = require('../controllers/contentController');

// Import middleware
const { validateNews, validateEvent, validateTestimonial, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get content overview
// @route   GET /api/content
// @access  Public
router.get('/', getContentOverview);

// @desc    Get all statistics
// @route   GET /api/content/stats
// @access  Public
router.get('/stats', getStats);

// @desc    Get all news
// @route   GET /api/content/news
// @access  Public
router.get('/news', validatePagination, getNews);

// @desc    Get news by ID
// @route   GET /api/content/news/:id
// @access  Public
router.get('/news/:id', validateId, getNewsById);

// @desc    Create news
// @route   POST /api/content/news
// @access  Private/Admin
router.post('/news', authenticateToken, authorizeRoles('admin'), validateNews, createNews);

// @desc    Update news
// @route   PUT /api/content/news/:id
// @access  Private/Admin
router.put('/news/:id', authenticateToken, authorizeRoles('admin'), validateId, validateNews, updateNews);

// @desc    Delete news
// @route   DELETE /api/content/news/:id
// @access  Private/Admin
router.delete('/news/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteNews);

// @desc    Get all events
// @route   GET /api/content/events
// @access  Public
router.get('/events', validatePagination, getEvents);

// @desc    Create event
// @route   POST /api/content/events
// @access  Private/Admin
router.post('/events', authenticateToken, authorizeRoles('admin'), validateEvent, createEvent);

// @desc    Get all testimonials
// @route   GET /api/content/testimonials
// @access  Public
router.get('/testimonials', validatePagination, getTestimonials);

// @desc    Create testimonial
// @route   POST /api/content/testimonials
// @access  Public
router.post('/testimonials', validateTestimonial, createTestimonial);

// @desc    Get campus life content
// @route   GET /api/content/campus-life
// @access  Public
router.get('/campus-life', getCampusLife);

// @desc    Get optimized home content
// @route   GET /api/content/home
// @access  Public
router.get('/home', getHomeContent);

module.exports = router;
