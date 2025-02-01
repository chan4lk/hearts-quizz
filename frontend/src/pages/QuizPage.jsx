import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function QuizPage({ socket }) {
  const { pin } = useParams();
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Listen for quiz updates
    socket.on('new_question', (data) => {
      setQuestion(data.question);
      setTimeLeft(data.timeLimit);
      setSelectedAnswer(null);
    });

    // Listen for leaderboard updates
    socket.on('leaderboard_update', (data) => {
      setLeaderboard(data);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('new_question');
      socket.off('leaderboard_update');
    };
  }, [socket]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    socket.emit('submit_answer', { pin, answer });
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-gray-700">Waiting for the quiz to start...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Question Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Question</h2>
            <div className="px-4 py-2 bg-red-100 text-red-600 rounded-full">
              {timeLeft}s
            </div>
          </div>
          <p className="text-lg text-gray-700 mb-6">{question.text}</p>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={selectedAnswer !== null}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors
                  ${selectedAnswer === option
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                  ${selectedAnswer !== null && 'cursor-not-allowed'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{entry.username}</span>
                <span className="text-blue-600 font-medium">{entry.score} points</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;
