import { wsManager } from './ws.manager.js';
import { pipelineOrchestrator } from '../services/pipeline/pipeline.orchestrator.js';
import type { ForecastingStage, ForecastContext, StageResult } from '../types/pipeline.types.js';
import { wsLogger } from '../utils/logger.js';

/**
 * WebSocket Broadcaster - connects pipeline events to WebSocket clients
 */
class WSBroadcaster {
  private initialized = false;

  /**
   * Initialize broadcaster by subscribing to pipeline events
   */
  initialize(): void {
    if (this.initialized) return;

    // Subscribe to pipeline events
    pipelineOrchestrator.on('stageStart', this.onStageStart.bind(this));
    pipelineOrchestrator.on('stageComplete', this.onStageComplete.bind(this));
    pipelineOrchestrator.on('pipelineComplete', this.onPipelineComplete.bind(this));
    pipelineOrchestrator.on('pipelineError', this.onPipelineError.bind(this));
    pipelineOrchestrator.on('progressUpdate', this.onProgressUpdate.bind(this));

    this.initialized = true;
    wsLogger.info('WebSocket broadcaster initialized');
  }

  /**
   * Handle stage start event
   */
  private onStageStart(forecastId: string, stage: ForecastingStage): void {
    wsManager.broadcastToForecast(forecastId, {
      type: 'stage_start',
      forecastId,
      stage,
      timestamp: new Date(),
    });
  }

  /**
   * Handle stage complete event
   */
  private onStageComplete(
    forecastId: string,
    stage: ForecastingStage,
    result: StageResult
  ): void {
    wsManager.broadcastToForecast(forecastId, {
      type: 'stage_complete',
      forecastId,
      stage,
      status: result.status,
      output: result.output,
      processingTimeMs: result.processingTimeMs,
      timestamp: new Date(),
    });
  }

  /**
   * Handle pipeline complete event
   */
  private onPipelineComplete(forecastId: string, context: ForecastContext): void {
    wsManager.broadcastToForecast(forecastId, {
      type: 'forecast_complete',
      forecastId,
      result: {
        finalProbability: context.finalProbability,
        confidenceInterval: context.confidenceInterval,
        recommendation: context.recommendation,
        keyDrivers: context.keyDrivers,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Handle pipeline error event
   */
  private onPipelineError(forecastId: string, error: string): void {
    wsManager.broadcastToForecast(forecastId, {
      type: 'error',
      forecastId,
      code: 'PIPELINE_ERROR',
      message: error,
      timestamp: new Date(),
    });
  }

  /**
   * Handle progress update event
   */
  private onProgressUpdate(
    forecastId: string,
    progress: number,
    stage: ForecastingStage | null
  ): void {
    wsManager.broadcastToForecast(forecastId, {
      type: 'progress_update',
      forecastId,
      progress,
      currentStage: stage,
      timestamp: new Date(),
    });
  }

  /**
   * Send a custom message to all subscribers of a forecast
   */
  sendToForecast(forecastId: string, type: string, data: unknown): void {
    wsManager.broadcastToForecast(forecastId, {
      type: type as 'progress_update',
      forecastId,
      ...data as Record<string, unknown>,
      timestamp: new Date(),
    });
  }
}

// Singleton instance
export const wsBroadcaster = new WSBroadcaster();
