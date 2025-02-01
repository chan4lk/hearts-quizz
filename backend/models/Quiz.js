const db = require('../config/database');

class Quiz {
  static async createTable() {
    return new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pin TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        questions TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async create(pin, title, questions) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO quizzes (pin, title, questions) VALUES (?, ?, ?)',
        [pin, title, JSON.stringify(questions)],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async findByPin(pin) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM quizzes WHERE pin = ?', [pin], (err, row) => {
        if (err) reject(err);
        else {
          if (row) {
            row.questions = JSON.parse(row.questions);
          }
          resolve(row);
        }
      });
    });
  }
}

module.exports = Quiz;
