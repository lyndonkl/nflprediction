import nunjucks from 'nunjucks';
import type { PromptTemplate } from '../types/agent.types.js';

// Configure Nunjucks environment
const env = new nunjucks.Environment(null, {
  autoescape: false,
  throwOnUndefined: false,
});

// Add custom filters
env.addFilter('round', (num: number, decimals: number = 2) => {
  if (typeof num !== 'number') return num;
  return num.toFixed(decimals);
});

env.addFilter('default', (value: unknown, defaultValue: unknown) => {
  return value ?? defaultValue;
});

env.addFilter('json', (value: unknown) => {
  return JSON.stringify(value, null, 2);
});

/**
 * Render a prompt template with variables
 */
export function renderPrompt(
  template: string,
  variables: Record<string, unknown>
): string {
  try {
    return env.renderString(template, variables);
  } catch (error) {
    throw new Error(`Failed to render prompt template: ${error}`);
  }
}

/**
 * Render both system and user prompts from a PromptTemplate
 */
export function renderPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, unknown>
): { system: string; user: string } {
  // Validate required variables
  const missing = template.requiredVariables.filter((v) => !(v in variables));
  if (missing.length > 0) {
    throw new Error(`Missing required variables: ${missing.join(', ')}`);
  }

  return {
    system: renderPrompt(template.systemPrompt, variables),
    user: renderPrompt(template.userPromptTemplate, variables),
  };
}

/**
 * Validate that a template has all required variables in context
 */
export function validateTemplateVariables(
  template: PromptTemplate,
  variables: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const missing = template.requiredVariables.filter((v) => !(v in variables));
  return {
    valid: missing.length === 0,
    missing,
  };
}
