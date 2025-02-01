import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './hooks/useSocket';
import { API_URL } from './config/env';

import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import CreateQuizPage from './pages/CreateQuizPage';
import JoinPage from './pages/JoinPage';
import GamePage from './pages/GamePage';
import HostPage from './pages/HostPage';

function App() {
  return (
    <Router>
      <SocketProvider url={API_URL}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/join/:pin" element={<JoinPage />} />
            <Route path="/game/:pin" element={<GamePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/host/:pin" element={<HostPage />} />
            <Route path="/create-quiz" element={<CreateQuizPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
