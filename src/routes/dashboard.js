const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStudentDashboard,
  getTutorDashboard,
  getAdminDashboard,
  getDashboardStats,
  // Admin management functions
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  approveTestimonial,
  toggleTestimonialApproval,
  getAllCampusLife,
  createCampusLife,
  updateCampusLife,
  deleteCampusLife,
  getAllContactMessages,
  updateContactMessage,
  markContactMessageRead,
  deleteContactMessage
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

// ================================
// ADMIN MANAGEMENT ROUTES
// ================================

// NEWS MANAGEMENT ROUTES
// @desc    Get all news
// @route   GET /api/admin/news
// @access  Private/Admin
router.get('/admin/news', authenticateToken, authorizeRoles('admin'), getAllNews);

// @desc    Create news
// @route   POST /api/admin/news
// @access  Private/Admin
router.post('/admin/news', authenticateToken, authorizeRoles('admin'), createNews);

// @desc    Update news
// @route   PUT /api/admin/news/:id
// @access  Private/Admin
router.put('/admin/news/:id', authenticateToken, authorizeRoles('admin'), updateNews);

// @desc    Delete news
// @route   DELETE /api/admin/news/:id
// @access  Private/Admin
router.delete('/admin/news/:id', authenticateToken, authorizeRoles('admin'), deleteNews);

// EVENTS MANAGEMENT ROUTES
// @desc    Get all events
// @route   GET /api/admin/events
// @access  Private/Admin
router.get('/admin/events', authenticateToken, authorizeRoles('admin'), getAllEvents);

// @desc    Create event
// @route   POST /api/admin/events
// @access  Private/Admin
router.post('/admin/events', authenticateToken, authorizeRoles('admin'), createEvent);

// @desc    Update event
// @route   PUT /api/admin/events/:id
// @access  Private/Admin
router.put('/admin/events/:id', authenticateToken, authorizeRoles('admin'), updateEvent);

// @desc    Delete event
// @route   DELETE /api/admin/events/:id
// @access  Private/Admin
router.delete('/admin/events/:id', authenticateToken, authorizeRoles('admin'), deleteEvent);

// TESTIMONIALS MANAGEMENT ROUTES
// @desc    Get all testimonials
// @route   GET /api/admin/testimonials
// @access  Private/Admin
router.get('/admin/testimonials', authenticateToken, authorizeRoles('admin'), getAllTestimonials);

// @desc    Create testimonial
// @route   POST /api/admin/testimonials
// @access  Private/Admin
router.post('/admin/testimonials', authenticateToken, authorizeRoles('admin'), createTestimonial);

// @desc    Update testimonial
// @route   PUT /api/admin/testimonials/:id
// @access  Private/Admin
router.put('/admin/testimonials/:id', authenticateToken, authorizeRoles('admin'), updateTestimonial);

// @desc    Delete testimonial
// @route   DELETE /api/admin/testimonials/:id
// @access  Private/Admin
router.delete('/admin/testimonials/:id', authenticateToken, authorizeRoles('admin'), deleteTestimonial);

// @desc    Approve testimonial
// @route   PUT /api/admin/testimonials/:id/approve
// @access  Private/Admin
router.put('/admin/testimonials/:id/approve', authenticateToken, authorizeRoles('admin'), approveTestimonial);

// @desc    Toggle testimonial approval
// @route   PUT /api/admin/testimonials/:id/toggle-approval
// @access  Private/Admin
router.put('/admin/testimonials/:id/toggle-approval', authenticateToken, authorizeRoles('admin'), toggleTestimonialApproval);

// CAMPUS LIFE MANAGEMENT ROUTES
// @desc    Get all campus life content
// @route   GET /api/admin/campus-life
// @access  Private/Admin
router.get('/admin/campus-life', authenticateToken, authorizeRoles('admin'), getAllCampusLife);

// @desc    Create campus life content
// @route   POST /api/admin/campus-life
// @access  Private/Admin
router.post('/admin/campus-life', authenticateToken, authorizeRoles('admin'), createCampusLife);

// @desc    Update campus life content
// @route   PUT /api/admin/campus-life/:id
// @access  Private/Admin
router.put('/admin/campus-life/:id', authenticateToken, authorizeRoles('admin'), updateCampusLife);

// @desc    Delete campus life content
// @route   DELETE /api/admin/campus-life/:id
// @access  Private/Admin
router.delete('/admin/campus-life/:id', authenticateToken, authorizeRoles('admin'), deleteCampusLife);

// CONTACT MESSAGES MANAGEMENT ROUTES
// @desc    Get all contact messages
// @route   GET /api/admin/contact-messages
// @access  Private/Admin
router.get('/admin/contact-messages', authenticateToken, authorizeRoles('admin'), getAllContactMessages);

// @desc    Update contact message
// @route   PUT /api/admin/contact-messages/:id
// @access  Private/Admin
router.put('/admin/contact-messages/:id', authenticateToken, authorizeRoles('admin'), updateContactMessage);

// @desc    Mark contact message as read
// @route   PUT /api/admin/contact-messages/:id/read
// @access  Private/Admin
router.put('/admin/contact-messages/:id/read', authenticateToken, authorizeRoles('admin'), markContactMessageRead);

// @desc    Delete contact message
// @route   DELETE /api/admin/contact-messages/:id
// @access  Private/Admin
router.delete('/admin/contact-messages/:id', authenticateToken, authorizeRoles('admin'), deleteContactMessage);

module.exports = router;
