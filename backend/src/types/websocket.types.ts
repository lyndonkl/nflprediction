import type { ForecastingStage } from './pipeline.types.js';

// ============================================
// Client -> Server Messages
// ============================================

export type WSClientMessage =
  | { type: 'subscribe'; forecastId: string }
  | { type: 'unsubscribe'; forecastId: string }
  | { type: 'subscribe_game'; gameId: string }
  | { type: 'unsubscribe_game'; gameId: string }
  | { type: 'set_notification_level'; forecastId: string; level: NotificationLevel }
  | { type: 'ping' };

// ============================================
// Server -> Client Messages
// ============================================

export type WSServerMessage =
  | WSConnectedMessage
  | WSStageStartMessage
  | WSStageCompleteMessage
  | WSAgentOutputMessage
  | WSProgressUpdateMessage
  | WSForecastCompleteMessage
  | WSErrorMessage
  | WSGameUpdateMessage
  | WSSubscribedMessage
  | WSUnsubscribedMessage
  | WSPongMessage;

export interface WSConnectedMessage {
  type: 'connected';
  clientId: string;
  timestamp: Date;
}

export interface WSStageStartMessage {
  type: 'stage_start';
  forecastId: string;
  stage: ForecastingStage;
  timestamp: Date;
}

export interface WSStageCompleteMessage {
  type: 'stage_complete';
  forecastId: string;
  stage: ForecastingStage;
  status?: 'success' | 'partial' | 'failed';
  output: unknown;
  contextUpdate?: Record<string, unknown>;
  processingTimeMs?: number;
  timestamp: Date;
}

export interface WSAgentOutputMessage {
  type: 'agent_output';
  forecastId: string;
  stage: ForecastingStage;
  agentId: string;
  agentName: string;
  output: unknown;
  confidence: number;
  timestamp: Date;
}

export interface WSProgressUpdateMessage {
  type: 'progress_update';
  forecastId: string;
  currentStage?: ForecastingStage | null;
  progress?: number;
  overallProgress?: number;
  stagesCompleted?: number;
  totalStages?: number;
  workingAgents?: number;
  estimatedTimeRemainingMs?: number;
  timestamp: Date;
}

export interface WSForecastCompleteMessage {
  type: 'forecast_complete';
  forecastId: string;
  result: {
    finalProbability: number | null;
    confidenceInterval: [number, number] | null;
    recommendation: string | null;
    keyDrivers: string[];
  };
  timestamp: Date;
}

export interface WSErrorMessage {
  type: 'error';
  forecastId?: string;
  code: string;
  message: string;
  stage?: ForecastingStage;
  agentId?: string;
  timestamp: Date;
}

export interface WSGameUpdateMessage {
  type: 'game_update';
  gameId: string;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  status: string;
  timestamp: Date;
}

export interface WSSubscribedMessage {
  type: 'subscribed';
  forecastId?: string;
  gameId?: string;
  timestamp: Date;
}

export interface WSUnsubscribedMessage {
  type: 'unsubscribed';
  forecastId?: string;
  gameId?: string;
  timestamp: Date;
}

export interface WSPongMessage {
  type: 'pong';
  timestamp: Date;
}

// ============================================
// Notification Level
// ============================================

export type NotificationLevel = 'quiet' | 'normal' | 'detailed';

export interface NotificationPreferences {
  level: NotificationLevel;
  soundEnabled: boolean;
  showIntermediateResults: boolean;
}

// ============================================
// Ambient Status (for header indicator)
// ============================================

export interface AmbientAgentStatus {
  totalAgents: number;
  workingAgents: number;
  completedAgents: number;
  errorAgents: number;
  currentPhase: string;
  overallProgress: number;
  state: 'idle' | 'working' | 'complete' | 'error';
}
