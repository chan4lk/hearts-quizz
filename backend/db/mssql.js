const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool = null;

/**
 * Initialize the MSSQL database connection
 * @returns {Promise<sql.ConnectionPool>} - The database connection pool
 */
async function init() {
  if (pool) return pool;

  try {
    // Get connection config from environment variables
    const config = {
      user: process.env.MSSQL_USER || 'sa',
      password: process.env.MSSQL_PASSWORD || 'YourStrongPassword',
      server: process.env.MSSQL_SERVER || 'localhost',
      database: process.env.MSSQL_DATABASE || 'khoot',
      options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true', // Use encryption if specified
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true', // Trust self-signed certificates
        enableArithAbort: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

    // Create connection pool
    pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to MSSQL database');

    // Create tables if they don't exist
    await createTables();

    return pool;
  } catch (error) {
    console.error('MSSQL connection error:', error);
    throw error;
  }
}

/**
 * Create necessary tables if they don't exist
 */
async function createTables() {
  try {
    // Check if users table exists
    const result = await pool.request().query(`
      SELECT OBJECT_ID('users') AS TableID
    `);

    // If tables don't exist, create them
    if (!result.recordset[0].TableID) {
      await createUsersTable();
      await createQuizzesTable();
      await createQuestionsTable();
      await createTeamsTable();
      await createGameStatesTables();
      await createTriggers();
      console.log('MSSQL tables created successfully');
    }
  } catch (error) {
    console.error('Error creating MSSQL tables:', error);
    throw error;
  }
}

/**
 * Create users table
 */
async function createUsersTable() {
  try {
    await pool.request().batch(`
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
      );
    `);
  } catch (error) {
    console.error('Error creating users table:', error);
    throw error;
  }
}

/**
 * Create quizzes table
 */
async function createQuizzesTable() {
  try {
    await pool.request().batch(`
      CREATE TABLE quizzes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        category NVARCHAR(255),
        pin NVARCHAR(10) UNIQUE NOT NULL,
        user_id INT,
        active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
  } catch (error) {
    console.error('Error creating quizzes table:', error);
    throw error;
  }
}

/**
 * Create questions table
 */
async function createQuestionsTable() {
  try {
    await pool.request().batch(`
      CREATE TABLE questions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        quiz_id INT NOT NULL,
        text NVARCHAR(MAX) NOT NULL,
        image_url NVARCHAR(255) DEFAULT '/quiz.jpeg',
        time_limit INT DEFAULT 30,
        points INT DEFAULT 1000,
        options NVARCHAR(MAX) NOT NULL,
        correct_answer INT NOT NULL,
        order_index INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error('Error creating questions table:', error);
    throw error;
  }
}

/**
 * Create teams table
 */
async function createTeamsTable() {
  try {
    await pool.request().batch(`
      CREATE TABLE teams (
        id INT IDENTITY(1,1) PRIMARY KEY,
        quiz_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        color NVARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error('Error creating teams table:', error);
    throw error;
  }
}

/**
 * Create game states tables
 */
async function createGameStatesTables() {
  try {
    // Check if tables already exist
    const tableExists = await pool.request().query(`
      SELECT COUNT(*) as count FROM sys.tables WHERE name = 'game_states'
    `);
    
    if (tableExists.recordset[0].count === 0) {
      // Create game_states table with NVARCHAR(MAX) for state to store JSON
      await pool.request().batch(`
        CREATE TABLE game_states (
          pin NVARCHAR(10) PRIMARY KEY,
          quiz_id INT,
          state NVARCHAR(MAX) NOT NULL,
          current_question INT DEFAULT -1,
          is_active BIT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );
      `);
      
      console.log('Created game_states table');
    }
    
    // Check if game_players table exists
    const playersTableExists = await pool.request().query(`
      SELECT COUNT(*) as count FROM sys.tables WHERE name = 'game_players'
    `);
    
    if (playersTableExists.recordset[0].count === 0) {
      // Create game_players table
      await pool.request().batch(`
        CREATE TABLE game_players (
          pin NVARCHAR(10) NOT NULL,
          player_name NVARCHAR(255) NOT NULL,
          team_id INT,
          score INT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          PRIMARY KEY (pin, player_name),
          FOREIGN KEY (pin) REFERENCES game_states(pin) ON DELETE CASCADE,
          FOREIGN KEY (team_id) REFERENCES teams(id)
        );
      `);
      
      console.log('Created game_players table');
    }
  } catch (error) {
    console.error('Error creating game states tables:', error);
    throw error;
  }
}

/**
 * Create triggers for timestamp updates
 */
async function createTriggers() {
  try {
    // Create game_states trigger
    await pool.request().batch(`
      CREATE TRIGGER update_game_states_timestamp 
      ON game_states
      AFTER UPDATE
      AS
      BEGIN
        UPDATE game_states
        SET updated_at = GETDATE()
        FROM game_states
        INNER JOIN inserted ON game_states.pin = inserted.pin;
      END;
    `);
    
    // Create game_players trigger
    await pool.request().batch(`
      CREATE TRIGGER update_game_players_timestamp 
      ON game_players
      AFTER UPDATE
      AS
      BEGIN
        UPDATE game_players
        SET updated_at = GETDATE()
        FROM game_players
        INNER JOIN inserted ON game_players.pin = inserted.pin AND game_players.player_name = inserted.player_name;
      END;
    `);
  } catch (error) {
    console.error('Error creating triggers:', error);
    throw error;
  }
}

/**
 * Execute a SQL query that returns a single row
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function get(query, params = []) {
  try {
    // Replace ? placeholders with @paramX
    let paramIndex = 0;
    const modifiedQuery = query.replace(/\?/g, () => `@param${paramIndex++}`);
    
    const request = pool.request();
    addParameters(request, params);
    const result = await request.query(modifiedQuery);
    return result.recordset[0];
  } catch (error) {
    console.error('MSSQL get error:', error);
    throw error;
  }
}

/**
 * Execute a SQL query that returns multiple rows
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
async function all(query, params = []) {
  try {
    // Replace ? placeholders with @paramX
    let paramIndex = 0;
    const modifiedQuery = query.replace(/\?/g, () => `@param${paramIndex++}`);
    
    const request = pool.request();
    addParameters(request, params);
    const result = await request.query(modifiedQuery);
    return result.recordset;
  } catch (error) {
    console.error('MSSQL all error:', error);
    throw error;
  }
}

/**
 * Execute a SQL query that modifies data
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result with rowsAffected and lastID
 */
async function run(query, params = []) {
  try {
    // Check if this is a MERGE statement (used for upserts)
    const isMergeStatement = query.trim().toUpperCase().startsWith('MERGE');
    
    // For MERGE statements, we don't need to modify the query as it already uses named parameters
    if (isMergeStatement) {
      console.log('Executing MERGE statement with named parameters');
      const request = pool.request();
      addParameters(request, params);
      const result = await request.query(query);
      
      return {
        rowsAffected: result.rowsAffected[0],
        lastID: null
      };
    }
    
    // For standard queries with ? placeholders, replace with @paramX
    let paramIndex = 0;
    const modifiedQuery = query.replace(/\?/g, () => `@param${paramIndex++}`);
    
    // For INSERT statements, use a different approach to get the last inserted ID
    if (modifiedQuery.trim().toUpperCase().startsWith('INSERT')) {
      // Extract table name from INSERT query
      const tableMatch = modifiedQuery.match(/INSERT\s+INTO\s+([^\s(]+)/i);
      if (tableMatch && tableMatch[1]) {
        const tableName = tableMatch[1];
        
        // Create a request with parameters
        const request = pool.request();
        addParameters(request, params);
        
        // Modify the query to get the last inserted ID in the same transaction
        const modifiedQueryWithId = `
          ${modifiedQuery};
          SELECT SCOPE_IDENTITY() AS id;
        `;
        
        // Execute the modified query with ID retrieval
        const result = await request.query(modifiedQueryWithId);
        
        // The last recordset contains the ID
        const lastID = result.recordsets.length > 1 ? 
                      result.recordsets[1][0].id : 
                      (result.recordset && result.recordset.length > 0 ? result.recordset[0].id : null);
        
        if (lastID === null) {
          console.warn('Failed to get last inserted ID for query:', modifiedQuery);
        } else {
          console.log(`Last inserted ID: ${lastID} for table ${tableName}`);
        }
        
        return {
          rowsAffected: result.rowsAffected[0],
          lastID: lastID
        };
      }
    }
    
    // For other non-INSERT queries
    const request = pool.request();
    addParameters(request, params);
    const result = await request.query(modifiedQuery);
    
    return {
      rowsAffected: result.rowsAffected[0],
      lastID: null
    };
  } catch (error) {
    console.error('MSSQL run error:', error);
    throw error;
  }
}

/**
 * Execute a SQL batch script
 * @param {string} query - SQL batch to execute
 * @returns {Promise<void>}
 */
async function exec(query) {
  try {
    await pool.request().batch(query);
  } catch (error) {
    console.error('MSSQL exec error:', error);
    throw error;
  }
}

/**
 * Add parameters to a SQL request
 * @param {sql.Request} request - SQL request object
 * @param {Array|Object} params - Parameters to add (array or object)
 */
function addParameters(request, params) {
  if (Array.isArray(params)) {
    // Handle array parameters (positional parameters)
    params.forEach((param, index) => {
      request.input(`param${index}`, param === null ? null : param);
    });
  } else if (params && typeof params === 'object') {
    // Handle object parameters (named parameters)
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value === null ? null : value);
    });
  }
  
  // Log the parameters for debugging
  console.log('SQL parameters:', JSON.stringify(params, (key, value) => {
    // Handle circular references and large objects
    if (typeof value === 'object' && value !== null) {
      if (Object.keys(value).length > 20) {
        return '[Large Object]';
      }
    }
    return value;
  }));
}

// Alias for addParameters to maintain consistency with function calls
const addParams = addParameters;

/**
 * Begin a transaction
 * @returns {Promise<sql.Transaction>}
 */
async function beginTransaction() {
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  return transaction;
}

/**
 * Commit a transaction
 * @param {sql.Transaction} transaction - Transaction to commit
 * @returns {Promise<void>}
 */
async function commitTransaction(transaction) {
  await transaction.commit();
}

/**
 * Rollback a transaction
 * @param {sql.Transaction} transaction - Transaction to rollback
 * @returns {Promise<void>}
 */
async function rollbackTransaction(transaction) {
  await transaction.rollback();
}

module.exports = {
  init,
  get,
  all,
  run,
  exec,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
