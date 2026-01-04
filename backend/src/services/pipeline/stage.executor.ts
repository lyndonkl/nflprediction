import { agentInvoker, type InvocationResult } from '../agents/agent.invoker.js';
import { coherenceRouter } from '../agents/coherence.router.js';
import { contextManager } from './context.manager.js';
import type { ForecastContext, ForecastingStage, StageConfig, StageResult } from '../../types/pipeline.types.js';
import type { AgentContribution } from '../../types/agent.types.js';
import type { EvidenceItem } from '../../types/forecast.types.js';
import { pipelineLogger } from '../../utils/logger.js';

/**
 * Stage Executor - executes a single forecasting stage
 */
class StageExecutor {
  /**
   * Execute a stage with configured agents
   */
  async execute(
    forecastId: string,
    stage: ForecastingStage,
    stageConfig: StageConfig
  ): Promise<StageResult> {
    const startTime = Date.now();

    const context = contextManager.get(forecastId);
    if (!context) {
      return this.errorResult(stage, `Context not found: ${forecastId}`, startTime);
    }

    pipelineLogger.info({ forecastId, stage }, 'Executing stage');

    try {
      // Select agents to use
      const agentIds = this.selectAgents(stage, context, stageConfig);

      if (agentIds.length === 0) {
        return this.errorResult(stage, `No agents available for stage: ${stage}`, startTime);
      }

      // Update context with current stage
      contextManager.setCurrentStage(forecastId, stage);

      // Invoke agents (parallel if configured)
      const results = stageConfig.parallelExecution
        ? await agentInvoker.invokeParallel(agentIds, stage, context)
        : await this.invokeSequential(agentIds, stage, context);

      // Collect successful contributions
      const contributions: AgentContribution[] = [];
      for (const result of results) {
        if (result.success) {
          contributions.push(result.contribution);
          contextManager.addContribution(forecastId, stage, result.contribution);
        }
      }

      if (contributions.length === 0) {
        const errors = results.filter((r) => !r.success).map((r) => r.error);
        return this.errorResult(
          stage,
          `All agents failed: ${errors.join(', ')}`,
          startTime,
          contributions
        );
      }

      // Aggregate output from all contributions
      const aggregatedOutput = this.aggregateOutputs(stage, contributions);

      // Apply stage-specific updates to context
      await this.applyStageUpdates(forecastId, stage, aggregatedOutput);

      const processingTimeMs = Date.now() - startTime;
      contextManager.recordProcessingTime(forecastId, stage, processingTimeMs);

      pipelineLogger.info(
        { forecastId, stage, processingTimeMs, agentCount: contributions.length },
        'Stage execution complete'
      );

      return {
        stage,
        status: contributions.length === agentIds.length ? 'success' : 'partial',
        output: aggregatedOutput,
        agentResponses: contributions,
        processingTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      pipelineLogger.error({ forecastId, stage, error: errorMessage }, 'Stage execution failed');

      return this.errorResult(stage, errorMessage, startTime);
    }
  }

  /**
   * Invoke agents sequentially
   */
  private async invokeSequential(
    agentIds: string[],
    stage: ForecastingStage,
    context: ForecastContext
  ): Promise<InvocationResult[]> {
    const results: InvocationResult[] = [];
    for (const agentId of agentIds) {
      const result = await agentInvoker.invoke(agentId, stage, context);
      results.push(result);
    }
    return results;
  }

  /**
   * Select which agents to use for a stage
   */
  private selectAgents(
    stage: ForecastingStage,
    context: ForecastContext,
    stageConfig: StageConfig
  ): string[] {
    // If specific agents configured, use their IDs
    if (stageConfig.agents.length > 0) {
      return stageConfig.agents
        .filter((a) => a.enabled)
        .map((a) => a.agentId);
    }

    // Otherwise, use coherence router to select best agents
    return coherenceRouter.selectAgents(stage, context, 2);
  }

  /**
   * Aggregate outputs from multiple agent contributions
   */
  private aggregateOutputs(
    stage: ForecastingStage,
    contributions: AgentContribution[]
  ): unknown {
    if (contributions.length === 1) {
      return contributions[0].output;
    }

    // Merge outputs based on stage type
    const outputs = contributions.map((c) => c.output as Record<string, unknown>);
    const confidences = contributions.map((c) => c.confidence);

    switch (stage) {
      case 'evidence_gathering':
        return this.mergeEvidenceOutputs(outputs);

      case 'premortem':
        return this.mergePremortemOutputs(outputs);

      case 'base_rate':
      case 'bayesian_update':
        return this.mergeNumericOutputs(outputs, confidences);

      default:
        // Use highest confidence output
        const bestIdx = confidences.indexOf(Math.max(...confidences));
        return outputs[bestIdx];
    }
  }

  /**
   * Apply stage-specific updates to context
   */
  private async applyStageUpdates(
    forecastId: string,
    stage: ForecastingStage,
    output: unknown
  ): Promise<void> {
    const record = output as Record<string, unknown>;

    switch (stage) {
      case 'reference_class':
        if (Array.isArray(record.matches)) {
          contextManager.updateReferenceClasses(forecastId, record.matches);
        }
        break;

      case 'base_rate':
        // Agent returns 'probability', not 'baseRate'
        const baseRateValue = (record.probability as number) ?? (record.baseRate as number);
        if (typeof baseRateValue === 'number') {
          contextManager.updateBaseRate(
            forecastId,
            baseRateValue,
            (record.confidenceInterval as [number, number]) || [baseRateValue - 0.1, baseRateValue + 0.1],
            (record.sampleSize as number) || 0
          );
        }
        break;

      case 'fermi_decomposition':
        // Agent returns subQuestions, structuralEstimate, reconciliation
        if (Array.isArray(record.subQuestions)) {
          contextManager.updateFermiDecomposition(
            forecastId,
            record.subQuestions as Array<{ question: string; probability: number; confidence: number; reasoning: string }>,
            (record.structuralEstimate as number) ?? null,
            (record.reconciliation as string) ?? (record.baseRateComparison as string) ?? null
          );
        }
        break;

      case 'evidence_gathering':
        // Agent returns 'evidenceItems', not 'evidence'
        const evidenceArray = (record.evidenceItems as EvidenceItem[]) ?? (record.evidence as EvidenceItem[]);
        if (Array.isArray(evidenceArray)) {
          contextManager.addEvidence(
            forecastId,
            evidenceArray,
            record.summary as string | undefined
          );
        }
        break;

      case 'bayesian_update':
        // Handle array format: { updates: [...] }
        if (Array.isArray(record.updates)) {
          for (const update of record.updates as Array<Record<string, unknown>>) {
            if (update.likelihoodRatio && update.posterior) {
              contextManager.addBayesianUpdate(forecastId, {
                evidenceDescription: (update.evidenceDescription as string) || 'Evidence update',
                likelihoodRatio: update.likelihoodRatio as number,
                prior: (update.prior as number) || 0.5,
                posterior: update.posterior as number,
                reasoning: (update.reasoning as string) || '',
              });
            }
          }
        }
        // Fallback: handle single update format: { likelihoodRatio, posterior, ... }
        else if (record.likelihoodRatio && record.posterior) {
          contextManager.addBayesianUpdate(forecastId, {
            evidenceDescription: record.evidenceDescription as string || record.factor as string || 'unknown',
            likelihoodRatio: record.likelihoodRatio as number,
            prior: record.prior as number || 0.5,
            posterior: record.posterior as number,
            reasoning: record.reasoning as string || '',
          });
        }
        break;

      case 'premortem':
        // Agent returns 'concerns', not 'risks'
        const concerns = (record.concerns as string[]) ?? (record.risks as string[]) ?? [];
        contextManager.addPremortemResults(
          forecastId,
          concerns,
          (record.biases as string[]) || [],
          record.confidenceAdjustment as number | undefined
        );
        break;

      case 'synthesis':
        // Handle finalProbability as number or string
        let finalProb: number | undefined;
        if (typeof record.finalProbability === 'number') {
          finalProb = record.finalProbability;
        } else if (typeof record.finalProbability === 'string') {
          finalProb = parseFloat(record.finalProbability);
        }

        if (finalProb !== undefined && !isNaN(finalProb)) {
          // Clamp probability to valid range [0, 1]
          finalProb = Math.max(0, Math.min(1, finalProb));
          contextManager.finalize(
            forecastId,
            finalProb,
            (record.confidenceInterval as [number, number]) || [finalProb - 0.1, finalProb + 0.1],
            (record.recommendation as string) || 'neutral',
            (record.keyDrivers as string[]) || []
          );
        } else {
          pipelineLogger.warn(
            { forecastId, finalProbability: record.finalProbability },
            'Synthesis stage missing or invalid finalProbability'
          );
        }
        break;
    }
  }

  /**
   * Merge evidence gathering outputs
   */
  private mergeEvidenceOutputs(outputs: Record<string, unknown>[]): unknown {
    const allEvidence: unknown[] = [];
    const allSources: unknown[] = [];

    for (const output of outputs) {
      if (Array.isArray(output.evidence)) {
        allEvidence.push(...output.evidence);
      }
      if (Array.isArray(output.sources)) {
        allSources.push(...output.sources);
      }
    }

    return {
      evidence: allEvidence,
      sources: [...new Set(allSources.map((s) => JSON.stringify(s)))].map((s) => JSON.parse(s)),
      summary: outputs[0]?.summary || 'Combined evidence from multiple agents',
    };
  }

  /**
   * Merge premortem outputs
   */
  private mergePremortemOutputs(outputs: Record<string, unknown>[]): unknown {
    const allRisks: unknown[] = [];
    const allBiases: unknown[] = [];

    for (const output of outputs) {
      if (Array.isArray(output.risks)) {
        allRisks.push(...output.risks);
      }
      if (Array.isArray(output.biases)) {
        allBiases.push(...output.biases);
      }
    }

    return {
      risks: allRisks,
      biases: allBiases,
      overallAssessment: outputs[0]?.overallAssessment || 'Combined assessment',
    };
  }

  /**
   * Merge numeric outputs with weighted averaging
   */
  private mergeNumericOutputs(
    outputs: Record<string, unknown>[],
    confidences: number[]
  ): unknown {
    const result: Record<string, unknown> = { ...outputs[0] };

    // Weight by confidence
    const totalConfidence = confidences.reduce((a, b) => a + b, 0);
    const weights = confidences.map((c) => c / totalConfidence);

    // Average numeric fields
    const numericFields = ['probability', 'baseRate', 'posterior', 'likelihoodRatio'];
    for (const field of numericFields) {
      const values = outputs.map((o) => o[field]).filter((v) => typeof v === 'number') as number[];
      if (values.length > 0) {
        result[field] = values.reduce((sum, v, i) => sum + v * (weights[i] || 1 / values.length), 0);
      }
    }

    return result;
  }

  /**
   * Create error result
   */
  private errorResult(
    stage: ForecastingStage,
    error: string,
    startTime: number,
    agentResponses: AgentContribution[] = []
  ): StageResult {
    return {
      stage,
      status: 'failed',
      output: { error },
      agentResponses,
      processingTimeMs: Date.now() - startTime,
      error,
    };
  }
}

// Singleton instance
export const stageExecutor = new StageExecutor();
