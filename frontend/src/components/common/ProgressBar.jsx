import React from 'react';

const ProgressBar = ({ timeLeft, totalTime }) => {
  const percentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
      <div
        className="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-linear"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;
