/**
 * Script to alter the game_states table to use NVARCHAR(MAX) for the state column
 */
const db = require('../db');

async function alterGameStatesTable() {
  try {
    console.log('Initializing database connection...');
    await db.init();
    
    // Check if we're using MSSQL
    if (!global.dbHelper || !global.dbHelper.isMssql()) {
      console.log('This script is only needed for SQL Server databases.');
      return;
    }
    
    console.log('Altering game_states table to use NVARCHAR(MAX) for state column...');
    
    // First check the current column type
    const columnInfo = await db.get(`
      SELECT name, max_length 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('game_states') AND name = 'state'
    `);
    
    console.log('Current column info:', columnInfo);
    
    // Only alter if it's not already MAX (-1)
    if (columnInfo && columnInfo.max_length !== -1) {
      // Alter the table to use NVARCHAR(MAX)
      await db.exec(`
        ALTER TABLE game_states
        ALTER COLUMN state NVARCHAR(MAX) NOT NULL;
      `);
      console.log('Successfully altered game_states table.');
    } else {
      console.log('The state column is already NVARCHAR(MAX), no changes needed.');
    }
    
    // Verify the change
    const updatedColumnInfo = await db.get(`
      SELECT name, max_length 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('game_states') AND name = 'state'
    `);
    
    console.log('Updated column info:', updatedColumnInfo);
    
  } catch (error) {
    console.error('Error altering game_states table:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
alterGameStatesTable();
