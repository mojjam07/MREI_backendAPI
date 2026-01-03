const express = require('express');
const router = express.Router();

// Import controllers
const {
  getDashboardStats,
  getAdminNews,
  createNews,
  updateNews,
  deleteNews,
  getAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAdminCampusLife,
  createCampusLife,
  updateCampusLife,
  deleteCampusLife,
  getAdminBooks,
  createBook,
  updateBook,
  deleteBook,
  getAdminContactMessages,
  updateContactMessage,
  replyContactMessage,
  archiveContactMessage,
  deleteContactMessage,
  getAdminStudents,
  getAdminTutors
} = require('../controllers/dashboardController');

// Import middleware
const { validateNews, validateEvent, validateTestimonial, validateId, validatePagination, validateCampusLife, validateBook } = require('../middleware/validation');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
router.get('/stats', authenticateToken, authorizeRoles('admin'), getDashboardStats);

// @desc    Get all news for admin (including unpublished)
// @route   GET /api/dashboard/admin/news
// @access  Private/Admin
router.get('/admin/news', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminNews);

// @desc    Create news
// @route   POST /api/dashboard/admin/news
// @access  Private/Admin
router.post('/admin/news', authenticateToken, authorizeRoles('admin'), validateNews, createNews);

// @desc    Update news
// @route   PUT /api/dashboard/admin/news/:id
// @access  Private/Admin
router.put('/admin/news/:id', authenticateToken, authorizeRoles('admin'), validateId, validateNews, updateNews);

// @desc    Delete news
// @route   DELETE /api/dashboard/admin/news/:id
// @access  Private/Admin
router.delete('/admin/news/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteNews);

// @desc    Get all events for admin
// @route   GET /api/dashboard/admin/events
// @access  Private/Admin
router.get('/admin/events', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminEvents);

// @desc    Create event
// @route   POST /api/dashboard/admin/events
// @access  Private/Admin
router.post('/admin/events', authenticateToken, authorizeRoles('admin'), validateEvent, createEvent);

// @desc    Update event
// @route   PUT /api/dashboard/admin/events/:id
// @access  Private/Admin
router.put('/admin/events/:id', authenticateToken, authorizeRoles('admin'), validateId, validateEvent, updateEvent);

// @desc    Delete event
// @route   DELETE /api/dashboard/admin/events/:id
// @access  Private/Admin
router.delete('/admin/events/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteEvent);

// @desc    Get all testimonials for admin (including unapproved)
// @route   GET /api/dashboard/admin/testimonials
// @access  Private/Admin
router.get('/admin/testimonials', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminTestimonials);

// @desc    Create testimonial
// @route   POST /api/dashboard/admin/testimonials
// @access  Private/Admin
router.post('/admin/testimonials', authenticateToken, authorizeRoles('admin'), validateTestimonial, createTestimonial);

// @desc    Update testimonial (approve/reject)
// @route   PUT /api/dashboard/admin/testimonials/:id
// @access  Private/Admin
router.put('/admin/testimonials/:id', authenticateToken, authorizeRoles('admin'), validateId, validateTestimonial, updateTestimonial);

// @desc    Delete testimonial
// @route   DELETE /api/dashboard/admin/testimonials/:id
// @access  Private/Admin
router.delete('/admin/testimonials/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteTestimonial);

// @desc    Get all campus life content for admin
// @route   GET /api/dashboard/admin/campus-life
// @access  Private/Admin
router.get('/admin/campus-life', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminCampusLife);

// @desc    Create campus life content
// @route   POST /api/dashboard/admin/campus-life
// @access  Private/Admin
router.post('/admin/campus-life', authenticateToken, authorizeRoles('admin'), validateCampusLife, createCampusLife);

// @desc    Update campus life content
// @route   PUT /api/dashboard/admin/campus-life/:id
// @access  Private/Admin
router.put('/admin/campus-life/:id', authenticateToken, authorizeRoles('admin'), validateId, updateCampusLife);

// @desc    Delete campus life content
// @route   DELETE /api/dashboard/admin/campus-life/:id
// @access  Private/Admin
router.delete('/admin/campus-life/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteCampusLife);

// @desc    Get all books for admin
// @route   GET /api/dashboard/admin/books
// @access  Private/Admin
router.get('/admin/books', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminBooks);

// @desc    Create book
// @route   POST /api/dashboard/admin/books
// @access  Private/Admin
router.post('/admin/books', authenticateToken, authorizeRoles('admin'), validateBook, createBook);

// @desc    Update book
// @route   PUT /api/dashboard/admin/books/:id
// @access  Private/Admin
router.put('/admin/books/:id', authenticateToken, authorizeRoles('admin'), validateId, updateBook);

// @desc    Delete book
// @route   DELETE /api/dashboard/admin/books/:id
// @access  Private/Admin
router.delete('/admin/books/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteBook);

// @desc    Get all contact messages for admin
// @route   GET /api/dashboard/admin/contact-messages
// @access  Private/Admin
router.get('/admin/contact-messages', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminContactMessages);

// @desc    Update contact message (mark as read)
// @route   PUT /api/dashboard/admin/contact-messages/:id
// @access  Private/Admin
router.put('/admin/contact-messages/:id', authenticateToken, authorizeRoles('admin'), validateId, updateContactMessage);

// @desc    Reply to contact message
// @route   POST /api/dashboard/admin/contact-messages/:id/reply
// @access  Private/Admin
router.post('/admin/contact-messages/:id/reply', authenticateToken, authorizeRoles('admin'), validateId, replyContactMessage);

// @desc    Archive contact message
// @route   PUT /api/dashboard/admin/contact-messages/:id/archive
// @access  Private/Admin
router.put('/admin/contact-messages/:id/archive', authenticateToken, authorizeRoles('admin'), validateId, archiveContactMessage);

// @desc    Delete contact message
// @route   DELETE /api/dashboard/admin/contact-messages/:id
// @access  Private/Admin
router.delete('/admin/contact-messages/:id', authenticateToken, authorizeRoles('admin'), validateId, deleteContactMessage);

// @desc    Get all students for admin
// @route   GET /api/dashboard/admin/students
// @access  Private/Admin
router.get('/admin/students', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminStudents);

// @desc    Get all tutors for admin
// @route   GET /api/dashboard/admin/tutors
// @access  Private/Admin
router.get('/admin/tutors', authenticateToken, authorizeRoles('admin'), validatePagination, getAdminTutors);

module.exports = router;

