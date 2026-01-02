import { Router } from 'express';
import { agentRegistry } from '../services/agents/agent.registry.js';
import { PRESETS, getPreset } from '../config/presets.config.js';
import { STAGE_INFO } from '../types/pipeline.types.js';

const router = Router();

/**
 * GET /api/agents - List all registered agents
 */
router.get('/', (_req, res) => {
  const agents = agentRegistry.getAll();

  res.json({
    count: agents.length,
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      version: agent.version,
      description: agent.description,
      capabilities: agent.capabilities,
      coherenceProfile: agent.coherenceProfile,
    })),
  });
});

/**
 * GET /api/agents/presets - Get available presets
 */
router.get('/presets', (_req, res) => {
  res.json({
    presets: PRESETS.map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      recommended: preset.recommended || false,
      agentCount: preset.agentCount,
      estimatedTimeSeconds: preset.estimatedTimeSeconds,
    })),
  });
});

/**
 * GET /api/agents/stages - Get stage information
 */
router.get('/stages', (_req, res) => {
  res.json({
    stages: Object.entries(STAGE_INFO).map(([id, info]) => ({
      id,
      ...info,
      agents: agentRegistry.getAgentIdsForStage(id as keyof typeof STAGE_INFO),
    })),
  });
});

/**
 * GET /api/agents/:id - Get agent details
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const agent = agentRegistry.get(id);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  res.json({ agent });
});

/**
 * GET /api/agents/preset/:presetId - Get agents for a preset
 */
router.get('/preset/:presetId', (req, res) => {
  const { presetId } = req.params;
  const preset = getPreset(presetId as 'quick' | 'balanced' | 'deep' | 'custom');

  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }

  const agentsByStage: Record<string, unknown[]> = {};

  for (const [stage, agentIds] of Object.entries(preset.stages)) {
    agentsByStage[stage] = agentIds.map((id) => {
      const agent = agentRegistry.get(id);
      return agent ? {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      } : { id, name: 'Unknown', description: 'Agent not found' };
    });
  }

  res.json({
    preset: {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      agentCount: preset.agentCount,
      estimatedTimeSeconds: preset.estimatedTimeSeconds,
    },
    stages: agentsByStage,
  });
});

export default router;
