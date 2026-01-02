import type { UserAgentConfig, AgentContribution } from './agent.types.js';
import type {
  ReferenceClassMatch,
  EvidenceItem,
  BayesianUpdate,
} from './forecast.types.js';

/**
 * The 7 forecasting stages in the superforecaster pipeline
 */
export type ForecastingStage =
  | 'reference_class'
  | 'base_rate'
  | 'evidence_gathering'
  | 'bayesian_update'
  | 'premortem'
  | 'synthesis'
  | 'calibration';

/**
 * All stages in execution order
 */
export const FORECASTING_STAGES: ForecastingStage[] = [
  'reference_class',
  'base_rate',
  'evidence_gathering',
  'bayesian_update',
  'premortem',
  'synthesis',
  'calibration',
];

/**
 * Stage metadata for UI display
 */
export const STAGE_INFO: Record<ForecastingStage, { name: string; shortName: string; description: string }> = {
  reference_class: { name: 'Reference Class', shortName: 'RefClass', description: 'Find similar historical matchups' },
  base_rate: { name: 'Base Rate', shortName: 'BaseRate', description: 'Calculate starting probability' },
  evidence_gathering: { name: 'Evidence Gathering', shortName: 'Evidence', description: 'Gather current information' },
  bayesian_update: { name: 'Bayesian Update', shortName: 'Bayesian', description: 'Update probability with evidence' },
  premortem: { name: 'Premortem', shortName: 'Premortem', description: 'Challenge assumptions' },
  synthesis: { name: 'Synthesis', shortName: 'Synthesis', description: 'Generate final estimate' },
  calibration: { name: 'Calibration', shortName: 'Calibrate', description: 'Log for accuracy tracking' },
};

/**
 * Task lifecycle states (A2A-inspired)
 */
export type TaskState =
  | 'submitted'
  | 'queued'
  | 'working'
  | 'completed'
  | 'failed'
  | 'input_required'
  | 'cancelled';

/**
 * Pipeline execution task
 */
export interface PipelineTask {
  id: string;
  forecastId: string;
  gameId: string;
  state: TaskState;
  currentStage: ForecastingStage | null;
  preset: AgentPreset;
  config: PipelineConfig;
  context: ForecastContext;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  stages: Record<ForecastingStage, StageConfig>;
  notificationLevel: 'quiet' | 'normal' | 'detailed';
  showIntermediateResults: boolean;
}

/**
 * Stage configuration
 */
export interface StageConfig {
  enabled: boolean;
  parallelExecution: boolean;
  agents: UserAgentConfig[];
}

/**
 * Agent preset names
 */
export type AgentPreset = 'quick' | 'balanced' | 'deep' | 'custom';

/**
 * Preset definition
 */
export interface PresetDefinition {
  id: AgentPreset;
  name: string;
  description: string;
  recommended?: boolean;
  agentCount: number;
  estimatedTimeSeconds: number;
  stages: Record<ForecastingStage, string[]>; // agent IDs per stage
}

/**
 * Stage execution result
 */
export interface StageResult {
  stage: ForecastingStage;
  status: 'success' | 'partial' | 'failed';
  output: unknown;
  agentResponses: AgentContribution[];
  processingTimeMs: number;
  error?: string;
}

/**
 * Extended ForecastContext - accumulates data through pipeline
 */
export interface ForecastContext {
  // Identity
  forecastId: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: Date;

  // Current state
  currentStage: ForecastingStage;
  createdAt: Date;
  updatedAt: Date;

  // Stage outputs (accumulated)
  referenceClasses: ReferenceClassMatch[];
  baseRate: number | null;
  baseRateConfidence: [number, number] | null;
  baseRateSampleSize: number | null;

  evidence: EvidenceItem[];
  evidenceSummary: string | null;

  bayesianUpdates: BayesianUpdate[];
  posteriorProbability: number | null;

  premortermConcerns: string[];
  biasFlags: string[];
  confidenceAdjustment: number | null;

  finalProbability: number | null;
  confidenceInterval: [number, number] | null;
  recommendation: string | null;
  keyDrivers: string[];

  // Metadata
  agentContributions: Record<ForecastingStage, AgentContribution[]>;
  processingTimes: Record<ForecastingStage, number>;
}

/**
 * Create an empty ForecastContext
 */
export function createForecastContext(
  forecastId: string,
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  gameTime: Date
): ForecastContext {
  const now = new Date();
  return {
    forecastId,
    gameId,
    homeTeam,
    awayTeam,
    gameTime,
    currentStage: 'reference_class',
    createdAt: now,
    updatedAt: now,
    referenceClasses: [],
    baseRate: null,
    baseRateConfidence: null,
    baseRateSampleSize: null,
    evidence: [],
    evidenceSummary: null,
    bayesianUpdates: [],
    posteriorProbability: null,
    premortermConcerns: [],
    biasFlags: [],
    confidenceAdjustment: null,
    finalProbability: null,
    confidenceInterval: null,
    recommendation: null,
    keyDrivers: [],
    agentContributions: {
      reference_class: [],
      base_rate: [],
      evidence_gathering: [],
      bayesian_update: [],
      premortem: [],
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
  };
}
