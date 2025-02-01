const Quiz = require('../models/Quiz');

const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll();
    res.json({ quizzes });
  } catch (error) {
    console.error('Error getting quizzes:', error);
    res.status(500).json({ error: 'Failed to get quizzes' });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { title, questions } = req.body;
    
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid quiz data' });
    }

    const quiz = await Quiz.create({ title, questions });
    res.status(201).json({ quiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
};

const deactivateQuiz = async (req, res) => {
  try {
    const { pin } = req.params;
    await Quiz.deactivate(pin);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deactivating quiz:', error);
    res.status(500).json({ error: 'Failed to deactivate quiz' });
  }
};

module.exports = {
  getAllQuizzes,
  createQuiz,
  deactivateQuiz
};
