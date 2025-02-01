const express = require('express');
const quizController = require('../controllers/quizController');

const router = express.Router();

router.post('/create', quizController.create);

module.exports = router;
