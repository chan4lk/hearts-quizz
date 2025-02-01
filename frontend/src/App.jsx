import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';

import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';

const BACKEND_URL = 'http://localhost:5001';

function App() {
  const [socket, setSocket] = React.useState(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  if (!socket) {
    return <div>Connecting to server...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage socket={socket} />} />
            <Route path="/admin" element={<AdminPage socket={socket} />} />
            <Route path="/quiz/:pin" element={<QuizPage socket={socket} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
