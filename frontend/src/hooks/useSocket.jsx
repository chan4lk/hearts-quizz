import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';
import { useError } from '../context/ErrorContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, url = SOCKET_URL }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { addError } = useError();

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      addError(
        `Connection error: ${error.message}. Please check your internet connection.`,
        'connection_error',
        8000
      );
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected the client
        addError(
          'You were disconnected by the server. Please refresh the page to reconnect.',
          'connection_error',
          8000
        );
      } else if (reason === 'transport close') {
        // Connection lost
        addError(
          'Connection lost. Attempting to reconnect...',
          'connection_error',
          5000
        );
      }
    });

    // Handle server-side errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      
      // Display appropriate error message based on error type
      switch(error.type) {
        case 'authentication_error':
          addError(error.message, 'authentication_error', 8000);
          break;
        case 'game_error':
        case 'quiz_error':
          addError(error.message, error.type, 5000);
          break;
        case 'player_error':
          addError(error.message, 'player_error', 5000);
          break;
        default:
          addError(error.message || 'An unknown error occurred', 'server_error', 5000);
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [url, addError]);

  if (!socket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">
          {connectionError ? `Connection error: ${connectionError}` : 'Connecting to server...'}
        </div>
      </div>
    );
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default useSocket;
