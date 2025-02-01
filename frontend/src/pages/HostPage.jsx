import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../config/env';

const HostPage = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const [quiz, setQuiz] = useState(location.state?.quiz);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    // Join as admin
    socket.emit('join_quiz', { pin, playerName: 'admin' }, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });

    // Listen for player join events
    socket.on('player_joined', ({ players }) => {
      console.log('Players updated:', players);
      setPlayers(players || []);
    });

    // Listen for player leave events
    socket.on('player_left', ({ players }) => {
      console.log('Players updated after leave:', players);
      setPlayers(players || []);
    });

    // Listen for quiz start
    socket.on('quiz_started', () => {
      console.log('Quiz started');
      setGameStarted(true);
    });

    // Listen for questions
    socket.on('question_start', ({ question }) => {
      console.log('Received question:', question);
      setCurrentQuestion(question);
    });

    // Listen for quiz errors
    socket.on('quiz_error', ({ message }) => {
      console.error('Quiz error:', message);
      setError(message);
    });

    // Clean up socket listeners
    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('quiz_started');
      socket.off('question_start');
      socket.off('quiz_error');
    };
  }, [socket, quiz, pin]);

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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
              <input
                type="text"
                value={`${window.location.origin}/join/${pin}`}
                readOnly
                className="px-4 py-2 border rounded bg-white text-gray-800 flex-1"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${pin}`);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Or go to <span className="font-semibold">{window.location.origin}</span> and enter PIN: <span className="font-semibold">{pin}</span>
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
                        {player.name}
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
              {currentQuestion ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">
                    Question {currentQuestion.number} of {quiz?.questions?.length || 0}
                  </h2>
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
                        className="bg-white p-4 rounded-lg shadow text-center"
                      >
                        {option}
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
