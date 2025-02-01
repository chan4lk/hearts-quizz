import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSocket from '../hooks/useSocket';

const AdminPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState(null);
  const [newQuiz, setNewQuiz] = useState({ title: '', questions: [] });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answerStats, setAnswerStats] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winners, setWinners] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (isLoggedIn) {
      fetchQuizzes();
    }
  }, [isLoggedIn]);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to fetch quizzes');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', loginForm);
      const { token } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
    setQuizzes([]);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/quizzes', newQuiz, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes([...quizzes, response.data.quiz]);
      setNewQuiz({ title: '', questions: [] });
    } catch (error) {
      console.error('Error creating quiz:', error);
      setError('Failed to create quiz');
    }
  };

  const handleDeactivateQuiz = async (pin) => {
    try {
      await axios.post(`http://localhost:5001/api/quizzes/${pin}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuizzes();
    } catch (error) {
      console.error('Error deactivating quiz:', error);
      setError('Failed to deactivate quiz');
    }
  };

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz);
    setPlayers([]);
    setGameStarted(false);
    // Join the admin to the quiz room
    if (socket) {
      socket.emit('join_quiz', { pin: quiz.pin, playerName: 'admin' });
    }
  };

  const startQuiz = () => {
    if (socket && selectedQuiz) {
      socket.emit('start_quiz', { pin: selectedQuiz.pin });
    }
  };

  const nextQuestion = () => {
    socket.emit('next_question', { pin: selectedQuiz.pin });
  };

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data) => {
      console.log('Player joined event received:', data);
      if (data.players) {
        setPlayers(data.players);
      }
    };

    const handleQuizStarted = (data) => {
      if (data.success) {
        setGameStarted(true);
      }
    };

    const handleQuestionStart = (data) => {
      console.log('Question started:', data);
      setCurrentQuestion(data.question);
      setShowLeaderboard(false);
      setLeaderboard([]);
      setAnswerStats([]);
    };

    const handleQuestionEnd = (data) => {
      setLeaderboard(data.leaderboard);
      setAnswerStats(data.answerStats);
      setShowLeaderboard(true);
    };

    const handleQuizEnd = (data) => {
      setGameOver(true);
      setWinners(data.winners);
      setLeaderboard(data.allPlayers);
    };

    socket.on('player_joined', handlePlayerJoined);
    socket.on('quiz_started', handleQuizStarted);
    socket.on('question_start', handleQuestionStart);
    socket.on('question_end', handleQuestionEnd);
    socket.on('quiz_end', handleQuizEnd);

    return () => {
      socket.off('player_joined', handlePlayerJoined);
      socket.off('quiz_started', handleQuizStarted);
      socket.off('question_start', handleQuestionStart);
      socket.off('question_end', handleQuestionEnd);
      socket.off('quiz_end', handleQuizEnd);
      // Clean up players when component unmounts
      setPlayers([]);
    };
  }, [socket]);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6">Game Over!</h2>
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">🏆 Winners 🏆</h3>
          {winners.map((winner, index) => (
            <div key={index} className="flex items-center mb-4">
              <div className="text-2xl mr-4">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <div className="font-bold">{winner.name}</div>
              <div className="ml-4">{winner.score} points</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setSelectedQuiz(null);
            setGameOver(false);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Quiz List
        </button>
      </div>
    );
  }

  if (selectedQuiz && !gameStarted) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedQuiz.title}
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Game PIN: <span className="font-mono font-bold">{selectedQuiz.pin}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Quiz List
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  Players ({players.length})
                </h3>
                <button
                  onClick={startQuiz}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    players.length > 0
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={players.length === 0}
                >
                  Start Quiz
                </button>
              </div>

              {players.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Waiting for players to join...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {players.map((player, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 flex items-center"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-700">{player}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Instructions:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Share the Game PIN with your players</li>
                <li>Wait for players to join</li>
                <li>Click "Start Quiz" when ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedQuiz && gameStarted) {
    return (
      <div className="p-8">
        {currentQuestion && !showLeaderboard && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
            </h2>
            <p className="text-xl mb-4">{currentQuestion.text}</p>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="p-4 bg-gray-100 rounded">
                  {option}
                </div>
              ))}
            </div>
            <div className="mt-4">
              Time remaining: {currentQuestion.timeLimit} seconds
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">Answer Statistics</h3>
              <div className="grid grid-cols-4 gap-2">
                {answerStats.map((count, index) => (
                  <div key={index} className="text-center">
                    <div className="font-bold">Option {index + 1}</div>
                    <div>{count} answers</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">Top Players</h3>
              {leaderboard.map((player, index) => (
                <div key={index} className="flex items-center mb-2">
                  <div className="w-8">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                  </div>
                  <div className="flex-1">{player.name}</div>
                  <div>{player.score} points</div>
                </div>
              ))}
            </div>
            {currentQuestion?.questionNumber < currentQuestion?.totalQuestions && (
              <button
                onClick={nextQuestion}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Next Question
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quiz Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Quiz</h2>
        <form onSubmit={handleCreateQuiz} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Quiz Title"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
            Create Quiz
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Active Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="border p-4 rounded">
              <h3 className="font-semibold">{quiz.title}</h3>
              <p>PIN: {quiz.pin}</p>
              <button
                onClick={() => handleQuizSelect(quiz)}
                className="bg-green-500 text-white px-2 py-1 rounded mt-2"
              >
                Start Quiz
              </button>
              <button
                onClick={() => handleDeactivateQuiz(quiz.pin)}
                className="bg-red-500 text-white px-2 py-1 rounded mt-2"
              >
                Deactivate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
