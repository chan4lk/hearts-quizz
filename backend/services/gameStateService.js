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
    const stateJson = JSON.stringify(state);
    
    await db.run(
      `INSERT OR REPLACE INTO game_states (pin, quiz_id, state) 
       VALUES (?, ?, ?)`,
      [pin, quiz_id, stateJson]
    );

    // Save player scores
    if (state.scores) {
      const scores = state.scores instanceof Map ? 
        Object.fromEntries(state.scores) : 
        state.scores;
      
      for (const [playerName, score] of Object.entries(scores)) {
        if (playerName === 'admin') continue;
        await db.run(
          `INSERT OR REPLACE INTO game_players (pin, player_name, score)
           VALUES (?, ?, ?)`,
          [pin, playerName, score]
        );
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
}

module.exports = new GameStateService();
