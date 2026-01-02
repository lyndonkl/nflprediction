import { config } from '../../config/index.js';
import { cacheService, CacheKeys } from '../storage/cache.service.js';
import { apiLogger } from '../../utils/logger.js';
import type { Odds } from '../../types/index.js';

interface OddsAPIOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsAPIMarket {
  key: string;
  outcomes: OddsAPIOutcome[];
}

interface OddsAPIBookmaker {
  key: string;
  title: string;
  markets: OddsAPIMarket[];
}

interface OddsAPIEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsAPIBookmaker[];
}

/**
 * The Odds API Service
 */
class OddsAPIService {
  private baseUrl = config.oddsApi.baseUrl;
  private apiKey = config.oddsApiKey;

  /**
   * Get odds for all NCAAF games
   */
  async getNCAAFOdds(markets: string[] = ['h2h', 'spreads', 'totals']): Promise<Odds[]> {
    const cacheKey = CacheKeys.ncaafOdds();

    const cached = cacheService.get<Odds[]>(cacheKey);
    if (cached) {
      apiLogger.debug({ cacheKey }, 'Odds API cache hit');
      return cached;
    }

    if (!this.apiKey) {
      apiLogger.warn('Odds API key not configured');
      return [];
    }

    const url = new URL(`${this.baseUrl}/sports/${config.oddsApi.sport}/odds`);
    url.searchParams.set('apiKey', this.apiKey);
    url.searchParams.set('regions', 'us');
    url.searchParams.set('markets', markets.join(','));
    url.searchParams.set('oddsFormat', 'american');

    apiLogger.info({ sport: config.oddsApi.sport }, 'Fetching Odds API');

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Odds API error: ${response.status}`);
      }

      const data = (await response.json()) as OddsAPIEvent[];
      const odds = data.map((e) => this.normalizeOdds(e));

      cacheService.set(cacheKey, odds, config.cache.odds);
      apiLogger.info({ count: odds.length }, 'Odds API fetched');

      return odds;
    } catch (error) {
      apiLogger.error({ error }, 'Failed to fetch Odds API');
      throw error;
    }
  }

  /**
   * Get odds for a specific game by matching team names
   */
  async getOddsForGame(homeTeam: string, awayTeam: string): Promise<Odds | null> {
    const allOdds = await this.getNCAAFOdds();

    // Fuzzy match team names
    const match = allOdds.find((o) => {
      const homeMatch = this.teamsMatch(o.gameId, homeTeam) || this.teamsMatch(o.gameId, awayTeam);
      return homeMatch;
    });

    return match || null;
  }

  /**
   * Normalize Odds API event to our Odds type
   */
  private normalizeOdds(event: OddsAPIEvent): Odds {
    // Get first bookmaker (usually DraftKings)
    const book = event.bookmakers[0];

    let homeMoneyline = 0;
    let awayMoneyline = 0;
    let spreadLine = 0;
    let spreadPrice = 0;
    let totalLine = 0;
    let overPrice = 0;
    let underPrice = 0;

    if (book) {
      // Moneyline (h2h)
      const h2h = book.markets.find((m) => m.key === 'h2h');
      if (h2h) {
        const home = h2h.outcomes.find((o) => o.name === event.home_team);
        const away = h2h.outcomes.find((o) => o.name === event.away_team);
        homeMoneyline = home?.price || 0;
        awayMoneyline = away?.price || 0;
      }

      // Spread
      const spreads = book.markets.find((m) => m.key === 'spreads');
      if (spreads) {
        const home = spreads.outcomes.find((o) => o.name === event.home_team);
        spreadLine = home?.point || 0;
        spreadPrice = home?.price || -110;
      }

      // Totals
      const totals = book.markets.find((m) => m.key === 'totals');
      if (totals) {
        const over = totals.outcomes.find((o) => o.name === 'Over');
        const under = totals.outcomes.find((o) => o.name === 'Under');
        totalLine = over?.point || 0;
        overPrice = over?.price || -110;
        underPrice = under?.price || -110;
      }
    }

    return {
      gameId: `${event.home_team}_${event.away_team}`,
      homeMoneyline,
      awayMoneyline,
      spreadLine,
      spreadPrice,
      totalLine,
      overPrice,
      underPrice,
      updatedAt: new Date(),
    };
  }

  /**
   * Convert American odds to implied probability
   */
  americanToImplied(odds: number): number {
    if (odds === 0) return 0.5;
    if (odds > 0) {
      return 100 / (odds + 100);
    }
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }

  /**
   * Remove vig to get true probability
   */
  calculateVigFree(homeOdds: number, awayOdds: number): { home: number; away: number } {
    if (homeOdds === 0 || awayOdds === 0) {
      return { home: 0.5, away: 0.5 };
    }

    const homeImplied = this.americanToImplied(homeOdds);
    const awayImplied = this.americanToImplied(awayOdds);
    const totalImplied = homeImplied + awayImplied;

    return {
      home: homeImplied / totalImplied,
      away: awayImplied / totalImplied,
    };
  }

  /**
   * Simple team name matching
   */
  private teamsMatch(gameId: string, teamName: string): boolean {
    const normalized = teamName.toLowerCase().replace(/[^a-z]/g, '');
    const gameNormalized = gameId.toLowerCase().replace(/[^a-z]/g, '');
    return gameNormalized.includes(normalized);
  }
}

// Singleton instance
export const oddsAPIService = new OddsAPIService();
