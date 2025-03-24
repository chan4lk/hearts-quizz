import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import ProgressBar from '../components/common/ProgressBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GameOverMessage from '../components/GameOverMessage';
import TeamLeaderboard from '../components/game/TeamLeaderboard';

// Define SVG icons as components
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const IconUsers = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconUser = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconAlertCircle = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const IconCheckCircle = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const IconXCircle = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const IconLoader = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);

const IconTrophy = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

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
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

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
      setAnswerSubmitting(false);
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
    setAnswerSubmitting(true);
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
        className="ml-2 px-3 py-1 rounded-full text-sm font-medium flex items-center"
        style={{ 
          backgroundColor: `${playerTeam.color}22`,
          color: playerTeam.color,
          border: `1px solid ${playerTeam.color}`
        }}
      >
        <IconUsers size={16} className="mr-1" />
        {playerTeam.name}
      </div>
    );
  };

  // Loading/Connection Screen
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <Header userName={playerName}>
          {renderTeamBadge()}
        </Header>
        <div className="flex-grow flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center">
              <div className="text-blue-500 mb-4">
                <IconLoader size={48} />
              </div>
              <div className="text-gray-700 text-lg font-medium">
                Connecting to quiz server...
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <Header userName={playerName}>
          {renderTeamBadge()}
        </Header>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center">
              <div className="text-red-500 mb-4">
                <IconAlertCircle size={48} />
              </div>
              <div className="text-red-600 text-lg font-medium mb-2">{error}</div>
              <div className="text-gray-600 text-center">
                Redirecting to join page...
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Game Over Screen
  if (!currentQuestion && winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <Header userName={playerName}>
          {renderTeamBadge()}
        </Header>
        <GameOverMessage winner={winner} />
        <Footer />
      </div>
    );
  }

  // Leaderboard Screen
  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <Header userName={playerName}>
          {renderTeamBadge()}
        </Header>
        <div className="max-w-4xl mx-auto flex-grow p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="text-yellow-500 mr-2">
              <IconTrophy size={32} />
            </div>
            <h2 className="text-2xl font-bold text-center">Game Results</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-4">
                <div className="text-blue-600 mr-2">
                  <IconUsers size={24} />
                </div>
                <h3 className="text-xl font-semibold">Team Standings</h3>
              </div>
              <TeamLeaderboard teams={teamScores} players={leaderboard} />
            </div>
            <div>
              <div className="flex items-center mb-4">
                <div className="text-blue-600 mr-2">
                  <IconUser size={24} />
                </div>
                <h3 className="text-xl font-semibold">Individual Rankings</h3>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="space-y-3">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.name}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`font-medium ${index < 3 ? 'text-yellow-500' : 'text-gray-600'}`}>
                          {index === 0 ? <IconTrophy size={16} /> : `${index + 1}.`}
                        </span>
                        <div>
                          <span className="font-medium">{player.name}</span>
                          {player.team && (
                            <span
                            className="ml-2 text-sm px-2 py-1 rounded items-center inline-flex"                              style={{
                                backgroundColor: player.team.color + '22',
                                color: player.team.color
                              }}
                            >
                              <IconUsers size={12} className="mr-1" />
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
        <Footer />
      </div>
    );
  }

  // Waiting for Quiz Screen
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
        <Header userName={playerName}>
          {renderTeamBadge()}
        </Header>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center">
              <div className="text-blue-500 mb-4">
                <IconLoader size={48} />
              </div>
              <h2 className="text-2xl font-bold text-center mb-4">
                Waiting for quiz to start...
              </h2>
              <p className="text-gray-600 text-center">
                The host will start the quiz shortly
              </p>
              <div className="mt-8 flex items-center justify-center space-x-3">
                <div className="flex items-center">
                  <div className="text-blue-500 mr-1">
                    <IconUser size={16} />
                  </div>
                  <span className="text-gray-700">{playerName}</span>
                </div>
                {playerTeam && (
                  <div 
                    className="flex items-center px-2 py-1 rounded-full text-sm"
                    style={{ 
                      backgroundColor: `${playerTeam.color}22`,
                      color: playerTeam.color
                    }}
                  >
                    <IconUsers size={14} className="mr-1" />
                    {playerTeam.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Question Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <Header userName={playerName}>
        {renderTeamBadge()}
      </Header>
      <div className="flex-grow p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
            {timeLeft !== null && currentQuestion?.timeLimit && (
              <div className="mb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-blue-600 mr-2">
                    <IconClock />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {timeLeft}s
                  </div>
                </div>
                <ProgressBar timeLeft={timeLeft} totalTime={currentQuestion.timeLimit} />
              </div>
            )}

            <h2 className="text-xl font-bold mb-6 text-center">
              {currentQuestion?.text}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answered || showCorrectAnswer}
                  className={`
                    p-4 rounded-lg shadow-md transition-all duration-200
                    ${getButtonColor(index)}
                    ${answered || showCorrectAnswer ? 'cursor-default' : 'cursor-pointer'}
                    disabled:opacity-70 hover:shadow-lg flex items-center justify-center
                  `}
                >
                  <span className="mr-2">{String.fromCharCode(65 + index)}.</span> {option}
                </button>
              ))}
            </div>

            {answered && !showCorrectAnswer && (
              <div className="mt-6 text-center text-gray-600 flex items-center justify-center">
                {answerSubmitting ? (
                  <>
                    <div className="text-blue-500 mr-2">
                      <IconLoader size={20} />
                    </div>
                    Processing your answer...
                  </>
                ) : (
                  <>
                    <div className="text-blue-500 mr-2">
                      <IconCheckCircle size={20} />
                    </div>
                    Answer submitted! Waiting for other players...
                  </>
                )}
              </div>
            )}

            {showCorrectAnswer && (
              <div className="mt-6 text-center">
                <div className={`text-xl font-bold flex items-center justify-center
                  ${selectedAnswer === correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAnswer === correctAnswer ? (
                    <>
                      <div className="mr-2">
                        <IconCheckCircle size={24} />
                      </div>
                      Correct!
                    </>
                  ) : (
                    <>
                      <div className="mr-2">
                        <IconXCircle size={24} />
                      </div>
                      Wrong!
                    </>
                  )}
                </div>
                <div className="text-gray-600 mt-2">
                  The correct answer was: {currentQuestion.options[correctAnswer]}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GamePage;