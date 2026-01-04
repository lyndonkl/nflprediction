import { agentRegistry } from './agent.registry.js';
import { llmService } from '../external/llm.service.js';
import { renderPrompt } from '../../utils/prompt.renderer.js';
import { PROMPT_TEMPLATES } from '../../config/agents.config.js';
import { config } from '../../config/index.js';
import type { AgentCard, AgentContribution, WebSearchSource, WebSearchCitation } from '../../types/agent.types.js';
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
      // Check if agent uses web search
      const usesWebSearch = this.usesWebSearch(agent);

      if (usesWebSearch && config.webSearch.enabled) {
        // Use Responses API with web search for evidence gathering
        return await this.invokeWithWebSearch(agent, stage, context, startTime);
      }

      // Render prompts
      const { systemPrompt, userPrompt } = this.renderPrompts(agent, stage, context);

      agentLogger.debug(
        { agentId, stage, systemPromptLength: systemPrompt.length },
        'Invoking agent'
      );

      // Call LLM with o4-mini model
      const llmResponse = await llmService.completeJSON<Record<string, unknown>>(
        systemPrompt,
        userPrompt,
        {
          temperature: options.temperature ?? agent.constraints.maxTokensOutput > 1000 ? 0.7 : 0.5,
          maxTokens: options.maxTokens ?? agent.constraints.maxTokensOutput,
          model: config.llm.model,
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

      case 'fermi_decomposition':
        // Fermi decomposition needs base rate and reference classes
        baseContext.baseRate = this.extractBaseRate(previousOutputs);
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
        // Include Fermi decomposition outputs for reconciliation
        baseContext.fermiSubQuestions = this.extractFermiSubQuestions(previousOutputs);
        baseContext.fermiStructuralEstimate = this.extractFermiStructuralEstimate(previousOutputs);
        baseContext.fermiReconciliation = this.extractFermiReconciliation(previousOutputs);
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
   * Extract Fermi sub-questions from previous outputs
   */
  private extractFermiSubQuestions(outputs: Record<string, unknown>): unknown[] {
    const fermiOutput = outputs['fermi_decomposition'];
    if (Array.isArray(fermiOutput) && fermiOutput.length > 0) {
      const firstOutput = fermiOutput[0] as Record<string, unknown>;
      if (Array.isArray(firstOutput?.subQuestions)) {
        return firstOutput.subQuestions;
      }
    }
    return [];
  }

  /**
   * Extract Fermi structural estimate from previous outputs
   */
  private extractFermiStructuralEstimate(outputs: Record<string, unknown>): number | null {
    const fermiOutput = outputs['fermi_decomposition'];
    if (Array.isArray(fermiOutput) && fermiOutput.length > 0) {
      const firstOutput = fermiOutput[0] as Record<string, unknown>;
      if (typeof firstOutput?.structuralEstimate === 'number') {
        return firstOutput.structuralEstimate;
      }
    }
    return null;
  }

  /**
   * Extract Fermi reconciliation text from previous outputs
   */
  private extractFermiReconciliation(outputs: Record<string, unknown>): string | null {
    const fermiOutput = outputs['fermi_decomposition'];
    if (Array.isArray(fermiOutput) && fermiOutput.length > 0) {
      const firstOutput = fermiOutput[0] as Record<string, unknown>;
      if (typeof firstOutput?.reconciliation === 'string') {
        return firstOutput.reconciliation;
      }
    }
    return null;
  }

  /**
   * Clamp likelihood ratio to prevent overconfident updates
   * Sports outcomes have high variance, so we bound LRs to 0.5-2.0
   * This means any single piece of evidence can at most double/halve the odds
   */
  clampLikelihoodRatio(lr: number, min: number = 0.5, max: number = 2.0): number {
    const clamped = Math.max(min, Math.min(max, lr));
    if (clamped !== lr) {
      agentLogger.debug(
        { original: lr, clamped, min, max },
        'Likelihood ratio clamped to bounds'
      );
    }
    return clamped;
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
   * Check if an agent uses web search
   */
  private usesWebSearch(agent: AgentCard): boolean {
    return agent.capabilities.actions.includes('web_search');
  }

  /**
   * Invoke an agent with web search using Responses API
   */
  private async invokeWithWebSearch(
    agent: AgentCard,
    stage: ForecastingStage,
    context: ForecastContext,
    startTime: number
  ): Promise<InvocationResult> {
    const agentId = agent.id;

    // Build the web search query for the game
    const searchInput = this.buildWebSearchQuery(agent, context);

    agentLogger.debug(
      { agentId, stage, inputLength: searchInput.length },
      'Invoking agent with web search'
    );

    try {
      // Call the Responses API with web search
      const response = await llmService.completeWithWebSearch(searchInput, {
        model: 'o4-mini',
        searchContextSize: config.webSearch.searchContextSize,
        allowedDomains: config.webSearch.allowedDomains,
        userLocation: config.webSearch.userLocation,
      });

      const latencyMs = Date.now() - startTime;

      // Parse the output as JSON
      let parsedOutput: Record<string, unknown>;
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.output_text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedOutput = JSON.parse(jsonMatch[0]);
        } else {
          // Wrap text output in expected format based on agent type
          parsedOutput = this.buildFallbackOutput(agent, response.output_text);
        }
      } catch {
        // Wrap text output in expected format based on agent type
        parsedOutput = this.buildFallbackOutput(agent, response.output_text);
      }

      // Build contribution with sources and citations
      const contribution: AgentContribution = {
        agentId,
        agentName: agent.name,
        output: parsedOutput,
        confidence: this.extractConfidence(parsedOutput),
        timestamp: new Date(),
        latencyMs,
        sources: response.sources,
        citations: response.citations,
      };

      agentLogger.info(
        {
          agentId,
          stage,
          latencyMs,
          sourcesCount: response.sources.length,
          citationsCount: response.citations.length,
          confidence: contribution.confidence,
        },
        'Web search agent invocation complete'
      );

      return {
        contribution,
        latencyMs,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      agentLogger.error({ agentId, stage, error: errorMessage }, 'Web search agent invocation failed');
      return this.errorResult(agentId, errorMessage, startTime);
    }
  }

  /**
   * Build web search query for a specific agent and game context
   */
  private buildWebSearchQuery(agent: AgentCard, context: ForecastContext): string {
    const gameDate = context.gameTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Reference class agent - find historical matchups
    if (agent.id === 'reference-class-historical') {
      return `
Search for historical reference classes for the college football game:
${context.awayTeam} @ ${context.homeTeam}

Game Date: ${gameDate}

Search for:
1. Head-to-head history between ${context.homeTeam} and ${context.awayTeam} (all-time series record)
2. Home team win rate in similar matchups (same conference, rivalry games)
3. Historical win rates when teams have similar rankings
4. Any relevant historical patterns for this matchup

After searching, provide your analysis as JSON in this format:
{
  "matches": [
    {
      "description": "Description of the reference class",
      "historicalSampleSize": 50,
      "relevanceScore": 0.85,
      "category": "head_to_head|conference|ranking|venue",
      "winRate": 0.55
    }
  ],
  "reasoning": "Explanation of how you found and selected these reference classes",
  "recommendedClass": "The most relevant reference class to anchor the base rate"
}
`.trim();
    }

    // Base rate agent - calculate probability from reference classes
    if (agent.id === 'base-rate-calculator') {
      const previousOutputs = this.getPreviousOutputs(context);
      const refClasses = this.extractReferenceClasses(previousOutputs);
      const refClassesStr = refClasses.length > 0
        ? JSON.stringify(refClasses, null, 2)
        : 'No reference classes found - use general home team win rates';

      return `
Calculate the base rate probability that ${context.homeTeam} (HOME TEAM) beats ${context.awayTeam}.

Game Date: ${gameDate}

Reference Classes Found:
${refClassesStr}

Search for:
1. Historical win rates for the reference classes above
2. ${context.homeTeam} vs ${context.awayTeam} all-time record
3. Home team win rates in college football for similar matchups
4. Any relevant statistics to anchor the probability

After searching, provide your analysis as JSON in this format:
{
  "probability": 0.55,
  "confidenceInterval": [0.45, 0.65],
  "sampleSize": 100,
  "sources": ["ESPN", "Sports Reference"],
  "reasoning": "Explanation of how you calculated the weighted base rate"
}

IMPORTANT: The "probability" field must be a number between 0 and 1 representing ${context.homeTeam}'s probability of winning.
`.trim();
    }

    if (agent.id === 'evidence-injury-analyzer') {
      return `
Search for the latest injury reports and player availability for the college football game:
${context.awayTeam} @ ${context.homeTeam}

Game Date: ${gameDate}

Focus on:
1. Key player injuries and their status (out, questionable, probable)
2. Recent injury updates from official team sources
3. Impact of any injuries on the game outcome
4. Starting lineup changes due to injuries

After searching, provide your analysis as JSON in this format:
{
  "evidenceItems": [
    {
      "type": "injury",
      "player": "Player Name",
      "team": "Team Name",
      "status": "out|questionable|probable|healthy",
      "position": "QB|RB|WR|etc",
      "impact": "high|medium|low",
      "description": "Brief description of the injury and impact",
      "source": "Source name"
    }
  ],
  "adjustmentFactor": 0.95,
  "confidence": 0.8,
  "reasoning": "Summary of injury impact on game prediction"
}
`.trim();
    }

    // Default evidence web search query
    return `
Search for the latest information about the college football game:
${context.awayTeam} @ ${context.homeTeam}

Game Date: ${gameDate}

Focus on:
1. Recent team performance and trends (last 3-5 games)
2. Expert predictions and betting line analysis
3. Key matchup factors (offensive vs defensive strengths)
4. Weather conditions if relevant to the game
5. Head-to-head history and rivalry factors
6. Any breaking news that could affect the outcome

After searching, provide your analysis as JSON in this format:
{
  "evidenceItems": [
    {
      "type": "performance|matchup|trend|expert|weather|rivalry",
      "description": "Description of the evidence",
      "team": "Which team this favors (or 'neutral')",
      "impact": "high|medium|low",
      "adjustmentDirection": "increase|decrease|none",
      "adjustmentMagnitude": 0.02,
      "source": "Source name"
    }
  ],
  "netAdjustment": 0.03,
  "confidence": 0.75,
  "reasoning": "Summary of evidence and its impact on prediction"
}
`.trim();
  }

  /**
   * Build fallback output when JSON parsing fails, based on agent type
   */
  private buildFallbackOutput(agent: AgentCard, outputText: string): Record<string, unknown> {
    // Reference class agent - need matches array
    if (agent.id === 'reference-class-historical') {
      return {
        matches: [{
          description: outputText.substring(0, 200),
          historicalSampleSize: 50,
          relevanceScore: 0.7,
          category: 'general',
          winRate: 0.5,
        }],
        reasoning: outputText,
        recommendedClass: 'General historical matchup',
        confidence: 0.6,
      };
    }

    // Base rate agent - need probability
    if (agent.id === 'base-rate-calculator') {
      // Try to extract a probability number from the text
      const probMatch = outputText.match(/(\d+(?:\.\d+)?)\s*%/);
      const probability = probMatch ? parseFloat(probMatch[1]) / 100 : 0.5;
      return {
        probability: Math.max(0.1, Math.min(0.9, probability)),
        confidenceInterval: [probability - 0.1, probability + 0.1],
        sampleSize: 50,
        sources: ['web_search'],
        reasoning: outputText,
        confidence: 0.6,
      };
    }

    // Default: evidence format
    return {
      evidenceItems: [{
        description: outputText,
        source: 'web_search',
        relevance: 0.8,
      }],
      confidence: 0.7,
    };
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
