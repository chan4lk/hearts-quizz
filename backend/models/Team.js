const db = require('../db');

class Team {
  static async createTable() {
    try {
      // Create teams table with database-specific syntax
      if (global.dbHelper.getDbType() === 'mssql') {
        await db.run(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'teams')
          BEGIN
            CREATE TABLE teams (
              id INT IDENTITY(1,1) PRIMARY KEY,
              quiz_id INT NOT NULL,
              name NVARCHAR(255) NOT NULL,
              color NVARCHAR(50) NOT NULL,
              created_at DATETIME DEFAULT GETDATE(),
              CONSTRAINT FK_teams_quizzes FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )
          END
        `);

        // Create player_teams table for tracking team membership
        await db.run(`
          IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'player_teams')
          BEGIN
            CREATE TABLE player_teams (
              id INT IDENTITY(1,1) PRIMARY KEY,
              player_id INT NOT NULL,
              team_id INT NOT NULL,
              created_at DATETIME DEFAULT GETDATE(),
              CONSTRAINT FK_player_teams_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
            )
          END
        `);
      } else {
        // SQLite version
        await db.run(`
          CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
          )
        `);

        // Create player_teams table for tracking team membership
        await db.run(`
          CREATE TABLE IF NOT EXISTS player_teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            team_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
          )
        `);
      }
    } catch (error) {
      console.error('Error creating team tables:', error);
      throw error;
    }
  }

  static async createTeams(quizId, teams) {
    const insertTeam = async (team) => {
      // Make sure quizId is not null or undefined
      if (quizId === null || quizId === undefined) {
        throw new Error('Quiz ID cannot be null when creating teams');
      }
      
      // Convert quizId to a number if it's a string
      const numericQuizId = typeof quizId === 'string' ? parseInt(quizId, 10) : quizId;
      
      // Log the team creation attempt
      console.log(`Creating team ${team.name} for quiz ID: ${numericQuizId}`);
      
      const result = await db.run(`
        INSERT INTO teams (quiz_id, name, color, created_at)
        VALUES (?, ?, ?, ${global.dbHelper.getCurrentTimestamp()})
      `, [numericQuizId, team.name, team.color]);
      
      console.log(`Team created with ID: ${result.lastID}`);
      return result.lastID;
    };

    try {
      const teamIds = [];
      for (const team of teams) {
        const teamId = await insertTeam(team);
        teamIds.push(teamId);
      }
      return teamIds;
    } catch (error) {
      console.error('Error creating teams:', error);
      throw error;
    }
  }

  static async getQuizTeams(quizId) {
    try {
      const teams = await db.all(`
        SELECT id, name, color
        FROM teams
        WHERE quiz_id = ?
      `, [quizId]);
      return teams;
    } catch (error) {
      console.error('Error getting quiz teams:', error);
      throw error;
    }
  }

  static async assignPlayerToTeam(playerId, teamId) {
    try {
      // Validate inputs
      if (!playerId || !teamId) {
        throw new Error('Player ID and Team ID cannot be null');
      }
      
      await db.run(`
        INSERT INTO player_teams (player_id, team_id, created_at)
        VALUES (?, ?, ${global.dbHelper.getCurrentTimestamp()})
      `, [playerId, teamId]);
    } catch (error) {
      console.error('Error assigning player to team:', error);
      throw error;
    }
  }

  static async getTeamScores(quizId) {
    try {
      const scores = await db.all(`
        SELECT 
          t.id,
          t.name,
          t.color,
          COUNT(DISTINCT pt.player_id) as player_count,
          COALESCE(SUM(ps.score), 0) as total_score,
          COALESCE(AVG(ps.score), 0) as average_score
        FROM teams t
        LEFT JOIN player_teams pt ON t.id = pt.team_id
        LEFT JOIN player_scores ps ON pt.player_id = ps.player_id
        WHERE t.quiz_id = ?
        GROUP BY t.id
        ORDER BY total_score DESC
      `, [quizId]);
      return scores;
    } catch (error) {
      console.error('Error getting team scores:', error);
      throw error;
    }
  }
}

module.exports = Team;
