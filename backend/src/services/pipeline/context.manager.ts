import { memoryStore } from '../storage/memory.store.js';
import {
  createForecastContext,
  type ForecastContext,
  type ForecastingStage,
  FORECASTING_STAGES,
} from '../../types/pipeline.types.js';
import type { AgentContribution } from '../../types/agent.types.js';
import type { ReferenceClassMatch, EvidenceItem, BayesianUpdate } from '../../types/forecast.types.js';
import { pipelineLogger } from '../../utils/logger.js';

/**
 * Context Manager - manages ForecastContext lifecycle
 */
class ContextManager {
  /**
   * Create a new forecast context
   */
  create(
    forecastId: string,
    gameId: string,
    homeTeam: string,
    awayTeam: string,
    gameTime: Date
  ): ForecastContext {
    const context = createForecastContext(
      forecastId,
      gameId,
      homeTeam,
      awayTeam,
      gameTime
    );

    memoryStore.setContext(context);
    pipelineLogger.info({ forecastId, gameId }, 'Forecast context created');

    return context;
  }

  /**
   * Get a forecast context
   */
  get(forecastId: string): ForecastContext | undefined {
    return memoryStore.getContext(forecastId);
  }

  /**
   * Add agent contribution to a stage
   */
  addContribution(
    forecastId: string,
    stage: ForecastingStage,
    contribution: AgentContribution
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) {
      pipelineLogger.warn({ forecastId }, 'Context not found for contribution');
      return undefined;
    }

    context.agentContributions[stage].push(contribution);
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    pipelineLogger.debug({ forecastId, stage, agentId: contribution.agentId }, 'Contribution added');

    return context;
  }

  /**
   * Update reference class results
   */
  updateReferenceClasses(
    forecastId: string,
    matches: ReferenceClassMatch[]
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.referenceClasses = matches;
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Update base rate
   */
  updateBaseRate(
    forecastId: string,
    baseRate: number,
    confidence: [number, number],
    sampleSize: number
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.baseRate = baseRate;
    context.baseRateConfidence = confidence;
    context.baseRateSampleSize = sampleSize;
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Update Fermi decomposition results
   */
  updateFermiDecomposition(
    forecastId: string,
    subQuestions: Array<{ question: string; probability: number; confidence: number; reasoning: string }>,
    structuralEstimate: number | null,
    reconciliation: string | null
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.fermiSubQuestions = subQuestions;
    context.fermiStructuralEstimate = structuralEstimate;
    context.fermiReconciliation = reconciliation;
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Add evidence items
   */
  addEvidence(
    forecastId: string,
    evidence: EvidenceItem[],
    summary?: string
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.evidence.push(...evidence);
    if (summary) {
      context.evidenceSummary = summary;
    }
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Add Bayesian update
   */
  addBayesianUpdate(
    forecastId: string,
    update: BayesianUpdate
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.bayesianUpdates.push(update);
    context.posteriorProbability = update.posterior;
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Add premortem concerns and biases
   */
  addPremortemResults(
    forecastId: string,
    concerns: string[],
    biases: string[],
    adjustment?: number
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.premortermConcerns.push(...concerns);
    context.biasFlags.push(...biases);
    if (adjustment !== undefined) {
      context.confidenceAdjustment = adjustment;
    }
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Set final synthesis results
   */
  finalize(
    forecastId: string,
    finalProbability: number,
    confidenceInterval: [number, number],
    recommendation: string,
    keyDrivers: string[]
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.finalProbability = finalProbability;
    context.confidenceInterval = confidenceInterval;
    context.recommendation = recommendation;
    context.keyDrivers = keyDrivers;
    context.updatedAt = new Date();

    memoryStore.setContext(context);

    pipelineLogger.info(
      { forecastId, finalProbability, recommendation },
      'Forecast finalized'
    );

    return context;
  }

  /**
   * Update current stage
   */
  setCurrentStage(
    forecastId: string,
    stage: ForecastingStage
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.currentStage = stage;
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Record processing time for a stage
   */
  recordProcessingTime(
    forecastId: string,
    stage: ForecastingStage,
    timeMs: number
  ): ForecastContext | undefined {
    const context = this.get(forecastId);
    if (!context) return undefined;

    context.processingTimes[stage] = timeMs;
    context.updatedAt = new Date();

    memoryStore.setContext(context);
    return context;
  }

  /**
   * Calculate overall progress percentage
   */
  getProgress(forecastId: string): number {
    const context = this.get(forecastId);
    if (!context) return 0;

    const currentIndex = FORECASTING_STAGES.indexOf(context.currentStage);
    if (currentIndex === -1) return 0;

    // Add partial progress for current stage based on contributions
    const stageContributions = context.agentContributions[context.currentStage].length;
    const partialProgress = stageContributions > 0 ? 0.5 : 0;

    return Math.round(((currentIndex + partialProgress) / FORECASTING_STAGES.length) * 100);
  }

  /**
   * Delete a forecast context
   */
  delete(forecastId: string): boolean {
    return memoryStore.deleteContext(forecastId);
  }

  /**
   * Get all active forecasts (not finalized)
   */
  getActive(): ForecastContext[] {
    return memoryStore.getAllContexts().filter(
      (ctx) => ctx.finalProbability === null
    );
  }
}

// Singleton instance
export const contextManager = new ContextManager();
