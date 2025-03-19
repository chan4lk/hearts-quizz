/**
 * Database Configuration
 * Manages database connection settings and pool configuration
 */
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  // Database file path
  dbPath: process.env.DB_PATH || path.join(__dirname, '../db/khoot.sqlite'),
  
  // Connection pool settings
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10)
  },
  
  // Migration settings
  migrations: {
    directory: path.join(__dirname, '../db/migrations'),
    tableName: 'migrations'
  },
  
  // Environment-specific settings
  development: {
    debug: true,
    useNullAsDefault: true
  },
  
  production: {
    debug: false,
    useNullAsDefault: true
  },
  
  // SQLite-specific settings
  sqlite: {
    useNullAsDefault: true,
    pragma: {
      // Enable foreign keys
      'foreign_keys': 'ON',
      // Enable WAL mode for better concurrency
      'journal_mode': 'WAL',
      // Synchronous setting (0=OFF, 1=NORMAL, 2=FULL, 3=EXTRA)
      'synchronous': 1
    }
  }
};

module.exports = dbConfig;
