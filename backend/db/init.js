const Quiz = require('../models/Quiz');
const Team = require('../models/Team');
const Player = require('../models/Player');
const db = require('./index');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Initialize database connection
    await db.init();
    console.log('Database connection established');
    
    // Create quiz and question tables
    await Quiz.createTable();
    console.log('Quiz tables created successfully');
    
    // Create team tables
    await Team.createTable();
    console.log('Team tables created successfully');
    
    // Create player tables
    await Player.createTable();
    console.log('Player tables created successfully');
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run initialization if this file is run directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
