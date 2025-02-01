import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';

const GamePage = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const playerName = location.state?.playerName;
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket]);

  useEffect(() => {
    if (!isConnected || !playerName || !pin) {
      return;
    }

    console.log('Joining quiz:', { pin, playerName });
    socket.emit('join_quiz', { pin, playerName });

    socket.on('quiz_error', ({ message }) => {
      console.error('Quiz error:', message);
      setError(message);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    });

    socket.on('player_joined', (data) => {
      console.log('Player joined:', data);
    });

    socket.on('quiz_started', () => {
      console.log('Quiz started');
      setCurrentQuestion(null);
      setAnswered(false);
      setShowLeaderboard(false);
      setSelectedAnswer(null);
    });

    socket.on('question_start', ({ question, timeLimit }) => {
      console.log('Question started:', question);
      setCurrentQuestion(question);
      setAnswered(false);
      setSelectedAnswer(null);
      setShowLeaderboard(false);
      setTimeLeft(timeLimit);
    });

    socket.on('question_end', ({ correctAnswer, scores }) => {
      console.log('Question ended:', { correctAnswer, scores });
      setShowLeaderboard(true);
      const sortedScores = Object.entries(scores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
      setLeaderboard(sortedScores);
    });

    return () => {
      socket.off('quiz_error');
      socket.off('player_joined');
      socket.off('quiz_started');
      socket.off('question_start');
      socket.off('question_end');
    };
  }, [socket, isConnected, playerName, pin, navigate]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSelect = (answer) => {
    if (answered || !currentQuestion) return;
    
    setSelectedAnswer(answer);
    setAnswered(true);
    socket.emit('submit_answer', {
      pin,
      playerName,
      answer
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-red-600 text-center">{error}</div>
          <div className="text-gray-600 text-center mt-2">
            Redirecting to join page...
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-gray-600 text-center">
            Connecting to server...
          </div>
        </div>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Leaderboard</h2>
          <div className="space-y-4">
            {leaderboard.map((player, index) => (
              <div
                key={player.name}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center">
                  <span className="font-medium text-gray-600 mr-3">
                    {index + 1}.
                  </span>
                  <span className="font-medium">
                    {player.name}
                  </span>
                </div>
                <span className="font-bold text-blue-600">
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-4">
            Waiting for quiz to start...
          </h2>
          <p className="text-gray-600 text-center">
            The host will start the quiz shortly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {timeLeft !== null && (
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-blue-600">
                {timeLeft}s
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold mb-6">
            {currentQuestion.text}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={answered}
                className={`p-4 rounded-lg text-center transition-colors ${
                  selectedAnswer === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {option}
              </button>
            ))}
          </div>

          {answered && (
            <div className="mt-6 text-center text-gray-600">
              Answer submitted! Waiting for other players...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
