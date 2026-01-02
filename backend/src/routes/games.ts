import { Router } from 'express';
import type { Game } from '../types/index.js';

const router = Router();

// GET /api/games - List all games
router.get('/', (_req, res) => {
  // TODO: Fetch from ESPN API / cache
  const games: Game[] = [];
  res.json({ games });
});

// GET /api/games/:id - Get single game
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Fetch specific game
  res.json({ gameId: id, message: 'Not implemented' });
});

// GET /api/games/:id/odds - Get odds for a game
router.get('/:id/odds', (req, res) => {
  const { id } = req.params;
  // TODO: Fetch from Odds API / cache
  res.json({ gameId: id, odds: null });
});

export default router;
