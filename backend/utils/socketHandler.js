const gameService = require('../services/gameService');
const db = require('../db');
const { handleSocketError, createSocketError, SocketErrorTypes } = require('./socketErrorHandler');

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

    // Handle errors
    socket.on('error', (error) => {
      handleSocketError(socket, 'socket_error', error);
    });

    // Track which room/quiz this socket is in
    let currentPin = null;

    socket.on('join_quiz', async ({ pin, playerName, teamId }) => {
      try {
        // Get quiz from database
        const quiz = await db.get('SELECT * FROM quizzes WHERE pin = ?', [pin]);
        if (!quiz) {
          throw new Error('Quiz not found');
        }

        // Join the room
        socket.join(pin);
        currentPin = pin;

        // Add player to game
        const result = await gameService.joinQuiz(pin, playerName, teamId);
        if (!result.success) {
          throw new Error(result.error);
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
        handleSocketError(socket, 'join_quiz', error);
      }
    });

    socket.on('start_quiz', async ({ pin }) => {
      try {
        console.log('Starting quiz:', pin);
        const gameState = await gameService.startQuiz(pin);
        if (!gameState) {
          throw new Error('Failed to start quiz');
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
      } catch (error) {
        handleSocketError(socket, 'start_quiz', error);
      }
    });

    socket.on('next_question', async ({ pin }) => {
      try {
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
      } catch (error) {
        handleSocketError(socket, 'next_question', error);
      }
    });

    socket.on('submit_answer', async ({ pin, playerName, answer, timeLeft }) => {
      try {
        console.log('Answer submitted:', { pin, playerName, answer, timeLeft });
        
        const result = await gameService.submitAnswer(pin, playerName, answer, timeLeft);
        if (result) {
          // Send immediate feedback to the player who answered
          socket.emit('answer_submitted', result);
        }
      } catch (error) {
        handleSocketError(socket, 'submit_answer', error);
      }
    });

    socket.on('disconnect_all_players', async ({ pin }) => {
      try {
        console.log('Received disconnect all players request for quiz:', pin);
        
        // Get all sockets in the room except admin
        const sockets = await io.in(pin).fetchSockets();
        console.log(`Found ${sockets.length} sockets in room ${pin}`);
        
        let disconnectedCount = 0;
        for (const socket of sockets) {
          const playerName = await gameService.getPlayerNameFromSocket(socket.id);
          if (playerName !== 'admin') {
            console.log(`Disconnecting player ${playerName} (${socket.id})`);
            socket.disconnect(true);
            disconnectedCount++;
          }
        }
        console.log(`Disconnected ${disconnectedCount} players from quiz ${pin}`);
        
        // Reset the game state players
        const result = await gameService.disconnectAllPlayers(pin);
        if (result.success) {
          console.log('Successfully reset game state, notifying remaining clients');
          // Emit to all sockets in the room, including the host
          io.to(pin).emit('players_disconnected', {
            players: result.players,
            message: `${disconnectedCount} players have been disconnected`
          });
        }
      } catch (error) {
        handleSocketError(socket, 'disconnect_all_players', error);
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
