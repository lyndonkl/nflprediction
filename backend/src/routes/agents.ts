import { Router } from 'express';
import { agentRegistry } from '../services/agents/agent.registry.js';
import { agentInvoker } from '../services/agents/agent.invoker.js';
import { PRESETS, getPreset } from '../config/presets.config.js';
import { PROMPT_TEMPLATES } from '../config/agents.config.js';
import { STAGE_INFO } from '../types/pipeline.types.js';
import type { ForecastContext, ForecastingStage } from '../types/pipeline.types.js';
import { apiLogger } from '../utils/logger.js';

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

/**
 * GET /api/agents/:id/prompt - Get the prompt template for an agent
 */
router.get('/:id/prompt', (req, res) => {
  const { id } = req.params;
  const agent = agentRegistry.get(id);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const template = PROMPT_TEMPLATES[id];
  if (!template) {
    return res.status(404).json({ error: 'No prompt template found for this agent' });
  }

  res.json({
    agentId: id,
    agentName: agent.name,
    template: {
      templateId: template.templateId,
      stage: template.stage,
      name: template.name,
      description: template.description,
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPromptTemplate,
      requiredVariables: template.requiredVariables,
      optionalVariables: template.optionalVariables,
      outputFormat: template.outputFormat,
    },
  });
});

/**
 * POST /api/agents/:id/test - Test an agent with sample input
 *
 * Body: { stage?: string, customContext?: Partial<ForecastContext> }
 */
router.post('/:id/test', async (req, res) => {
  const { id } = req.params;
  const { stage: stageOverride, customContext } = req.body;

  const agent = agentRegistry.get(id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  // Determine stage (use override, agent's first supported stage, or default)
  const stage = (stageOverride || agent.capabilities.supportedStages[0]) as ForecastingStage;

  if (!agent.capabilities.supportedStages.includes(stage)) {
    return res.status(400).json({
      error: `Agent ${id} does not support stage: ${stage}`,
      supportedStages: agent.capabilities.supportedStages,
    });
  }

  // Build sample ForecastContext
  const now = new Date();
  const sampleContext: ForecastContext = {
    forecastId: 'test-forecast-001',
    gameId: 'test-game-001',
    homeTeam: 'Georgia Bulldogs',
    awayTeam: 'Alabama Crimson Tide',
    gameTime: new Date('2025-12-07T20:00:00Z'),
    currentStage: stage,
    createdAt: now,
    updatedAt: now,

    // Stage outputs - populated based on stage being tested
    referenceClasses: stage !== 'reference_class' ? [
      { description: 'Top 5 SEC rivalry games', historicalSampleSize: 45, relevanceScore: 0.85, category: 'conference_rivalry' },
      { description: 'Home favorites by 3-7 points', historicalSampleSize: 200, relevanceScore: 0.7, category: 'spread_class' },
      { description: 'Georgia vs Alabama history', historicalSampleSize: 20, relevanceScore: 0.9, category: 'head_to_head' },
    ] : [],
    baseRate: ['base_rate', 'evidence_gathering', 'bayesian_update', 'premortem', 'synthesis'].includes(stage) ? 0.55 : null,
    baseRateConfidence: ['base_rate', 'evidence_gathering', 'bayesian_update', 'premortem', 'synthesis'].includes(stage) ? [0.42, 0.68] : null,
    baseRateSampleSize: ['base_rate', 'evidence_gathering', 'bayesian_update', 'premortem', 'synthesis'].includes(stage) ? 65 : null,

    evidence: ['bayesian_update', 'premortem', 'synthesis'].includes(stage) ? [
      { type: 'injury', source: 'ESPN', content: 'Alabama starting RB questionable with ankle injury', relevance: 0.7, direction: 'favors_home', suggestedLikelihoodRatio: 1.1, timestamp: new Date() },
      { type: 'weather', source: 'Weather.com', content: 'Clear conditions, 55°F expected', relevance: 0.3, direction: 'neutral', timestamp: new Date() },
      { type: 'sentiment', source: 'ESPN Analytics', content: 'Georgia favored by 4.5 points', relevance: 0.5, direction: 'favors_home', suggestedLikelihoodRatio: 1.05, timestamp: new Date() },
    ] : [],
    evidenceSummary: ['bayesian_update', 'premortem', 'synthesis'].includes(stage) ? 'Slight evidence advantage for home team due to injury concerns.' : null,

    bayesianUpdates: ['premortem', 'synthesis'].includes(stage) ? [
      { evidenceDescription: 'Alabama RB injury', likelihoodRatio: 1.1, prior: 0.55, posterior: 0.57, reasoning: 'Starting RB out reduces Alabama offensive efficiency slightly.' },
      { evidenceDescription: 'Betting line favors Georgia', likelihoodRatio: 1.05, prior: 0.57, posterior: 0.58, reasoning: 'Market consensus provides weak additional evidence.' },
    ] : [],
    posteriorProbability: ['premortem', 'synthesis'].includes(stage) ? 0.58 : null,

    premortermConcerns: stage === 'synthesis' ? [
      'Alabama has historically performed well as slight underdogs in rivalry games',
      'Georgia may be overvalued due to recency bias from recent success',
    ] : [],
    biasFlags: stage === 'synthesis' ? ['Recency bias towards Georgia', 'Anchoring on betting line'] : [],
    confidenceAdjustment: stage === 'synthesis' ? -0.02 : null,

    finalProbability: null,
    confidenceInterval: null,
    recommendation: null,
    keyDrivers: [],

    // Agent contributions
    agentContributions: {
      reference_class: stage !== 'reference_class' ? [
        {
          agentId: 'reference-class-historical',
          agentName: 'Historical Matchup Finder',
          output: {
            matches: [
              { description: 'Top 5 SEC rivalry games', historicalSampleSize: 45, relevanceScore: 0.85, category: 'conference_rivalry' },
              { description: 'Home favorites by 3-7 points', historicalSampleSize: 200, relevanceScore: 0.7, category: 'spread_class' },
            ],
            reasoning: 'Selected reference classes based on SEC rivalry dynamics.',
            recommendedClass: 'SEC rivalry games',
          },
          confidence: 0.8,
          timestamp: now,
          latencyMs: 2500,
        },
      ] : [],
      base_rate: ['evidence_gathering', 'bayesian_update', 'premortem', 'synthesis'].includes(stage) ? [
        {
          agentId: 'base-rate-calculator',
          agentName: 'Base Rate Calculator',
          output: {
            probability: 0.55,
            confidenceInterval: [0.42, 0.68],
            sampleSize: 65,
            sources: ['SEC rivalry games'],
            reasoning: 'Georgia wins 55% of similar matchups historically.',
          },
          confidence: 0.75,
          timestamp: now,
          latencyMs: 1800,
        },
      ] : [],
      evidence_gathering: ['bayesian_update', 'premortem', 'synthesis'].includes(stage) ? [
        {
          agentId: 'evidence-web-search',
          agentName: 'Web Search Evidence Gatherer',
          output: {
            evidenceItems: [
              { type: 'injury', source: 'ESPN', content: 'Alabama starting RB questionable', relevance: 0.7, direction: 'favors_home', timestamp: now.toISOString() },
            ],
            summary: 'Slight edge to home team.',
            keyFactors: ['Alabama RB injury'],
          },
          confidence: 0.7,
          timestamp: now,
          latencyMs: 3200,
        },
      ] : [],
      bayesian_update: ['premortem', 'synthesis'].includes(stage) ? [
        {
          agentId: 'bayesian-updater',
          agentName: 'Bayesian Probability Updater',
          output: {
            updates: [
              { evidenceDescription: 'Alabama RB injury', likelihoodRatio: 1.1, prior: 0.55, posterior: 0.58, reasoning: 'Injury reduces Alabama offense.' },
            ],
            posterior: 0.58,
            updateChain: '55% → 58%',
          },
          confidence: 0.8,
          timestamp: now,
          latencyMs: 2100,
        },
      ] : [],
      premortem: stage === 'synthesis' ? [
        {
          agentId: 'devils-advocate',
          agentName: "Devil's Advocate",
          output: {
            concerns: ['Alabama performs well as underdog'],
            biases: ['Recency bias'],
            alternativeScenarios: ['Alabama controls clock'],
            confidenceAdjustment: -0.02,
          },
          confidence: 0.75,
          timestamp: now,
          latencyMs: 2400,
        },
      ] : [],
      synthesis: [],
      calibration: [],
    },
    processingTimes: {
      reference_class: 0,
      base_rate: 0,
      evidence_gathering: 0,
      bayesian_update: 0,
      premortem: 0,
      synthesis: 0,
      calibration: 0,
    },
    ...customContext,
  };

  try {
    apiLogger.info({ agentId: id, stage }, 'Testing agent with sample input');

    const result = await agentInvoker.invoke(id, stage, sampleContext, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    res.json({
      success: result.success,
      agent: {
        id: agent.id,
        name: agent.name,
      },
      stage,
      testContext: {
        homeTeam: sampleContext.homeTeam,
        awayTeam: sampleContext.awayTeam,
        gameTime: sampleContext.gameTime,
      },
      result: result.success ? {
        output: result.contribution.output,
        confidence: result.contribution.confidence,
        latencyMs: result.latencyMs,
      } : {
        error: result.error,
        latencyMs: result.latencyMs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error({ error: message, agentId: id, stage }, 'Agent test failed');
    res.status(500).json({ error: message });
  }
});

export default router;
