import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSocket from '../hooks/useSocket';

function JoinPage() {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const socket = useSocket();
  const { pin } = useParams();

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setLoading(true);
    const cleanName = playerName.trim();

    socket.emit('join_quiz', { pin, playerName: cleanName }, (response) => {
      setLoading(false);
      if (response?.error) {
        setError(response.error);
      } else if (response?.success) {
        navigate(`/game/${pin}`, { 
          state: { playerName: cleanName } 
        });
      } else {
        setError('Failed to join game. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Join Game <span className="text-blue-600">{pin}</span>
        </h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoinGame();
              }
            }}
          />
          <button
            onClick={handleJoinGame}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;
