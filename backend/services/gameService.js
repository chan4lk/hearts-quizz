const Quiz = require('../models/Quiz');

class GameService {
  constructor() {
    this.gameStates = new Map(); // Store game states by pin
    this.playerScores = new Map(); // Store player scores by pin
  }

  handlePlayerJoin(socket, { pin, playerName }) {
    socket.join(pin);
    
    if (!this.playerScores.has(pin)) {
      this.playerScores.set(pin, new Map());
    }
    
    // Initialize player score
    this.playerScores.get(pin).set(playerName, 0);
    
    // Return player list for admin
    return Array.from(this.playerScores.get(pin).keys());
  }

  async startQuiz(pin) {
    try {
      const quiz = await Quiz.findByPin(pin);
      if (!quiz) return null;

      this.gameStates.set(pin, {
        currentQuestion: 0,
        questions: quiz.questions,
        answers: new Map(),
        isActive: true
      });

      return {
        question: {
          text: quiz.questions[0].text,
          options: quiz.questions[0].options,
          questionNumber: 1,
          totalQuestions: quiz.questions.length
        }
      };
    } catch (err) {
      console.error('Error starting quiz:', err);
      return null;
    }
  }

  submitAnswer(pin, playerName, answer, timeLeft) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) return null;

    const currentQuestion = gameState.questions[gameState.currentQuestion];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    // Calculate score based on time left (max 1000 points)
    const score = isCorrect ? Math.round(timeLeft * 1000) : 0;
    
    // Update player's score
    const currentScore = this.playerScores.get(pin).get(playerName) || 0;
    this.playerScores.get(pin).set(playerName, currentScore + score);

    // Track who has answered
    if (!gameState.answers.has(gameState.currentQuestion)) {
      gameState.answers.set(gameState.currentQuestion, new Map());
    }
    gameState.answers.get(gameState.currentQuestion).set(playerName, { answer, score });

    // Check if all players have answered
    const totalPlayers = this.playerScores.get(pin).size;
    const answeredPlayers = gameState.answers.get(gameState.currentQuestion).size;

    if (answeredPlayers === totalPlayers) {
      return {
        leaderboard: this.getLeaderboard(pin),
        correctAnswer: currentQuestion.correctAnswer
      };
    }

    return null;
  }

  nextQuestion(pin) {
    const gameState = this.gameStates.get(pin);
    if (!gameState || !gameState.isActive) return null;

    gameState.currentQuestion++;

    // Check if quiz is over
    if (gameState.currentQuestion >= gameState.questions.length) {
      gameState.isActive = false;
      return {
        isOver: true,
        leaderboard: this.getLeaderboard(pin)
      };
    }

    // Return next question
    const question = gameState.questions[gameState.currentQuestion];
    return {
      question: {
        text: question.text,
        options: question.options,
        questionNumber: gameState.currentQuestion + 1,
        totalQuestions: gameState.questions.length
      }
    };
  }

  getLeaderboard(pin) {
    return Array.from(this.playerScores.get(pin).entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, score]) => ({ name, score }));
  }

  cleanup(pin) {
    this.gameStates.delete(pin);
    this.playerScores.delete(pin);
  }
}

module.exports = new GameService();
