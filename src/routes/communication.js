const express = require('express');
const router = express.Router();

// Import controllers
const {
  getCommunicationOverview,
  getContactMessages,
  createContactMessage,
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getDashboardStats,
  getHomeContent,
  getNews,
  getEvents,
  getTestimonials,
  getCampusLife
} = require('../controllers/communicationController');

const { getPlaceholder } = require('../controllers/placeholderController');

// Import middleware
const { validateContact, validateId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get communication overview
// @route   GET /api/communication
// @access  Public
router.get('/', getCommunicationOverview);

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

// @desc    Get news
// @route   GET /api/communication/news
// @access  Public
router.get('/news', validatePagination, getNews);

// @desc    Get events
// @route   GET /api/communication/events
// @access  Public
router.get('/events', validatePagination, getEvents);

// @desc    Get testimonials
// @route   GET /api/communication/testimonials
// @access  Public
router.get('/testimonials', validatePagination, getTestimonials);

// @desc    Get campus life content
// @route   GET /api/communication/campus-life
// @access  Public
router.get('/campus-life', validatePagination, getCampusLife);

// @desc    Get placeholder image
// @route   GET /api/communication/placeholder/:width/:height
// @access  Public
router.get('/placeholder/:width/:height', getPlaceholder);

module.exports = router;
