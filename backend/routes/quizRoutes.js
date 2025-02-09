const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');
const authMiddleware = require('../middleware/auth');
const Quiz = require('../models/Quiz');

// Get quiz by pin
router.get('/pin/:pin', async (req, res) => {
  try {
    const quiz = await Quiz.findByPin(req.params.pin);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
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
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create a new quiz
router.post('/', authMiddleware, async (req, res) => {
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

    res.json({
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
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Get user's quizzes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.findAll();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Update quiz questions
router.put('/:quizId/questions', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const { questions } = req.body;

    // Validate input
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions must be an array' });
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
  } catch (error) {
    console.error('Error updating quiz questions:', error);
    res.status(500).json({ error: 'Failed to update quiz questions' });
  }
});

module.exports = router;
