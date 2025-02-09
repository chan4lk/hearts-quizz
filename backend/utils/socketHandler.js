const gameService = require('../services/gameService');
const db = require('../db');

function socketHandler(io) {
  const questionTimers = new Map();

  function startQuestionTimer(pin, timeLimit) {
    // Clear any existing timer
    if (questionTimers.has(pin)) {
      clearInterval(questionTimers.get(pin).interval);
      questionTimers.delete(pin);
    }

    const startTime = Date.now();
    const timer = {
      startTime,
      timeLimit,
      interval: setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timeLeft = Math.max(0, timeLimit - elapsed);
        
        // Emit time update to all players
        io.to(pin).emit('time_update', { timeLeft, totalTime: timeLimit });
        
        // When time is up
        if (timeLeft === 0) {
          clearInterval(timer.interval);
          questionTimers.delete(pin);
          handleQuestionTimeout(pin);
        }
      }, 1000)
    };
    
    questionTimers.set(pin, timer);
  }

  async function handleQuestionTimeout(pin) {
    const result = await gameService.endQuestion(pin);
    if (result) {
      // First send the correct answer to everyone
      io.to(pin).emit('show_correct_answer', { correctAnswer: result.correctAnswer });

      // After 10 seconds, show the leaderboard
      setTimeout(() => {
        io.to(pin).emit('show_leaderboard', { leaderboard: result.leaderboard });
      }, 10000);
    }
  }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track which room/quiz this socket is in
    let currentPin = null;

    socket.on('join_quiz', async ({ pin, playerName, teamId }) => {
      console.log('Join quiz request:', { pin, playerName, teamId });
      try {
        // Get quiz from database
        const quiz = await db.get('SELECT * FROM quizzes WHERE pin = ?', [pin]);
        if (!quiz) {
          socket.emit('quiz_error', { message: 'Quiz not found' });
          return;
        }

        // Join the room
        socket.join(pin);
        currentPin = pin;

        // Add player to game
        const result = await gameService.joinQuiz(pin, playerName, teamId);
        if (!result.success) {
          socket.emit('quiz_error', { message: result.error });
          return;
        }

        // Register socket with game service
        await gameService.registerSocket(socket.id, pin, playerName);

        // Notify all clients in the room about the new player
        io.to(pin).emit('player_joined', {
          players: result.players,
          playerName
        });

        // If player is admin, send full quiz data
        if (playerName === 'admin') {
          const questions = await db.all('SELECT * FROM questions WHERE quiz_id = ?', [quiz.id]);
          socket.emit('quiz_data', {
            ...quiz,
            questions: questions.map(q => ({
              text: q.text,
              options: JSON.parse(q.options),
              correctAnswer: q.correct_answer,
              image: q.image
            }))
          });
        }
      } catch (error) {
        console.error('Error in join_quiz:', error);
        socket.emit('quiz_error', { message: 'Failed to join quiz' });
      }
    });

    socket.on('start_quiz', async ({ pin }) => {
      console.log('Starting quiz:', pin);
      const gameState = await gameService.startQuiz(pin);
      if (!gameState) {
        socket.emit('quiz_error', { message: 'Failed to start quiz' });
        return;
      }

      // Notify all players that the quiz has started
      io.to(pin).emit('quiz_started');

      // Start with first question
      const firstQuestion = await gameService.nextQuestion(pin);
      if (firstQuestion) {
        if (firstQuestion.isOver) {
          io.to(pin).emit('quiz_end', firstQuestion);
        } else {
          // Send first question to admin
          socket.emit('question_start', { question: firstQuestion.adminData });
          // Send player data to other players
          socket.to(pin).emit('question_start', { question: firstQuestion.playerData });
          // Start the timer
          startQuestionTimer(pin, firstQuestion.adminData.timeLimit);
        }
      }
    });

    socket.on('next_question', async ({ pin }) => {
      console.log('Moving to next question:', pin);
      const result = await gameService.nextQuestion(pin);
      if (result) {
        if (result.isOver) {
          io.to(pin).emit('quiz_end', result);
        } else {
          // Send admin data to admin socket
          socket.emit('question_start', { question: result.adminData });
          // Send player data to all other sockets in the room
          socket.to(pin).emit('question_start', { question: result.playerData });
          // Start the timer
          startQuestionTimer(pin, result.adminData.timeLimit);
        }
      }
    });

    socket.on('submit_answer', async ({ pin, playerName, answer, timeLeft }) => {
      console.log('Answer submitted:', { pin, playerName, answer, timeLeft });
      
      const result = await gameService.submitAnswer(pin, playerName, answer, timeLeft);
      if (result) {
        // Send immediate feedback to the player who answered
        socket.emit('answer_submitted', result);
      }
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      if (currentPin) {
        // Clean up player data if they were in a game
        const players = await gameService.handlePlayerDisconnect(socket);
        if (players) {
          // Notify others in the room about the player leaving
          io.to(currentPin).emit('player_joined', { players });
        }
        await gameService.handleDisconnect(socket.id);
      }
    });
  });
}

module.exports = socketHandler;
