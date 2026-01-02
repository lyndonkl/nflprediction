import { contextManager } from './context.manager.js';
import { stageExecutor } from './stage.executor.js';
import { taskQueue } from './task.queue.js';
import { getPreset } from '../../config/presets.config.js';
import {
  FORECASTING_STAGES,
  type ForecastContext,
  type ForecastingStage,
  type PipelineTask,
  type AgentPreset,
  type StageResult,
} from '../../types/pipeline.types.js';
import { pipelineLogger } from '../../utils/logger.js';
import { EventEmitter } from 'events';

export interface PipelineEvents {
  stageStart: (forecastId: string, stage: ForecastingStage) => void;
  stageComplete: (forecastId: string, stage: ForecastingStage, result: StageResult) => void;
  pipelineComplete: (forecastId: string, context: ForecastContext) => void;
  pipelineError: (forecastId: string, error: string) => void;
  progressUpdate: (forecastId: string, progress: number, stage: ForecastingStage | null) => void;
}

/**
 * Pipeline Orchestrator - manages forecast pipeline execution
 */
class PipelineOrchestrator extends EventEmitter {
  private runningPipelines: Map<string, boolean> = new Map();

  /**
   * Start a new forecast pipeline
   */
  async startForecast(
    gameId: string,
    homeTeam: string,
    awayTeam: string,
    gameTime: Date,
    presetId: AgentPreset = 'balanced'
  ): Promise<{ forecastId: string; taskId: string }> {
    // Validate preset
    const preset = getPreset(presetId);
    if (!preset) {
      throw new Error(`Invalid preset: ${presetId}`);
    }

    // Create task (includes context creation)
    const task = taskQueue.createTask(gameId, homeTeam, awayTeam, gameTime, presetId);
    const priority = presetId === 'quick' ? 2 : presetId === 'balanced' ? 1 : 0;
    taskQueue.enqueue(task, priority);

    pipelineLogger.info(
      { forecastId: task.forecastId, gameId, preset: presetId, taskId: task.id },
      'Forecast pipeline started'
    );

    // Execute pipeline asynchronously
    this.executePipeline(task).catch((error) => {
      pipelineLogger.error({ forecastId: task.forecastId, error }, 'Pipeline execution failed');
      this.emit('pipelineError', task.forecastId, error.message);
    });

    return { forecastId: task.forecastId, taskId: task.id };
  }

  /**
   * Execute the full pipeline for a forecast
   */
  private async executePipeline(task: PipelineTask): Promise<void> {
    const { forecastId } = task;
    this.runningPipelines.set(forecastId, true);

    try {
      // Update task state
      taskQueue.updateTaskState(task.id, 'working');

      // Execute stages sequentially
      for (const stage of FORECASTING_STAGES) {
        // Check if pipeline was cancelled
        if (!this.runningPipelines.get(forecastId)) {
          pipelineLogger.info({ forecastId }, 'Pipeline cancelled');
          return;
        }

        // Check if stage is enabled in config
        const stageConfig = task.config.stages[stage];
        if (!stageConfig.enabled) {
          pipelineLogger.debug({ forecastId, stage }, 'Stage skipped (disabled)');
          continue;
        }

        // Emit stage start event
        this.emit('stageStart', forecastId, stage);

        // Update task current stage
        taskQueue.updateCurrentStage(task.id, stage);

        // Execute stage
        const result = await stageExecutor.execute(forecastId, stage, stageConfig);

        // Emit stage complete event
        this.emit('stageComplete', forecastId, stage, result);

        if (result.status === 'failed') {
          // Stage failed - decide whether to continue or abort
          if (this.isCriticalStage(stage)) {
            throw new Error(`Critical stage ${stage} failed: ${result.error}`);
          }
          pipelineLogger.warn({ forecastId, stage, error: result.error }, 'Non-critical stage failed, continuing');
        }

        // Emit progress update
        const progress = contextManager.getProgress(forecastId);
        this.emit('progressUpdate', forecastId, progress, stage);
      }

      // Pipeline complete
      const finalContext = contextManager.get(forecastId);
      if (finalContext) {
        taskQueue.updateTaskState(task.id, 'completed');
        taskQueue.updateCurrentStage(task.id, null);
        this.emit('pipelineComplete', forecastId, finalContext);

        pipelineLogger.info(
          { forecastId, finalProbability: finalContext.finalProbability },
          'Pipeline completed'
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      taskQueue.updateTaskState(task.id, 'failed', errorMessage);
      this.emit('pipelineError', forecastId, errorMessage);
      throw error;
    } finally {
      this.runningPipelines.delete(forecastId);
    }
  }

  /**
   * Cancel a running forecast
   */
  cancel(forecastId: string): boolean {
    if (this.runningPipelines.has(forecastId)) {
      this.runningPipelines.set(forecastId, false);
      pipelineLogger.info({ forecastId }, 'Pipeline cancellation requested');
      return true;
    }

    // Try to cancel queued task
    const task = taskQueue.getTaskByForecastId(forecastId);
    if (task) {
      return taskQueue.cancel(task.id);
    }

    return false;
  }

  /**
   * Get forecast status
   */
  getStatus(forecastId: string): {
    context: ForecastContext | undefined;
    task: PipelineTask | undefined;
    isRunning: boolean;
    progress: number;
  } {
    return {
      context: contextManager.get(forecastId),
      task: taskQueue.getTaskByForecastId(forecastId),
      isRunning: this.runningPipelines.get(forecastId) || false,
      progress: contextManager.getProgress(forecastId),
    };
  }

  /**
   * Check if a stage is critical (pipeline fails if it fails)
   */
  private isCriticalStage(stage: ForecastingStage): boolean {
    const criticalStages: ForecastingStage[] = ['base_rate', 'synthesis'];
    return criticalStages.includes(stage);
  }

  /**
   * Get all running forecast IDs
   */
  getRunningForecasts(): string[] {
    return Array.from(this.runningPipelines.entries())
      .filter(([, running]) => running)
      .map(([id]) => id);
  }

  /**
   * Get pipeline statistics
   */
  stats(): {
    running: number;
    queued: number;
    active: PipelineTask[];
  } {
    return {
      running: this.runningPipelines.size,
      queued: taskQueue.length,
      active: taskQueue.getActive(),
    };
  }
}

// Singleton instance
export const pipelineOrchestrator = new PipelineOrchestrator();
