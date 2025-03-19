const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');
const authMiddleware = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const { ApiError } = require('../middleware/errorHandler');

// Helper function to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /quizzes
 * Get all quizzes (requires authentication)
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const quizzes = await Quiz.findAll();
  res.json(quizzes);
}));

/**
 * GET /quizzes/:id
 * Get quiz by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }
  
  // Don't send correct answers to client
  const safeQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    pin: quiz.pin,
    teams: quiz.teams,
    questions: quiz.questions.map(q => ({
      text: q.text,
      options: q.options,
      image: q.image_url,
      timeLimit: q.time_limit,
      points: q.points
    }))
  };

  res.json(safeQuiz);
}));

/**
 * GET /quizzes/pin/:pin
 * Get quiz by PIN
 */
router.get('/pin/:pin', asyncHandler(async (req, res) => {
  const quiz = await Quiz.findByPin(req.params.pin);
  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  // Initialize game state if it doesn't exist
  if (!gameService.getGameState(req.params.pin)) {
    gameService.initializeQuiz(req.params.pin, {
      questions: quiz.questions.map(q => ({
        text: q.text,
        options: q.options,
        image: q.image_url,
        correctAnswer: q.correct_answer,
        timeLimit: q.time_limit,
        points: q.points
      })),
      teams: quiz.teams,
      isActive: false,
      currentQuestion: -1,
      scores: new Map(),
      teamScores: new Map(quiz.teams.map(team => [team.id, 0])),
      answers: new Map()
    });
  }

  // Don't send correct answers to client
  const safeQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    pin: quiz.pin,
    teams: quiz.teams,
    questions: quiz.questions.map(q => ({
      text: q.text,
      options: q.options,
      image: q.image_url,
      timeLimit: q.time_limit,
      points: q.points
    }))
  };

  res.json(safeQuiz);
}));

/**
 * POST /quizzes
 * Create a new quiz (requires authentication)
 */
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { title, description, category, teams, questions } = req.body;

    // Create quiz with teams and questions
    const quiz = await Quiz.create({
      title,
      description,
      category,
      teams: teams.map(team => ({
        name: team.name,
        color: team.color
      })),
      questions: questions.map((q, index) => ({
        text: q.text,
        imageUrl: q.imageUrl,
        timeLimit: q.timeLimit || 30,
        points: q.points || 1000,
        options: q.options,
        correctAnswer: q.correctAnswer,
        orderIndex: index
      }))
    });

    // Get the full quiz data
    const fullQuiz = await Quiz.findByPin(quiz.pin);

    // Initialize game state
    gameService.initializeQuiz(quiz.pin, {
      questions: fullQuiz.questions.map(q => ({
        text: q.text,
        options: q.options,
        image: q.image_url,
        correctAnswer: q.correct_answer,
        timeLimit: q.time_limit,
        points: q.points
      })),
      teams: fullQuiz.teams,
      isActive: false,
      currentQuestion: -1,
      scores: new Map(),
      teamScores: new Map(fullQuiz.teams.map(team => [team.id, 0])),
      answers: new Map()
    });

    res.status(201).json({
      id: fullQuiz.id,
      pin: fullQuiz.pin,
      title: fullQuiz.title,
      description: fullQuiz.description,
      category: fullQuiz.category,
      teams: fullQuiz.teams,
      questions: fullQuiz.questions.map(q => ({
        text: q.text,
        options: q.options,
        image: q.image_url,
        timeLimit: q.time_limit,
        points: q.points
      }))
    });
  } catch (error) {
    throw new ApiError(500, 'Failed to create quiz', error);
  }
}));

/**
 * PUT /quizzes/:id
 * Update an entire quiz (requires authentication)
 */
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const quizId = req.params.id;
  const { title, description, category, teams, questions } = req.body;
  
  // Validate quiz exists
  const existingQuiz = await Quiz.findById(quizId);
  if (!existingQuiz) {
    throw new ApiError(404, 'Quiz not found');
  }
  
  // Update quiz
  const updatedQuiz = await Quiz.update(quizId, {
    title, 
    description, 
    category,
    teams,
    questions
  });
  
  res.json(updatedQuiz);
}));

/**
 * PATCH /quizzes/:id
 * Partially update a quiz (requires authentication)
 */
router.patch('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const quizId = req.params.id;
  const updates = req.body;
  
  // Validate quiz exists
  const existingQuiz = await Quiz.findById(quizId);
  if (!existingQuiz) {
    throw new ApiError(404, 'Quiz not found');
  }
  
  // Update quiz with only the fields provided
  const updatedQuiz = await Quiz.partialUpdate(quizId, updates);
  
  res.json(updatedQuiz);
}));

/**
 * PUT /quizzes/:id/questions
 * Update quiz questions (requires authentication)
 */
router.put('/:id/questions', authMiddleware, asyncHandler(async (req, res) => {
  const quizId = req.params.id;
  const { questions } = req.body;

  // Validate input
  if (!Array.isArray(questions)) {
    throw new ApiError(400, 'Questions must be an array');
  }

  // Validate quiz exists
  const existingQuiz = await Quiz.findById(quizId);
  if (!existingQuiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  // Update questions
  const updatedQuestions = await Quiz.updateQuestions(quizId, questions);

  res.json(updatedQuestions.map(q => ({
    text: q.text,
    options: q.options,
    image: q.image_url,
    timeLimit: q.time_limit,
    points: q.points
  })));
}));

/**
 * DELETE /quizzes/:id
 * Delete a quiz (requires authentication)
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const quizId = req.params.id;
  
  // Validate quiz exists
  const existingQuiz = await Quiz.findById(quizId);
  if (!existingQuiz) {
    throw new ApiError(404, 'Quiz not found');
  }
  
  // Delete quiz
  await Quiz.delete(quizId);
  
  res.status(204).end();
}));

module.exports = router;
