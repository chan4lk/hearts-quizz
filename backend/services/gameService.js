const Quiz = require('../models/Quiz');
const gameStateService = require('./gameStateService');

class GameService {
  constructor() {
    this.gameStates = new Map();
    this.questionTimers = new Map();
    this.QUESTION_TIME_LIMIT = 20; // seconds
    this.playerSockets = new Map();
    this.playerScores = new Map();
    
    // Restore game states when service is initialized
    this.restoreGameStates().catch(err => {
      console.error('Failed to restore game states:', err);
    });
  }

  async initializeQuiz(pin, initialState) {
    console.log('Initializing quiz:', { pin, state: initialState });
    
    // Convert questions array to proper format if needed
    const formattedQuestions = initialState.questions.map(q => ({
      ...q,
      timeLimit: q.timeLimit || this.QUESTION_TIME_LIMIT
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
    await gameStateService.saveGameState(pin, gameState);
    return gameState;
  }

  async getGameState(pin) {
    let gameState = this.gameStates.get(pin);
    
    // If not in memory, try to load from persistence
    if (!gameState) {
      gameState = await gameStateService.loadGameState(pin);
      if (gameState) {
        this.gameStates.set(pin, gameState);
      }
    }
    
    console.log('Getting game state:', { pin, exists: !!gameState });
    return gameState;
  }

  async joinQuiz(pin, playerName) {
    console.log('Joining quiz:', { pin, playerName });
    
    const gameState = await this.getGameState(pin);
    if (!gameState) {
      console.error('No game found for pin:', pin);
      return { success: false, error: 'Game not found' };
    }

    // Skip adding admin to scores
    if (playerName !== 'admin') {
      if (!gameState.scores.has(playerName)) {
        gameState.scores.set(playerName, 0);
        gameState.totalPlayers++;
        await gameStateService.saveGameState(pin, gameState);
      }
    }

    return {
      success: true,
      players: Array.from(gameState.scores.keys())
    };
  }

  async startQuiz(pin) {
    console.log('Starting quiz:', pin);
    const gameState = await this.getGameState(pin);
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

  async submitAnswer(pin, playerName, answer, timeLeft) {
    const gameState = await this.getGameState(pin);
    if (!gameState || !gameState.isActive) return null;

    const currentQ = gameState.questions[gameState.currentQuestion];
    if (!currentQ) return null;

    // Record answer and calculate score
    const isCorrect = answer === currentQ.correctAnswer;
    const score = isCorrect ? Math.ceil(timeLeft * 100) : 0;
    
    gameState.scores.set(
      playerName,
      (gameState.scores.get(playerName) || 0) + score
    );
    
    await gameStateService.saveGameState(pin, gameState);
    
    return {
      isCorrect,
      score,
      correctAnswer: currentQ.correctAnswer
    };
  }

  async nextQuestion(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState || !gameState.isActive) return null;

    gameState.currentQuestion++;
    const question = gameState.questions[gameState.currentQuestion];
    
    if (!question) {
      // Quiz is over
      gameState.isActive = false;
      await gameStateService.saveGameState(pin, gameState);
      
      return {
        isOver: true,
        finalLeaderboard: Array.from(gameState.scores.entries()).map(
          ([playerName, score]) => ({ playerName, score })
        ).sort((a, b) => b.score - a.score)
      };
    }

    // Clear previous answers
    gameState.answers = new Map();
    await gameStateService.saveGameState(pin, gameState);

    // Return different data for admin and players
    return {
      adminData: {
        ...question,
        number: gameState.currentQuestion + 1,
        total: gameState.questions.length
      },
      playerData: {
        text: question.text,
        image: question.image,
        options: question.options,
        timeLimit: question.timeLimit,
        number: gameState.currentQuestion + 1,
        total: gameState.questions.length
      }
    };
  }

  async startQuestion(pin) {
    const gameState = await this.getGameState(pin);
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

  async endQuestion(pin) {
    const gameState = await this.getGameState(pin);
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

  async getQuestionEndData(pin) {
    const gameState = await this.getGameState(pin);
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

  async getPlayerList(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState) {
      return [];
    }
    return Array.from(gameState.scores.keys())
      .map(playerName => ({ name: playerName }));
  }

  async registerSocket(socketId, pin, playerName) {
    this.playerSockets.set(socketId, { pin, name: playerName });
  }

  async handleDisconnect(socketId) {
    const playerData = this.playerSockets.get(socketId);
    if (playerData) {
      const { pin, name } = playerData;
      console.log('Player disconnecting:', { pin, name, socketId });
      
      // Remove player from scores
      const gameState = await this.getGameState(pin);
      if (gameState) {
        gameState.scores.delete(name);
        gameState.totalPlayers--;
        await gameStateService.saveGameState(pin, gameState);
        
        // Clean up quiz if no players left
        if (gameState.totalPlayers === 0) {
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

  async handlePlayerJoin(socket, { pin, playerName }) {
    console.log('Player joining:', { pin, playerName, socketId: socket.id });
    
    // Store socket ID for player cleanup on disconnect
    this.playerSockets.set(socket.id, { pin, playerName });
    
    // Initialize score tracking for this quiz if not exists
    const gameState = await this.getGameState(pin);
    if (gameState) {
      if (!gameState.scores.has(playerName)) {
        gameState.scores.set(playerName, 0);
        gameState.totalPlayers++;
        await gameStateService.saveGameState(pin, gameState);
      }
    }
    
    // Return current player list
    return this.getPlayerList(pin);
  }

  async handlePlayerLeave(socket, pin) {
    const playerData = this.playerSockets.get(socket.id);
    if (playerData && playerData.pin === pin) {
      console.log('Player leaving room:', { pin, playerName: playerData.playerName });
      
      // Remove player from scores for this pin
      const gameState = await this.getGameState(pin);
      if (gameState) {
        gameState.scores.delete(playerData.playerName);
        gameState.totalPlayers--;
        await gameStateService.saveGameState(pin, gameState);
        
        // Clean up quiz if no players left
        if (gameState.totalPlayers === 0) {
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

  async handlePlayerDisconnect(socket) {
    const playerData = this.playerSockets.get(socket.id);
    if (playerData) {
      const { pin, playerName } = playerData;
      console.log('Player disconnecting:', { pin, playerName, socketId: socket.id });
      
      // Remove player from scores
      const gameState = await this.getGameState(pin);
      if (gameState) {
        gameState.scores.delete(playerName);
        gameState.totalPlayers--;
        await gameStateService.saveGameState(pin, gameState);
        
        // Clean up quiz if no players left
        if (gameState.totalPlayers === 0) {
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

  async cleanupQuiz(pin) {
    console.log('Cleaning up quiz:', pin);
    
    // Clear any existing timers
    if (this.questionTimers.has(pin)) {
      clearTimeout(this.questionTimers.get(pin));
      this.questionTimers.delete(pin);
    }
    
    // Remove game state
    this.gameStates.delete(pin);
    await gameStateService.removeGameState(pin);
  }

  async restoreGameStates() {
    try {
      // Get all active game states from the database using gameStateService
      const allStates = await gameStateService.getAllGameStates();
      
      if (!allStates) {
        console.log('No game states to restore');
        return;
      }
      
      // Restore each game state to memory
      for (const gameState of allStates) {
        const pin = gameState.pin;
        // Restore to memory
        this.gameStates.set(pin, gameState);
        console.log(`Restored game state for pin ${pin}`);
      }
      
      console.log(`Restored ${allStates.length} game states`);
    } catch (err) {
      console.error('Error restoring game states:', err);
      throw err;
    }
  }
}

module.exports = new GameService();
