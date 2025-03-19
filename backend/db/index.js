/**
 * Database Connection Module
 * Implements connection pooling and provides database access methods
 */
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const genericPool = require('generic-pool');
const dbConfig = require('../config/database');

// Connection pool
let pool = null;

/**
 * Create a new SQLite connection
 * @returns {Promise<Object>} SQLite database connection
 */
const createConnection = async () => {
  const dbPath = dbConfig.dbPath;
  const dbDir = path.dirname(dbPath);
  
  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Ensure directory has proper permissions
  try {
    await fs.promises.access(dbDir, fs.constants.W_OK);
  } catch (error) {
    console.error('Database directory is not writable:', error);
    try {
      fs.chmodSync(dbDir, 0o777);
    } catch (error) {
      console.error('Failed to set directory permissions:', error);
    }
  }

  // Open database with write permissions
  const connection = await open({
    filename: dbPath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  });

  // Apply SQLite pragmas for better performance and reliability
  for (const [pragma, value] of Object.entries(dbConfig.sqlite.pragma)) {
    await connection.exec(`PRAGMA ${pragma} = ${value};`);
  }

  return connection;
};

/**
 * Initialize the database connection pool
 * @returns {Object} Database connection pool
 */
const initPool = () => {
  if (pool) return pool;

  // Create a connection pool
  pool = genericPool.createPool({
    create: async () => {
      const connection = await createConnection();
      return connection;
    },
    destroy: async (connection) => {
      await connection.close();
    },
    validate: (connection) => {
      return connection && typeof connection.exec === 'function';
    }
  }, {
    min: dbConfig.pool.min,
    max: dbConfig.pool.max,
    idleTimeoutMillis: dbConfig.pool.idleTimeoutMillis,
    acquireTimeoutMillis: dbConfig.pool.acquireTimeoutMillis,
    testOnBorrow: true
  });

  return pool;
};

/**
 * Initialize the database and create tables if they don't exist
 * @returns {Promise<void>}
 */
async function init() {
  // Initialize connection pool
  const pool = initPool();
  
  // Acquire a connection from the pool
  const connection = await pool.acquire();
  
  try {
    // Create tables if they don't exist
    await connection.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
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

      -- Create migrations table if it doesn't exist
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        batch INTEGER NOT NULL,
        migration_time DATETIME DEFAULT CURRENT_TIMESTAMP
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
  } finally {
    // Release the connection back to the pool
    await pool.release(connection);
  }
}

/**
 * Execute a database query with a connection from the pool
 * @param {Function} callback - Function to execute with the database connection
 * @returns {Promise<any>} - Result of the callback
 */
async function withConnection(callback) {
  const pool = initPool();
  const connection = await pool.acquire();
  
  try {
    return await callback(connection);
  } finally {
    await pool.release(connection);
  }
}

/**
 * Execute a SELECT query that returns a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function get(sql, params = []) {
  return withConnection(async (connection) => {
    return await connection.get(sql, params);
  });
}

/**
 * Execute a SELECT query that returns multiple rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
async function all(sql, params = []) {
  return withConnection(async (connection) => {
    return await connection.all(sql, params);
  });
}

/**
 * Execute a query that modifies the database
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function run(sql, params = []) {
  return withConnection(async (connection) => {
    return await connection.run(sql, params);
  });
}

/**
 * Execute multiple SQL statements
 * @param {string} sql - SQL statements
 * @returns {Promise<void>}
 */
async function exec(sql) {
  return withConnection(async (connection) => {
    return await connection.exec(sql);
  });
}

/**
 * Execute database operations within a transaction
 * @param {Function} callback - Function containing database operations
 * @returns {Promise<any>} - Result of the callback
 */
async function transaction(callback) {
  return withConnection(async (connection) => {
    try {
      await connection.exec('BEGIN TRANSACTION');
      const result = await callback(connection);
      await connection.exec('COMMIT');
      return result;
    } catch (error) {
      await connection.exec('ROLLBACK');
      throw error;
    }
  });
}

module.exports = {
  init,
  get,
  all,
  run,
  exec,
  transaction,
  withConnection,
  pool: () => pool
};
