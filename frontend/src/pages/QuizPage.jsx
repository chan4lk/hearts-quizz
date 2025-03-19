import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const QuizPage = ({ socket }) => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const playerName = location.state?.playerName;

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winners, setWinners] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket || !pin || !playerName) {
      navigate('/');
      return;
    }

    socket.emit('join_quiz', { pin, playerName });

    socket.on('question_start', ({ question }) => {
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setShowLeaderboard(false);
      setTimeLeft(question.timeLimit);
      
      // Start timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('question_end', ({ leaderboard, correctAnswer, answerStats }) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setLeaderboard(leaderboard);
      setShowLeaderboard(true);
    });

    socket.on('quiz_end', ({ winners, allPlayers }) => {
      setGameOver(true);
      setWinners(winners);
      setLeaderboard(allPlayers);
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      socket.off('question_start');
      socket.off('question_end');
      socket.off('quiz_end');
    };
  }, [socket, pin, playerName, navigate]);

  const submitAnswer = (answerIndex) => {
    if (answerSubmitted || timeLeft === 0) return;
    
    setSelectedAnswer(answerIndex);
    setAnswerSubmitted(true);
    
    socket.emit('submit_answer', {
      pin,
      playerName,
      answer: answerIndex,
      timeLeft: timeLeft / currentQuestion.timeLimit // Send as percentage
    });
  };

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
          onClick={() => navigate('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!currentQuestion && !showLeaderboard) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Waiting for quiz to start...</h2>
        <p>Get ready, {playerName}!</p>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
        {leaderboard.map((player, index) => (
          <div
            key={index}
            className={`flex items-center mb-2 p-2 rounded ${
              player.name === playerName ? 'bg-blue-100' : ''
            }`}
          >
            <div className="w-8">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
            </div>
            <div className="flex-1">{player.name}</div>
            <div>{player.score} points</div>
          </div>
        ))}
        <p className="mt-4">Waiting for next question...</p>
      </div>
      
    );
                <Footer/>

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div>Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}</div>
          <div className={`font-bold ${timeLeft <= 5 ? 'text-red-500' : ''}`}>
            {timeLeft} seconds
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded">
          <div
            className="bg-blue-500 h-2 rounded transition-all duration-1000"
            style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => submitAnswer(index)}
            disabled={answerSubmitted || timeLeft === 0}
            className={`p-4 rounded text-white text-lg font-bold transition-all ${
              selectedAnswer === index
                ? 'bg-blue-700'
                : answerSubmitted || timeLeft === 0
                ? 'bg-gray-500'
                : index === 0
                ? 'bg-red-500 hover:bg-red-600'
                : index === 1
                ? 'bg-blue-500 hover:bg-blue-600'
                : index === 2
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {(answerSubmitted || timeLeft === 0) && (
        <div className="mt-4 text-center text-xl">
          {answerSubmitted ? "Answer submitted!" : "Time's up!"}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
