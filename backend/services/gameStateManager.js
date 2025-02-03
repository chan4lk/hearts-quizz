const gameStateService = require('./gameStateService');

class GameStateManager {
  constructor() {
    this.activeGames = new Map();
  }

  async getGameState(pin) {
    // First check memory
    let gameState = this.activeGames.get(pin);
    
    // If not in memory, try to load from persistent storage
    if (!gameState) {
      gameState = await gameStateService.loadGameState(pin);
      if (gameState) {
        this.activeGames.set(pin, gameState);
      }
    }
    
    return gameState;
  }

  async saveGameState(pin, gameState) {
    // Save in memory
    this.activeGames.set(pin, gameState);
    // Persist to storage
    await gameStateService.saveGameState(pin, gameState);
  }

  async resetGame(pin) {
    const gameState = await this.getGameState(pin);
    if (!gameState) return null;

    // Reset game state
    const resetState = {
      ...gameState,
      isActive: true,
      currentQuestion: -1,
      players: gameState.players || [],
      scores: new Map(),
      answers: new Map()
    };

    await this.saveGameState(pin, resetState);
    return resetState;
  }

  async cleanupGame(pin) {
    this.activeGames.delete(pin);
    await gameStateService.removeGameState(pin);
  }
}

// Export singleton instance
module.exports = new GameStateManager();
