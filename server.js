// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// require('dotenv').config();

// // Import middleware
// const { errorHandler, notFound } = require('./src/middleware/errorHandler');
// const { preventDuplicateRequests } = require('./src/middleware/requestDeduplicator');

// // Import routes
// const authRoutes = require('./src/routes/auth');
// const userRoutes = require('./src/routes/users');
// const studentRoutes = require('./src/routes/students');
// const tutorRoutes = require('./src/routes/tutors');
// const academicRoutes = require('./src/routes/academics');
// const communicationRoutes = require('./src/routes/communication');
// const dashboardRoutes = require('./src/routes/dashboard');
// const adminRoutes = require('./src/routes/admin');
// const searchRoutes = require('./src/routes/search');

// const app = express();
// const PORT = process.env.PORT || 8000;

// // Trust proxy for rate limiting and security headers
// app.set('trust proxy', 1);

// // Security middleware
// app.use(helmet());

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// // CORS configuration
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true,
//   optionsSuccessStatus: 200,
// }));

// // Request deduplication middleware (before routes)
// app.use(preventDuplicateRequests({
//   ttl: 30000, // 30 seconds
//   methods: ['GET'],
//   excludePaths: ['/auth', '/users'] // Don't cache auth or user management
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Logging middleware
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
//   next();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/students', studentRoutes);
// app.use('/api/tutors', tutorRoutes);
// app.use('/api/academics', academicRoutes);
// app.use('/api/communication', communicationRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/search', searchRoutes);

// // Serve static files (for uploaded files)
// app.use('/uploads', express.static('uploads'));

// // 404 handler
// app.use(notFound);

// // Global error handler
// app.use(errorHandler);

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
//   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`📝 API Documentation available at http://localhost:${PORT}/health`);
//   console.log(`🔐 JWT Secret configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//   console.log('Unhandled Rejection:', err.message);
//   process.exit(1);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.log('Uncaught Exception:', err.message);
//   process.exit(1);
// });

// module.exports = app;

/**
 * MREI Backend API
 * Production-ready Express server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// --------------------
// Import middleware
// --------------------
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { preventDuplicateRequests } = require('./src/middleware/requestDeduplicator');

// --------------------
// Import routes
// --------------------
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const studentRoutes = require('./src/routes/students');
const tutorRoutes = require('./src/routes/tutors');
const academicRoutes = require('./src/routes/academics');
const communicationRoutes = require('./src/routes/communication');
const dashboardRoutes = require('./src/routes/dashboard');
const adminRoutes = require('./src/routes/admin');
const searchRoutes = require('./src/routes/search');

// --------------------
// App initialization
// --------------------
const app = express();
const PORT = process.env.PORT || 8000;

// Required for Render, proxies & rate-limiting
app.set('trust proxy', 1);

// --------------------
// Security middleware
// --------------------
app.use(helmet());

// --------------------
// Rate limiting
// --------------------
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// --------------------
// CORS (local + production safe)
// --------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

// --------------------
// Body parsers
// --------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --------------------
// Request logging
// --------------------
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// --------------------
// Request deduplication
// --------------------
app.use(
  preventDuplicateRequests({
    ttl: 30000,
    methods: ['GET'],
    excludePaths: ['/health', '/api/auth', '/api/users']
  })
);

// --------------------
// Root endpoint (IMPORTANT)
// --------------------
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'MREI Backend API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    health: '/health'
  });
});

// --------------------
// Health check (Render-safe)
// --------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// --------------------
// API Routes
// --------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

// --------------------
// Static files (uploads)
// --------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------
// Error handlers (LAST)
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// Start server
// --------------------
app.listen(PORT, () => {
  console.log('====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🩺 Health check: /health`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Loaded' : 'Missing'}`);
  console.log('====================================');
});

// --------------------
// Process-level safety
// --------------------
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
