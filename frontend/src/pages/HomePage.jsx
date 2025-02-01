import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage({ socket }) {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleJoinQuiz = () => {
    if (pin.trim()) {
      socket.emit('join_quiz', pin);
      navigate(`/quiz/${pin}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">Khoot Clone</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Join a Quiz</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter Quiz PIN"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoinQuiz}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
