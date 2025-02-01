const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');
const authMiddleware = require('../middleware/auth');

// Get quiz by pin
router.get('/pin/:pin', async (req, res) => {
  try {
    const quiz = await global.db.get('SELECT * FROM quizzes WHERE pin = ?', [req.params.pin]);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get questions for the quiz
    const questions = await global.db.all('SELECT * FROM questions WHERE quiz_id = ?', [quiz.id]);
    quiz.questions = questions.map(q => ({
      text: q.text,
      options: JSON.parse(q.options),
      image: q.image,
      correctAnswer: q.correct_answer
    }));

    // Initialize game state if it doesn't exist
    if (!gameService.getGameState(req.params.pin)) {
      gameService.initializeQuiz(req.params.pin, {
        questions: quiz.questions.map(q => ({
          text: q.text,
          options: q.options,
          image: q.image,
          correctAnswer: q.correctAnswer
        })),
        isActive: false,
        currentQuestion: -1,
        scores: new Map(),
        answers: new Map()
      });
    }

    // Don't send correct answers to client
    const safeQuiz = {
      id: quiz.id,
      title: quiz.title,
      pin: quiz.pin,
      questions: quiz.questions.map(q => ({
        text: q.text,
        options: q.options,
        image: q.image
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
    const { title, questions } = req.body;
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit pin

    // Insert quiz
    const result = await global.db.run(
      'INSERT INTO quizzes (title, pin, user_id) VALUES (?, ?, ?)',
      [title, pin, req.user.id]
    );
    const quizId = result.lastID;

    // Insert questions
    for (const q of questions) {
      await global.db.run(
        'INSERT INTO questions (quiz_id, text, options, correct_answer, image) VALUES (?, ?, ?, ?, ?)',
        [quizId, q.text, JSON.stringify(q.options), q.correctAnswer, q.image]
      );
    }

    // Get the created quiz with questions
    const quiz = await global.db.get('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    quiz.questions = await global.db.all('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);
    
    // Initialize game state
    gameService.initializeQuiz(pin, {
      questions: quiz.questions.map(q => ({
        text: q.text,
        options: JSON.parse(q.options),
        image: q.image,
        correctAnswer: q.correct_answer
      })),
      isActive: false,
      currentQuestion: -1,
      scores: new Map(),
      answers: new Map()
    });
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Get all quizzes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quizzes = await global.db.all(
      `SELECT q.*, COUNT(qu.id) as question_count 
       FROM quizzes q 
       LEFT JOIN questions qu ON q.id = qu.quiz_id 
       WHERE q.user_id = ? 
       GROUP BY q.id`,
      [req.user.id]
    );
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Deactivate a quiz
router.post('/:pin/deactivate', authMiddleware, async (req, res) => {
  try {
    const quiz = await global.db.get(
      'SELECT * FROM quizzes WHERE pin = ? AND user_id = ?',
      [req.params.pin, req.user.id]
    );
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Clean up game state
    gameService.cleanupQuiz(req.params.pin);
    
    res.json({ message: 'Quiz deactivated' });
  } catch (error) {
    console.error('Error deactivating quiz:', error);
    res.status(500).json({ error: 'Failed to deactivate quiz' });
  }
});

module.exports = router;
