import { DEFAULT_AGENTS } from '../../config/agents.config.js';
import type { AgentCard } from '../../types/agent.types.js';
import type { ForecastingStage } from '../../types/pipeline.types.js';
import { agentLogger } from '../../utils/logger.js';

/**
 * Agent Registry - manages agent discovery and lookup
 */
class AgentRegistry {
  private agents: Map<string, AgentCard> = new Map();

  constructor() {
    // Register default agents on startup
    this.registerDefaultAgents();
  }

  /**
   * Register default built-in agents
   */
  private registerDefaultAgents(): void {
    for (const agent of DEFAULT_AGENTS) {
      this.register(agent);
    }
    agentLogger.info({ count: this.agents.size }, 'Default agents registered');
  }

  /**
   * Register a new agent
   */
  register(agent: AgentCard): void {
    if (this.agents.has(agent.id)) {
      agentLogger.warn({ agentId: agent.id }, 'Agent already registered, overwriting');
    }
    this.agents.set(agent.id, agent);
    agentLogger.debug({ agentId: agent.id, stages: agent.capabilities.supportedStages }, 'Agent registered');
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): boolean {
    const deleted = this.agents.delete(agentId);
    if (deleted) {
      agentLogger.info({ agentId }, 'Agent unregistered');
    }
    return deleted;
  }

  /**
   * Get an agent by ID
   */
  get(agentId: string): AgentCard | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAll(): AgentCard[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents that support a specific stage
   */
  getByStage(stage: ForecastingStage): AgentCard[] {
    return this.getAll().filter((agent) =>
      agent.capabilities.supportedStages.includes(stage)
    );
  }

  /**
   * Get agents by semantic domain
   */
  getByDomain(domain: string): AgentCard[] {
    return this.getAll().filter((agent) =>
      agent.coherenceProfile.semanticDomain === domain
    );
  }

  /**
   * Get agents by frequency tier (theta = deliberate, gamma = reactive)
   */
  getByFrequencyTier(tier: 'theta' | 'gamma'): AgentCard[] {
    return this.getAll().filter((agent) =>
      agent.coherenceProfile.frequencyTier === tier
    );
  }

  /**
   * Check if an agent exists
   */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get agent count
   */
  get count(): number {
    return this.agents.size;
  }

  /**
   * Get agent IDs for a given stage (convenience method)
   */
  getAgentIdsForStage(stage: ForecastingStage): string[] {
    return this.getByStage(stage).map((a) => a.id);
  }

  /**
   * Validate that all required agents exist
   */
  validateAgents(agentIds: string[]): { valid: boolean; missing: string[] } {
    const missing = agentIds.filter((id) => !this.has(id));
    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

// Singleton instance
export const agentRegistry = new AgentRegistry();
