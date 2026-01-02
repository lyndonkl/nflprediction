import OpenAI from 'openai';
import { config } from '../../config/index.js';
import { agentLogger } from '../../utils/logger.js';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: 'text' | 'json';
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

/**
 * LLM Service - abstraction over OpenAI API
 */
class LLMService {
  private client: OpenAI | null = null;

  constructor() {
    if (config.openaiApiKey) {
      this.client = new OpenAI({
        apiKey: config.openaiApiKey,
      });
    } else {
      agentLogger.warn('OpenAI API key not configured - LLM calls will fail');
    }
  }

  /**
   * Generate a completion
   */
  async complete(
    systemPrompt: string,
    userPrompt: string,
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const model = options.model || config.llm.model;
    const temperature = options.temperature ?? config.llm.temperature;
    const maxTokens = options.maxTokens ?? config.llm.maxTokens;

    agentLogger.debug({ model, temperature, maxTokens }, 'LLM request');

    try {
      const startTime = Date.now();

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      });

      const latency = Date.now() - startTime;
      const choice = response.choices[0];

      agentLogger.info({
        model: response.model,
        latency,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      }, 'LLM response received');

      return {
        content: choice.message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
        finishReason: choice.finish_reason || 'unknown',
      };
    } catch (error) {
      agentLogger.error({ error }, 'LLM request failed');
      throw error;
    }
  }

  /**
   * Generate a JSON completion with parsing
   */
  async completeJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    options: LLMOptions = {}
  ): Promise<{ parsed: T; raw: LLMResponse }> {
    const response = await this.complete(systemPrompt, userPrompt, {
      ...options,
      responseFormat: 'json',
    });

    try {
      const parsed = JSON.parse(response.content) as T;
      return { parsed, raw: response };
    } catch (error) {
      agentLogger.error({ content: response.content }, 'Failed to parse LLM JSON response');
      throw new Error(`Failed to parse LLM response as JSON: ${error}`);
    }
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }
}

// Singleton instance
export const llmService = new LLMService();
