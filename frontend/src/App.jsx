import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';

import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001', {
  autoConnect: false
});

function App() {
  useEffect(() => {
    // Connect socket when component mounts
    socket.connect();

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage socket={socket} />} />
            <Route path="/quiz/:pin" element={<QuizPage socket={socket} />} />
            <Route path="/admin" element={<AdminPage socket={socket} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
