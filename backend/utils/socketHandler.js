const gameService = require('../services/gameService');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Track which room/quiz this socket is in
    let currentPin = null;

    socket.on('join_quiz', async (data) => {
      const { pin, playerName } = data;
      console.log('Player joining quiz:', { pin, playerName, socketId: socket.id });
      
      // Leave previous room if any
      if (currentPin) {
        socket.leave(currentPin);
        // Clean up from previous room
        const prevPlayers = gameService.handlePlayerLeave(socket, currentPin);
        if (prevPlayers) {
          io.to(currentPin).emit('player_joined', { players: prevPlayers });
        }
      }
      
      // Join new room
      socket.join(pin);
      currentPin = pin;
      
      // Skip adding admin to player list
      if (playerName.toLowerCase() !== 'admin') {
        const players = gameService.handlePlayerJoin(socket, { pin, playerName });
        console.log('Current players:', players);
        // Broadcast to everyone in the room
        io.to(pin).emit('player_joined', { players });
      } else {
        // If admin is joining, send them the current player list
        const players = gameService.getPlayerList(pin);
        socket.emit('player_joined', { players });
      }
    });

    socket.on('start_quiz', async ({ pin }) => {
      console.log('Starting quiz:', pin);
      try {
        const questionData = await gameService.startQuiz(pin);
        if (questionData) {
          console.log('Quiz started successfully');
          // First notify everyone that quiz is starting
          io.to(pin).emit('quiz_started', { success: true });
          
          // Then send the first question after a short delay
          setTimeout(() => {
            io.to(pin).emit('question_start', { question: questionData });
          }, 1000);
        } else {
          console.error('Failed to start quiz');
          socket.emit('quiz_error', { message: 'Failed to start quiz' });
        }
      } catch (error) {
        console.error('Error starting quiz:', error);
        socket.emit('quiz_error', { message: 'Error starting quiz' });
      }
    });

    socket.on('submit_answer', (data) => {
      const { pin, playerName, answer, timeLeft } = data;
      console.log('Answer submitted:', { pin, playerName, answer, timeLeft });
      
      const result = gameService.submitAnswer(pin, playerName, answer, timeLeft);
      if (result) {
        io.to(pin).emit('question_end', result);
      }
    });

    socket.on('next_question', ({ pin }) => {
      console.log('Moving to next question:', pin);
      const result = gameService.nextQuestion(pin);
      if (result) {
        if (result.isOver) {
          io.to(pin).emit('quiz_end', result);
        } else {
          io.to(pin).emit('question_start', { question: result });
        }
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
      }
    });
  });
};

module.exports = setupSocketHandlers;
