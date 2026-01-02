import { Router } from 'express';
import { espnService } from '../services/external/espn.service.js';
import { oddsAPIService } from '../services/external/odds-api.service.js';
import { memoryStore } from '../services/storage/memory.store.js';
import { apiLogger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/games - List all games (with optional date filter)
 */
router.get('/', async (req, res) => {
  try {
    const { date, live } = req.query;

    let games;
    if (live === 'true') {
      games = await espnService.getLiveGames();
    } else {
      const dateFilter = date ? new Date(date as string) : undefined;
      games = await espnService.getScoreboard(dateFilter);
    }

    // Store in memory for quick access
    memoryStore.setGames(games);

    res.json({
      count: games.length,
      games,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error({ error: message }, 'Failed to fetch games');
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/games/live - Get live games only
 */
router.get('/live', async (_req, res) => {
  try {
    const games = await espnService.getLiveGames();

    res.json({
      count: games.length,
      games,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error({ error: message }, 'Failed to fetch live games');
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/games/:id - Get single game with odds
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try memory first
    let game = memoryStore.getGame(id);

    // Fetch from ESPN if not in memory
    if (!game) {
      const fetchedGame = await espnService.getGame(id);
      if (fetchedGame) {
        game = fetchedGame;
        memoryStore.setGame(game);
      }
    }

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Try to get odds for this game
    const odds = await oddsAPIService.getOddsForGame(game.homeTeam, game.awayTeam);
    if (odds) {
      memoryStore.setOdds(odds);
    }

    res.json({
      game,
      odds: odds || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error({ error: message, gameId: req.params.id }, 'Failed to fetch game');
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/games/:id/odds - Get odds for a game
 */
router.get('/:id/odds', async (req, res) => {
  try {
    const { id } = req.params;

    // Get game first to find team names
    const game = memoryStore.getGame(id) || await espnService.getGame(id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const odds = await oddsAPIService.getOddsForGame(game.homeTeam, game.awayTeam);
    if (!odds) {
      return res.status(404).json({ error: 'Odds not available for this game' });
    }

    // Calculate vig-free probabilities
    const vigFree = oddsAPIService.calculateVigFree(odds.homeMoneyline, odds.awayMoneyline);

    res.json({
      gameId: id,
      odds,
      impliedProbabilities: {
        home: {
          raw: oddsAPIService.americanToImplied(odds.homeMoneyline),
          vigFree: vigFree.home,
        },
        away: {
          raw: oddsAPIService.americanToImplied(odds.awayMoneyline),
          vigFree: vigFree.away,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error({ error: message, gameId: req.params.id }, 'Failed to fetch odds');
    res.status(500).json({ error: message });
  }
});

export default router;
