/**
 * Migration: add_quiz_analytics
 * Created at: 2025-03-19T00:00:02.000Z
 * 
 * Adds analytics tables for tracking quiz usage and performance
 */

/**
 * Run the migration
 * @param {Object} db - Database connection
 */
exports.up = async (db) => {
  await db.exec(`
    -- Create quiz_sessions table to track when quizzes are played
    CREATE TABLE IF NOT EXISTS quiz_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      player_count INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );
    
    -- Create quiz_question_stats table to track question performance
    CREATE TABLE IF NOT EXISTS quiz_question_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      correct_count INTEGER DEFAULT 0,
      incorrect_count INTEGER DEFAULT 0,
      average_response_time_ms INTEGER,
      FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
    
    -- Create player_responses table to track individual responses
    CREATE TABLE IF NOT EXISTS player_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      selected_option INTEGER,
      is_correct BOOLEAN,
      response_time_ms INTEGER,
      points_awarded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
    
    -- Add indexes for better query performance
    CREATE INDEX idx_quiz_sessions_quiz_id ON quiz_sessions(quiz_id);
    CREATE INDEX idx_quiz_question_stats_session_id ON quiz_question_stats(session_id);
    CREATE INDEX idx_quiz_question_stats_question_id ON quiz_question_stats(question_id);
    CREATE INDEX idx_player_responses_session_id ON player_responses(session_id);
    CREATE INDEX idx_player_responses_question_id ON player_responses(question_id);
    CREATE INDEX idx_player_responses_player_name ON player_responses(player_name);
  `);
};

/**
 * Rollback the migration
 * @param {Object} db - Database connection
 */
exports.down = async (db) => {
  await db.exec(`
    -- Drop indexes
    DROP INDEX IF EXISTS idx_quiz_sessions_quiz_id;
    DROP INDEX IF EXISTS idx_quiz_question_stats_session_id;
    DROP INDEX IF EXISTS idx_quiz_question_stats_question_id;
    DROP INDEX IF EXISTS idx_player_responses_session_id;
    DROP INDEX IF EXISTS idx_player_responses_question_id;
    DROP INDEX IF EXISTS idx_player_responses_player_name;
    
    -- Drop tables
    DROP TABLE IF EXISTS player_responses;
    DROP TABLE IF EXISTS quiz_question_stats;
    DROP TABLE IF EXISTS quiz_sessions;
  `);
};
