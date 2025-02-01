const gameService = require('../services/gameService');

function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track which room/quiz this socket is in
    let currentPin = null;

    socket.on('join_quiz', async ({ pin, playerName }) => {
      console.log('Join quiz request:', { pin, playerName });
      try {
        // Get quiz from database
        const quiz = await global.db.get('SELECT * FROM quizzes WHERE pin = ?', [pin]);
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
        gameService.registerSocket(socket.id, pin, playerName);

        // Notify all clients in the room about the new player
        io.to(pin).emit('player_joined', {
          players: result.players,
          playerName
        });

        // If player is admin, send full quiz data
        if (playerName === 'admin') {
          const questions = await global.db.all('SELECT * FROM questions WHERE quiz_id = ?', [quiz.id]);
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

    socket.on('start_quiz', ({ pin }) => {
      console.log('Starting quiz:', pin);
      const gameState = gameService.startQuiz(pin);
      if (gameState) {
        io.to(pin).emit('quiz_started');
        // Start with first question
        gameService.nextQuestion(pin);
      }
    });

    socket.on('next_question', ({ pin }) => {
      console.log('Moving to next question:', pin);
      const result = gameService.nextQuestion(pin);
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

    socket.on('submit_answer', ({ pin, playerName, answer, timeLeft }) => {
      console.log('Answer submitted:', { pin, playerName, answer, timeLeft });
      
      const result = gameService.submitAnswer(pin, playerName, answer, timeLeft);
      if (result) {
        io.to(pin).emit('question_end', result);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (currentPin) {
        // Clean up player data if they were in a game
        const players = gameService.handlePlayerDisconnect(socket);
        if (players) {
          // Notify others in the room about the player leaving
          io.to(currentPin).emit('player_joined', { players });
        }
        gameService.handleDisconnect(socket.id);
      }
    });
  });
}

module.exports = socketHandler;
