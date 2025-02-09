const db = require('../db');
const gameStateManager = require('./gameStateManager');

class GameService {
  constructor() {
    this.QUESTION_TIME_LIMIT = 20; // seconds
    this.playerSockets = new Map();
    this.gameStates = new Map();
    this.questionTimers = new Map();
    this.playerScores = new Map();
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
      isActive: false,
      currentQuestion: -1,
      players: [],
      scores: new Map(),
      answers: new Map(),
      teams: initialState.teams || []
    };

    await gameStateManager.saveGameState(pin, gameState);
    this.gameStates.set(pin, gameState);
    return gameState;
  }

  async getGameState(pin) {
    let gameState = this.gameStates.get(pin);
    
    // If not in memory, try to load from persistence
    if (!gameState) {
      gameState = await gameStateManager.getGameState(pin);
      if (gameState) {
        this.gameStates.set(pin, gameState);
      }
    }
    
    console.log('Getting game state:', { pin, exists: !!gameState });
    return gameState;
  }

  async joinQuiz(pin, playerName, teamId = null) {
    console.log('Joining quiz:', { pin, playerName, teamId });
    
    let gameState = await gameStateManager.getGameState(pin);
    
    // If admin is joining and no game state exists, initialize it
    if (!gameState && playerName === 'admin') {
      console.log('Admin joining, initializing game state');
      const quiz = await db.get('SELECT * FROM quizzes WHERE pin = ?', [pin]);
      if (!quiz) {
        console.error('Quiz not found in database:', pin);
        return { success: false, error: 'Quiz not found' };
      }

      const questions = await db.all('SELECT * FROM questions WHERE quiz_id = ?', [quiz.id]);
      const formattedQuestions = questions.map(q => ({
        text: q.text,
        options: JSON.parse(q.options),
        correctAnswer: q.correct_answer,
        image: q.image,
        timeLimit: q.timeLimit || this.QUESTION_TIME_LIMIT
      }));

      const teams = await db.all('SELECT * FROM teams WHERE quiz_id = ?', [quiz.id]);
      gameState = await this.initializeQuiz(pin, { 
        questions: formattedQuestions,
        teams: teams.map(team => ({
          id: team.id,
          name: team.name,
          color: team.color
        }))
      });
    }

    if (!gameState) {
      return { success: false, error: 'Quiz not found' };
    }

    // Don't add admin to the players list
    if (playerName !== 'admin' && !gameState.players.find(p => p.name === playerName)) {
      // Find the team if teamId is provided
      const team = teamId ? gameState.teams?.find(t => t.id === teamId) : null;
      
      // Add player with team info
      const player = {
        name: playerName,
        team: team || null
      };
      
      gameState.players.push(player);
      gameState.scores.set(playerName, 0);
      await gameStateManager.saveGameState(pin, gameState);
    }

    return { 
      success: true, 
      players: gameState.players,
      teams: gameState.teams
    };
  }

  async startQuiz(pin) {
    console.log('Starting quiz:', pin);
    const gameState = await this.getGameState(pin);
    if (!gameState) {
      console.error('No game found for pin:', pin);
      return null;
    }

    // Reset game state when starting
    gameState.isActive = true;
    gameState.currentQuestion = -1;
    gameState.players = gameState.players || [];
    gameState.scores = new Map();
    gameState.answers = new Map();

    // Save the updated game state
    await gameStateManager.saveGameState(pin, gameState);

    // Start with first question
    return gameState;
  }

  async nextQuestion(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState || !gameState.isActive) {
      console.error('No active game found for pin:', pin);
      return null;
    }

    // Clear previous question's answers
    gameState.answers = new Map();
    
    // Move to next question
    gameState.currentQuestion++;

    // Check if quiz is over
    if (gameState.currentQuestion >= gameState.questions.length) {
      gameState.isActive = false;
      await gameStateManager.saveGameState(pin, gameState);
      return {
        isOver: true,
        winner: Array.from(gameState.scores.entries())
          .map(([player, score]) => ({ player, score }))
          .sort((a, b) => b.score - a.score)[0]?.player,
        finalLeaderboard: this.buildLeaderboard(gameState)
      };
    }

    const question = gameState.questions[gameState.currentQuestion];
    await gameStateManager.saveGameState(pin, gameState);

    // Return different data for admin and players
    return {
      adminData: {
        ...question,
        number: gameState.currentQuestion + 1,
        correctAnswer: question.correctAnswer
      },
      playerData: {
        text: question.text,
        options: question.options,
        image: question.image,
        timeLimit: question.timeLimit,
        number: gameState.currentQuestion + 1
      }
    };
  }

  async submitAnswer(pin, playerName, answer, timeLeft) {
    const gameState = await this.getGameState(pin);
    if (!gameState || !gameState.isActive) return null;

    const currentQ = gameState.questions[gameState.currentQuestion];
    if (!currentQ) return null;

    // Record answer and calculate score based on time left
    const isCorrect = answer === currentQ.correctAnswer;
    const timeBonus = timeLeft / currentQ.timeLimit; // Time bonus factor (0 to 1)
    const baseScore = 1000; // Base score for correct answer
    const score = isCorrect ? Math.ceil(baseScore * timeBonus) : 0;
    
    // Store the answer with score and time info
    gameState.answers.set(playerName, {
      answer,
      isCorrect,
      score,
      timeLeft,
      timeBonus
    });
    
    // Update total score
    gameState.scores.set(
      playerName,
      (gameState.scores.get(playerName) || 0) + score
    );
    
    await gameStateManager.saveGameState(pin, gameState);
    
    // Don't return correct answer immediately
    return {
      answered: true,
      score
    };
  }

  async endQuiz(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState) return null;

    const finalLeaderboard = this.buildLeaderboard(gameState);
    const winner = finalLeaderboard[0]?.name || null;

    return {
      finalLeaderboard,
      winner
    };
  }

  async endQuestion(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState || !gameState.isActive) return null;

    const currentQ = gameState.questions[gameState.currentQuestion];
    if (!currentQ) return null;

    return {
      leaderboard: this.buildLeaderboard(gameState),
      correctAnswer: currentQ.correctAnswer
    };
  }

  async getQuestionEndData(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState) return null;

    return {
      leaderboard: this.buildLeaderboard(gameState),
      correctAnswer: gameState.questions[gameState.currentQuestion]?.correctAnswer
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

  async getPlayerList(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState) {
      return [];
    }
    return Array.from(gameState.scores.keys())
      .map(playerName => ({ name: playerName }));
  }

  async registerSocket(socketId, pin, playerName) {
    this.playerSockets.set(socketId, { pin, playerName });
  }

  async handleDisconnect(socketId) {
    console.log('Handling player disconnection:', socketId);
    const playerData = this.playerSockets.get(socketId);
    if (playerData) {
      const { pin, name } = playerData;
      console.log('Player disconnecting:', { pin, name, socketId });
      
      // Remove player from scores
      const gameState = await this.getGameState(pin);
      if (gameState) {
        gameState.scores.delete(name);
        gameState.totalPlayers--;
        await gameStateManager.saveGameState(pin, gameState);
        
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
    console.log('No player found for socket:', socketId);
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
        await gameStateManager.saveGameState(pin, gameState);
      }
    }
    
    // Return current player list
    return this.getPlayerList(pin);
  }

  async handlePlayerLeave(socket, pin) {
    console.log('Player leaving room:', { pin, socketId: socket.id });
    const playerData = this.playerSockets.get(socket.id);
    if (playerData && playerData.pin === pin) {
      console.log('Player leaving room:', { pin, playerName: playerData.playerName });
      
      // Remove player from scores for this pin
      const gameState = await this.getGameState(pin);
      if (gameState) {
        gameState.scores.delete(playerData.playerName);
        gameState.totalPlayers--;
        await gameStateManager.saveGameState(pin, gameState);
        
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
    console.log('No player found for socket:', socket.id);
    return null;
  }

  async handlePlayerDisconnect(socket) {
    console.log('Handling player disconnection:', socket.id);
    const playerData = this.playerSockets.get(socket.id);
    if (playerData) {
      const { pin, playerName } = playerData;
      console.log('Player disconnecting:', { pin, playerName, socketId: socket.id });
      
      // Remove player from scores
      const gameState = await this.getGameState(pin);
      if (gameState) {
        gameState.scores.delete(playerName);
        gameState.totalPlayers--;
        await gameStateManager.saveGameState(pin, gameState);
        
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
    console.log('No player found for socket:', socket.id);
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
    await gameStateManager.removeGameState(pin);
  }

  async restoreGameStates() {
    try {
      // Get all active game states from the database using gameStateService
      const allStates = await gameStateManager.getAllGameStates();
      
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

  async getPlayerNameFromSocket(socketId) {
    console.log('Getting player name for socket:', socketId);
    for (const [playerName, socket] of this.playerSockets.entries()) {
      if (socket === socketId) {
        console.log('Found player:', playerName);
        return playerName;
      }
    }
    console.log('No player found for socket:', socketId);
    return null;
  }

  async disconnectAllPlayers(pin) {
    console.log('Disconnecting all players for quiz:', pin);
    const gameState = await this.getGameState(pin);
    if (!gameState) {
      console.error('Quiz not found for pin:', pin);
      return { success: false, error: 'Quiz not found' };
    }

    const initialPlayerCount = gameState.players.length;
    
    // Keep only admin in the players list
    gameState.players = gameState.players.filter(player => 
      typeof player === 'string' ? player === 'admin' : player.name === 'admin'
    );
    
    // Reset scores except for admin
    const newScores = new Map();
    for (const [name, score] of gameState.scores.entries()) {
      if (name === 'admin') {
        newScores.set(name, score);
      }
    }
    gameState.scores = newScores;

    await gameStateManager.saveGameState(pin, gameState);
    
    console.log(`Disconnected ${initialPlayerCount - gameState.players.length} players from quiz ${pin}`);
    return { success: true, players: gameState.players };
  }

  /**
   * Builds a standardized leaderboard structure from game state
   * @param {Object} gameState Current game state
   * @returns {Array} Leaderboard data with player scores and team information
   */
  buildLeaderboard(gameState) {
    if (!gameState || !gameState.scores) return [];

    return Array.from(gameState.scores.entries())
      .map(([name, totalScore]) => {
        const answer = gameState.answers.get(name);
        const player = gameState.players.find(p => p.name === name);
        
        // Ensure we have the complete team object
        const team = player?.team ? {
          id: player.team.id,
          name: player.team.name,
          color: player.team.color
        } : null;

        return {
          name,
          score: totalScore,
          team,
          lastAnswer: answer || { score: 0, timeBonus: 0, isCorrect: false }
        };
      })
      .sort((a, b) => {
        // First sort by total score
        if (b.score !== a.score) return b.score - a.score;
        // Then by correctness of last answer
        if (b.lastAnswer.isCorrect !== a.lastAnswer.isCorrect) return b.lastAnswer.isCorrect ? 1 : -1;
        // Finally by time bonus of last answer
        return b.lastAnswer.timeBonus - a.lastAnswer.timeBonus;
      });
  }
}

// Export singleton instance
module.exports = new GameService();
