const db = require('../db');
const { withTransaction } = require('../db/transaction');
const Team = require('./Team');

class Quiz {
  static async findAll() {
    try {
      const rows = await db.all(`
        SELECT q.id, q.pin, q.title, q.description, q.category, q.created_at,
               COUNT(qn.id) as question_count
        FROM quizzes q
        LEFT JOIN questions qn ON q.id = qn.quiz_id
        WHERE q.active = 1
        GROUP BY q.id
        ORDER BY q.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error in Quiz.findAll:', error);
      throw error;
    }
  }

  static async findByPin(pin) {
    try {
      // Get quiz details
      const quiz = await db.get(`
        SELECT id, pin, title, description, category
        FROM quizzes
        WHERE pin = ? AND active = 1
      `, [pin]);
      
      if (quiz) {
        // Get questions
        quiz.questions = await this.getQuizQuestions(quiz.id);
        // Get teams
        quiz.teams = await Team.getQuizTeams(quiz.id);
      }
      return quiz;
    } catch (error) {
      console.error('Error in Quiz.findByPin:', error);
      throw error;
    }
  }

  static async getQuizQuestions(quizId) {
    const questions = await db.all(`
      SELECT id, text, image_url, time_limit, points, options, correct_answer
      FROM questions
      WHERE quiz_id = ?
      ORDER BY order_index
    `, [quizId]);

    return questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));
  }

  static generatePin() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  static async create(quizData) {
    return withTransaction(async () => {
      const pin = this.generatePin();
      const { title, description, category, questions, teams } = quizData;

      // Insert quiz
      const result = await db.run(`
        INSERT INTO quizzes (title, description, category, pin)
        VALUES (?, ?, ?, ?)
      `, [title, description || '', category || '', pin]);
      const quizId = result.lastID;

      // Insert teams
      if (teams && teams.length > 0) {
        await Team.createTeams(quizId, teams);
      }

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await db.run(`
          INSERT INTO questions (
            quiz_id, text, image_url, time_limit, points,
            options, correct_answer, order_index
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          quizId, q.text, q.imageUrl || '/quiz.jpeg', q.timeLimit || 30, q.points || 1000,
          JSON.stringify(q.options), q.correctAnswer, i
        ]);
      }

      // Return the created quiz
      return this.findByPin(pin);
    });
  }

  static async deactivate(pin) {
    try {
      await db.run(`
        UPDATE quizzes
        SET active = 0
        WHERE pin = ?
      `, [pin]);
    } catch (error) {
      console.error('Error in Quiz.deactivate:', error);
      throw error;
    }
  }
}

module.exports = Quiz;
