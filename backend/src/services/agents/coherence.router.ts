import { agentRegistry } from './agent.registry.js';
import type { AgentCard } from '../../types/agent.types.js';
import type { ForecastingStage, ForecastContext } from '../../types/pipeline.types.js';
import { agentLogger } from '../../utils/logger.js';

/**
 * Coherence scores for agent selection
 */
interface CoherenceScore {
  agentId: string;
  score: number;
  reasons: string[];
}

/**
 * Domain keywords for semantic matching
 */
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  historical: ['history', 'past', 'record', 'streak', 'trend', 'previous'],
  statistical: ['stats', 'numbers', 'data', 'percentage', 'rate', 'average'],
  news: ['news', 'report', 'update', 'latest', 'recent', 'announced'],
  injury: ['injury', 'health', 'questionable', 'out', 'doubtful', 'status'],
  analytical: ['analysis', 'evaluate', 'assess', 'calculate', 'compute'],
  critical: ['risk', 'concern', 'worry', 'problem', 'issue', 'weakness'],
  synthesis: ['combine', 'integrate', 'final', 'overall', 'conclusion'],
};

/**
 * Stage-to-domain affinity mapping
 */
const STAGE_DOMAIN_AFFINITY: Record<ForecastingStage, string[]> = {
  reference_class: ['historical', 'statistical'],
  base_rate: ['statistical', 'historical'],
  fermi_decomposition: ['analytical', 'statistical'],
  evidence_gathering: ['news', 'injury', 'analytical'],
  bayesian_update: ['analytical', 'statistical'],
  premortem: ['critical', 'analytical'],
  synthesis: ['synthesis', 'analytical'],
  calibration: ['statistical', 'analytical'],
};

/**
 * Coherence Router - routes tasks to agents based on semantic similarity
 */
class CoherenceRouter {
  /**
   * Select the best agent(s) for a stage
   */
  selectAgents(
    stage: ForecastingStage,
    context: ForecastContext,
    maxAgents: number = 1
  ): string[] {
    const eligibleAgents = agentRegistry.getByStage(stage);

    if (eligibleAgents.length === 0) {
      agentLogger.warn({ stage }, 'No agents available for stage');
      return [];
    }

    if (eligibleAgents.length <= maxAgents) {
      return eligibleAgents.map((a) => a.id);
    }

    // Score agents by coherence
    const scores = eligibleAgents.map((agent) =>
      this.scoreAgent(agent, stage, context)
    );

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const selected = scores.slice(0, maxAgents).map((s) => s.agentId);

    agentLogger.debug(
      { stage, scores: scores.map((s) => ({ id: s.agentId, score: s.score })) },
      'Agent selection complete'
    );

    return selected;
  }

  /**
   * Score an agent's coherence for a given context
   */
  private scoreAgent(
    agent: AgentCard,
    stage: ForecastingStage,
    context: ForecastContext
  ): CoherenceScore {
    const reasons: string[] = [];
    let score = 0;

    // 1. Domain affinity (0-30 points)
    const affineDomains = STAGE_DOMAIN_AFFINITY[stage] || [];
    if (affineDomains.includes(agent.coherenceProfile.semanticDomain)) {
      score += 30;
      reasons.push(`Domain match: ${agent.coherenceProfile.semanticDomain}`);
    }

    // 2. Frequency tier matching (0-20 points)
    // Theta (deliberate) for complex analysis stages
    // Gamma (reactive) for quick data gathering
    const deliberateStages: ForecastingStage[] = ['bayesian_update', 'synthesis', 'calibration'];
    const reactiveStages: ForecastingStage[] = ['evidence_gathering', 'reference_class'];

    if (deliberateStages.includes(stage) && agent.coherenceProfile.frequencyTier === 'theta') {
      score += 20;
      reasons.push('Theta tier for deliberate stage');
    } else if (reactiveStages.includes(stage) && agent.coherenceProfile.frequencyTier === 'gamma') {
      score += 20;
      reasons.push('Gamma tier for reactive stage');
    }

    // 3. Context keyword matching (0-30 points)
    const contextText = this.extractContextText(context);
    const domainKeywords = DOMAIN_KEYWORDS[agent.coherenceProfile.semanticDomain] || [];
    const matches = domainKeywords.filter((kw) =>
      contextText.toLowerCase().includes(kw)
    );
    if (matches.length > 0) {
      score += Math.min(matches.length * 10, 30);
      reasons.push(`Keyword matches: ${matches.join(', ')}`);
    }

    // 4. Capability breadth (0-10 points)
    // Prefer specialists over generalists
    if (agent.capabilities.supportedStages.length === 1) {
      score += 10;
      reasons.push('Specialist agent');
    } else if (agent.capabilities.supportedStages.length === 2) {
      score += 5;
      reasons.push('Focused agent');
    }

    // 5. Output capacity for stage needs (0-10 points)
    const highOutputStages: ForecastingStage[] = ['synthesis', 'premortem'];
    if (highOutputStages.includes(stage) && agent.constraints.maxTokensOutput >= 1500) {
      score += 10;
      reasons.push('High output capacity');
    }

    return {
      agentId: agent.id,
      score,
      reasons,
    };
  }

  /**
   * Extract text from context for keyword matching
   */
  private extractContextText(context: ForecastContext): string {
    const parts: string[] = [
      context.homeTeam,
      context.awayTeam,
    ];

    // Include previous stage output summaries
    for (const contributions of Object.values(context.agentContributions)) {
      for (const contribution of contributions) {
        if (contribution.output && typeof contribution.output === 'object') {
          parts.push(JSON.stringify(contribution.output));
        }
      }
    }

    return parts.join(' ');
  }

  /**
   * Get recommended agent count for a stage based on preset
   */
  getRecommendedAgentCount(
    stage: ForecastingStage,
    preset: 'quick' | 'balanced' | 'deep'
  ): number {
    const countMap: Record<string, Record<ForecastingStage, number>> = {
      quick: {
        reference_class: 1,
        base_rate: 1,
        fermi_decomposition: 0,
        evidence_gathering: 1,
        bayesian_update: 1,
        premortem: 0,
        synthesis: 1,
        calibration: 0,
      },
      balanced: {
        reference_class: 1,
        base_rate: 1,
        fermi_decomposition: 1,
        evidence_gathering: 2,
        bayesian_update: 1,
        premortem: 1,
        synthesis: 1,
        calibration: 1,
      },
      deep: {
        reference_class: 1,
        base_rate: 1,
        fermi_decomposition: 1,
        evidence_gathering: 3,
        bayesian_update: 1,
        premortem: 2,
        synthesis: 1,
        calibration: 1,
      },
    };

    return countMap[preset]?.[stage] ?? 1;
  }

  /**
   * Explain why agents were selected (for debugging/UI)
   */
  explainSelection(
    stage: ForecastingStage,
    context: ForecastContext
  ): CoherenceScore[] {
    const eligibleAgents = agentRegistry.getByStage(stage);
    return eligibleAgents.map((agent) => this.scoreAgent(agent, stage, context));
  }
}

// Singleton instance
export const coherenceRouter = new CoherenceRouter();
