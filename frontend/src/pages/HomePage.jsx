import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Khoot Clone</h1>
            <p className="text-gray-600">Join a quiz or login as admin!</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="space-y-4">
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
                  {error}
                </div>
              )}
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="Enter Quiz PIN"
                maxLength={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinQuiz();
                  }
                }}
              />
              <button
                onClick={handleJoinQuiz}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
      </div>
    </div>
  );
}

export default HomePage;
