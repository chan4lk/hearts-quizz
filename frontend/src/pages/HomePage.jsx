import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage({ socket }) {
  const [pin, setPin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinQuiz = () => {
    if (!pin.trim() || !playerName.trim()) {
      setError('Please enter both PIN and your name');
      return;
    }

    const cleanPin = pin.trim().toUpperCase();
    const cleanName = playerName.trim();

    socket.emit('join_quiz', { pin: cleanPin, playerName: cleanName });
    navigate(`/quiz/${cleanPin}`, { 
      state: { playerName: cleanName } 
    });
  };

  const handleAdminLogin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">Khoot Clone</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Join a Quiz</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            placeholder="Enter Quiz PIN"
            maxLength={6}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter Your Name"
            maxLength={15}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoinQuiz}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Quiz
          </button>
          <div className="text-center">
            <button
              onClick={handleAdminLogin}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Login as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
