/**
 * Request deduplication middleware to prevent duplicate API requests
 * This helps avoid unnecessary database queries and improves performance
 */

class RequestDeduplicator {
  constructor(ttl = 30000) { // 30 seconds default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Generate a unique key for the request
   */
  generateKey(req) {
    const { method, url, query, body, user } = req;
    const userId = user ? user.id || user.user_id : 'anonymous';
    
    // Include relevant parts of the request to create a unique key
    const keyData = {
      method,
      url,
      query: JSON.stringify(query),
      body: typeof body === 'object' ? JSON.stringify(body) : body,
      userId
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Check if a request is a duplicate
   */
  isDuplicate(key) {
    const now = Date.now();
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if the entry has expired
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Mark a request as processed
   */
  markAsProcessed(key, response) {
    this.cache.set(key, {
      timestamp: Date.now(),
      response
    });
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(key) {
    const entry = this.cache.get(key);
    return entry ? entry.response : null;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton instance
const deduplicator = new RequestDeduplicator();

// Middleware function
const preventDuplicateRequests = (options = {}) => {
  const { ttl = 30000, methods = ['GET'], excludePaths = [] } = options;
  
  // Update TTL if provided
  if (ttl !== 30000) {
    deduplicator.ttl = ttl;
  }
  
  return (req, res, next) => {
    // Skip if method is not in the list
    if (!methods.includes(req.method.toUpperCase())) {
      return next();
    }
    
    // Skip if path is in exclude list
    if (excludePaths.some(path => req.path.includes(path))) {
      return next();
    }
    
    const key = deduplicator.generateKey(req);
    
    if (deduplicator.isDuplicate(key)) {
      console.log(`Duplicate request detected: ${req.method} ${req.path}`);
      
      // Get cached response
      const cachedResponse = deduplicator.getCachedResponse(key);
      if (cachedResponse) {
        return res.status(200).json(cachedResponse);
      }
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        deduplicator.markAsProcessed(key, data);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Clean up expired entries every 5 minutes
setInterval(() => {
  deduplicator.cleanup();
}, 5 * 60 * 1000);

module.exports = {
  preventDuplicateRequests,
  RequestDeduplicator
};
