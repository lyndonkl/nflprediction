import { Router } from 'express';
import { pipelineOrchestrator } from '../services/pipeline/pipeline.orchestrator.js';
import { contextManager } from '../services/pipeline/context.manager.js';
import type { AgentPreset } from '../types/pipeline.types.js';
import { apiLogger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/forecast - Start a new forecast
 */
router.post('/', async (req, res) => {
  try {
    const { gameId, homeTeam, awayTeam, gameTime, preset = 'balanced' } = req.body;

    if (!gameId || !homeTeam || !awayTeam) {
      return res.status(400).json({
        error: 'Missing required fields: gameId, homeTeam, awayTeam',
      });
    }

    const parsedGameTime = gameTime ? new Date(gameTime) : new Date();

    const { forecastId, taskId } = await pipelineOrchestrator.startForecast(
      gameId,
      homeTeam,
      awayTeam,
      parsedGameTime,
      preset as AgentPreset
    );

    apiLogger.info({ forecastId, gameId, preset }, 'Forecast started');

    res.status(201).json({
      forecastId,
      taskId,
      status: 'submitted',
      message: 'Forecast pipeline started',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error({ error: message }, 'Failed to start forecast');
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/forecast/:id - Get forecast status and result
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const { context, task, isRunning, progress } = pipelineOrchestrator.getStatus(id);

  if (!context && !task) {
    return res.status(404).json({ error: 'Forecast not found' });
  }

  res.json({
    forecastId: id,
    status: task?.state || 'unknown',
    isRunning,
    progress,
    currentStage: context?.currentStage || null,
    result: context?.finalProbability ? {
      finalProbability: context.finalProbability,
      confidenceInterval: context.confidenceInterval,
      recommendation: context.recommendation,
      keyDrivers: context.keyDrivers,
    } : null,
    context,
  });
});

/**
 * GET /api/forecast/:id/progress - Get detailed progress
 */
router.get('/:id/progress', (req, res) => {
  const { id } = req.params;

  const context = contextManager.get(id);
  if (!context) {
    return res.status(404).json({ error: 'Forecast not found' });
  }

  const progress = contextManager.getProgress(id);

  res.json({
    forecastId: id,
    progress,
    currentStage: context.currentStage,
    processingTimes: context.processingTimes,
    agentContributions: Object.fromEntries(
      Object.entries(context.agentContributions).map(([stage, contributions]) => [
        stage,
        contributions.map((c) => ({
          agentId: c.agentId,
          agentName: c.agentName,
          confidence: c.confidence,
          latencyMs: c.latencyMs,
        })),
      ])
    ),
  });
});

/**
 * DELETE /api/forecast/:id - Cancel a forecast
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const cancelled = pipelineOrchestrator.cancel(id);

  if (cancelled) {
    apiLogger.info({ forecastId: id }, 'Forecast cancelled');
    res.json({ message: 'Forecast cancelled', forecastId: id });
  } else {
    res.status(404).json({ error: 'Forecast not found or already completed' });
  }
});

/**
 * GET /api/forecast - List all forecasts
 */
router.get('/', (_req, res) => {
  const active = contextManager.getActive();
  const stats = pipelineOrchestrator.stats();

  res.json({
    running: stats.running,
    queued: stats.queued,
    forecasts: active.map((ctx) => ({
      forecastId: ctx.forecastId,
      gameId: ctx.gameId,
      homeTeam: ctx.homeTeam,
      awayTeam: ctx.awayTeam,
      currentStage: ctx.currentStage,
      progress: contextManager.getProgress(ctx.forecastId),
    })),
  });
});

export default router;
