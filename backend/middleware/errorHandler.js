/**
 * Centralized error handling middleware
 * Handles different types of errors and provides appropriate responses
 * without exposing sensitive information
 */

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error('Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // For development environment, provide more details
  const response = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && err.isOperational && { details: err.stack.split('\n')[0] })
  };

  // Don't expose server errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
    response.error = message;
  }

  // Send error response
  res.status(statusCode).json(response);
};

// 404 handler middleware
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler
};
