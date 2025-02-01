import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/env';

const JoinPage = () => {
  const navigate = useNavigate();
  const { pin: urlPin } = useParams();
  const [pin, setPin] = useState(urlPin || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate input
    const cleanPin = pin.trim();
    const cleanName = name.trim();

    if (!cleanPin || !cleanName) {
      setError('Please enter both PIN and name');
      setIsLoading(false);
      return;
    }

    if (cleanName.toLowerCase() === 'admin') {
      setError('Cannot use "admin" as a player name');
      setIsLoading(false);
      return;
    }

    try {
      // First verify the quiz exists
      const response = await axios.get(`${API_URL}/api/quizzes/pin/${cleanPin}`);
      if (response.data) {
        // Navigate to game page with player info
        navigate(`/game/${cleanPin}`, { 
          state: { 
            playerName: cleanName,
            quiz: response.data
          }
        });
      }
    } catch (err) {
      console.error('Error joining quiz:', err);
      if (err.response?.status === 404) {
        setError('Quiz not found. Please check the PIN.');
      } else {
        setError('Failed to join quiz. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Join Quiz
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Game PIN
              </label>
              <input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.trim())}
                placeholder="Enter game PIN"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                required
                maxLength={20}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-md text-white transition-colors ${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
