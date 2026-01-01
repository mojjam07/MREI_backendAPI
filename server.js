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
const { deprecationWarning } = require('./src/middleware/deprecation');

// --------------------
// Import routes
// --------------------
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const studentRoutes = require('./src/routes/students');
const tutorRoutes = require('./src/routes/tutors');
const academicRoutes = require('./src/routes/academics');
const communicationRoutes = require('./src/routes/communication');
const contentRoutes = require('./src/routes/content');
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
// Disable rate limiting in test environment
const isTest = process.env.NODE_ENV === 'test';

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  // CRITICAL: Skip OPTIONS preflight requests to avoid CORS issues
  skip: (req) => req.method === 'OPTIONS' || isTest
});
app.use(limiter);

// --------------------
// CORS (local + production safe)
// --------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8000',
  'https://mrei-frontend.vercel.app',  // Allow all Vercel preview deployments
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check wildcard pattern for Vercel preview deployments
    if (origin.match(/https:\/\/.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  maxAge: 86400  // Cache preflight response for 24 hours
}));

// This line ensures OPTIONS preflight requests are handled for all routes
app.options('*', cors());

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
// Explicit CORS headers for test environment
// --------------------
// This ensures CORS headers are always set, even when no Origin header is sent (e.g., supertest)
app.use((req, res, next) => {
  // Always set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// --------------------
// Deprecation warnings
// --------------------
app.use(deprecationWarning);

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
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
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
app.use('/api/content', contentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

// --------------------
// Static files (uploads)
// --------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------
// SPA Fallback for client-side routing (MUST be before API routes and error handlers)
// --------------------
// Serve index.html for all non-API routes - this fixes 404 on page refresh
// The order matters: API routes first, then static files, then SPA fallback
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all handler for SPA routes - must be AFTER static files but BEFORE error handlers
app.get('*', (req, res, next) => {
  // Only handle non-API routes that don't match a file
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    // Check if the request is for an API endpoint that doesn't exist
    return res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
  // Let the next middleware (notFound) handle undefined API routes
  next();
});

// --------------------
// Error handlers (LAST)
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// Database Migration and Server Startup
// --------------------
async function startServer() {
  try {
    // Import and run migrations before starting server
    console.log('🔄 Starting database migration process...');
    const { runMigrations } = require('./scripts/migrate.js');
    await runMigrations();
    console.log('✅ Database migrations completed successfully');

    // Start the HTTP server
    app.listen(PORT, () => {
      console.log('====================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🩺 Health check: /health`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Loaded' : 'Missing'}`);
      console.log('====================================');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Database migration may have failed. Please check your database connection and try again.');
    process.exit(1);
  }
}

// Start the server with migrations (only when run directly, not when imported for testing)
if (require.main === module) {
  startServer();
}

// --------------------
// Process-level safety (only in main module)
// --------------------
if (require.main === module) {
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
