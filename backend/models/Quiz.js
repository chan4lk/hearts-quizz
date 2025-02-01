const db = require('../db');

class Quiz {
  static async createTable() {
    try {
      await db.run(`CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pin TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        questions TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active'
      )`);
    } catch (error) {
      console.error('Error creating quizzes table:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const rows = await db.all(`
        SELECT id, pin, title, created_at, status
        FROM quizzes
        WHERE status = 'active'
        ORDER BY created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error in Quiz.findAll:', error);
      throw error;
    }
  }

  static async findByPin(pin) {
    try {
      const row = await db.get(`
        SELECT id, pin, title, questions
        FROM quizzes
        WHERE pin = ? AND status = 'active'
      `, [pin]);
      
      if (row) {
        row.questions = JSON.parse(row.questions);
      }
      return row;
    } catch (error) {
      console.error('Error in Quiz.findByPin:', error);
      throw error;
    }
  }

  static async create({ title, questions }) {
    try {
      const pin = Math.random().toString(36).substr(2, 6).toUpperCase();
      const result = await db.run(`
        INSERT INTO quizzes (pin, title, questions, status)
        VALUES (?, ?, ?, 'active')
      `, [pin, title, JSON.stringify(questions)]);
      
      return {
        id: result.lastID,
        pin,
        title
      };
    } catch (error) {
      console.error('Error in Quiz.create:', error);
      throw error;
    }
  }

  static async deactivate(pin) {
    try {
      await db.run(`
        UPDATE quizzes
        SET status = 'inactive'
        WHERE pin = ?
      `, [pin]);
    } catch (error) {
      console.error('Error in Quiz.deactivate:', error);
      throw error;
    }
  }
}

module.exports = Quiz;
