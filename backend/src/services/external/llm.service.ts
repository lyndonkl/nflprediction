import OpenAI from 'openai';
import { config } from '../../config/index.js';
import { agentLogger } from '../../utils/logger.js';
import type {
  ResponsesAPIResult,
  WebSearchSource,
  WebSearchCitation
} from '../../types/agent.types.js';

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

export interface WebSearchOptions {
  model?: string;
  searchContextSize?: 'low' | 'medium' | 'high';
  allowedDomains?: string[];
  userLocation?: {
    type: 'approximate';
    country: string;
    timezone: string;
  };
}

export interface ResponsesOptions {
  model?: string;
  reasoning?: {
    effort: 'low' | 'medium' | 'high';
  };
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

    agentLogger.info({ model, temperature, maxTokens, configMaxTokens: config.llm.maxTokens }, 'LLM request');

    try {
      const startTime = Date.now();

      // o4-mini and other reasoning models use max_completion_tokens instead of max_tokens
      // They also don't support response_format or temperature
      const isReasoningModel = model.startsWith('o4') || model.startsWith('o3') || model.startsWith('o1');
      const tokenParam = isReasoningModel
        ? { max_completion_tokens: maxTokens }
        : { max_tokens: maxTokens };

      // For reasoning models, append JSON instruction to prompt since response_format isn't supported
      const effectiveUserPrompt = (isReasoningModel && options.responseFormat === 'json')
        ? `${userPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown code blocks, no explanations, just raw JSON.`
        : userPrompt;

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: effectiveUserPrompt },
        ],
        temperature: isReasoningModel ? undefined : temperature, // Reasoning models don't support temperature
        ...tokenParam,
        // Reasoning models don't support response_format
        response_format: (!isReasoningModel && options.responseFormat === 'json') ? { type: 'json_object' } : undefined,
      } as any);

      const latency = Date.now() - startTime;
      const choice = response.choices[0];

      // Debug: Log the actual response structure for reasoning models
      if (isReasoningModel) {
        agentLogger.info({
          hasContent: !!choice.message.content,
          contentLength: choice.message.content?.length || 0,
          contentPreview: choice.message.content?.substring(0, 200) || '[empty]',
          messageKeys: Object.keys(choice.message),
          choiceKeys: Object.keys(choice),
          finishReason: choice.finish_reason,
        }, 'Reasoning model response structure');
      }

      agentLogger.info({
        model: response.model,
        latency,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      }, 'LLM response received');

      // For reasoning models, content might be in different locations
      let content = choice.message.content || '';
      if (!content && (choice as any).text) {
        content = (choice as any).text;
      }
      if (!content && (choice.message as any).reasoning) {
        content = (choice.message as any).reasoning;
      }

      return {
        content,
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
      // First try direct JSON parsing
      const parsed = JSON.parse(response.content) as T;
      return { parsed, raw: response };
    } catch (firstError) {
      // Try to extract JSON from markdown code blocks (reasoning models may wrap in ```json```)
      try {
        const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1].trim()) as T;
          return { parsed, raw: response };
        }

        // Try to find any JSON object in the response
        const objectMatch = response.content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          const parsed = JSON.parse(objectMatch[0]) as T;
          return { parsed, raw: response };
        }
      } catch {
        // Fall through to original error
      }

      agentLogger.error({ content: response.content?.substring(0, 500) }, 'Failed to parse LLM JSON response');
      throw new Error(`Failed to parse LLM response as JSON: ${firstError}`);
    }
  }

  /**
   * Generate a completion using Responses API with web search
   * Uses o4-mini model for real-time web access
   */
  async completeWithWebSearch(
    input: string,
    options: WebSearchOptions = {}
  ): Promise<ResponsesAPIResult> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const model = options.model || 'o4-mini';
    const searchContextSize = options.searchContextSize || config.webSearch.searchContextSize;
    const allowedDomains = options.allowedDomains || config.webSearch.allowedDomains;
    const userLocation = options.userLocation || config.webSearch.userLocation;

    agentLogger.debug({
      model,
      searchContextSize,
      allowedDomains,
    }, 'Responses API web search request');

    try {
      const startTime = Date.now();

      // Use the Responses API with web_search tool
      const response = await this.client.responses.create({
        model,
        input,
        tools: [{
          type: 'web_search',
          search_context_size: searchContextSize,
          user_location: userLocation,
        }],
        include: ['web_search_call.results'],
      } as any);

      const latency = Date.now() - startTime;

      // Extract output text
      const outputText = this.extractOutputText(response);

      // Extract sources from web_search_call results
      const sources = this.extractSources(response);

      // Extract citations from annotations
      const citations = this.extractCitations(response);

      agentLogger.info({
        model,
        latency,
        sourcesCount: sources.length,
        citationsCount: citations.length,
      }, 'Responses API web search completed');

      return {
        output_text: outputText,
        sources,
        citations,
        usage: {
          input_tokens: (response as any).usage?.input_tokens || 0,
          output_tokens: (response as any).usage?.output_tokens || 0,
        },
      };
    } catch (error) {
      agentLogger.error({ error }, 'Responses API web search failed');
      throw error;
    }
  }

  /**
   * Generate a completion using Responses API (without web search)
   * For reasoning models with optional effort control
   */
  async completeResponses(
    input: string,
    options: ResponsesOptions = {}
  ): Promise<{ output_text: string; usage: { input_tokens: number; output_tokens: number } }> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const model = options.model || 'o4-mini';

    agentLogger.debug({ model, reasoning: options.reasoning }, 'Responses API request');

    try {
      const startTime = Date.now();

      const requestBody: any = {
        model,
        input,
      };

      if (options.reasoning) {
        requestBody.reasoning = options.reasoning;
      }

      const response = await this.client.responses.create(requestBody);
      const latency = Date.now() - startTime;

      const outputText = this.extractOutputText(response);

      agentLogger.info({
        model,
        latency,
      }, 'Responses API completed');

      return {
        output_text: outputText,
        usage: {
          input_tokens: (response as any).usage?.input_tokens || 0,
          output_tokens: (response as any).usage?.output_tokens || 0,
        },
      };
    } catch (error) {
      agentLogger.error({ error }, 'Responses API request failed');
      throw error;
    }
  }

  /**
   * Extract output text from Responses API response
   */
  private extractOutputText(response: any): string {
    // The response output is an array of output items
    if (response.output && Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text' || content.type === 'text') {
              return content.text || '';
            }
          }
        }
      }
    }

    // Fallback: try output_text directly
    if (response.output_text) {
      return response.output_text;
    }

    return '';
  }

  /**
   * Extract sources from web search results
   */
  private extractSources(response: any): WebSearchSource[] {
    const sources: WebSearchSource[] = [];

    if (response.output && Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item.type === 'web_search_call' && item.results) {
          for (const result of item.results) {
            sources.push({
              url: result.url || '',
              title: result.title || '',
              snippet: result.snippet || undefined,
            });
          }
        }
      }
    }

    return sources;
  }

  /**
   * Extract citations from output annotations
   */
  private extractCitations(response: any): WebSearchCitation[] {
    const citations: WebSearchCitation[] = [];

    if (response.output && Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.annotations && Array.isArray(content.annotations)) {
              for (const annotation of content.annotations) {
                if (annotation.type === 'url_citation') {
                  citations.push({
                    type: 'url_citation',
                    url: annotation.url || '',
                    title: annotation.title || '',
                    start_index: annotation.start_index || 0,
                    end_index: annotation.end_index || 0,
                  });
                }
              }
            }
          }
        }
      }
    }

    return citations;
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
