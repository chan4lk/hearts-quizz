import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';

import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001', {
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
      <Routes>
        <Route path="/" element={<HomePage socket={socket} />} />
        <Route path="/quiz/:pin" element={<QuizPage socket={socket} />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
