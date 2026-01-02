import { agentRegistry } from './agent.registry.js';
import { llmService } from '../external/llm.service.js';
import { renderPrompt } from '../../utils/prompt.renderer.js';
import { PROMPT_TEMPLATES } from '../../config/agents.config.js';
import type { AgentCard, AgentContribution } from '../../types/agent.types.js';
import type { ForecastContext, ForecastingStage } from '../../types/pipeline.types.js';
import { agentLogger } from '../../utils/logger.js';

export interface InvocationOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface InvocationResult {
  contribution: AgentContribution;
  latencyMs: number;
  success: boolean;
  error?: string;
}

/**
 * Agent Invoker - handles LLM invocation for agents
 */
class AgentInvoker {
  /**
   * Invoke an agent with the given context
   */
  async invoke(
    agentId: string,
    stage: ForecastingStage,
    context: ForecastContext,
    options: InvocationOptions = {}
  ): Promise<InvocationResult> {
    const startTime = Date.now();
    const agent = agentRegistry.get(agentId);

    if (!agent) {
      return this.errorResult(agentId, `Agent not found: ${agentId}`, startTime);
    }

    // Verify agent supports this stage
    if (!agent.capabilities.supportedStages.includes(stage)) {
      return this.errorResult(
        agentId,
        `Agent ${agentId} does not support stage: ${stage}`,
        startTime
      );
    }

    try {
      // Render prompts
      const { systemPrompt, userPrompt } = this.renderPrompts(agent, stage, context);

      agentLogger.debug(
        { agentId, stage, systemPromptLength: systemPrompt.length },
        'Invoking agent'
      );

      // Call LLM
      const llmResponse = await llmService.completeJSON<Record<string, unknown>>(
        systemPrompt,
        userPrompt,
        {
          temperature: options.temperature ?? agent.constraints.maxTokensOutput > 1000 ? 0.7 : 0.5,
          maxTokens: options.maxTokens ?? agent.constraints.maxTokensOutput,
          model: 'gpt-4o-mini',
        }
      );

      const latencyMs = Date.now() - startTime;

      // Build contribution
      const contribution: AgentContribution = {
        agentId,
        agentName: agent.name,
        output: llmResponse.parsed,
        confidence: this.extractConfidence(llmResponse.parsed),
        timestamp: new Date(),
        latencyMs,
      };

      agentLogger.info(
        {
          agentId,
          stage,
          latencyMs,
          tokens: llmResponse.raw.usage.totalTokens,
          confidence: contribution.confidence,
        },
        'Agent invocation complete'
      );

      return {
        contribution,
        latencyMs,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      agentLogger.error({ agentId, stage, error: errorMessage }, 'Agent invocation failed');

      return this.errorResult(agentId, errorMessage, startTime);
    }
  }

  /**
   * Invoke multiple agents in parallel
   */
  async invokeParallel(
    agentIds: string[],
    stage: ForecastingStage,
    context: ForecastContext,
    options: InvocationOptions = {}
  ): Promise<InvocationResult[]> {
    const promises = agentIds.map((agentId) =>
      this.invoke(agentId, stage, context, options)
    );

    return Promise.all(promises);
  }

  /**
   * Render system and user prompts for an agent
   */
  private renderPrompts(
    agent: AgentCard,
    stage: ForecastingStage,
    context: ForecastContext
  ): { systemPrompt: string; userPrompt: string } {
    const template = PROMPT_TEMPLATES[agent.id];

    if (!template) {
      // Fallback to generic prompt
      return {
        systemPrompt: `You are ${agent.name}. ${agent.description}. Output valid JSON only.`,
        userPrompt: this.buildGenericUserPrompt(stage, context),
      };
    }

    // Build comprehensive template context with all variables needed by enhanced prompts
    const previousOutputs = this.getPreviousOutputs(context);
    const templateContext = this.buildTemplateContext(stage, context, previousOutputs);

    return {
      systemPrompt: renderPrompt(template.systemPrompt, templateContext),
      userPrompt: renderPrompt(template.userPromptTemplate, templateContext),
    };
  }

  /**
   * Build comprehensive template context for prompt rendering
   */
  private buildTemplateContext(
    stage: ForecastingStage,
    context: ForecastContext,
    previousOutputs: Record<string, unknown>
  ): Record<string, unknown> {
    // Base context available to all stages
    const baseContext: Record<string, unknown> = {
      // Game info
      gameId: context.gameId,
      homeTeam: context.homeTeam,
      awayTeam: context.awayTeam,
      venue: context.homeTeam + ' Stadium', // Default venue name
      gameTime: context.gameTime.toISOString(),
      conference: 'Conference', // Would come from game data
      isRivalry: false, // Would come from game data

      // Rankings (would come from game data)
      homeRanking: null,
      awayRanking: null,

      // Raw context and outputs
      context,
      stage,
      previousOutputs,
    };

    // Stage-specific context
    switch (stage) {
      case 'reference_class':
        // Reference class just needs game info
        break;

      case 'base_rate':
        // Base rate needs reference classes from previous stage
        baseContext.teamForProbability = context.homeTeam;
        baseContext.referenceClasses = this.extractReferenceClasses(previousOutputs);
        break;

      case 'evidence_gathering':
        // Evidence gathering needs base rate
        baseContext.baseRate = this.extractBaseRate(previousOutputs);
        baseContext.searchQueries = [
          `${context.homeTeam} ${context.awayTeam} injury report`,
          `${context.homeTeam} ${context.awayTeam} preview`,
        ];
        break;

      case 'bayesian_update':
        // Bayesian update needs prior and evidence
        baseContext.prior = this.extractBaseRate(previousOutputs);
        baseContext.evidence = this.extractEvidence(previousOutputs);
        break;

      case 'premortem':
        // Premortem needs current probability, reasoning, and evidence
        baseContext.currentProbability = this.extractPosterior(previousOutputs);
        baseContext.reasoningSoFar = this.buildReasoningSummary(previousOutputs);
        baseContext.evidenceUsed = this.extractEvidence(previousOutputs);
        break;

      case 'synthesis':
        // Synthesis needs all previous outputs
        baseContext.baseRate = this.extractBaseRate(previousOutputs);
        baseContext.posteriorProbability = this.extractPosterior(previousOutputs);
        baseContext.premortermConcerns = this.extractConcerns(previousOutputs);
        baseContext.biasFlags = this.extractBiases(previousOutputs);
        baseContext.allEvidence = this.extractEvidence(previousOutputs);
        break;

      case 'calibration':
        // Calibration needs final probability
        baseContext.predictedProbability = context.finalProbability || context.posteriorProbability || context.baseRate || 0.5;
        break;
    }

    return baseContext;
  }

  /**
   * Extract reference classes from previous outputs
   */
  private extractReferenceClasses(outputs: Record<string, unknown>): unknown[] {
    const rcOutput = outputs['reference_class'];
    if (Array.isArray(rcOutput) && rcOutput.length > 0) {
      const firstOutput = rcOutput[0] as Record<string, unknown>;
      if (Array.isArray(firstOutput?.matches)) {
        return firstOutput.matches;
      }
    }
    return [];
  }

  /**
   * Extract base rate from previous outputs
   */
  private extractBaseRate(outputs: Record<string, unknown>): number {
    const brOutput = outputs['base_rate'];
    if (Array.isArray(brOutput) && brOutput.length > 0) {
      const firstOutput = brOutput[0] as Record<string, unknown>;
      if (typeof firstOutput?.probability === 'number') {
        return firstOutput.probability;
      }
    }
    return 0.5; // Default
  }

  /**
   * Extract evidence from previous outputs
   */
  private extractEvidence(outputs: Record<string, unknown>): unknown[] {
    const evOutput = outputs['evidence_gathering'];
    if (Array.isArray(evOutput)) {
      const allEvidence: unknown[] = [];
      for (const output of evOutput) {
        const o = output as Record<string, unknown>;
        if (Array.isArray(o?.evidenceItems)) {
          allEvidence.push(...o.evidenceItems);
        }
      }
      return allEvidence;
    }
    return [];
  }

  /**
   * Extract posterior probability from Bayesian update
   */
  private extractPosterior(outputs: Record<string, unknown>): number {
    const buOutput = outputs['bayesian_update'];
    if (Array.isArray(buOutput) && buOutput.length > 0) {
      const firstOutput = buOutput[0] as Record<string, unknown>;
      if (typeof firstOutput?.posterior === 'number') {
        return firstOutput.posterior;
      }
    }
    // Fall back to base rate
    return this.extractBaseRate(outputs);
  }

  /**
   * Extract concerns from premortem outputs
   */
  private extractConcerns(outputs: Record<string, unknown>): string[] {
    const pmOutput = outputs['premortem'];
    if (Array.isArray(pmOutput)) {
      const allConcerns: string[] = [];
      for (const output of pmOutput) {
        const o = output as Record<string, unknown>;
        if (Array.isArray(o?.concerns)) {
          allConcerns.push(...(o.concerns as string[]));
        }
      }
      return allConcerns;
    }
    return [];
  }

  /**
   * Extract biases from premortem outputs
   */
  private extractBiases(outputs: Record<string, unknown>): string[] {
    const pmOutput = outputs['premortem'];
    if (Array.isArray(pmOutput)) {
      const allBiases: string[] = [];
      for (const output of pmOutput) {
        const o = output as Record<string, unknown>;
        if (Array.isArray(o?.biases)) {
          allBiases.push(...(o.biases as string[]));
        }
      }
      return allBiases;
    }
    return [];
  }

  /**
   * Build a summary of reasoning so far
   */
  private buildReasoningSummary(outputs: Record<string, unknown>): string {
    const parts: string[] = [];

    // Base rate reasoning
    const brOutput = outputs['base_rate'];
    if (Array.isArray(brOutput) && brOutput.length > 0) {
      const o = brOutput[0] as Record<string, unknown>;
      if (o?.reasoning) {
        parts.push(`Base Rate: ${o.reasoning}`);
      }
    }

    // Bayesian update chain
    const buOutput = outputs['bayesian_update'];
    if (Array.isArray(buOutput) && buOutput.length > 0) {
      const o = buOutput[0] as Record<string, unknown>;
      if (o?.updateChain) {
        parts.push(`Bayesian Updates: ${o.updateChain}`);
      }
    }

    return parts.join('\n\n') || 'No prior reasoning available.';
  }

  /**
   * Build a generic user prompt when no template exists
   */
  private buildGenericUserPrompt(stage: ForecastingStage, context: ForecastContext): string {
    const parts = [
      `Game: ${context.awayTeam} @ ${context.homeTeam}`,
      `Game Time: ${context.gameTime.toISOString()}`,
      `Stage: ${stage}`,
    ];

    // Add previous stage outputs if available
    const outputs = this.getPreviousOutputs(context);
    if (Object.keys(outputs).length > 0) {
      parts.push(`\nPrevious Stage Outputs:\n${JSON.stringify(outputs, null, 2)}`);
    }

    parts.push('\nProvide your analysis as valid JSON.');

    return parts.join('\n');
  }

  /**
   * Get outputs from previous stages (using agentContributions)
   */
  private getPreviousOutputs(context: ForecastContext): Record<string, unknown> {
    const outputs: Record<string, unknown> = {};

    for (const [stage, contributions] of Object.entries(context.agentContributions)) {
      if (contributions && contributions.length > 0) {
        outputs[stage] = contributions.map((c) => c.output);
      }
    }

    return outputs;
  }

  /**
   * Extract confidence from LLM output
   */
  private extractConfidence(output: Record<string, unknown>): number {
    // Look for common confidence fields
    if (typeof output.confidence === 'number') {
      return output.confidence;
    }
    if (typeof output.confidenceLevel === 'number') {
      return output.confidenceLevel;
    }
    if (typeof output.certainty === 'number') {
      return output.certainty;
    }

    // Default confidence
    return 0.7;
  }

  /**
   * Create error result
   */
  private errorResult(agentId: string, error: string, startTime: number): InvocationResult {
    return {
      contribution: {
        agentId,
        agentName: 'error',
        output: { error },
        confidence: 0,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
      },
      latencyMs: Date.now() - startTime,
      success: false,
      error,
    };
  }
}

// Singleton instance
export const agentInvoker = new AgentInvoker();
