const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let db = null;

async function init() {
  if (db) return db;

  const dbDir = __dirname;
  const dbPath = path.join(dbDir, 'khoot.sqlite');

  // Ensure directory has proper permissions
  try {
    await fs.promises.access(dbDir, fs.constants.W_OK);
  } catch (error) {
    console.error('Database directory is not writable:', error);
    // Try to fix directory permissions
    try {
      fs.chmodSync(dbDir, 0o777);
    } catch (error) {
      console.error('Failed to set directory permissions:', error);
    }
  }

  // Ensure the database file is writable
  try {
    // If file exists, ensure it's writable
    if (fs.existsSync(dbPath)) {
      try {
        await fs.promises.access(dbPath, fs.constants.W_OK);
      } catch (error) {
        console.error('Database file is not writable:', error);
        fs.chmodSync(dbPath, 0o666);
      }
    }
  } catch (error) {
    console.error('Error checking database permissions:', error);
  }

  // Open database with write permissions
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  });

  // Create tables if they don't exist
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      pin TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      image_url TEXT DEFAULT '/quiz.jpeg',
      time_limit INTEGER DEFAULT 30,
      points INTEGER DEFAULT 1000,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    -- Game state tables
    DROP TABLE IF EXISTS game_players;
    DROP TABLE IF EXISTS game_states;

    CREATE TABLE IF NOT EXISTS game_states (
      pin TEXT PRIMARY KEY,
      quiz_id INTEGER,
      state TEXT NOT NULL,
      current_question INTEGER DEFAULT -1,
      is_active BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_players (
      pin TEXT NOT NULL,
      player_name TEXT NOT NULL,
      team_id INTEGER,
      score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (pin, player_name),
      FOREIGN KEY (pin) REFERENCES game_states(pin) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    -- Update triggers for timestamps
    CREATE TRIGGER IF NOT EXISTS update_game_states_timestamp 
    AFTER UPDATE ON game_states
    BEGIN
      UPDATE game_states SET updated_at = CURRENT_TIMESTAMP WHERE pin = NEW.pin;
    END;

    CREATE TRIGGER IF NOT EXISTS update_game_players_timestamp 
    AFTER UPDATE ON game_players
    BEGIN
      UPDATE game_players SET updated_at = CURRENT_TIMESTAMP 
      WHERE pin = NEW.pin AND player_name = NEW.player_name;
    END;
  `);

  // Ensure the database is writable after initialization
  try {
    fs.chmodSync(dbPath, 0o666);
    // Also ensure directory remains writable
    fs.chmodSync(dbDir, 0o777);
  } catch (error) {
    console.error('Error setting final permissions:', error);
  }

  return db;
}

function get(...args) {
  return db.get(...args);
}

function all(...args) {
  return db.all(...args);
}

function run(...args) {
  return db.run(...args);
}

function exec(...args) {
  return db.exec(...args);
}

module.exports = {
  init,
  get,
  all,
  run,
  exec
};
