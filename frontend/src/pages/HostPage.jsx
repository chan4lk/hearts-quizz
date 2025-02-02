import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../config/env';

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

  // Fetch quiz if not available from location state
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

  // Join as admin
  useEffect(() => {
    if (!isConnected || !socket || !pin) return;
    
    console.log('Joining as admin:', pin);
    socket.emit('join_quiz', { pin, playerName: 'admin' });
  }, [isConnected, socket, pin]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onPlayerJoined = ({ players, playerName }) => {
      console.log('Players updated:', players);
      if (Array.isArray(players)) {
        setPlayers(players);
      } else if (playerName) {
        setPlayers(prev => [...prev, playerName]);
      }
    };

    const onPlayerLeft = ({ players }) => {
      console.log('Players updated after leave:', players);
      if (Array.isArray(players)) {
        setPlayers(players);
      }
    };

    const onQuizStarted = () => {
      console.log('Quiz started');
      setGameStarted(true);
      setShowLeaderboard(false);
    };

    const onQuestionStart = ({ question }) => {
      console.log('Received question:', question);
      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit);
      setShowLeaderboard(false);
    };

    const onQuestionEnd = ({ leaderboard }) => {
      console.log('Question ended, leaderboard:', leaderboard);
      setLeaderboard(leaderboard);
      setShowLeaderboard(true);
    };

    const onQuizEnd = ({ finalLeaderboard }) => {
      console.log('Quiz ended, final leaderboard:', finalLeaderboard);
      setLeaderboard(finalLeaderboard);
      setShowLeaderboard(true);
      setGameStarted(false);
      setCurrentQuestion(null);
    };

    const onQuizError = ({ message }) => {
      console.error('Quiz error:', message);
      setError(message);
    };

    console.log('Setting up host socket listeners');
    
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('quiz_started', onQuizStarted);
    socket.on('question_start', onQuestionStart);
    socket.on('question_end', onQuestionEnd);
    socket.on('quiz_end', onQuizEnd);
    socket.on('quiz_error', onQuizError);

    return () => {
      console.log('Cleaning up host socket listeners');
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('quiz_started', onQuizStarted);
      socket.off('question_start', onQuestionStart);
      socket.off('question_end', onQuestionEnd);
      socket.off('quiz_end', onQuizEnd);
      socket.off('quiz_error', onQuizError);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    let timer;
    if (currentQuestion && timeLeft > 0 && !showLeaderboard) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentQuestion, timeLeft, showLeaderboard]);

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
    <div className="min-h-screen bg-gray-50 p-8">
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
            <div className="space-y-6">
              {showLeaderboard && leaderboard ? (
                <div>
                  <h2 className="text-2xl font-bold text-center mb-6">Leaderboard</h2>
                  <div className="space-y-4">
                    {leaderboard.map((player, index) => (
                      <div
                        key={player.name}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl font-bold mr-4">#{index + 1}</span>
                          <span className="text-lg">{player.name}</span>
                        </div>
                        <span className="text-xl font-semibold">{player.score}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    className="mt-6 w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600"
                  >
                    Next Question
                  </button>
                </div>
              ) : currentQuestion ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                      Question {currentQuestion.number} of {quiz?.questions?.length || 0}
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
                      className="max-w-full h-auto mb-4 rounded"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg shadow text-center ${
                          index === currentQuestion.correctAnswer
                            ? 'bg-purple-100 border-2 border-purple-500'
                            : 'bg-white'
                        }`}
                      >
                        <div className={`text-lg ${
                          index === currentQuestion.correctAnswer
                            ? 'text-purple-800 font-bold'
                            : ''
                        }`}>{option}</div>
                        {index === currentQuestion.correctAnswer && (
                          <div className="text-sm text-purple-600 mt-2 font-semibold">
                            ★ Correct Answer ★
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-lg text-blue-600 font-semibold">
                  Starting game...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostPage;
