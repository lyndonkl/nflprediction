import type { AgentCard, PromptTemplate } from '../types/agent.types.js';
import type { ForecastingStage } from '../types/pipeline.types.js';

/**
 * Default 8 agents for the superforecaster pipeline
 */
export const DEFAULT_AGENTS: AgentCard[] = [
  // Stage 1: Reference Class
  {
    id: 'reference-class-historical',
    name: 'Historical Matchup Finder',
    version: '1.0.0',
    description: 'Searches historical college football games to find similar matchups based on rankings, conference, venue, and rivalry status.',
    capabilities: {
      supportedStages: ['reference_class'],
      actions: ['database_query', 'semantic_search'],
      inputTypes: ['game_context'],
      outputTypes: ['reference_class_list'],
    },
    coherenceProfile: {
      semanticDomain: 'sports_history',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2000,
      maxTokensOutput: 1500,
      timeoutMs: 30000,
      rateLimit: '10/minute',
    },
  },

  // Stage 2: Base Rate
  {
    id: 'base-rate-calculator',
    name: 'Base Rate Calculator',
    version: '1.0.0',
    description: 'Calculates historical win probabilities from reference classes, providing a base rate anchor for forecasting.',
    capabilities: {
      supportedStages: ['base_rate'],
      actions: ['statistical_analysis', 'probability_estimation'],
      inputTypes: ['reference_class_list'],
      outputTypes: ['base_rate'],
    },
    coherenceProfile: {
      semanticDomain: 'statistics',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 1500,
      maxTokensOutput: 1000,
      timeoutMs: 20000,
      rateLimit: '15/minute',
    },
  },

  // Stage 3: Evidence Gathering (Web Search)
  {
    id: 'evidence-web-search',
    name: 'Web Search Evidence Gatherer',
    version: '1.0.0',
    description: 'Searches the web for relevant news, analysis, and information that could affect game outcomes.',
    capabilities: {
      supportedStages: ['evidence_gathering'],
      actions: ['web_search', 'summarize', 'extract_entities'],
      inputTypes: ['game_context', 'search_queries'],
      outputTypes: ['evidence_list'],
    },
    coherenceProfile: {
      semanticDomain: 'sports_news',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2000,
      maxTokensOutput: 2000,
      timeoutMs: 45000,
      rateLimit: '5/minute',
    },
  },

  // Stage 3: Evidence Gathering (Injury Analyzer)
  {
    id: 'evidence-injury-analyzer',
    name: 'Injury Report Analyzer',
    version: '1.0.0',
    description: 'Analyzes injury reports and player availability to assess impact on game outcomes.',
    capabilities: {
      supportedStages: ['evidence_gathering'],
      actions: ['data_extraction', 'impact_assessment'],
      inputTypes: ['game_context', 'injury_data'],
      outputTypes: ['evidence_list'],
    },
    coherenceProfile: {
      semanticDomain: 'sports_injuries',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 1500,
      maxTokensOutput: 1500,
      timeoutMs: 30000,
      rateLimit: '10/minute',
    },
  },

  // Stage 4: Bayesian Update
  {
    id: 'bayesian-updater',
    name: 'Bayesian Probability Updater',
    version: '1.0.0',
    description: 'Applies Bayesian reasoning to update probability estimates based on gathered evidence.',
    capabilities: {
      supportedStages: ['bayesian_update'],
      actions: ['likelihood_estimation', 'probability_update'],
      inputTypes: ['prior_probability', 'evidence_list'],
      outputTypes: ['posterior_probability', 'update_chain'],
    },
    coherenceProfile: {
      semanticDomain: 'probability_reasoning',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2500,
      maxTokensOutput: 2000,
      timeoutMs: 30000,
      rateLimit: '10/minute',
    },
  },

  // Stage 5: Premortem (Devil's Advocate)
  {
    id: 'devils-advocate',
    name: "Devil's Advocate",
    version: '1.0.0',
    description: 'Challenges the current forecast by identifying potential weaknesses, overlooked factors, and alternative scenarios.',
    capabilities: {
      supportedStages: ['premortem'],
      actions: ['adversarial_reasoning', 'weakness_identification', 'scenario_generation'],
      inputTypes: ['probability_estimate', 'reasoning_chain'],
      outputTypes: ['concerns', 'alternative_scenarios'],
    },
    coherenceProfile: {
      semanticDomain: 'critical_analysis',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2000,
      maxTokensOutput: 1500,
      timeoutMs: 30000,
      rateLimit: '10/minute',
    },
  },

  // Stage 5: Premortem (Bias Detector)
  {
    id: 'bias-detector',
    name: 'Cognitive Bias Detector',
    version: '1.0.0',
    description: 'Identifies cognitive biases that may be affecting the forecast, such as recency bias, confirmation bias, and anchoring.',
    capabilities: {
      supportedStages: ['premortem'],
      actions: ['bias_detection', 'debiasing_suggestions'],
      inputTypes: ['reasoning_chain', 'evidence_list'],
      outputTypes: ['bias_list', 'adjustment_recommendations'],
    },
    coherenceProfile: {
      semanticDomain: 'cognitive_psychology',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2000,
      maxTokensOutput: 1500,
      timeoutMs: 30000,
      rateLimit: '10/minute',
    },
  },

  // Stage 6: Synthesis
  {
    id: 'synthesis-coordinator',
    name: 'Synthesis Coordinator',
    version: '1.0.0',
    description: 'Integrates outputs from all prior stages to generate a final probability estimate with confidence intervals.',
    capabilities: {
      supportedStages: ['synthesis'],
      actions: ['multi_perspective_integration', 'final_estimation', 'recommendation_generation'],
      inputTypes: ['all_stage_outputs'],
      outputTypes: ['final_probability', 'confidence_interval', 'recommendation'],
    },
    coherenceProfile: {
      semanticDomain: 'forecasting_synthesis',
      frequencyTier: 'theta', // Coordinator role
    },
    constraints: {
      maxTokensInput: 4000,
      maxTokensOutput: 2000,
      timeoutMs: 45000,
      rateLimit: '5/minute',
    },
  },
];

/**
 * Default prompt templates for each agent
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  'reference-class-historical': {
    templateId: 'reference_class_default',
    stage: 'reference_class',
    name: 'Default Reference Class Finder',
    description: 'Finds similar historical matchups',
    systemPrompt: `You are an expert sports analyst specializing in college football statistics and historical analysis.

Your task is to identify REFERENCE CLASSES - categories of similar historical games that can anchor probability estimates.

Focus on:
- Team rankings and relative strength differences
- Conference dynamics and home-field advantages
- Rivalry status and historical head-to-head records
- Season timing and momentum factors

Be specific and cite sample sizes when available.`,
    userPromptTemplate: `Find reference classes for this college football game:

**Game:** {{homeTeam}} vs {{awayTeam}}
**Venue:** {{venue}}
**Home Ranking:** {{homeRanking | default("Unranked")}}
**Away Ranking:** {{awayRanking | default("Unranked")}}
**Conference:** {{conference}}
**Is Rivalry:** {{isRivalry}}

Identify 3-5 relevant reference classes. For each, provide:
- Description of the reference class
- Approximate sample size
- Relevance score (0-1)
- Category type

Respond in JSON format:
{
  "matches": [{ "description": "...", "historicalSampleSize": N, "relevanceScore": 0.X, "category": "..." }],
  "reasoning": "...",
  "recommendedClass": "..."
}`,
    requiredVariables: ['homeTeam', 'awayTeam', 'venue', 'conference'],
    optionalVariables: ['homeRanking', 'awayRanking', 'isRivalry'],
    outputFormat: 'json',
  },

  'base-rate-calculator': {
    templateId: 'base_rate_default',
    stage: 'base_rate',
    name: 'Default Base Rate Calculator',
    description: 'Calculates base rate from reference classes',
    systemPrompt: `You are a statistical analyst calculating base rate probabilities for sports forecasting.

Your task is to estimate the historical win rate for a team given relevant reference classes.

Guidelines:
- Weight reference classes by relevance and sample size
- Consider home-field advantage (typically 2-3% for college football)
- Provide confidence intervals based on sample sizes
- Be conservative when sample sizes are small`,
    userPromptTemplate: `Calculate the base rate probability for {{teamForProbability}} to win.

Reference Classes:
{% for rc in referenceClasses %}
- {{rc.description}} (n={{rc.historicalSampleSize}}, relevance={{rc.relevanceScore}})
{% endfor %}

Provide:
- Base rate probability (0-1)
- 80% confidence interval
- Total effective sample size
- Reasoning for your estimate

Respond in JSON format:
{
  "probability": 0.XX,
  "confidenceInterval": [0.XX, 0.XX],
  "sampleSize": N,
  "sources": ["..."],
  "reasoning": "..."
}`,
    requiredVariables: ['teamForProbability', 'referenceClasses'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'evidence-web-search': {
    templateId: 'evidence_web_search_default',
    stage: 'evidence_gathering',
    name: 'Default Web Search Evidence Gatherer',
    description: 'Searches for relevant game information',
    systemPrompt: `You are a sports research analyst gathering evidence to update probability estimates.

Your task is to identify relevant information that could affect game outcomes:
- Injury reports and player availability
- Recent team performance and trends
- Weather conditions at game time
- Coaching changes or strategy shifts
- Expert analysis and predictions
- Betting line movements

For each piece of evidence, assess its relevance and direction of impact.`,
    userPromptTemplate: `Gather evidence for this game:

**Game:** {{homeTeam}} vs {{awayTeam}}
**Game ID:** {{gameId}}
**Current Base Rate ({{homeTeam}} win):** {{baseRate | round(2)}}

{% if searchQueries %}
Focus on these topics:
{% for query in searchQueries %}
- {{query}}
{% endfor %}
{% endif %}

For each evidence item found, provide:
- Type (injury, weather, news, statistical, sentiment)
- Source
- Content summary
- Relevance (0-1)
- Direction (favors_home, favors_away, neutral)
- Suggested likelihood ratio if applicable

Respond in JSON format:
{
  "evidenceItems": [{ "type": "...", "source": "...", "content": "...", "relevance": 0.X, "direction": "...", "suggestedLikelihoodRatio": X.X, "timestamp": "..." }],
  "summary": "...",
  "keyFactors": ["..."]
}`,
    requiredVariables: ['homeTeam', 'awayTeam', 'gameId', 'baseRate'],
    optionalVariables: ['searchQueries'],
    outputFormat: 'json',
  },

  'bayesian-updater': {
    templateId: 'bayesian_update_default',
    stage: 'bayesian_update',
    name: 'Default Bayesian Updater',
    description: 'Applies Bayesian updates to probability',
    systemPrompt: `You are a Bayesian reasoning specialist updating probability estimates based on evidence.

For each piece of evidence, you will:
1. Estimate a likelihood ratio (how much more likely is this evidence if the home team wins vs loses?)
2. Apply Bayes' rule: posterior = prior * LR / (prior * LR + (1-prior))
3. Chain updates sequentially

Guidelines:
- Most evidence has LR between 0.7 and 1.5 (weak to moderate)
- Strong evidence might have LR of 0.5 or 2.0
- Be conservative with likelihood ratios
- Consider independence of evidence items`,
    userPromptTemplate: `Update the probability based on evidence.

**Prior Probability:** {{prior}}

**Evidence Items:**
{% for e in evidence %}
- [{{e.type}}] {{e.content}} (relevance: {{e.relevance}}, direction: {{e.direction}})
{% endfor %}

For each evidence item:
1. Estimate a likelihood ratio
2. Calculate the posterior after that update
3. Explain your reasoning

Respond in JSON format:
{
  "updates": [{ "evidenceDescription": "...", "likelihoodRatio": X.X, "prior": 0.XX, "posterior": 0.XX, "reasoning": "..." }],
  "posterior": 0.XX,
  "updateChain": "Prior -> ... -> Final"
}`,
    requiredVariables: ['prior', 'evidence'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'devils-advocate': {
    templateId: 'premortem_devils_advocate',
    stage: 'premortem',
    name: "Default Devil's Advocate",
    description: 'Challenges the current forecast',
    systemPrompt: `You are a skeptical analyst whose job is to find weaknesses in forecasts.

Your task is to:
1. Identify 3-5 reasons the current prediction could be wrong
2. Generate alternative scenarios
3. Highlight overlooked factors
4. Challenge key assumptions

Be constructive but thorough in your criticism.`,
    userPromptTemplate: `Challenge this forecast:

**Current Probability:** {{currentProbability | round(2)}}

**Reasoning So Far:**
{{reasoningSoFar}}

**Evidence Used:**
{% for e in evidenceUsed %}
- {{e.content}} ({{e.direction}})
{% endfor %}

Provide:
1. 3-5 concerns or reasons this could be wrong
2. Potential biases in the analysis
3. Alternative scenarios that haven't been considered
4. Any confidence adjustment recommendation

Respond in JSON format:
{
  "concerns": ["..."],
  "biases": ["..."],
  "alternativeScenarios": ["..."],
  "confidenceAdjustment": -0.0X or 0.0X (optional)
}`,
    requiredVariables: ['currentProbability', 'reasoningSoFar', 'evidenceUsed'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'synthesis-coordinator': {
    templateId: 'synthesis_default',
    stage: 'synthesis',
    name: 'Default Synthesis Coordinator',
    description: 'Generates final probability estimate',
    systemPrompt: `You are a forecasting synthesis expert combining multiple inputs into a final probability estimate.

Your task is to:
1. Weigh the base rate, Bayesian posterior, and premortem adjustments
2. Generate a final probability with confidence interval
3. Identify key drivers of the estimate
4. Provide a clear recommendation

Be calibrated and acknowledge uncertainty appropriately.`,
    userPromptTemplate: `Synthesize a final forecast:

**Base Rate:** {{baseRate | round(2)}}
**Bayesian Posterior:** {{posteriorProbability | round(2)}}

**Premortem Concerns:**
{% for c in premortermConcerns %}
- {{c}}
{% endfor %}

**Identified Biases:**
{% for b in biasFlags %}
- {{b}}
{% endfor %}

**Key Evidence:**
{% for e in allEvidence[:5] %}
- {{e.content}} ({{e.direction}})
{% endfor %}

Generate:
1. Final probability estimate
2. 80% confidence interval
3. Key drivers (what matters most)
4. Sources of uncertainty
5. Recommendation (strong_buy, buy, neutral, avoid)

Respond in JSON format:
{
  "finalProbability": 0.XX,
  "confidenceInterval": [0.XX, 0.XX],
  "keyDrivers": ["..."],
  "uncertaintySources": ["..."],
  "recommendation": "..."
}`,
    requiredVariables: ['baseRate', 'posteriorProbability', 'premortermConcerns', 'biasFlags', 'allEvidence'],
    optionalVariables: [],
    outputFormat: 'json',
  },
};

/**
 * Get prompt template for an agent
 */
export function getPromptTemplate(agentId: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[agentId];
}

/**
 * Get all agents for a stage
 */
export function getAgentsForStage(stage: ForecastingStage): AgentCard[] {
  return DEFAULT_AGENTS.filter((a) => a.capabilities.supportedStages.includes(stage));
}
