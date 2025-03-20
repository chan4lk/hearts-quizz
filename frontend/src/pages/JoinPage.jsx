import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/env';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const JoinPage = () => {
  const navigate = useNavigate();
  const { pin: urlPin } = useParams();
  const [pin, setPin] = useState(urlPin || '');
  const [name, setName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (urlPin) {
      navigate('/join');
    } else {
      navigate(-1);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanPin = pin.trim();

    if (!cleanPin) {
      setError('Please enter a PIN');
      setIsLoading(false);
      return;
    }

    try {
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

    const cleanName = name.trim();

    if (!cleanName) {
      setError('Please enter your name');
      return;
    }

    if (cleanName.toLowerCase() === 'admin') {
      setError('Cannot use "admin" as a player name');
      return;
    }

    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <div className="flex-grow flex items-center justify-center p-4">
          <Header />
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 hover:scale-105">
            <div className="flex flex-col items-center space-y-6">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
                <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Join the Quiz</h1>
              <form onSubmit={handlePinSubmit} className="w-full space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.trim())}
                      placeholder="Enter Quiz PIN"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      disabled={isLoading}
                      required
                    />
                    <svg className="absolute right-3 top-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                    isLoading ? 'bg-gray-400 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Finding Quiz...' : 'Find Quiz'}
                </button>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <Header />
        <div className="bg-white rounded-xl shadow-1xl p-2 max-w-md w-full transform transition-all duration-300 hover:scale-105">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
              <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{quiz.title}</h1>
            <form onSubmit={handleJoinSubmit} className="w-full space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                  <svg className="absolute right-3 top-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Team
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {quiz.teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeam(team)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedTeam?.id === team.id
                          ? 'shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: selectedTeam?.id === team.id ? team.color : undefined,
                        backgroundColor: selectedTeam?.id === team.id ? `${team.color}22` : undefined
                      }}
                    >
                      <div className="text-center">
                        <div
                          className={`w-12 h-12 mx-auto rounded-full mb-2 transition-all duration-200 ${
                            selectedTeam?.id === team.id ? 'transform scale-110' : ''
                          }`}
                          style={{ 
                            backgroundColor: selectedTeam?.id === team.id ? team.color : team.color + '33'
                          }}
                        >
                          <span className="text-white text-lg font-semibold flex items-center justify-center h-full">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                        <div 
                          className={`font-medium transition-all duration-200 ${
                            selectedTeam?.id === team.id ? 'text-lg' : 'text-base'
                          }`}
                          style={{ color: team.color }}
                        >
                          {team.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
              <button
                type="submit"
                disabled={!name || !selectedTeam}
                className={`w-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
                  !name || !selectedTeam
                    ? 'bg-gray-400 cursor-not-allowed'
                    : ''
                }`}
              >
                Join Game
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JoinPage;