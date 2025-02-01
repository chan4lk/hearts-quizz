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
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerName) {
      navigate('/');
      return;
    }

    // Listen for quiz start
    socket.on('quiz_started', () => {
      console.log('Quiz started');
      setCurrentQuestion(null);
      setAnswered(false);
    });

    // Listen for questions
    socket.on('question', (questionData) => {
      console.log('Received question:', questionData);
      setCurrentQuestion(questionData);
      setAnswered(false);
    });

    // Listen for question results
    socket.on('question_end', (result) => {
      console.log('Question ended:', result);
      if (result.leaderboard) {
        const playerScore = result.leaderboard.find(p => p.name === playerName);
        if (playerScore) {
          setScore(playerScore.score);
        }
      }
    });

    // Clean up socket listeners
    return () => {
      socket.off('quiz_started');
      socket.off('question');
      socket.off('question_end');
    };
  }, [socket, playerName, navigate]);

  const handleAnswer = (answerIndex) => {
    if (answered || !currentQuestion) return;
    
    setAnswered(true);
    socket.emit('submit_answer', {
      pin,
      playerName,
      answer: answerIndex,
      timeLeft: currentQuestion.timeLeft
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="text-blue-500 hover:text-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-xl font-semibold text-gray-800">
              Player: {playerName}
            </div>
            <div className="text-xl font-semibold text-blue-600">
              Score: {score}
            </div>
          </div>

          {currentQuestion ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-4">
                {currentQuestion.text}
              </h2>
              {currentQuestion.image && (
                <img
                  src={currentQuestion.image}
                  alt="Question"
                  className="max-w-full h-auto mx-auto mb-6 rounded"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={answered}
                    className={`p-4 rounded-lg text-center text-lg font-semibold transition-colors
                      ${
                        answered
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {answered && (
                <div className="text-center text-lg text-green-600 font-semibold">
                  Answer submitted! Waiting for other players...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-lg text-blue-600 font-semibold">
              Waiting for the game to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
