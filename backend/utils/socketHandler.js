const gameService = require('../services/gameService');
const db = require('../db');

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track which room/quiz this socket is in
    let currentPin = null;

    socket.on('join_quiz', async ({ pin, playerName }) => {
      console.log('Join quiz request:', { pin, playerName });
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
        const result = await gameService.joinQuiz(pin, playerName);
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
      if (gameState) {
        io.to(pin).emit('quiz_started');
        // Start with first question
        const firstQuestion = await gameService.nextQuestion(pin);
        if (firstQuestion) {
          // Send first question to admin
          socket.emit('question_start', { question: firstQuestion.adminData });
          // Send player data to other players
          socket.to(pin).emit('question_start', { question: firstQuestion.playerData });
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
          if (socket.isAdmin) {
            socket.emit('question_start', { question: result.adminData });
          }
          
          // Send player data to all other sockets in the room
          socket.to(pin).emit('question_start', { question: result.playerData });
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

    socket.on('question_timeout', async ({ pin }) => {
      console.log('Question timed out:', pin);
      
      // Get question end data with correct answer and leaderboard
      const result = await gameService.endQuestion(pin);
      if (result) {
        // First send the correct answer to everyone
        io.to(pin).emit('show_correct_answer', { correctAnswer: result.correctAnswer });

        // After 10 seconds, show the leaderboard
        setTimeout(() => {
          io.to(pin).emit('show_leaderboard', { leaderboard: result.leaderboard });
        }, 10000);
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
