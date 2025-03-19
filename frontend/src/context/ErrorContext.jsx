import React, { createContext, useContext, useState, useCallback } from 'react';
import ErrorPopup from '../components/ErrorPopup';

// Create context
const ErrorContext = createContext();

/**
 * Error Provider Component
 * Manages application-wide error state and displays error popups
 */
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  // Add a new error to the queue
  const addError = useCallback((message, type = 'error', duration = 5000) => {
    const id = Date.now(); // Simple unique ID
    setErrors(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  // Remove an error from the queue
  const removeError = useCallback((id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Context value
  const value = {
    errors,
    addError,
    removeError,
    clearErrors
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      {/* Render all active error popups */}
      <div className="error-popup-container">
        {errors.map((error) => (
          <ErrorPopup
            key={error.id}
            message={error.message}
            type={error.type}
            duration={error.duration}
            onClose={() => removeError(error.id)}
          />
        ))}
      </div>
    </ErrorContext.Provider>
  );
};

// Custom hook to use the error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;
