const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/auth');

// Get all quizzes
router.get('/quizzes', authMiddleware, quizController.getAllQuizzes);

// Create a new quiz
router.post('/quizzes', authMiddleware, quizController.createQuiz);

// Deactivate a quiz
router.post('/quizzes/:pin/deactivate', authMiddleware, quizController.deactivateQuiz);

module.exports = router;
