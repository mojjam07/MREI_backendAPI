// Deprecation Warning Middleware
const deprecationWarning = (req, res, next) => {
  // Add deprecation headers to all responses
  res.set({
    'X-API-Version': '2.0',
    'X-API-Deprecated': 'false',
    'X-API-Deprecation-Date': '2024-12-31',
    'X-API-Migration-Guide': '/api/docs/migration-guide'
  });
  
  next();
};

// Specific deprecation warnings for old endpoints
const deprecatedEndpoints = [
  {
    pattern: /^\/api\/communication\/(news|events|testimonials|home-content)/,
    message: 'This endpoint is deprecated and will be removed on 2024-12-31. Use /api/content/ instead.',
    alternative: '/api/content/{endpoint}'
  },
  {
    pattern: /^\/api\/communication\/news/,
    message: 'Use /api/content/news instead',
    alternative: '/api/content/news'
  },
  {
    pattern: /^\/api\/communication\/events/,
    message: 'Use /api/content/events instead', 
    alternative: '/api/content/events'
  },
  {
    pattern: /^\/api\/communication\/testimonials/,
    message: 'Use /api/content/testimonials instead',
    alternative: '/api/content/testimonials'
  },
  {
    pattern: /^\/api\/communication\/home-content/,
    message: 'Use /api/content/home instead',
    alternative: '/api/content/home'
  }
];

const checkDeprecatedEndpoints = (req, res, next) => {
  const path = req.path;
  
  // Check if the current path matches any deprecated endpoint patterns
  const deprecatedEndpoint = deprecatedEndpoints.find(endpoint => 
    endpoint.pattern.test(path)
  );
  
  if (deprecatedEndpoint) {
    // Add deprecation headers
    res.set({
      'Warning': `299 - "${deprecatedEndpoint.message}"`,
      'X-API-Deprecated': 'true',
      'X-API-Alternative': deprecatedEndpoint.alternative,
      'X-API-Migration-Required': 'true'
    });
    
    // Log deprecation warning for monitoring
    console.warn(`[DEPRECATED] ${req.method} ${path} - ${deprecatedEndpoint.message}`);
  }
  
  next();
};

module.exports = {
  deprecationWarning,
  checkDeprecatedEndpoints,
  deprecatedEndpoints
};
