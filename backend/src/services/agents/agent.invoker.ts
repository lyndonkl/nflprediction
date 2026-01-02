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

    // Build template context
    const templateContext = {
      game: {
        homeTeam: context.homeTeam,
        awayTeam: context.awayTeam,
        gameTime: context.gameTime.toISOString(),
      },
      context,
      stage,
      previousOutputs: this.getPreviousOutputs(context),
    };

    return {
      systemPrompt: renderPrompt(template.systemPrompt, templateContext),
      userPrompt: renderPrompt(template.userPromptTemplate, templateContext),
    };
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
