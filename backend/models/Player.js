const db = require('../db');

class Player {
  static async createTable() {
    try {
      // Create players table
      await db.run(`
        CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        )
      `);

      // Create player_scores table
      await db.run(`
        CREATE TABLE IF NOT EXISTS player_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          answer INTEGER,
          response_time INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);
    } catch (error) {
      console.error('Error creating player tables:', error);
      throw error;
    }
  }

  static async create(quizId, name, teamId = null) {
    return await db.withTransaction(async () => {
      // Create player
      const result = await db.run(`
        INSERT INTO players (quiz_id, name)
        VALUES (?, ?)
      `, [quizId, name]);
      
      const playerId = result.lastID;

      // Assign to team if specified
      if (teamId) {
        await db.run(`
          INSERT INTO player_teams (player_id, team_id)
          VALUES (?, ?)
        `, [playerId, teamId]);
      }

      return {
        id: playerId,
        name,
        teamId
      };
    });
  }

  static async getPlayerScores(quizId) {
    try {
      const scores = await db.all(`
        SELECT 
          p.id,
          p.name,
          t.id as team_id,
          t.name as team_name,
          t.color as team_color,
          SUM(ps.score) as total_score,
          COUNT(DISTINCT ps.question_id) as questions_answered,
          AVG(ps.response_time) as avg_response_time
        FROM players p
        LEFT JOIN player_teams pt ON p.id = pt.player_id
        LEFT JOIN teams t ON pt.team_id = t.id
        LEFT JOIN player_scores ps ON p.id = ps.player_id
        WHERE p.quiz_id = ?
        GROUP BY p.id
        ORDER BY total_score DESC
      `, [quizId]);
      
      return scores;
    } catch (error) {
      console.error('Error getting player scores:', error);
      throw error;
    }
  }

  static async recordAnswer(playerId, questionId, answer, score, responseTime) {
    try {
      await db.run(`
        INSERT INTO player_scores (
          player_id, question_id, answer, score, response_time
        )
        VALUES (?, ?, ?, ?, ?)
      `, [playerId, questionId, answer, score, responseTime]);
    } catch (error) {
      console.error('Error recording player answer:', error);
      throw error;
    }
  }
}

module.exports = Player;
