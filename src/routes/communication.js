const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStatistics,
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
  getContactMessages,
  createContactMessage,
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getDashboardStats,
  getHomeContent
} = require('../controllers/communicationController');

const { getPlaceholder } = require('../controllers/placeholderController');

// Import middleware
const { validateNews, validateEvent, validateTestimonial, validateContact, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get all statistics
// @route   GET /api/communication/statistics
// @access  Public
router.get('/statistics', getStatistics);

// @desc    Get all news
// @route   GET /api/communication/news
// @access  Public
router.get('/news', validatePagination, getNews);

// @desc    Get news by ID
// @route   GET /api/communication/news/:id
// @access  Public
router.get('/news/:id', validateId, getNewsById);

// @desc    Create news
// @route   POST /api/communication/news
// @access  Private/Admin
router.post('/news', authenticateToken, authorizeRoles('admin'), validateNews, createNews);

// @desc    Update news
// @route   PUT /api/communication/news/:id
// @access  Private/Admin
router.put('/news/:id', authenticateToken, authorizeRoles('admin'), validateId, validateNews, updateNews);

// @desc    Delete news
// @route   DELETE /api/communication/news/:id
// @access  Private/Admin
router.delete('/news/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteNews);

// @desc    Get all events
// @route   GET /api/communication/events
// @access  Public
router.get('/events', validatePagination, getEvents);

// @desc    Create event
// @route   POST /api/communication/events
// @access  Private/Admin
router.post('/events', authenticateToken, authorizeRoles('admin'), validateEvent, createEvent);

// @desc    Get all testimonials
// @route   GET /api/communication/testimonials
// @access  Public
router.get('/testimonials', validatePagination, getTestimonials);

// @desc    Create testimonial
// @route   POST /api/communication/testimonials
// @access  Public
router.post('/testimonials', validateTestimonial, createTestimonial);

// @desc    Get campus life content
// @route   GET /api/communication/campus-life
// @access  Public
router.get('/campus-life', getCampusLife);

// @desc    Get contact messages
// @route   GET /api/communication/contact
// @access  Private/Admin
router.get('/contact', authenticateToken, authorizeRoles('admin'), validatePagination, getContactMessages);

// @desc    Create contact message
// @route   POST /api/communication/contact
// @access  Public
router.post('/contact', validateContact, createContactMessage);

// @desc    Get books
// @route   GET /api/communication/books
// @access  Public
router.get('/books', validatePagination, getBooks);

// @desc    Create book
// @route   POST /api/communication/books
// @access  Private/Admin
router.post('/books', authenticateToken, authorizeRoles('admin'), createBook);

// @desc    Update book
// @route   PUT /api/communication/books/:id
// @access  Private/Admin
router.put('/books/:id', authenticateToken, authorizeRoles('admin'), validateId, updateBook);

// @desc    Delete book
// @route   DELETE /api/communication/books/:id
// @access  Private/Admin
router.delete('/books/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteBook);

// @desc    Get dashboard stats
// @route   GET /api/communication/dashboard-stats
// @access  Private
router.get('/dashboard-stats', authenticateToken, getDashboardStats);

// @desc    Get home content (news and events)
// @route   GET /api/communication/home-content
// @access  Public
router.get('/home-content', getHomeContent);

// @desc    Get placeholder image
// @route   GET /api/communication/placeholder/:width/:height
// @access  Public
router.get('/placeholder/:width/:height', getPlaceholder);

module.exports = router;
