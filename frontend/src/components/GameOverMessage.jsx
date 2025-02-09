import React from 'react';

const GameOverMessage = ({ winner }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 my-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        <p className="text-lg">Winner: {winner?.name ?? winner}</p>
      </div>
    </div>
  );
};

export default GameOverMessage;
