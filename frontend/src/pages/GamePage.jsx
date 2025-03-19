import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import ProgressBar from '../components/common/ProgressBar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import GameOverMessage from '../components/GameOverMessage';
import TeamLeaderboard from '../components/game/TeamLeaderboard'; // Import TeamLeaderboard component

// Default team for single team mode
const DEFAULT_TEAM = {
  id: 1,
  name: 'Default Team',
  color: '#3f51b5'
};

const GamePage = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const playerName = location.state?.playerName;
  // Use default team if no team is provided
  const playerTeam = location.state?.team || DEFAULT_TEAM;
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [teamScores, setTeamScores] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState('');
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [winner, setWinner] = useState(null);

  const { socket, isConnected } = useSocket();

  const calculateTeamScores = (leaderboardData) => {
    const teamScores = new Map();
      
    // First group players by team and calculate team totals
    leaderboardData.forEach(player => {
      if (player.team) {
        const currentTeam = teamScores.get(player.team.id) || {
          ...player.team,
          players: [],
          totalScore: 0,
          averageScore: 0
        };
        
        currentTeam.players.push({
          name: player.name,
          score: player.score
        });
        
        currentTeam.totalScore += player.score;
        currentTeam.averageScore = currentTeam.totalScore / currentTeam.players.length;
        
        teamScores.set(player.team.id, currentTeam);
      }
    });

    // Convert to array and sort by total score
    return Array.from(teamScores.values())
      .sort((a, b) => b.totalScore - a.totalScore);
  };

  useEffect(() => {
    if (!socket || !isConnected || !playerName || !pin) {
      navigate('/');
      return;
    }

    console.log('Setting up game socket listeners and joining quiz');
    socket.emit('join_quiz', { 
      pin, 
      playerName,
      teamId: playerTeam.id 
    });

    socket.on('quiz_error', ({ message }) => {
      console.error('Quiz error:', message);
      setError(message);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    });

    socket.on('question_start', ({ question }) => {
      console.log('Question started:', question);
      setCurrentQuestion(question);
      setTimeLeft(question.timeLimit);
      setAnswered(false);
      setSelectedAnswer(null);
      setShowLeaderboard(false);
      setShowCorrectAnswer(false);
      setCorrectAnswer(null);
    });

    socket.on('time_update', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('show_correct_answer', ({ correctAnswer }) => {
      console.log('Showing correct answer:', correctAnswer);
      setCorrectAnswer(parseInt(correctAnswer));
      setShowCorrectAnswer(true);
    });

    socket.on('show_leaderboard', ({ leaderboard }) => {
      const sortedTeams = calculateTeamScores(leaderboard);
      setLeaderboard(leaderboard);
      setTeamScores(sortedTeams);
      setShowLeaderboard(true);
    });

    socket.on('quiz_end', ({ finalLeaderboard, winner }) => {
      console.log('Quiz ended, final leaderboard:', finalLeaderboard, 'Winner:', winner);
      
      const sortedTeams = calculateTeamScores(finalLeaderboard);
      setLeaderboard(finalLeaderboard);
      setTeamScores(sortedTeams);
      setShowLeaderboard(true);
      setCurrentQuestion(null);
      setWinner(winner);
    });

    return () => {
      console.log('Cleaning up game socket listeners');
      socket.off('quiz_error');
      socket.off('question_start');
      socket.off('time_update');
      socket.off('show_correct_answer');
      socket.off('show_leaderboard');
      socket.off('quiz_end');
    };
  }, [socket, isConnected, playerName, pin, navigate]);

  const handleAnswerSelect = (answer) => {
    if (answered || !currentQuestion) return;
    
    setSelectedAnswer(answer);
    setAnswered(true);
    socket.emit('submit_answer', {
      pin,
      playerName,
      answer,
      timeLeft
    });
  };

  const getButtonColor = (index) => {
    if (showCorrectAnswer) {
      if (index === correctAnswer) {
        return 'bg-green-500 hover:bg-green-500 text-white';
      }
      if (selectedAnswer === index && selectedAnswer !== correctAnswer) {
        return 'bg-red-500 hover:bg-red-500 text-white';
      }
      return 'bg-gray-200 hover:bg-gray-200';
    }

    if (selectedAnswer === index) {
      return 'bg-blue-500 hover:bg-blue-500 text-white';
    }

    return 'bg-white hover:bg-gray-100 text-gray-800';
  };

  // Display team badge in header
  const renderTeamBadge = () => {
    if (!playerTeam) return null;
    
    return (
      <div 
        className="ml-2 px-3 py-1 rounded-full text-sm font-medium"
        style={{ 
          backgroundColor: `${playerTeam.color}22`,
          color: playerTeam.color,
          border: `1px solid ${playerTeam.color}`
        }}
      >
        {playerTeam.name}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col">
      <Header userName={playerName}>
        {renderTeamBadge()}
      </Header>
      {(!currentQuestion && winner)  && <GameOverMessage winner={winner} />}
      {error ? (
        <div className="p-4 flex-grow">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-red-600 text-center">{error}</div>
            <div className="text-gray-600 text-center mt-2">
              Redirecting to join page...
            </div>
          </div>
          <Footer />
        </div>
      ) : !isConnected ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-center">
              Waiting for connection...
            </div>
          </div>
          <Footer />
        </div>
      ) : showLeaderboard ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col p-4">
          <div className="max-w-4xl mx-auto flex-grow">
            <h2 className="text-2xl font-bold text-center mb-6">Game Results</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Team Standings</h3>
                <TeamLeaderboard teams={teamScores} players={leaderboard} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Individual Rankings</h3>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="space-y-3">
                    {leaderboard.map((player, index) => (
                      <div
                        key={player.name}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-600">
                            {index + 1}.
                          </span>
                          <div>
                            <span className="font-medium">{player.name}</span>
                            {player.team && (
                              <span
                                className="ml-2 text-sm px-2 py-1 rounded"
                                style={{
                                  backgroundColor: player.team.color + '22',
                                  color: player.team.color
                                }}
                              >
                                {player.team.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">
                          {player.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !currentQuestion ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-center mb-4">
              Waiting for quiz to start...
            </h2>
            <p className="text-gray-600 text-center">
              The host will start the quiz shortly
            </p>
          </div>
        </div>

      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col p-4">
          <div className="max-w-2xl mx-auto flex-grow">
            <div className="bg-white rounded-lg shadow-md p-6">
              {timeLeft !== null && currentQuestion?.timeLimit && (
                <div className="mb-6">
                  <div className="text-center mb-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {timeLeft}s
                    </div>
                  </div>
                  <ProgressBar timeLeft={timeLeft} totalTime={currentQuestion.timeLimit} />
                </div>
              )}

              <h2 className="text-xl font-bold mb-6">
                {currentQuestion?.text}
              </h2>

              {currentQuestion?.image && (
                <div className="mb-6">
                  <img
                    src={currentQuestion.image}
                    alt="Question"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-8">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={answered || showCorrectAnswer}
                    className={`
                      p-4 rounded-lg shadow-md transition-colors duration-200
                      ${getButtonColor(index)}
                      ${answered || showCorrectAnswer ? 'cursor-default' : 'cursor-pointer'}
                      disabled:opacity-70
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {answered && !showCorrectAnswer && (
                <div className="mt-6 text-center text-gray-600">
                  Answer submitted! Waiting for other players...
                </div>
              )}

              {showCorrectAnswer && (
                <div className="mt-6 text-center">
                  <div className={`text-xl font-bold ${selectedAnswer === correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAnswer === correctAnswer ? 'Correct!' : 'Wrong!'}
                  </div>
                  <div className="text-gray-600 mt-2">
                    The correct answer was: {currentQuestion.options[correctAnswer]}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      )}
                        <Footer />

    </div>
    
  );
};

export default GamePage;
