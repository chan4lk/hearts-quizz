import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import axios from 'axios';
import { API_URL } from '../config/env';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GameOverMessage from '../components/GameOverMessage';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LinkIcon from '@mui/icons-material/Link';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LogoutIcon from '@mui/icons-material/Logout';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const HostPage = () => {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [quiz, setQuiz] = useState(location.state?.quiz);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [winner, setWinner] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!isConnected || !socket || !pin) return;

    socket.emit('join_quiz', { pin, playerName: 'admin' });

    socket.on('quiz_error', ({ message }) => {
      console.error('Quiz error:', message);
      setError(message);
      navigate('/');
    });

    socket.on('quiz_data', (data) => {
      setQuiz(data);
    });

    socket.on('player_joined', ({ players }) => {
      const gamePlayers = players.filter(p => p !== 'admin');
      setPlayers(gamePlayers);
    });

    socket.on('players_disconnected', ({ players, message }) => {
      const gamePlayers = players.filter(p => p !== 'admin');
      setPlayers(gamePlayers);
      // Reset game state if it was started
      if (gameStarted) {
        setGameStarted(false);
        setCurrentQuestion(null);
        setShowLeaderboard(false);
        setLeaderboard(null);
        setWinner(null);
      }
      // Show temporary success message
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('quiz_started', () => {
      setGameStarted(true);
      setShowLeaderboard(false);
    });

    socket.on('question_start', ({ question }) => {
      setCurrentQuestion(question);
      console.log('Starting question:', question);
      setTimeLeft(question.timeLimit);
      setShowLeaderboard(false);
    });

    socket.on('time_update', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('show_leaderboard', ({ leaderboard }) => {
      setLeaderboard(leaderboard);
      setShowLeaderboard(true);
    });

    socket.on('quiz_end', ({ finalLeaderboard, winner }) => {
      console.log('Quiz ended, final leaderboard:', finalLeaderboard, 'Winner:', winner);
      setLeaderboard(finalLeaderboard);
      setShowLeaderboard(true);
      setCurrentQuestion(null);
      setWinner(winner);
    });

    return () => {
      socket.off('quiz_error');
      socket.off('quiz_data');
      socket.off('player_joined');
      socket.off('players_disconnected');
      socket.off('quiz_started');
      socket.off('question_start');
      socket.off('time_update');
      socket.off('show_leaderboard');
      socket.off('quiz_end');
    };
  }, [socket, isConnected, pin, navigate]);

  useEffect(() => {
    if (!isConnected || !socket || !pin) return;

    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/quizzes/pin/${pin}`);
        setQuiz(response.data);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz data');
      }
    };

    if (!quiz) {
      fetchQuiz();
    }
  }, [isConnected, socket, pin, quiz]);

  const handleStartGame = () => {
    if (players.length === 0) {
      setError('Need at least one player to start the game');
      return;
    }
    socket.emit('start_quiz', { pin });
  };

  const handleNextQuestion = () => {
    socket.emit('next_question', { pin });
  };

  const handleDisconnectAll = () => {
    if (window.confirm('Are you sure you want to disconnect all players?')) {
      // Clear the players list immediately
      setPlayers([]);
      // Reset game state if it was started
      if (gameStarted) {
        setGameStarted(false);
        setCurrentQuestion(null);
        setShowLeaderboard(false);
        setLeaderboard(null);
        setWinner(null);
      }
      // Then emit the disconnect event
      socket.emit('disconnect_all_players', { pin });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCopyLink = () => {
    // Copy the link to clipboard
    const gameUrl = `${window.location.origin}/join/${pin}`;
    navigator.clipboard.writeText(gameUrl);
    
    // Show success message
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    
    // Open the link in a new browser tab
    window.open(gameUrl, '_blank');
  };
  const gameLink = `${window.location.origin}/join/${pin}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <Header userName="Host" />
      {(!currentQuestion && winner) && <GameOverMessage winner={winner} />}
      
      <div className="p-2 sm:p-4 w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 gap-2">
            <button 
              className="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100" 
              onClick={handleBack}
              aria-label="Back"
            >
              <ArrowBackIcon />
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center">
                <QuizIcon className="mr-2 text-blue-600" />
                <span className="truncate">Hosting: {quiz?.title}</span>
              </h1>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-semibold flex items-center">
              <span className="mr-1 sm:mr-2">PIN:</span> 
              <span className="text-xl sm:text-2xl">{pin}</span>
            </div>
          </div>

          <div className="mb-6 p-3 sm:p-5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3 text-blue-600">
              <LinkIcon className="mr-2" />
              <h2 className="text-lg font-semibold">Share with players</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full flex-1 bg-white border border-gray-300 rounded-lg p-2 sm:p-3 text-blue-600 hover:text-blue-800 truncate overflow-hidden text-sm sm:text-base">
                {gameLink}
              </div>
              <button
                onClick={handleCopyLink}
                className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 text-white rounded-lg flex items-center justify-center transition-colors ${
                  copySuccess ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <ContentCopyIcon className="mr-2" />
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            
            <p className="mt-3 text-xs sm:text-sm text-gray-600 flex flex-wrap items-center">
              <HelpOutlineIcon className="mr-1 text-gray-400" fontSize="small" />
              Players can also visit <span className="font-semibold mx-1">{window.location.origin}</span> and enter PIN: <span className="font-semibold ml-1">{pin}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-700 rounded-lg flex items-center text-sm sm:text-base">
              <ErrorIcon className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!gameStarted ? (
            <>
              <div className="mb-6 sm:mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-700 flex items-center">
                    <PeopleIcon className="mr-2 text-blue-600" />
                    Players ({players.length})
                  </h2>
                  <button
                    onClick={handleDisconnectAll}
                    className={`px-3 py-1 sm:px-4 sm:py-2 text-white rounded-lg transition-colors flex items-center text-sm sm:text-base ${
                      players.length === 0
                        ? 'bg-red-300 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                    disabled={players.length === 0}
                  >
                    <LogoutIcon className="mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Disconnect All</span>
                    <span className="xs:hidden">All</span>
                  </button>
                </div>

                {players.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <PersonAddIcon className="text-gray-400 mb-2" style={{ fontSize: '36px' }} />
                    <p className="text-gray-500">Waiting for players to join...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {players.map((player, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-gray-800 font-medium truncate max-w-full">
                            {typeof player === 'string' ? player : player.name}
                          </span>
                          {typeof player !== 'string' && player.team && (
                            <span
                              className="text-xs sm:text-sm px-2 py-1 rounded mt-1 truncate max-w-full"
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
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleStartGame}
                disabled={players.length === 0}
                className={`w-full py-3 px-4 sm:px-6 rounded-lg text-white font-semibold flex items-center justify-center ${
                  players.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                <PlayArrowIcon className="mr-2" />
                {players.length === 0 ? 'Waiting for Players' : 'Start Game'}
              </button>
            </>
          ) : (
            <div className="container mx-auto">
              <div className="max-w-4xl mx-auto">
                {currentQuestion && !showLeaderboard && (
                  <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
                    <div className="flex flex-col xs:flex-row justify-between xs:items-center mb-3 sm:mb-5 gap-2">
                      <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                        <QuizIcon className="mr-2 text-blue-600" />
                        Question {currentQuestion.number} of {quiz?.questions?.length}
                      </h2>
                      <div className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center">
                        <AccessTimeIcon className="mr-2" />
                        {timeLeft}s
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 sm:mb-6">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                        style={{
                          width: `${(timeLeft / currentQuestion.timeLimit) * 100}%`,
                        }}
                      ></div>
                    </div>

                    <p className="text-base sm:text-lg mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">{currentQuestion.text}</p>
                    {currentQuestion.image && (
                      <div className="mb-4 flex justify-center">
                        <img
                          src={currentQuestion.image}
                          alt="Question"
                          className="max-w-full h-auto rounded-lg shadow-md"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-4">
                      {currentQuestion.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-2 sm:p-4 rounded-lg ${
                            index === currentQuestion.correctAnswer
                              ? 'bg-green-100 border-green-500'
                              : 'bg-gray-100 border-gray-300'
                          } border-2 shadow-sm transition-all hover:shadow-md text-sm sm:text-base`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showLeaderboard && leaderboard && (
                  <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 border border-gray-200">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center flex items-center justify-center">
                      <EmojiEventsIcon className="mr-2 text-yellow-500" />
                      Leaderboard
                    </h2>
                    
                    <div className="space-y-2 sm:space-y-4">
                      {leaderboard.map((player, index) => (
                        <div
                          key={player.name}
                          className={`flex items-center justify-between p-2 sm:p-4 rounded-lg transition-all ${
                            index === 0 ? 'bg-yellow-50 border border-yellow-200' : 
                            index === 1 ? 'bg-gray-50 border border-gray-200' : 
                            index === 2 ? 'bg-orange-50 border border-orange-200' : 
                            'bg-gray-50 border border-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className={`text-base sm:text-lg font-bold flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full mr-2 sm:mr-4 ${
                              index === 0 ? 'bg-yellow-500 text-white' : 
                              index === 1 ? 'bg-gray-400 text-white' : 
                              index === 2 ? 'bg-orange-500 text-white' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="flex flex-col xs:flex-row xs:items-center">
                              <span className="text-sm sm:text-lg truncate max-w-28 xs:max-w-full">{player.name}</span>
                              {player.team && (
                                <span
                                  className="xs:ml-2 text-xs sm:text-sm px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate max-w-28 xs:max-w-full"
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
                          <span className="text-base sm:text-lg font-semibold ml-2">{player.score} pts</span>
                        </div>
                      ))}
                    </div>

                    {!currentQuestion && (
                      <div className="mt-6 sm:mt-8 text-center">
                        <div className="text-lg sm:text-xl font-bold text-blue-600 mb-4 sm:mb-6 flex items-center justify-center">
                          <EmojiEventsIcon className="mr-2 text-yellow-500" />
                          Game Over!
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <button
                            onClick={handleStartGame}
                            disabled={players.length === 0}
                            className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-white font-semibold flex items-center justify-center ${
                              players.length === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            <RestartAltIcon className="mr-2" />
                            {players.length === 0 ? 'Waiting for Players' : 'Restart Game'}
                          </button>
                          <button
                            onClick={handleDisconnectAll}
                            className={`w-full sm:w-auto py-2 sm:py-3 px-4 sm:px-6 text-white rounded-lg transition-colors flex items-center justify-center ${
                              players.length === 0
                                ? 'bg-red-300 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600'
                            }`}
                            disabled={players.length === 0}
                          >
                            <LogoutIcon className="mr-2" />
                            Disconnect All
                          </button>
                        </div>
                      </div>
                    )}

                    {currentQuestion && (
                      <button
                        onClick={handleNextQuestion}
                        className="mt-4 sm:mt-6 w-full bg-blue-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <NavigateNextIcon className="mr-2" />
                        Next Question
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-6 sm:mt-8">
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                    <PeopleIcon className="mr-2 text-blue-600" />
                    Players ({players.length})
                  </h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {players.map((player, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm p-2 sm:p-3 text-center border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-gray-800 font-medium truncate max-w-full">
                            {typeof player === 'string' ? player : player.name}
                          </span>
                          {typeof player !== 'string' && player.team && (
                            <span
                              className="text-xs sm:text-sm px-1 sm:px-2 py-0.5 sm:py-1 rounded mt-1 truncate max-w-full"
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
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer/>

    </div>
  );
};

export default HostPage;