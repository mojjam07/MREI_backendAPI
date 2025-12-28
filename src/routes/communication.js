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
  deleteBook
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

// @desc    Get placeholder image
// @route   GET /api/communication/placeholder/:width/:height
// @access  Public
router.get('/placeholder/:width/:height', getPlaceholder);

module.exports = router;
