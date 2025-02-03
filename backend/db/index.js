const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db = null;

async function init() {
  if (db) return db;

  db = await open({
    filename: path.join(__dirname, 'khoot.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      pin TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      image TEXT,
      timeLimit INTEGER DEFAULT 30,
      FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
    );

    -- Drop existing game_states table if it exists
    DROP TABLE IF EXISTS game_players;
    DROP TABLE IF EXISTS game_states;

    CREATE TABLE IF NOT EXISTS game_states (
      pin TEXT PRIMARY KEY,
      quiz_id INTEGER,  
      state TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_players (
      pin TEXT NOT NULL,
      player_name TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (pin, player_name),
      FOREIGN KEY (pin) REFERENCES game_states(pin) ON DELETE CASCADE
    );

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

  return db;
}

module.exports = {
  init,
  get: (...args) => db.get(...args),
  all: (...args) => db.all(...args),
  run: (...args) => db.run(...args),
  exec: (...args) => db.exec(...args)
};
