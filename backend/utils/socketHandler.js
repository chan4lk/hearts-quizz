const gameService = require('../services/gameService');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_quiz', async (data) => {
      const players = gameService.handlePlayerJoin(socket, data);
      io.to(data.pin).emit('player_joined', {
        playerName: data.playerName,
        players
      });
    });

    socket.on('start_quiz', async ({ pin }) => {
      const questionData = await gameService.startQuiz(pin);
      if (questionData) {
        io.to(pin).emit('question_start', questionData);
      }
    });

    socket.on('submit_answer', (data) => {
      const result = gameService.submitAnswer(data.pin, data.playerName, data.answer, data.timeLeft);
      if (result) {
        io.to(data.pin).emit('question_end', result);
      }
    });

    socket.on('next_question', ({ pin }) => {
      const result = gameService.nextQuestion(pin);
      if (result) {
        if (result.isOver) {
          io.to(pin).emit('quiz_end', { leaderboard: result.leaderboard });
          gameService.cleanup(pin);
        } else {
          io.to(pin).emit('question_start', result);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = setupSocketHandlers;
