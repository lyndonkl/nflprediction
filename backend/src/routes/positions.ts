import { Router } from 'express';
import type { Position } from '../types/index.js';

const router = Router();

// GET /api/positions - List all positions
router.get('/', (_req, res) => {
  // TODO: Fetch from database
  const positions: Position[] = [];
  res.json({ positions });
});

// POST /api/positions - Create new position
router.post('/', (req, res) => {
  const { gameId, contractType, side, entryPrice, quantity } = req.body;

  const position: Partial<Position> = {
    gameId,
    contractType,
    side,
    entryPrice,
    quantity,
    entryTime: new Date(),
    status: 'open',
  };

  // TODO: Save to database
  res.status(201).json({
    message: 'Position created',
    position
  });
});

// PATCH /api/positions/:id - Update position (close, etc.)
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  // TODO: Update in database
  res.json({ positionId: id, updates });
});

export default router;
