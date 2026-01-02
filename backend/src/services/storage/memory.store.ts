import type { PipelineTask, ForecastContext } from '../../types/pipeline.types.js';
import type { Game, Odds } from '../../types/index.js';

/**
 * In-memory storage for the application
 * Will be replaced with Redis/PostgreSQL later
 */
class MemoryStore {
  // Pipeline tasks by ID
  private tasks: Map<string, PipelineTask> = new Map();

  // Forecast contexts by forecast ID
  private contexts: Map<string, ForecastContext> = new Map();

  // Games by game ID
  private games: Map<string, Game> = new Map();

  // Odds by game ID
  private odds: Map<string, Odds> = new Map();

  // Tasks by game ID (for lookup)
  private tasksByGame: Map<string, Set<string>> = new Map();

  // ============================================
  // Task Operations
  // ============================================

  getTask(taskId: string): PipelineTask | undefined {
    return this.tasks.get(taskId);
  }

  setTask(task: PipelineTask): void {
    this.tasks.set(task.id, task);

    // Index by game ID
    if (!this.tasksByGame.has(task.gameId)) {
      this.tasksByGame.set(task.gameId, new Set());
    }
    this.tasksByGame.get(task.gameId)!.add(task.id);
  }

  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasksByGame.get(task.gameId)?.delete(taskId);
      return this.tasks.delete(taskId);
    }
    return false;
  }

  getTasksByGame(gameId: string): PipelineTask[] {
    const taskIds = this.tasksByGame.get(gameId);
    if (!taskIds) return [];
    return Array.from(taskIds)
      .map((id) => this.tasks.get(id))
      .filter((t): t is PipelineTask => t !== undefined);
  }

  getAllTasks(): PipelineTask[] {
    return Array.from(this.tasks.values());
  }

  // ============================================
  // Forecast Context Operations
  // ============================================

  getContext(forecastId: string): ForecastContext | undefined {
    return this.contexts.get(forecastId);
  }

  setContext(context: ForecastContext): void {
    this.contexts.set(context.forecastId, context);
  }

  deleteContext(forecastId: string): boolean {
    return this.contexts.delete(forecastId);
  }

  getAllContexts(): ForecastContext[] {
    return Array.from(this.contexts.values());
  }

  // ============================================
  // Game Operations
  // ============================================

  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  setGame(game: Game): void {
    this.games.set(game.id, game);
  }

  setGames(games: Game[]): void {
    for (const game of games) {
      this.games.set(game.id, game);
    }
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }

  getGamesByStatus(status: Game['status']): Game[] {
    return Array.from(this.games.values()).filter((g) => g.status === status);
  }

  // ============================================
  // Odds Operations
  // ============================================

  getOdds(gameId: string): Odds | undefined {
    return this.odds.get(gameId);
  }

  setOdds(odds: Odds): void {
    this.odds.set(odds.gameId, odds);
  }

  // ============================================
  // Cleanup
  // ============================================

  clear(): void {
    this.tasks.clear();
    this.contexts.clear();
    this.games.clear();
    this.odds.clear();
    this.tasksByGame.clear();
  }

  /**
   * Remove completed tasks older than maxAge
   */
  cleanupOldTasks(maxAgeMs: number): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, task] of this.tasks) {
      if (
        (task.state === 'completed' || task.state === 'failed') &&
        task.completedAt &&
        now - task.completedAt.getTime() > maxAgeMs
      ) {
        this.deleteTask(id);
        this.deleteContext(task.forecastId);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
export const memoryStore = new MemoryStore();
