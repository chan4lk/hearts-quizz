const db = require('../db');

class GameStateService {
  constructor() {
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await db.init();
      this.initialized = true;
    }
  }

  async saveGameState(pin, state) {
    await this.ensureInitialized();
    
    const quiz_id = state.quiz_id || null;
    const stateJson = JSON.stringify({
      ...state,
      scores: state.scores instanceof Map ? Object.fromEntries(state.scores) : state.scores,
      answers: state.answers instanceof Map ? Object.fromEntries(state.answers) : state.answers
    });
    
    // Use database-specific upsert syntax
    const isMssql = global.dbHelper && typeof global.dbHelper.getDbType === 'function' && 
                   global.dbHelper.getDbType() === 'mssql';
    if (isMssql) {
      console.log('Using SQL Server MERGE for game_states');
      // For SQL Server, we need to use named parameters
      const request = {
        pin: pin,
        quiz_id: quiz_id,
        state: stateJson
      };
      
      // SQL Server MERGE syntax for upsert with properly named parameters
      await db.run(`
        MERGE INTO game_states AS target
        USING (SELECT @pin AS pin) AS source
        ON target.pin = source.pin
        WHEN MATCHED THEN
          UPDATE SET quiz_id = @quiz_id, state = @state
        WHEN NOT MATCHED THEN
          INSERT (pin, quiz_id, state)
          VALUES (@pin, @quiz_id, @state);
      `, request);
    } else {
      // SQLite syntax
      await db.run(
        `INSERT OR REPLACE INTO game_states (pin, quiz_id, state) 
         VALUES (?, ?, ?)`,
        [pin, quiz_id, stateJson]
      );
    }

    // Save player scores
    if (state.scores) {
      const scores = state.scores instanceof Map ? 
        Object.fromEntries(state.scores) : 
        state.scores;
      
      for (const [playerName, score] of Object.entries(scores)) {
        if (playerName === 'admin') continue;
        
        // Use database-specific upsert syntax for player scores
        const isMssql = global.dbHelper && typeof global.dbHelper.getDbType === 'function' && 
                       global.dbHelper.getDbType() === 'mssql';
        if (isMssql) {
          console.log(`Saving player score for ${playerName}: ${score}`);
          // For SQL Server, we need to use named parameters
          const playerRequest = {
            pin: pin,
            player_name: playerName,
            score: score
          };
          
          // SQL Server MERGE syntax for upsert with properly named parameters
          await db.run(`
            MERGE INTO game_players AS target
            USING (SELECT @pin AS pin, @player_name AS player_name) AS source
            ON target.pin = source.pin AND target.player_name = source.player_name
            WHEN MATCHED THEN
              UPDATE SET score = @score
            WHEN NOT MATCHED THEN
              INSERT (pin, player_name, score)
              VALUES (@pin, @player_name, @score);
          `, playerRequest);
        } else {
          // SQLite syntax
          await db.run(
            `INSERT OR REPLACE INTO game_players (pin, player_name, score)
             VALUES (?, ?, ?)`,
            [pin, playerName, score]
          );
        }
      }
    }
  }

  async loadGameState(pin) {
    await this.ensureInitialized();
    
    const state = await db.get(
      'SELECT state FROM game_states WHERE pin = ?',
      [pin]
    );

    if (!state) return null;

    const gameState = JSON.parse(state.state);
    
    // Load player scores
    const players = await db.all(
      'SELECT player_name, score FROM game_players WHERE pin = ?',
      [pin]
    );

    // Convert scores back to Map
    gameState.scores = new Map(
      players.map(p => [p.player_name, p.score])
    );

    // Convert answers back to Map if they exist
    if (gameState.answers) {
      gameState.answers = new Map(Object.entries(gameState.answers));
    } else {
      gameState.answers = new Map();
    }

    return gameState;
  }

  async removeGameState(pin) {
    await this.ensureInitialized();
    await db.run('DELETE FROM game_states WHERE pin = ?', [pin]);
    // game_players will be automatically deleted due to CASCADE
  }

  async cleanupOldGames(hoursOld = 24) {
    await this.ensureInitialized();
    await db.run(`
      DELETE FROM game_states 
      WHERE datetime(updated_at) < datetime('now', '-' || ? || ' hours')`,
      [hoursOld]
    );
  }

  async getAllGameStates() {
    await this.ensureInitialized();
    
    const states = await db.all('SELECT pin, state FROM game_states');
    if (!states || states.length === 0) return null;

    const gameStates = [];
    
    for (const state of states) {
      const gameState = JSON.parse(state.state);
      
      // Load player scores
      const players = await db.all(
        'SELECT player_name, score FROM game_players WHERE pin = ?',
        [state.pin]
      );
      
      // Convert scores back to Map
      gameState.scores = new Map(
        players.map(p => [p.player_name, p.score])
      );

      // Convert answers back to Map if they exist
      if (gameState.answers) {
        gameState.answers = new Map(Object.entries(gameState.answers));
      } else {
        gameState.answers = new Map();
      }
      
      gameStates.push(gameState);
    }
    
    return gameStates;
  }
}

module.exports = new GameStateService();
