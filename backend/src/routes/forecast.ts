import { Router } from 'express';
import type { ForecastContext } from '../types/index.js';

const router = Router();

// POST /api/forecast - Start a new forecast
router.post('/', (req, res) => {
  const { gameId, homeTeam, awayTeam } = req.body;

  const context: ForecastContext = {
    gameId,
    homeTeam,
    awayTeam,
    currentStage: 'reference_class',
    baseRate: null,
    evidence: [],
    posteriorProbability: null,
    finalProbability: null,
  };

  // TODO: Queue pipeline execution
  res.json({
    message: 'Forecast started',
    context
  });
});

// GET /api/forecast/:id - Get forecast status
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Get from cache/db
  res.json({ forecastId: id, status: 'not_found' });
});

export default router;
