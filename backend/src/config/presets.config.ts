import type { PresetDefinition, ForecastingStage } from '../types/pipeline.types.js';
import type { UserAgentConfig } from '../types/agent.types.js';
import { DEFAULT_AGENTS, getPromptTemplate } from './agents.config.js';

/**
 * Agent preset definitions: Quick, Balanced, Deep
 */
export const PRESETS: PresetDefinition[] = [
  {
    id: 'quick',
    name: 'Quick',
    description: 'Fast analysis with essential agents (~30 seconds)',
    agentCount: 3,
    estimatedTimeSeconds: 30,
    stages: {
      reference_class: ['reference-class-historical'],
      base_rate: ['base-rate-calculator'],
      evidence_gathering: [], // Skip
      bayesian_update: [], // Skip
      premortem: [], // Skip
      synthesis: ['synthesis-coordinator'],
      calibration: [],
    },
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Recommended analysis with core agents (~2 minutes)',
    recommended: true,
    agentCount: 5,
    estimatedTimeSeconds: 120,
    stages: {
      reference_class: ['reference-class-historical'],
      base_rate: ['base-rate-calculator'],
      evidence_gathering: ['evidence-web-search'],
      bayesian_update: ['bayesian-updater'],
      premortem: ['devils-advocate'],
      synthesis: ['synthesis-coordinator'],
      calibration: [],
    },
  },
  {
    id: 'deep',
    name: 'Deep Research',
    description: 'Comprehensive analysis with all agents (~5 minutes)',
    agentCount: 8,
    estimatedTimeSeconds: 300,
    stages: {
      reference_class: ['reference-class-historical'],
      base_rate: ['base-rate-calculator'],
      evidence_gathering: ['evidence-web-search', 'evidence-injury-analyzer'],
      bayesian_update: ['bayesian-updater'],
      premortem: ['devils-advocate', 'bias-detector'],
      synthesis: ['synthesis-coordinator'],
      calibration: [],
    },
  },
];

/**
 * Get a preset by ID
 */
export function getPreset(presetId: string): PresetDefinition | undefined {
  return PRESETS.find((p) => p.id === presetId);
}

/**
 * Get the recommended preset
 */
export function getRecommendedPreset(): PresetDefinition {
  return PRESETS.find((p) => p.recommended) || PRESETS[1];
}

/**
 * Create default UserAgentConfig for an agent
 */
function createDefaultAgentConfig(agentId: string, stage: ForecastingStage): UserAgentConfig {
  const agent = DEFAULT_AGENTS.find((a) => a.id === agentId);
  const template = getPromptTemplate(agentId);

  return {
    agentId,
    stage,
    enabled: true,
    weight: 1.0,
    customSystemPrompt: undefined,
    customUserPrompt: undefined,
    temperature: 0.7,
    maxTokens: agent?.constraints.maxTokensOutput || 2000,
    stageConfig: {},
  };
}

/**
 * Build a full PipelineConfig from a preset
 */
export function buildPipelineConfig(presetId: string): import('../types/pipeline.types.js').PipelineConfig {
  const preset = getPreset(presetId);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }

  const stages: Record<ForecastingStage, import('../types/pipeline.types.js').StageConfig> = {
    reference_class: { enabled: true, parallelExecution: false, agents: [] },
    base_rate: { enabled: true, parallelExecution: false, agents: [] },
    evidence_gathering: { enabled: true, parallelExecution: true, agents: [] },
    bayesian_update: { enabled: true, parallelExecution: false, agents: [] },
    premortem: { enabled: true, parallelExecution: true, agents: [] },
    synthesis: { enabled: true, parallelExecution: false, agents: [] },
    calibration: { enabled: true, parallelExecution: false, agents: [] },
  };

  // Populate agents for each stage
  for (const [stage, agentIds] of Object.entries(preset.stages)) {
    const stageKey = stage as ForecastingStage;
    if (agentIds.length === 0) {
      stages[stageKey].enabled = false;
    }
    stages[stageKey].agents = agentIds.map((id) => createDefaultAgentConfig(id, stageKey));
  }

  return {
    stages,
    notificationLevel: 'normal',
    showIntermediateResults: true,
  };
}
