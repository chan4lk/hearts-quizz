import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../config/env';
import Header from '../components/Header';

const HostPage = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [quiz, setQuiz] = useState(location.state?.quiz);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (!isConnected || !socket || !pin) return;

    socket.emit('join_quiz', { pin, playerName: 'admin' });

    socket.on('quiz_error', ({ message }) => {
      console.error('Quiz error:', message);
      setError(message);
      navigate('/');
    });

    socket.on('quiz_data', (data) => {
      setQuiz(data);
    });

    socket.on('player_joined', ({ players }) => {
      const gamePlayers = players.filter(p => p !== 'admin');
      setPlayers(gamePlayers);
    });

    socket.on('quiz_started', () => {
      setGameStarted(true);
      setShowLeaderboard(false);
    });

    socket.on('question_start', ({ question }) => {
      setCurrentQuestion(question);
      console.log('Starting question:', question);
      setTimeLeft(question.timeLimit);
      setShowLeaderboard(false);
    });

    socket.on('time_update', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('show_leaderboard', ({ leaderboard }) => {
      setLeaderboard(leaderboard);
      setShowLeaderboard(true);
    });

    socket.on('quiz_end', ({ finalLeaderboard }) => {
      setLeaderboard(finalLeaderboard);
      setShowLeaderboard(true);
      setGameStarted(false);
      setCurrentQuestion(null);
    });

    return () => {
      socket.off('quiz_error');
      socket.off('quiz_data');
      socket.off('player_joined');
      socket.off('quiz_started');
      socket.off('question_start');
      socket.off('time_update');
      socket.off('show_leaderboard');
      socket.off('quiz_end');
    };
  }, [socket, isConnected, pin, navigate]);

  useEffect(() => {
    if (!isConnected || !socket || !pin) return;

    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/quizzes/pin/${pin}`);
        setQuiz(response.data);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz data');
      }
    };

    if (!quiz) {
      fetchQuiz();
    }
  }, [isConnected, socket, pin, quiz]);

  const handleStartGame = () => {
    if (players.length === 0) {
      setError('Need at least one player to start the game');
      return;
    }
    socket.emit('start_quiz', { pin });
  };

  const handleNextQuestion = () => {
    socket.emit('next_question', { pin });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName="Host" />
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                Hosting: {quiz?.title}
              </h1>
              <div className="text-2xl font-semibold text-blue-600">
                PIN: {pin}
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 mb-2">Share this link with players:</p>
              <div className="flex items-center justify-center gap-4">
                <a
                  href={`${window.location.origin}/join/${pin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border rounded bg-white text-blue-600 hover:text-blue-800 flex-1 truncate hover:underline"
                >
                  {`${window.location.origin}/join/${pin}`}
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${pin}`);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Or go to <a href={window.location.origin} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">{window.location.origin}</a> and enter PIN: <span className="font-semibold">{pin}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {!gameStarted ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-700">
                    Players ({players.length})
                  </h2>
                  {players.length === 0 ? (
                    <p className="text-gray-500">Waiting for players to join...</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {players.map((player, index) => (
                        <div
                          key={index}
                          className="bg-gray-100 rounded p-3 text-center"
                        >
                          <span className="text-gray-800 font-medium">
                            {player.playerName || player}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={players.length === 0}
                  className={`w-full py-3 px-6 rounded-lg text-white font-semibold ${
                    players.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {players.length === 0 ? 'Waiting for Players' : 'Start Game'}
                </button>
              </>
            ) : (
              <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                  {currentQuestion && !showLeaderboard && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                          Question {currentQuestion.number} of {quiz?.questions?.length}
                        </h2>
                        <div className="text-2xl font-bold text-blue-600">
                          {timeLeft}s
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                          style={{
                            width: `${(timeLeft / currentQuestion.timeLimit) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <p className="text-lg mb-4">{currentQuestion.text}</p>
                      {currentQuestion.image && (
                        <img
                          src={currentQuestion.image}
                          alt="Question"
                          className="max-w-full h-auto mb-4 rounded-lg"
                        />
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg ${
                              String(index) === currentQuestion.correctAnswer
                                ? 'bg-green-100 border-green-500'
                                : 'bg-gray-100 border-gray-300'
                            } border-2`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>

                      {timeLeft === 0 && (
                        <button
                          onClick={() => socket.emit('next_question', { pin })}
                          className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Next Question
                        </button>
                      )}
                    </div>
                  )}

                  {showLeaderboard && leaderboard && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>
                      <div className="space-y-4">
                        {leaderboard.map(({ name, player, score }, index) => (
                          <div
                            key={player}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              <span className="text-lg font-semibold mr-4">
                                #{index + 1}
                              </span>
                              <span className="text-lg">{ name ?? player}</span>
                            </div>
                            <span className="text-lg font-semibold">{score} pts</span>
                          </div>
                        ))}
                      </div>

                      {!currentQuestion && (
                        <div className="mt-6 text-center text-xl font-bold text-blue-600">
                          Game Over!
                        </div>
                      )}

                      {currentQuestion && (
                        <button
                          onClick={() => socket.emit('next_question', { pin })}
                          className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Next Question
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Players ({players.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {players.map((player) => (
                        <div
                          key={player}
                          className="bg-white rounded-lg shadow p-3 text-center"
                        >
                          {player}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostPage;
