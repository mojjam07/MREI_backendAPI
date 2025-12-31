const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      // Return 401 for invalid/expired tokens (401 = Unauthorized, 403 = Forbidden)
      const message = err.name === 'TokenExpiredError' 
        ? 'Token has expired' 
        : 'Invalid token';
      return res.status(401).json({
        success: false,
        message: message,
        code: 'TOKEN_INVALID'
      });
    }
    
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    tokenType: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', {
    expiresIn: '7d'
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  generateToken,
  generateRefreshToken
};
