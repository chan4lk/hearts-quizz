const db = require('../db');
const { withTransaction } = require('../db/transaction');
const Team = require('./Team');

class Quiz {
  static async findAll() {
    try {
      // Ensure database is initialized
      if (!db) {
        await db.init();
      }
      
      // Determine database type safely
      const isMssql = global.dbHelper && typeof global.dbHelper.getDbType === 'function' && 
                     global.dbHelper.getDbType() === 'mssql';
      
      // SQL Server requires all columns in the SELECT to be in the GROUP BY
      if (isMssql) {
        console.log('Using SQL Server query for findAll');
        const rows = await db.all(`
          SELECT q.id, q.pin, q.title, q.description, q.category, q.created_at,
                 COUNT(qn.id) as question_count
          FROM quizzes q
          LEFT JOIN questions qn ON q.id = qn.quiz_id
          WHERE q.active = 1
          GROUP BY q.id, q.pin, q.title, q.description, q.category, q.created_at
          ORDER BY q.created_at DESC
        `);
        return rows;
      } else {
        console.log('Using SQLite query for findAll');
        // SQLite version
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
      }
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
        INSERT INTO quizzes (title, description, category, pin, user_id, active, created_at)
        VALUES (?, ?, ?, ?, NULL, 1, ${global.dbHelper.getCurrentTimestamp()})
      `, [title, description || '', category || '', pin]);
      
      // Check if we got a valid lastID
      const quizId = result.lastID;
      if (!quizId) {
        throw new Error('Failed to get the last inserted ID for quiz');
      }
      
      console.log(`Created quiz with ID: ${quizId}`);

      // Insert teams
      if (teams && teams.length > 0) {
        console.log(`Creating ${teams.length} teams for quiz ${quizId}`);
        await Team.createTeams(quizId, teams);
      }

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await db.run(`
          INSERT INTO questions (
            quiz_id, text, image_url, time_limit, points,
            options, correct_answer, order_index, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${global.dbHelper.getCurrentTimestamp()})
        `, [
          quizId, q.text, q.imageUrl || '/up.png', q.timeLimit || 30, q.points || 1000,
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

  static async updateQuestions(quizId, questions) {
    return withTransaction(async () => {
      // Delete existing questions
      await db.run('DELETE FROM questions WHERE quiz_id = ?', [quizId]);

      // Insert updated questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await db.run(`
          INSERT INTO questions (
            quiz_id, text, image_url, time_limit, points,
            options, correct_answer, order_index, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${global.dbHelper.getCurrentTimestamp()})
        `, [
          quizId, q.text, q.imageUrl || '', q.timeLimit || 30, q.points || 1000,
          JSON.stringify(q.options), q.correctAnswer, i
        ]);
      }

      // Return updated questions
      return this.getQuizQuestions(quizId);
    });
  }
}

module.exports = Quiz;
