const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

/**
 * Authentication middleware for verifying JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new ApiError(401, 'No token, authorization denied');
    }

    // Get JWT secret from environment variable
    const jwtSecret = process.env.JWT_SECRET;
    
    // If JWT_SECRET is not set, return error instead of using an insecure fallback
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      throw new ApiError(500, 'Server configuration error: JWT_SECRET not set');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token has expired'));
    } else if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, 'Authentication failed'));
    }
  }
};

module.exports = authMiddleware;
