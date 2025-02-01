const Quiz = require('../models/Quiz');

const create = async (req, res) => {
  const { title, questions } = req.body;
  
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid quiz data' });
  }

  try {
    const pin = Math.random().toString(36).substr(2, 6).toUpperCase();
    const quizId = await Quiz.create(pin, title, questions);
    res.status(201).json({ success: true, quizId, pin });
  } catch (err) {
    console.error('Error creating quiz:', err);
    res.status(500).json({ success: false, error: 'Failed to create quiz' });
  }
};

module.exports = {
  create
};
