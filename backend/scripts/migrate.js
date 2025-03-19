/**
 * Database Migration CLI
 * Provides commands for running and managing database migrations
 */
const migrationManager = require('../db/migrationManager');

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const migrationName = args[1];

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Database Migration CLI

Usage:
  node migrate.js <command> [options]

Commands:
  run                 Run all pending migrations
  rollback            Rollback the last batch of migrations
  create <name>       Create a new migration file
  list                List all migrations and their status
  help                Show this help message

Examples:
  node migrate.js run
  node migrate.js rollback
  node migrate.js create add_user_fields
  node migrate.js list
  `);
}

/**
 * Main function
 */
async function main() {
  try {
    switch (command) {
      case 'run':
        // Run pending migrations
        const executedMigrations = await migrationManager.runMigrations();
        
        if (executedMigrations.length > 0) {
          console.log('\nMigrations completed:');
          executedMigrations.forEach(migration => console.log(`- ${migration}`));
        } else {
          console.log('No migrations were executed.');
        }
        break;
        
      case 'rollback':
        // Rollback last batch of migrations
        const rolledBackMigrations = await migrationManager.rollbackMigrations();
        
        if (rolledBackMigrations.length > 0) {
          console.log('\nMigrations rolled back:');
          rolledBackMigrations.forEach(migration => console.log(`- ${migration}`));
        } else {
          console.log('No migrations were rolled back.');
        }
        break;
        
      case 'create':
        // Create a new migration file
        if (!migrationName) {
          console.error('Error: Migration name is required');
          console.log('Usage: node migrate.js create <name>');
          process.exit(1);
        }
        
        const filePath = await migrationManager.createMigration(migrationName);
        console.log(`Migration file created: ${filePath}`);
        break;
        
      case 'list':
        // List all migrations and their status
        const migrationFiles = await migrationManager.getMigrationFiles();
        const completedMigrations = await migrationManager.getCompletedMigrations();
        
        console.log('\nMigrations:');
        migrationFiles.forEach(migration => {
          const status = completedMigrations.includes(migration) ? 'Completed' : 'Pending';
          console.log(`- ${migration} (${status})`);
        });
        break;
        
      case 'help':
      default:
        printUsage();
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
