import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, url = 'http://localhost:5001' }) => {
  const [socket, setSocket] = useState(null);

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
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [url]);

  if (!socket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Connecting to server...</div>
      </div>
    );
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return socket;
};

export default useSocket;
