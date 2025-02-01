import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './hooks/useSocket';
import { config } from './config/env';

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
      <SocketProvider url={config.BACKEND_URL}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/create-quiz" element={<CreateQuizPage />} />
            <Route path="/join/:pin" element={<JoinPage />} />
            <Route path="/game/:pin" element={<GamePage />} />
            <Route path="/host/:pin" element={<HostPage />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
