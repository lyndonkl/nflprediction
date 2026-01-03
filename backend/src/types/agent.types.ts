import type { ForecastingStage } from './pipeline.types.js';

/**
 * Agent Card - A2A-inspired capability advertisement
 * Describes what an agent can do and how to invoke it
 */
export interface AgentCard {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: {
    supportedStages: ForecastingStage[];
    actions: string[];
    inputTypes: string[];
    outputTypes: string[];
  };
  endpoint?: {
    url: string;
    protocol: 'internal' | 'http' | 'json-rpc';
  };
  coherenceProfile: {
    semanticDomain: string;
    frequencyTier: 'theta' | 'gamma'; // theta = coordinator, gamma = worker
  };
  constraints: {
    maxTokensInput: number;
    maxTokensOutput: number;
    timeoutMs: number;
    rateLimit: string;
  };
}

/**
 * Agent invocation response envelope
 */
export interface AgentResponse<T = unknown> {
  agentId: string;
  taskId: string;
  stage: ForecastingStage;
  timestamp: Date;
  status: 'success' | 'partial' | 'failed' | 'input_required';
  error?: string;
  output: T;
  rawResponse?: string;
  confidence: number;
  coherenceScore?: number;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
}

/**
 * User's configuration for an attached agent
 */
export interface UserAgentConfig {
  agentId: string;
  stage: ForecastingStage;
  enabled: boolean;
  weight: number; // 0-2, for aggregation weighting
  customSystemPrompt?: string;
  customUserPrompt?: string;
  temperature: number;
  maxTokens: number;
  stageConfig: Record<string, unknown>;
}

/**
 * Prompt template for agent invocation
 */
export interface PromptTemplate {
  templateId: string;
  stage: ForecastingStage;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  requiredVariables: string[];
  optionalVariables: string[];
  outputFormat: 'json' | 'markdown' | 'text';
}

/**
 * Agent contribution record for a stage
 */
export interface AgentContribution {
  agentId: string;
  agentName: string;
  output: unknown;
  confidence: number;
  timestamp: Date;
  latencyMs: number;
  // Web search results (if applicable)
  sources?: WebSearchSource[];
  citations?: WebSearchCitation[];
}

/**
 * Web search source from OpenAI Responses API
 */
export interface WebSearchSource {
  url: string;
  title: string;
  snippet?: string;
}

/**
 * Web search citation from OpenAI Responses API annotations
 */
export interface WebSearchCitation {
  type: 'url_citation';
  url: string;
  title: string;
  start_index: number;
  end_index: number;
}

/**
 * User location for web search relevance
 */
export interface WebSearchUserLocation {
  type: 'approximate';
  country: string;
  timezone: string;
}

/**
 * Web search configuration for agents
 */
export interface WebSearchConfig {
  enabled: boolean;
  searchContextSize: 'low' | 'medium' | 'high';
  allowedDomains: string[];
  userLocation: WebSearchUserLocation;
}

/**
 * Result from OpenAI Responses API with web search
 */
export interface ResponsesAPIResult {
  output_text: string;
  sources: WebSearchSource[];
  citations: WebSearchCitation[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
