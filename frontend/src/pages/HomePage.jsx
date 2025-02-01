import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinQuiz = () => {
    if (!pin.trim()) {
      setError('Please enter a PIN');
      return;
    }

    const cleanPin = pin.trim().toUpperCase();
    navigate(`/join/${cleanPin}`);
  };

  const handleAdminLogin = () => {
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoinQuiz();
              }
            }}
          />
          <button
            onClick={handleJoinQuiz}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
          <div className="text-center">
            <button
              onClick={handleAdminLogin}
              className="text-blue-500 hover:text-blue-600"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
