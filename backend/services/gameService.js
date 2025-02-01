const Quiz = require('../models/Quiz');

class GameService {
  constructor() {
    this.gameStates = new Map(); // Store game states by pin
    this.playerScores = new Map(); // Store player scores by pin
    this.questionTimers = new Map(); // Store question timers by pin
    this.playerSockets = new Map(); // Store socket IDs for players
    this.QUESTION_TIME_LIMIT = 20; // 20 seconds per question
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

  cleanupQuiz(pin) {
    console.log('Cleaning up quiz:', pin);
    // Clear timers
    if (this.questionTimers.has(pin)) {
      clearTimeout(this.questionTimers.get(pin));
      this.questionTimers.delete(pin);
    }
    // Clear game state
    this.gameStates.delete(pin);
    // Clear player scores
    this.playerScores.delete(pin);
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
      return this.startQuestion(pin);
    } catch (err) {
      console.error('Error starting quiz:', err);
      return null;
    }
  }

  startQuestion(pin) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) {
      console.error('Invalid game state for pin:', pin);
      return null;
    }

    const question = gameState.questions[gameState.currentQuestion];
    const questionData = {
      text: question.text,
      options: question.options,
      questionNumber: gameState.currentQuestion + 1,
      totalQuestions: gameState.questions.length,
      timeLimit: this.QUESTION_TIME_LIMIT
    };

    console.log('Starting question:', {
      pin,
      questionNumber: questionData.questionNumber,
      totalQuestions: questionData.totalQuestions
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

    return questionData;
  }

  submitAnswer(pin, playerName, answer, timeLeft) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) return null;

    const currentQuestion = gameState.questions[gameState.currentQuestion];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    // Calculate score (max 1000 points)
    const score = isCorrect ? Math.round(timeLeft * 1000 / this.QUESTION_TIME_LIMIT) : 0;
    
    // Update player's score
    const currentScore = this.playerScores.get(pin).get(playerName) || 0;
    this.playerScores.get(pin).set(playerName, currentScore + score);

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
    console.log('Question ended:', pin);
    const result = this.getQuestionEndData(pin);
    return result;
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
    const leaderboard = Array.from(this.playerScores.get(pin).entries())
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      leaderboard,
      correctAnswer: currentQuestion.correctAnswer,
      answerStats
    };
  }

  nextQuestion(pin) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) return null;

    gameState.currentQuestion++;

    if (gameState.currentQuestion >= gameState.questions.length) {
      console.log('Quiz ended:', pin);
      // Quiz is over, send final results
      const winners = Array.from(this.playerScores.get(pin).entries())
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const allPlayers = Array.from(this.playerScores.get(pin).entries())
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);

      // Clean up the quiz
      this.cleanupQuiz(pin);

      return {
        isOver: true,
        winners,
        allPlayers
      };
    }

    return this.startQuestion(pin);
  }

  getPlayerList(pin) {
    if (!this.playerScores.has(pin)) {
      return [];
    }
    return Array.from(this.playerScores.get(pin).keys())
      .map(playerName => ({ name: playerName }));
  }
}

module.exports = new GameService();
