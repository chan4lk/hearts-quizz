/**
 * Migration Manager
 * Handles database migrations for schema changes
 */
const fs = require('fs');
const path = require('path');
const db = require('./index');
const dbConfig = require('../config/database');

/**
 * Get all migration files from the migrations directory
 * @returns {Promise<Array>} Array of migration file names
 */
async function getMigrationFiles() {
  const migrationsDir = dbConfig.migrations.directory;
  
  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Get all .js files in the migrations directory
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort(); // Sort to ensure migrations run in order
    
  return files;
}

/**
 * Get completed migrations from the database
 * @returns {Promise<Array>} Array of completed migration names
 */
async function getCompletedMigrations() {
  try {
    const migrations = await db.all(
      `SELECT name FROM ${dbConfig.migrations.tableName} ORDER BY id`
    );
    return migrations.map(migration => migration.name);
  } catch (error) {
    // If migrations table doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Run pending migrations
 * @returns {Promise<Array>} Array of executed migration names
 */
async function runMigrations() {
  await db.init(); // Ensure database is initialized
  
  // Get migration files and completed migrations
  const migrationFiles = await getMigrationFiles();
  const completedMigrations = await getCompletedMigrations();
  
  // Filter out migrations that have already been run
  const pendingMigrations = migrationFiles.filter(
    file => !completedMigrations.includes(file)
  );
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return [];
  }
  
  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  // Determine the current batch number
  let batch = 1;
  try {
    const lastBatch = await db.get(
      `SELECT MAX(batch) as maxBatch FROM ${dbConfig.migrations.tableName}`
    );
    if (lastBatch && lastBatch.maxBatch) {
      batch = lastBatch.maxBatch + 1;
    }
  } catch (error) {
    // If migrations table doesn't exist yet, use batch 1
  }
  
  // Run each pending migration
  const executedMigrations = [];
  
  for (const migrationFile of pendingMigrations) {
    try {
      console.log(`Running migration: ${migrationFile}`);
      
      // Import the migration file
      const migrationPath = path.join(dbConfig.migrations.directory, migrationFile);
      const migration = require(migrationPath);
      
      // Execute the migration within a transaction
      await db.transaction(async (connection) => {
        // Run the up function
        await migration.up(connection);
        
        // Record the migration in the migrations table
        await connection.run(
          `INSERT INTO ${dbConfig.migrations.tableName} (name, batch) VALUES (?, ?)`,
          [migrationFile, batch]
        );
      });
      
      executedMigrations.push(migrationFile);
      console.log(`Migration completed: ${migrationFile}`);
    } catch (error) {
      console.error(`Error running migration ${migrationFile}:`, error);
      throw error; // Stop migration process on error
    }
  }
  
  return executedMigrations;
}

/**
 * Rollback the last batch of migrations
 * @returns {Promise<Array>} Array of rolled back migration names
 */
async function rollbackMigrations() {
  await db.init(); // Ensure database is initialized
  
  // Get the last batch number
  const lastBatch = await db.get(
    `SELECT MAX(batch) as maxBatch FROM ${dbConfig.migrations.tableName}`
  );
  
  if (!lastBatch || !lastBatch.maxBatch) {
    console.log('No migrations to rollback');
    return [];
  }
  
  // Get migrations from the last batch
  const migrations = await db.all(
    `SELECT name FROM ${dbConfig.migrations.tableName} WHERE batch = ? ORDER BY id DESC`,
    [lastBatch.maxBatch]
  );
  
  if (migrations.length === 0) {
    console.log('No migrations to rollback');
    return [];
  }
  
  console.log(`Rolling back ${migrations.length} migrations from batch ${lastBatch.maxBatch}`);
  
  // Rollback each migration
  const rolledBackMigrations = [];
  
  for (const migration of migrations) {
    try {
      console.log(`Rolling back migration: ${migration.name}`);
      
      // Import the migration file
      const migrationPath = path.join(dbConfig.migrations.directory, migration.name);
      const migrationModule = require(migrationPath);
      
      // Execute the rollback within a transaction
      await db.transaction(async (connection) => {
        // Run the down function
        await migrationModule.down(connection);
        
        // Remove the migration from the migrations table
        await connection.run(
          `DELETE FROM ${dbConfig.migrations.tableName} WHERE name = ?`,
          [migration.name]
        );
      });
      
      rolledBackMigrations.push(migration.name);
      console.log(`Rollback completed: ${migration.name}`);
    } catch (error) {
      console.error(`Error rolling back migration ${migration.name}:`, error);
      throw error; // Stop rollback process on error
    }
  }
  
  return rolledBackMigrations;
}

/**
 * Create a new migration file
 * @param {string} name - Migration name
 * @returns {Promise<string>} Path to the created migration file
 */
async function createMigration(name) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const fileName = `${timestamp}_${name}.js`;
  const filePath = path.join(dbConfig.migrations.directory, fileName);
  
  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(dbConfig.migrations.directory)) {
    fs.mkdirSync(dbConfig.migrations.directory, { recursive: true });
  }
  
  // Create migration file template
  const template = `/**
 * Migration: ${name}
 * Created at: ${new Date().toISOString()}
 */

/**
 * Run the migration
 * @param {Object} db - Database connection
 */
exports.up = async (db) => {
  // Add your migration code here
  await db.exec(\`
    -- Add your SQL statements here
  \`);
};

/**
 * Rollback the migration
 * @param {Object} db - Database connection
 */
exports.down = async (db) => {
  // Add your rollback code here
  await db.exec(\`
    -- Add your rollback SQL statements here
  \`);
};
`;
  
  // Write the migration file
  fs.writeFileSync(filePath, template);
  console.log(`Created migration: ${fileName}`);
  
  return filePath;
}

module.exports = {
  runMigrations,
  rollbackMigrations,
  createMigration,
  getMigrationFiles,
  getCompletedMigrations
};
