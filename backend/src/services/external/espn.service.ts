import { config } from '../../config/index.js';
import { cacheService, CacheKeys } from '../storage/cache.service.js';
import { apiLogger } from '../../utils/logger.js';
import type { Game } from '../../types/index.js';

interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
  };
  score?: string;
  curatedRank?: { current: number };
}

interface ESPNCompetition {
  id: string;
  competitors: ESPNCompetitor[];
  venue?: { fullName: string };
  conferenceCompetition?: boolean;
}

interface ESPNStatus {
  type: { name: string; completed: boolean };
  period: number;
  displayClock?: string;
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  competitions: ESPNCompetition[];
  status: ESPNStatus;
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

/**
 * ESPN Hidden API Service
 */
class ESPNService {
  private baseUrl = config.espn.baseUrl;

  /**
   * Get scoreboard with all games for a date
   */
  async getScoreboard(date?: Date, conferenceId?: string): Promise<Game[]> {
    const dateStr = date ? this.formatDate(date) : undefined;
    const cacheKey = CacheKeys.scoreboard(dateStr);

    // Check cache first
    const cached = cacheService.get<Game[]>(cacheKey);
    if (cached) {
      apiLogger.debug({ cacheKey }, 'ESPN scoreboard cache hit');
      return cached;
    }

    // Build URL
    const url = new URL(`${this.baseUrl}/scoreboard`);
    if (dateStr) url.searchParams.set('dates', dateStr);
    if (conferenceId) url.searchParams.set('groups', conferenceId);

    apiLogger.info({ url: url.toString() }, 'Fetching ESPN scoreboard');

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`);
      }

      const data = (await response.json()) as ESPNScoreboardResponse;
      const games = data.events.map((e) => this.normalizeGame(e));

      // Cache with appropriate TTL
      const ttl = this.getTTL(games);
      cacheService.set(cacheKey, games, ttl);

      apiLogger.info({ count: games.length, ttl }, 'ESPN scoreboard fetched');
      return games;
    } catch (error) {
      apiLogger.error({ error }, 'Failed to fetch ESPN scoreboard');
      throw error;
    }
  }

  /**
   * Get a single game by ID
   */
  async getGame(gameId: string): Promise<Game | null> {
    const cacheKey = CacheKeys.game(gameId);

    const cached = cacheService.get<Game>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/summary?event=${gameId}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`ESPN API error: ${response.status}`);
      }

      const data = await response.json();
      const game = this.normalizeGameSummary(data, gameId);

      const ttl = game.status === 'in_progress' ? config.cache.liveGame : config.cache.scheduledGame;
      cacheService.set(cacheKey, game, ttl);

      return game;
    } catch (error) {
      apiLogger.error({ error, gameId }, 'Failed to fetch ESPN game');
      throw error;
    }
  }

  /**
   * Get live games only
   */
  async getLiveGames(): Promise<Game[]> {
    const all = await this.getScoreboard();
    return all.filter((g) => g.status === 'in_progress');
  }

  /**
   * Normalize ESPN event to our Game type
   */
  private normalizeGame(event: ESPNEvent): Game {
    const competition = event.competitions[0];
    const homeTeam = competition.competitors.find((c) => c.homeAway === 'home')!;
    const awayTeam = competition.competitors.find((c) => c.homeAway === 'away')!;

    return {
      id: event.id,
      homeTeam: homeTeam.team.displayName,
      awayTeam: awayTeam.team.displayName,
      homeScore: parseInt(homeTeam.score || '0', 10),
      awayScore: parseInt(awayTeam.score || '0', 10),
      status: this.mapStatus(event.status.type.name),
      startTime: new Date(event.date),
      period: event.status.period || 0,
      clock: event.status.displayClock || '',
    };
  }

  /**
   * Normalize game summary response
   */
  private normalizeGameSummary(data: any, gameId: string): Game {
    // Summary response has different structure
    const header = data.header;
    const competitions = header?.competitions?.[0];

    if (!competitions) {
      throw new Error(`Invalid game summary for ${gameId}`);
    }

    const homeTeam = competitions.competitors?.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitions.competitors?.find((c: any) => c.homeAway === 'away');

    return {
      id: gameId,
      homeTeam: homeTeam?.team?.displayName || 'Unknown',
      awayTeam: awayTeam?.team?.displayName || 'Unknown',
      homeScore: parseInt(homeTeam?.score || '0', 10),
      awayScore: parseInt(awayTeam?.score || '0', 10),
      status: this.mapStatus(header?.competitions?.[0]?.status?.type?.name || 'STATUS_SCHEDULED'),
      startTime: new Date(header?.competitions?.[0]?.date || Date.now()),
      period: header?.competitions?.[0]?.status?.period || 0,
      clock: header?.competitions?.[0]?.status?.displayClock || '',
    };
  }

  /**
   * Map ESPN status to our status enum
   */
  private mapStatus(espnStatus: string): Game['status'] {
    switch (espnStatus) {
      case 'STATUS_IN_PROGRESS':
      case 'STATUS_HALFTIME':
      case 'STATUS_END_PERIOD':
        return 'in_progress';
      case 'STATUS_FINAL':
      case 'STATUS_FINAL_OT':
        return 'final';
      default:
        return 'scheduled';
    }
  }

  /**
   * Format date for ESPN API (YYYYMMDD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  /**
   * Determine cache TTL based on game states
   */
  private getTTL(games: Game[]): number {
    const hasLive = games.some((g) => g.status === 'in_progress');
    return hasLive ? config.cache.liveGame : config.cache.scheduledGame;
  }
}

// Singleton instance
export const espnService = new ESPNService();
