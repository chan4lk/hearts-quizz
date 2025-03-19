/**
 * Migration: add_user_profile_fields
 * Created at: 2025-03-19T00:00:01.000Z
 * 
 * Adds profile fields to the users table
 */

/**
 * Run the migration
 * @param {Object} db - Database connection
 */
exports.up = async (db) => {
  await db.exec(`
    -- Add profile fields to users table
    ALTER TABLE users ADD COLUMN email TEXT;
    ALTER TABLE users ADD COLUMN full_name TEXT;
    ALTER TABLE users ADD COLUMN profile_image TEXT;
    ALTER TABLE users ADD COLUMN last_login DATETIME;
  `);
};

/**
 * Rollback the migration
 * @param {Object} db - Database connection
 */
exports.down = async (db) => {
  // SQLite doesn't support DROP COLUMN, so we need to recreate the table
  await db.exec(`
    -- Create temporary table
    CREATE TABLE users_temp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Copy data to temporary table
    INSERT INTO users_temp (id, username, password, role, created_at)
    SELECT id, username, password, role, created_at FROM users;
    
    -- Drop original table
    DROP TABLE users;
    
    -- Rename temporary table
    ALTER TABLE users_temp RENAME TO users;
  `);
};
