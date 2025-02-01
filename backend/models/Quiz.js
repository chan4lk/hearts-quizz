const db = require('../db');
const { withTransaction } = require('../db/transaction');

class Quiz {
  static async createTable() {
    try {
      // Create quizzes table
      await db.run(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          pin TEXT UNIQUE,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create questions table
      await db.run(`
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          image_url TEXT DEFAULT '/quiz.jpeg',
          time_limit INTEGER NOT NULL,
          points INTEGER NOT NULL,
          options TEXT NOT NULL,
          correct_answer INTEGER NOT NULL,
          order_index INTEGER NOT NULL,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        )
      `);
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

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
        quiz.questions = await this.getQuizQuestions(quiz.id);
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

  static async insertQuiz(title, description, category, pin) {
    const result = await db.run(`
      INSERT INTO quizzes (title, description, category, pin)
      VALUES (?, ?, ?, ?)
    `, [title, description, category, pin]);

    if (!result?.id) {
      throw new Error('Failed to create quiz: No quiz ID returned');
    }

    return result.id;
  }

  static async insertQuestions(quizId, questions) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await db.run(`
        INSERT INTO questions (
          quiz_id, text, image_url, time_limit, points, 
          options, correct_answer, order_index
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        quizId,
        q.text,
        q.imageUrl || '/quiz.jpeg',
        q.timeLimit,
        q.points,
        JSON.stringify(q.options),
        q.correctAnswer,
        i
      ]);
    }
  }

  static async create({ title, description, category, questions }) {
    return withTransaction(async () => {
      // Create quiz and get ID
      const quizId = await this.insertQuiz(title, description, category, this.generatePin());

      // Insert questions
      await this.insertQuestions(quizId, questions);

      // Get complete quiz with questions
      const quiz = await db.get(`
        SELECT id, pin, title, description, category
        FROM quizzes
        WHERE id = ?
      `, [quizId]);

      if (!quiz) {
        throw new Error('Failed to retrieve created quiz');
      }

      // Get questions
      quiz.questions = await this.getQuizQuestions(quizId);
      return quiz;
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
