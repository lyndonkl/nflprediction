// Shared frontend types

// Game types
export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'in_progress' | 'final';
  quarter?: string;
  clock?: string;
  gameTime: string;
  venue?: string;
  conference?: string;
  homeRanking?: number | null;
  awayRanking?: number | null;
}

export interface Odds {
  homeMoneyline: number;
  awayMoneyline: number;
  spread: number;
  overUnder: number;
  source: string;
  updatedAt: string;
}

// Forecast types
export interface ForecastContext {
  forecastId: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  currentStage: ForecastingStage;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;

  // Stage outputs
  referenceClasses: ReferenceClass[];
  baseRate: number | null;
  baseRateConfidence: [number, number] | null;

  // Fermi decomposition outputs
  fermiSubQuestions: FermiSubQuestion[];
  fermiStructuralEstimate: number | null;
  fermiReconciliation: string | null;

  evidence: EvidenceItem[];
  bayesianUpdates: BayesianUpdate[];
  posteriorProbability: number | null;
  premortermConcerns: string[];
  biasFlags: string[];
  finalProbability: number | null;
  confidenceInterval: [number, number] | null;
  recommendation: string | null;
  keyDrivers: string[];

  // Agent contributions by stage
  agentContributions: Record<ForecastingStage, AgentContribution[]>;
}

export type ForecastingStage =
  | 'reference_class'
  | 'base_rate'
  | 'fermi_decomposition'
  | 'evidence_gathering'
  | 'bayesian_update'
  | 'premortem'
  | 'synthesis'
  | 'calibration';

export interface ReferenceClass {
  description: string;
  historicalSampleSize: number;
  relevanceScore: number;
  category: string;
}

export interface EvidenceItem {
  type: string;
  source: string;
  content: string;
  relevance: number;
  direction: 'favors_home' | 'favors_away' | 'neutral';
  suggestedLikelihoodRatio?: number;
  timestamp: string;
}

export interface BayesianUpdate {
  evidenceDescription: string;
  likelihoodRatio: number;
  prior: number;
  posterior: number;
  reasoning: string;
}

// Fermi decomposition types
export interface FermiSubQuestion {
  question: string;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface FermiDecomposition {
  subQuestions: FermiSubQuestion[];
  structuralEstimate: number;
  baseRateComparison: string;
  reconciliation: string;
}

export interface AgentContribution {
  agentId: string;
  agentName: string;
  output: Record<string, unknown>;
  confidence: number;
  timestamp: string;
  latencyMs: number;
}

// Agent types
export interface AgentCard {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: AgentCapabilities;
  coherenceProfile: CoherenceProfile;
}

export interface AgentCapabilities {
  supportedStages: ForecastingStage[];
  actions: string[];
  dataAccess: string[];
}

export interface CoherenceProfile {
  frequencyTier: 'always' | 'often' | 'sometimes' | 'rarely';
  domainAffinity: string[];
  computationalCost: 'low' | 'medium' | 'high';
}

// Preset types
export interface AgentPreset {
  id: 'quick' | 'balanced' | 'deep' | 'custom';
  name: string;
  description: string;
  agentCount: number;
  estimatedTimeSeconds: number;
  recommended?: boolean;
}

// Pipeline phase types (chunked for cognitive load)
export interface PipelinePhase {
  id: string;
  name: string;
  description: string;
  stages: ForecastingStage[];
}

export const PIPELINE_PHASES: PipelinePhase[] = [
  {
    id: 'research',
    name: 'Research',
    description: 'Find historical context',
    stages: ['reference_class', 'base_rate', 'fermi_decomposition'],
  },
  {
    id: 'analysis',
    name: 'Analysis',
    description: 'Gather and process evidence',
    stages: ['evidence_gathering', 'bayesian_update'],
  },
  {
    id: 'validation',
    name: 'Validation',
    description: 'Challenge assumptions',
    stages: ['premortem'],
  },
  {
    id: 'output',
    name: 'Output',
    description: 'Generate final estimate',
    stages: ['synthesis', 'calibration'],
  },
];

export const STAGE_INFO: Record<ForecastingStage, { name: string; shortName: string; description: string }> = {
  reference_class: {
    name: 'Reference Class',
    shortName: 'RefClass',
    description: 'Find similar historical matchups',
  },
  base_rate: {
    name: 'Base Rate',
    shortName: 'BaseRate',
    description: 'Calculate historical win probability',
  },
  fermi_decomposition: {
    name: 'Fermi Decomposition',
    shortName: 'Fermi',
    description: 'Break into sub-questions',
  },
  evidence_gathering: {
    name: 'Evidence Gathering',
    shortName: 'Evidence',
    description: 'Collect current game-specific factors',
  },
  bayesian_update: {
    name: 'Bayesian Update',
    shortName: 'Bayesian',
    description: 'Update probability with evidence',
  },
  premortem: {
    name: 'Premortem',
    shortName: 'Premortem',
    description: 'Challenge assumptions and identify biases',
  },
  synthesis: {
    name: 'Synthesis',
    shortName: 'Synthesis',
    description: 'Combine all inputs into final estimate',
  },
  calibration: {
    name: 'Calibration',
    shortName: 'Calibrate',
    description: 'Adjust for historical accuracy',
  },
};

// WebSocket message types
export type WSMessage =
  | { type: 'connected'; clientId: string }
  | { type: 'subscribed'; forecastId: string }
  | { type: 'unsubscribed'; forecastId: string }
  | { type: 'stage_start'; forecastId: string; stage: ForecastingStage }
  | { type: 'stage_complete'; forecastId: string; stage: ForecastingStage; outputs: unknown }
  | { type: 'agent_output'; forecastId: string; stage: ForecastingStage; agentId: string; output: unknown }
  | { type: 'pipeline_complete'; forecastId: string; context: ForecastContext }
  | { type: 'pipeline_error'; forecastId: string; error: string }
  | { type: 'progress_update'; forecastId: string; progress: number; stage: ForecastingStage }
  | { type: 'pong' };

// Probability step for journey visualization
export interface ProbabilityStep {
  probability: number;
  source: ForecastingStage;
  agent: string;
  summary: string;
  detail?: string;
  likelihoodRatio?: number;
  direction: 'up' | 'down' | 'neutral';
}
