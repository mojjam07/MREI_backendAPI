const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('role')
    .isIn(['student', 'tutor', 'admin'])
    .withMessage('Role must be student, tutor, or admin'),
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateTokenRefresh = [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors
];

// User validation rules
const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('first_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('last_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Student validation rules
const validateStudentUpdate = [
  body('student_id')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Student ID is required'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('emergency_contact')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Emergency contact must not exceed 100 characters'),
  handleValidationErrors
];

// Tutor validation rules
const validateTutorUpdate = [
  body('tutor_id')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Tutor ID is required'),
  body('specialization')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Specialization must not exceed 200 characters'),
  body('qualification')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Qualification must not exceed 200 characters'),
  body('experience_years')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience years must be a positive integer'),
  handleValidationErrors
];

// Course validation rules
const validateCourse = [
  body('title')
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 200 })
    .withMessage('Course title must not exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ max: 1000 })
    .withMessage('Course description must not exceed 1000 characters'),
  body('credits')
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('tutor_id')
    .notEmpty()
    .withMessage('Tutor ID is required'),
  handleValidationErrors
];

const validateAssignment = [
  body('title')
    .notEmpty()
    .withMessage('Assignment title is required')
    .isLength({ max: 200 })
    .withMessage('Assignment title must not exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Assignment description is required'),
  body('course_id')
    .notEmpty()
    .withMessage('Course ID is required'),
  body('due_date')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('max_score')
    .isInt({ min: 1 })
    .withMessage('Max score must be a positive integer'),
  handleValidationErrors
];

const validateSubmission = [
  body('assignment_id')
    .notEmpty()
    .withMessage('Assignment ID is required'),
  body('content')
    .notEmpty()
    .withMessage('Submission content is required'),
  handleValidationErrors
];

const validateEnrollment = [
  body('student_id')
    .notEmpty()
    .withMessage('Student ID is required'),
  body('course_id')
    .notEmpty()
    .withMessage('Course ID is required'),
  handleValidationErrors
];

const validateAttendance = [
  body('student_id')
    .notEmpty()
    .withMessage('Student ID is required'),
  body('course_id')
    .notEmpty()
    .withMessage('Course ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Status must be present, absent, or late'),
  handleValidationErrors
];

// Communication validation rules
const validateNews = [
  body('title')
    .notEmpty()
    .withMessage('News title is required')
    .isLength({ max: 200 })
    .withMessage('News title must not exceed 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('News content is required'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  handleValidationErrors
];

const validateEvent = [
  body('title')
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ max: 200 })
    .withMessage('Event title must not exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Event description is required'),
  body('event_date')
    .isISO8601()
    .withMessage('Please provide a valid event date'),
  body('location')
    .notEmpty()
    .withMessage('Event location is required'),
  handleValidationErrors
];

const validateTestimonial = [
  body('student_name')
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ max: 100 })
    .withMessage('Student name must not exceed 100 characters'),
  body('content')
    .notEmpty()
    .withMessage('Testimonial content is required')
    .isLength({ max: 1000 })
    .withMessage('Testimonial content must not exceed 1000 characters'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  handleValidationErrors
];

const validateContact = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject must not exceed 200 characters'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters'),
  handleValidationErrors
];

// Parameter validation
const validateId = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateTokenRefresh,
  validateUserUpdate,
  validateStudentUpdate,
  validateTutorUpdate,
  validateCourse,
  validateAssignment,
  validateSubmission,
  validateEnrollment,
  validateAttendance,
  validateNews,
  validateEvent,
  validateTestimonial,
  validateContact,
  validateId,
  validatePagination
};
