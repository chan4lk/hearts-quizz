const Quiz = require('../models/Quiz');

class GameService {
  constructor() {
    this.gameStates = new Map();
    this.questionTimers = new Map();
    this.QUESTION_TIME_LIMIT = 20; // seconds
    this.playerSockets = new Map();
    this.playerScores = new Map();
  }

  initializeQuiz(pin, initialState) {
    console.log('Initializing quiz:', { pin, state: initialState });
    
    // Convert questions array to proper format if needed
    const formattedQuestions = initialState.questions.map(q => ({
      ...q,
      timeLimit: this.QUESTION_TIME_LIMIT
    }));

    const gameState = {
      ...initialState,
      questions: formattedQuestions,
      scores: new Map(),
      answers: new Map(),
      isActive: false,
      currentQuestion: -1,
      totalPlayers: 0
    };

    this.gameStates.set(pin, gameState);
    return gameState;
  }

  getGameState(pin) {
    const gameState = this.gameStates.get(pin);
    console.log('Getting game state:', { pin, exists: !!gameState });
    return gameState;
  }

  joinQuiz(pin, playerName) {
    console.log('Joining quiz:', { pin, playerName });
    
    const gameState = this.getGameState(pin);
    if (!gameState) {
      console.error('No game found for pin:', pin);
      return { success: false, error: 'Game not found' };
    }

    // Skip adding admin to scores
    if (playerName !== 'admin') {
      gameState.scores.set(playerName, 0);
      gameState.totalPlayers++;
    }

    // Get current player list (excluding admin)
    const players = Array.from(gameState.scores.keys());
    console.log('Current players:', players);

    return {
      success: true,
      players
    };
  }

  startQuiz(pin) {
    console.log('Starting quiz:', pin);
    const gameState = this.getGameState(pin);
    if (!gameState) {
      console.error('No game found for pin:', pin);
      return null;
    }

    if (gameState.isActive) {
      console.error('Quiz already active:', pin);
      return null;
    }

    gameState.isActive = true;
    gameState.currentQuestion = -1;

    // Start with first question
    return this.nextQuestion(pin);
  }

  cleanupQuiz(pin) {
    console.log('Cleaning up quiz:', pin);
    
    // Clear any existing timers
    if (this.questionTimers.has(pin)) {
      clearTimeout(this.questionTimers.get(pin));
      this.questionTimers.delete(pin);
    }
    
    // Remove game state
    this.gameStates.delete(pin);
  }

  handlePlayerJoin(socket, { pin, playerName }) {
    console.log('Player joining:', { pin, playerName, socketId: socket.id });
    
    // Store socket ID for player cleanup on disconnect
    this.playerSockets.set(socket.id, { pin, playerName });
    
    // Initialize score tracking for this quiz if not exists
    if (!this.playerScores.has(pin)) {
      this.playerScores.set(pin, new Map());
    }
    
    // Initialize or update player score
    this.playerScores.get(pin).set(playerName, 0);
    
    // Return current player list
    return this.getPlayerList(pin);
  }

  handlePlayerLeave(socket, pin) {
    const playerData = this.playerSockets.get(socket.id);
    if (playerData && playerData.pin === pin) {
      console.log('Player leaving room:', { pin, playerName: playerData.playerName });
      
      // Remove player from scores for this pin
      if (this.playerScores.has(pin)) {
        this.playerScores.get(pin).delete(playerData.playerName);
        
        // Clean up quiz if no players left
        if (this.playerScores.get(pin).size === 0) {
          this.cleanupQuiz(pin);
        }
      }
      
      // Remove socket mapping
      this.playerSockets.delete(socket.id);
      
      // Return updated player list
      return this.getPlayerList(pin);
    }
    return null;
  }

  handlePlayerDisconnect(socket) {
    const playerData = this.playerSockets.get(socket.id);
    if (playerData) {
      const { pin, playerName } = playerData;
      console.log('Player disconnecting:', { pin, playerName, socketId: socket.id });
      
      // Remove player from scores
      if (this.playerScores.has(pin)) {
        this.playerScores.get(pin).delete(playerName);
        
        // Clean up quiz if no players left
        if (this.playerScores.get(pin).size === 0) {
          this.cleanupQuiz(pin);
        }
      }
      
      // Remove socket mapping
      this.playerSockets.delete(socket.id);
      
      // Return updated player list
      return this.getPlayerList(pin);
    }
    return null;
  }

  async startQuiz(pin) {
    try {
      console.log('Starting quiz:', pin);
      const quiz = await Quiz.findByPin(pin);
      if (!quiz) {
        console.error('Quiz not found:', pin);
        return null;
      }

      // Ensure we have players
      if (!this.playerScores.has(pin) || this.playerScores.get(pin).size === 0) {
        console.error('No players in quiz:', pin);
        return null;
      }

      // Initialize game state
      this.gameStates.set(pin, {
        currentQuestion: 0,
        questions: quiz.questions,
        answers: new Map(),
        isActive: true,
        totalPlayers: this.playerScores.get(pin).size
      });

      console.log('Game state initialized:', {
        pin,
        totalPlayers: this.gameStates.get(pin).totalPlayers,
        totalQuestions: quiz.questions.length
      });

      // Start first question
      return this.nextQuestion(pin);
    } catch (err) {
      console.error('Error starting quiz:', err);
      return null;
    }
  }

  nextQuestion(pin) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) {
      console.error('Invalid game state for pin:', pin);
      return null;
    }

    gameState.currentQuestion++;
    if (gameState.currentQuestion >= gameState.questions.length) {
      console.log('Quiz is over');
      return { isOver: true, leaderboard: Array.from(gameState.scores.entries()).map(([name, score]) => ({ name, score })) };
    }

    // Get the next question
    const question = gameState.questions[gameState.currentQuestion];
    
    // Base question data for all players
    const baseQuestionData = {
      number: gameState.currentQuestion + 1,
      totalQuestions: gameState.questions.length,
      text: question.text,
      options: question.options,
      image: question.image,
      timeLimit: this.QUESTION_TIME_LIMIT,
      timeLeft: this.QUESTION_TIME_LIMIT
    };

    // Add correct answer only for admin
    const adminQuestionData = {
      ...baseQuestionData,
      correctAnswer: question.correctAnswer
    };

    // Clear previous answers
    gameState.answers.set(gameState.currentQuestion, new Map());

    // Clear previous timer if exists
    if (this.questionTimers.has(pin)) {
      clearTimeout(this.questionTimers.get(pin));
    }

    // Set timer for question end
    this.questionTimers.set(pin, setTimeout(() => {
      this.endQuestion(pin);
    }, this.QUESTION_TIME_LIMIT * 1000));

    return { playerData: baseQuestionData, adminData: adminQuestionData };
  }

  startQuestion(pin) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) {
      console.error('Invalid game state for pin:', pin);
      return null;
    }

    const question = gameState.questions[gameState.currentQuestion];
    
    // Base question data for all players
    const baseQuestionData = {
      number: gameState.currentQuestion + 1,
      totalQuestions: gameState.questions.length,
      text: question.text,
      options: question.options,
      image: question.image,
      timeLimit: this.QUESTION_TIME_LIMIT,
      timeLeft: this.QUESTION_TIME_LIMIT
    };

    // Add correct answer only for admin
    const adminQuestionData = {
      ...baseQuestionData,
      correctAnswer: question.correctAnswer
    };

    console.log('Starting question:', {
      pin,
      questionNumber: baseQuestionData.number,
      totalQuestions: baseQuestionData.totalQuestions
    });

    // Clear previous answers
    gameState.answers.set(gameState.currentQuestion, new Map());

    // Clear previous timer if exists
    if (this.questionTimers.has(pin)) {
      clearTimeout(this.questionTimers.get(pin));
    }

    // Set timer for question end
    this.questionTimers.set(pin, setTimeout(() => {
      this.endQuestion(pin);
    }, this.QUESTION_TIME_LIMIT * 1000));

    return { playerData: baseQuestionData, adminData: adminQuestionData };
  }

  submitAnswer(pin, playerName, answer, timeLeft) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) return null;

    const currentQuestion = gameState.questions[gameState.currentQuestion];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    // Calculate score (max 1000 points)
    const score = isCorrect ? Math.round(timeLeft * 1000 / this.QUESTION_TIME_LIMIT) : 0;
    
    // Update player's score
    const currentScore = gameState.scores.get(playerName) || 0;
    gameState.scores.set(playerName, currentScore + score);

    // Record answer
    if (!gameState.answers.has(gameState.currentQuestion)) {
      gameState.answers.set(gameState.currentQuestion, new Map());
    }
    gameState.answers.get(gameState.currentQuestion).set(playerName, { answer, score });

    console.log('Answer submitted:', {
      pin,
      playerName,
      answer,
      isCorrect,
      score,
      totalScore: currentScore + score
    });

    // Check if all players have answered
    const answeredPlayers = gameState.answers.get(gameState.currentQuestion).size;
    if (answeredPlayers === gameState.totalPlayers) {
      return this.getQuestionEndData(pin);
    }

    return null;
  }

  endQuestion(pin) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) {
      console.error('Invalid game state for pin:', pin);
      return null;
    }

    // Clear the timer
    if (this.questionTimers.has(pin)) {
      clearTimeout(this.questionTimers.get(pin));
      this.questionTimers.delete(pin);
    }

    const currentAnswers = gameState.answers.get(gameState.currentQuestion) || new Map();
    const correctAnswer = gameState.questions[gameState.currentQuestion].correctAnswer;

    // Calculate scores for this question
    for (const [playerName, answer] of currentAnswers.entries()) {
      if (answer.answer === correctAnswer) {
        const timeBonus = Math.floor(answer.timeLeft / 2);
        const score = 100 + timeBonus;
        const currentScore = gameState.scores.get(playerName) || 0;
        gameState.scores.set(playerName, currentScore + score);
      }
    }

    // Return results including the correct answer
    return {
      correctAnswer,
      leaderboard: Array.from(gameState.scores.entries())
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
    };
  }

  getQuestionEndData(pin) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) return null;

    const currentAnswers = gameState.answers.get(gameState.currentQuestion);
    const currentQuestion = gameState.questions[gameState.currentQuestion];

    // Calculate answer statistics
    const answerStats = Array(4).fill(0);
    currentAnswers.forEach(({ answer }) => {
      if (answer >= 0 && answer < 4) {
        answerStats[answer]++;
      }
    });

    // Get current leaderboard
    const leaderboard = Array.from(gameState.scores.entries())
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      leaderboard,
      correctAnswer: currentQuestion.correctAnswer,
      answerStats
    };
  }

  getPlayerList(pin) {
    if (!this.playerScores.has(pin)) {
      return [];
    }
    return Array.from(this.playerScores.get(pin).keys())
      .map(playerName => ({ name: playerName }));
  }

  registerSocket(socketId, pin, playerName) {
    this.playerSockets.set(socketId, { pin, name: playerName });
  }

  handleDisconnect(socketId) {
    const playerData = this.playerSockets.get(socketId);
    if (playerData) {
      const { pin, name } = playerData;
      console.log('Player disconnecting:', { pin, name, socketId });
      
      // Remove player from scores
      if (this.playerScores.has(pin)) {
        this.playerScores.get(pin).delete(name);
        
        // Clean up quiz if no players left
        if (this.playerScores.get(pin).size === 0) {
          this.cleanupQuiz(pin);
        }
      }
      
      // Remove socket mapping
      this.playerSockets.delete(socketId);
      
      // Return updated player list
      return this.getPlayerList(pin);
    }
    return null;
  }
}

module.exports = new GameService();
