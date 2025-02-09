import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/env';

const JoinPage = () => {
  const navigate = useNavigate();
  const { pin: urlPin } = useParams();
  const [pin, setPin] = useState(urlPin || '');
  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate input
    const cleanPin = pin.trim();

    if (!cleanPin) {
      setError('Please enter a PIN');
      setIsLoading(false);
      return;
    }

    try {
      // First verify the quiz exists
      const response = await axios.get(`${API_URL}/api/quizzes/pin/${cleanPin}`);
      if (response.data) {
        setQuiz(response.data);
      }
    } catch (err) {
      console.error('Error finding quiz:', err);
      if (err.response?.status === 404) {
        setError('Quiz not found. Please check the PIN.');
      } else {
        setError('Failed to find quiz. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate input
    const cleanName = name.trim();

    if (!cleanName || !selectedTeam) {
      setError('Please enter your name and select a team');
      return;
    }

    if (cleanName.toLowerCase() === 'admin') {
      setError('Cannot use "admin" as a player name');
      return;
    }

    // Navigate to game page with player info
    navigate(`/game/${pin}`, { 
      state: { 
        playerName: cleanName,
        quiz: quiz,
        team: selectedTeam
      }
    });
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                Join Quiz
              </h1>
              <p className="text-gray-600">Enter the game PIN to start</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="pin"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Game PIN
                </label>
                <div className="relative">
                  <input
                    id="pin"
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.trim())}
                    placeholder="Enter game PIN"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {isLoading ? 'Finding Quiz...' : 'Find Quiz'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
              {quiz.title}
            </h1>
            <p className="text-gray-600">Choose your team and enter your name</p>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Team
              </label>
              <div className="grid grid-cols-2 gap-4">
                {quiz.teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelectedTeam(team)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTeam?.id === team.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                    style={{ backgroundColor: selectedTeam?.id === team.id ? team.color + '20' : 'white' }}
                  >
                    <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: team.color }} />
                    <div className="text-center font-medium">{team.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
