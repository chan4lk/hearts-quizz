const db = require('../db');

class Player {
  static async createTable() {
    try {
      if (global.dbHelper.getDbType() === 'mssql') {
        // Create players table for SQL Server
        await db.run(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'players')
          BEGIN
            CREATE TABLE players (
              id INT IDENTITY(1,1) PRIMARY KEY,
              quiz_id INT NOT NULL,
              name NVARCHAR(255) NOT NULL,
              created_at DATETIME DEFAULT GETDATE(),
              CONSTRAINT FK_players_quizzes FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )
          END
        `);

        // Create player_scores table for SQL Server
        await db.run(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'player_scores')
          BEGIN
            CREATE TABLE player_scores (
              id INT IDENTITY(1,1) PRIMARY KEY,
              player_id INT NOT NULL,
              question_id INT NOT NULL,
              score INT NOT NULL DEFAULT 0,
              answer INT NULL,
              response_time INT NULL,
              created_at DATETIME DEFAULT GETDATE(),
              CONSTRAINT FK_player_scores_players FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
              CONSTRAINT FK_player_scores_questions FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
          END
        `);
      } else {
        // Create players table for SQLite
        await db.run(`
          CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
          )
        `);

        // Create player_scores table for SQLite
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
      }
    } catch (error) {
      console.error('Error creating player tables:', error);
      throw error;
    }
  }

  static async create(quizId, name, teamId = null) {
    return await db.withTransaction(async () => {
      // Validate inputs
      if (!quizId) {
        throw new Error('Quiz ID cannot be null when creating a player');
      }
      
      // Create player
      const result = await db.run(`
        INSERT INTO players (quiz_id, name, created_at)
        VALUES (?, ?, ${global.dbHelper.getCurrentTimestamp()})
      `, [quizId, name]);
      
      const playerId = result.lastID;

      // Assign to team if specified
      if (teamId) {
        await db.run(`
          INSERT INTO player_teams (player_id, team_id, created_at)
          VALUES (?, ?, ${global.dbHelper.getCurrentTimestamp()})
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
      // SQL Server requires all columns in the SELECT list to be in the GROUP BY clause
      // or be aggregated with a function like SUM, COUNT, etc.
      if (global.dbHelper.getDbType() === 'mssql') {
        const scores = await db.all(`
          SELECT 
            p.id,
            p.name,
            t.id as team_id,
            t.name as team_name,
            t.color as team_color,
            SUM(ISNULL(ps.score, 0)) as total_score,
            COUNT(DISTINCT ps.question_id) as questions_answered,
            AVG(CAST(ps.response_time as FLOAT)) as avg_response_time
          FROM players p
          LEFT JOIN player_teams pt ON p.id = pt.player_id
          LEFT JOIN teams t ON pt.team_id = t.id
          LEFT JOIN player_scores ps ON p.id = ps.player_id
          WHERE p.quiz_id = ?
          GROUP BY p.id, p.name, t.id, t.name, t.color
          ORDER BY total_score DESC
        `, [quizId]);
        
        return scores;
      } else {
        // SQLite version
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
      }
    } catch (error) {
      console.error('Error getting player scores:', error);
      throw error;
    }
  }

  static async recordAnswer(playerId, questionId, answer, score, responseTime) {
    try {
      // Validate inputs
      if (!playerId || !questionId) {
        throw new Error('Player ID and Question ID cannot be null when recording an answer');
      }
      
      await db.run(`
        INSERT INTO player_scores (
          player_id, question_id, answer, score, response_time, created_at
        )
        VALUES (?, ?, ?, ?, ?, ${global.dbHelper.getCurrentTimestamp()})
      `, [playerId, questionId, answer, score, responseTime]);
    } catch (error) {
      console.error('Error recording player answer:', error);
      throw error;
    }
  }
}

module.exports = Player;
