import React, { useState, useEffect } from 'react';
import '../styles/ErrorPopup.css';

/**
 * Error Popup Component
 * Displays error messages in a stylish popup with different styles based on error type
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {string} props.type - Error type (connection_error, authentication_error, game_error, quiz_error, etc.)
 * @param {number} props.duration - How long to show the error in ms (default: 5000ms)
 * @param {function} props.onClose - Optional callback when popup is closed
 */
const ErrorPopup = ({ message, type = 'error', duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  // Determine icon based on error type
  const getIcon = () => {
    switch (type) {
      case 'connection_error':
        return '🔌';
      case 'authentication_error':
        return '🔒';
      case 'game_error':
      case 'quiz_error':
        return '🎮';
      case 'player_error':
        return '👤';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '❌';
    }
  };

  // Handle close animation
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 300); // Animation duration
  };

  // Auto-close after duration
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!visible) return null;

  return (
    <div className={`error-popup ${type} ${closing ? 'closing' : ''}`}>
      <div className="error-popup-content">
        <div className="error-popup-icon">{getIcon()}</div>
        <div className="error-popup-message">{message}</div>
        <button className="error-popup-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
};

export default ErrorPopup;
