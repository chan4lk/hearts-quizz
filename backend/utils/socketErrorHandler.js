/**
 * Socket error handling utility
 * Provides standardized error handling for socket.io connections
 */

// Error types for socket communication
const SocketErrorTypes = {
  CONNECTION: 'connection_error',
  AUTHENTICATION: 'authentication_error',
  GAME: 'game_error',
  QUIZ: 'quiz_error',
  PLAYER: 'player_error',
  SERVER: 'server_error'
};

/**
 * Create a standardized error object for socket communication
 * @param {string} type - Error type from SocketErrorTypes
 * @param {string} message - Error message
 * @param {object} details - Additional error details (optional)
 * @returns {object} Standardized error object
 */
function createSocketError(type, message, details = null) {
  const error = {
    type,
    message,
    timestamp: new Date().toISOString()
  };

  // Only include details in development mode
  if (details && process.env.NODE_ENV !== 'production') {
    error.details = details;
  }

  return error;
}

/**
 * Handle socket errors with proper logging and client notification
 * @param {object} socket - Socket.io socket object
 * @param {string} event - Event name that triggered the error
 * @param {Error} error - Error object
 */
function handleSocketError(socket, event, error) {
  // Log the error server-side
  console.error(`Socket Error [${event}]:`, error.message);
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.stack);
  }

  // Determine error type
  let errorType = SocketErrorTypes.SERVER;
  let errorMessage = 'An unexpected error occurred';

  // Map common errors to user-friendly messages
  if (error.message.includes('authentication') || error.message.includes('token')) {
    errorType = SocketErrorTypes.AUTHENTICATION;
    errorMessage = 'Authentication failed. Please log in again.';
  } else if (error.message.includes('quiz') || error.message.includes('question')) {
    errorType = SocketErrorTypes.QUIZ;
    errorMessage = 'There was a problem with the quiz data.';
  } else if (error.message.includes('game') || error.message.includes('player')) {
    errorType = SocketErrorTypes.GAME;
    errorMessage = 'There was a problem with the game state.';
  } else if (error.message.includes('connect')) {
    errorType = SocketErrorTypes.CONNECTION;
    errorMessage = 'Connection error. Please check your internet connection.';
  }

  // Send error to client
  socket.emit('error', createSocketError(
    errorType,
    errorMessage,
    process.env.NODE_ENV !== 'production' ? error.message : null
  ));
}

module.exports = {
  SocketErrorTypes,
  createSocketError,
  handleSocketError
};
