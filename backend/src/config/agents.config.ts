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
    description: 'Searches historical college football games to find similar matchups based on rankings, conference, venue, and rivalry status using web search.',
    capabilities: {
      supportedStages: ['reference_class'],
      actions: ['web_search', 'database_query', 'semantic_search'],
      inputTypes: ['game_context'],
      outputTypes: ['reference_class_list'],
    },
    coherenceProfile: {
      semanticDomain: 'sports_history',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2000,
      maxTokensOutput: 8000,
      timeoutMs: 60000,
      rateLimit: '10/minute',
    },
  },

  // Stage 2: Base Rate
  {
    id: 'base-rate-calculator',
    name: 'Base Rate Calculator',
    version: '1.0.0',
    description: 'Calculates historical win probabilities from reference classes using web search for actual historical win rates.',
    capabilities: {
      supportedStages: ['base_rate'],
      actions: ['web_search', 'statistical_analysis', 'probability_estimation'],
      inputTypes: ['reference_class_list'],
      outputTypes: ['base_rate'],
    },
    coherenceProfile: {
      semanticDomain: 'statistics',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 1500,
      maxTokensOutput: 8000,
      timeoutMs: 60000,
      rateLimit: '15/minute',
    },
  },

  // Stage 2.5: Fermi Decomposition
  {
    id: 'fermi-decomposer',
    name: 'Fermi Decomposer',
    version: '1.0.0',
    description: 'Breaks down the prediction into independent sub-questions using Fermi estimation for structural probability checks.',
    capabilities: {
      supportedStages: ['fermi_decomposition'],
      actions: ['decomposition', 'probability_estimation', 'structural_analysis'],
      inputTypes: ['game_context', 'base_rate'],
      outputTypes: ['sub_questions', 'structural_estimate'],
    },
    coherenceProfile: {
      semanticDomain: 'analytical_reasoning',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2000,
      maxTokensOutput: 8000,
      timeoutMs: 60000,
      rateLimit: '10/minute',
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
      maxTokensOutput: 8000,
      timeoutMs: 90000,
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
      actions: ['web_search', 'data_extraction', 'impact_assessment'],
      inputTypes: ['game_context', 'injury_data'],
      outputTypes: ['evidence_list'],
    },
    coherenceProfile: {
      semanticDomain: 'sports_injuries',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 1500,
      maxTokensOutput: 8000,
      timeoutMs: 90000,
      rateLimit: '10/minute',
    },
  },

  // Stage 3: Evidence Gathering (Contrarian Search)
  {
    id: 'contrarian-evidence-searcher',
    name: 'Contrarian Evidence Searcher',
    version: '1.0.0',
    description: 'Explicitly searches for disconfirming evidence to combat confirmation bias. Looks for reasons the underdog could win.',
    capabilities: {
      supportedStages: ['evidence_gathering'],
      actions: ['web_search', 'contrarian_analysis', 'weakness_identification'],
      inputTypes: ['game_context', 'base_rate'],
      outputTypes: ['evidence_list'],
    },
    coherenceProfile: {
      semanticDomain: 'adversarial_analysis',
      frequencyTier: 'gamma',
    },
    constraints: {
      maxTokensInput: 2000,
      maxTokensOutput: 8000,
      timeoutMs: 90000,
      rateLimit: '5/minute',
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
      maxTokensOutput: 8000,
      timeoutMs: 60000,
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
      maxTokensOutput: 8000,
      timeoutMs: 60000,
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
      maxTokensOutput: 8000,
      timeoutMs: 60000,
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
      maxTokensOutput: 8000,
      timeoutMs: 90000,
      rateLimit: '5/minute',
    },
  },
];

/**
 * Enhanced prompt templates for each agent
 * Based on OpenAI best practices: chain-of-thought, structured XML inputs, JSON outputs
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  'reference-class-historical': {
    templateId: 'reference_class_default',
    stage: 'reference_class',
    name: 'Historical Reference Class Finder',
    description: 'Finds similar historical matchups using web search',
    systemPrompt: `# Identity
You are a sports historian finding reference classes for college football probability forecasting using web search.

# Goal
Search for and identify 3-5 historical reference classes to anchor the probability that the HOME TEAM wins. Use web search to find ACTUAL historical data.

# Method
1. Search for head-to-head history between the teams (e.g., "Georgia vs Alabama all-time series record")
2. Search for similar matchup patterns (e.g., "SEC championship game home team win rate")
3. Search for ranking differential patterns (e.g., "top 10 vs top 10 college football home team win percentage")
4. Verify sample sizes from actual historical data

# Constraints
- Focus on HOME TEAM win probability (not away team)
- Use ACTUAL sample sizes from web search - do NOT estimate
- Score relevance 0-1 based on similarity to current matchup
- Include: head-to-head history, ranking differential, conference matchups, home favorite patterns
- Recommend the primary reference class for anchoring the base rate

# Output
Return valid JSON:
{
  "matches": [{"description": "string", "historicalSampleSize": number, "relevanceScore": 0-1, "category": "string", "winRate": 0-1}],
  "reasoning": "string",
  "recommendedClass": "string"
}`,
    userPromptTemplate: `Find reference classes to estimate the probability that {{homeTeam}} (HOME TEAM) beats {{awayTeam}}.

<game>
  <home_team>{{homeTeam}}</home_team>
  <away_team>{{awayTeam}}</away_team>
  <venue>{{venue}}</venue>
  <home_ranking>{{homeRanking | default("Unranked")}}</home_ranking>
  <away_ranking>{{awayRanking | default("Unranked")}}</away_ranking>
  <conference>{{conference}}</conference>
  <is_rivalry>{{isRivalry}}</is_rivalry>
</game>

Search for ACTUAL historical data for 3-5 reference classes. Include the HOME TEAM win rate you found for each reference class.`,
    requiredVariables: ['homeTeam', 'awayTeam', 'venue', 'conference'],
    optionalVariables: ['homeRanking', 'awayRanking', 'isRivalry'],
    outputFormat: 'json',
  },

  'base-rate-calculator': {
    templateId: 'base_rate_default',
    stage: 'base_rate',
    name: 'Base Rate Probability Calculator',
    description: 'Calculates base rate probability from reference classes using web search',
    systemPrompt: `# Identity
You are a sports statistician calculating base rate probabilities for college football games using web search.

# Goal
Calculate the base rate probability that the HOME TEAM wins by searching for ACTUAL historical win rates for the reference classes provided.

# Method
1. Search for historical win rates for each reference class (e.g., "Georgia vs Alabama history win loss record", "SEC rivalry game home team win rate")
2. Use REAL data from sports reference sites, ESPN, or official sources
3. Weight the win rates by relevance score and sample size
4. Apply standard home field advantage (~3% for college football) if not already captured

# Constraints
- ALWAYS search for actual historical data - do NOT estimate or guess win rates
- Probability between 0.10 and 0.90
- Provide 80% confidence interval (wider for smaller samples)
- Be explicit: you are calculating HOME TEAM win probability
- Cite your sources

# Output
Return valid JSON:
{
  "probability": 0.XX,
  "confidenceInterval": [lower, upper],
  "sampleSize": number,
  "sources": ["string - URLs or source names for win rate data"],
  "reasoning": "string - explain how you calculated the weighted average"
}`,
    userPromptTemplate: `Calculate the base rate probability that {{homeTeam}} (HOME TEAM) beats {{awayTeam}}.

<reference_classes>
{% for rc in referenceClasses %}
<class>
  <description>{{rc.description}}</description>
  <sample_size>{{rc.historicalSampleSize}}</sample_size>
  <relevance>{{rc.relevanceScore}}</relevance>
  <category>{{rc.category}}</category>
</class>
{% endfor %}
</reference_classes>

Search for the ACTUAL historical win rates for these reference classes. Look up head-to-head records, conference win rates, and similar historical data. Then calculate the weighted average base rate for HOME TEAM winning.`,
    requiredVariables: ['homeTeam', 'awayTeam', 'referenceClasses'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'fermi-decomposer': {
    templateId: 'fermi_decomposition_default',
    stage: 'fermi_decomposition',
    name: 'Fermi Decomposer',
    description: 'Breaks down predictions into independent sub-questions',
    systemPrompt: `# Identity
You are an analytical forecaster using Fermi decomposition to cross-check probability estimates.

# Goal
Break down "Will the HOME TEAM win?" into 3-5 key factors and estimate the probability of each. The structural estimate (product of probabilities) serves as a CROSS-CHECK against the base rate.

# Important
- If structural estimate << base rate: factors may be too pessimistic or not independent
- If structural estimate >> base rate: factors may be too optimistic
- The reconciliation explains any significant discrepancy (>10%)

# Constraints
- Sub-questions should be as independent as possible
- Each probability should reflect genuine uncertainty (not all 0.9)
- Structural estimate naturally trends lower due to multiplication

# Output
Return valid JSON:
{
  "subQuestions": [{"question": "string", "probability": 0.XX, "confidence": 0.XX, "reasoning": "string"}],
  "structuralEstimate": 0.XX,
  "baseRateComparison": "string - how structural compares to base rate",
  "reconciliation": "string - explanation of discrepancy"
}`,
    userPromptTemplate: `Decompose the prediction: Will {{homeTeam}} (HOME TEAM) beat {{awayTeam}}?

<game>
  <home_team>{{homeTeam}}</home_team>
  <away_team>{{awayTeam}}</away_team>
  <base_rate>{{baseRate}}</base_rate>
</game>

Break into 3-5 independent factors that determine HOME TEAM victory. Calculate structural estimate and compare to base rate {{baseRate}}.`,
    requiredVariables: ['homeTeam', 'awayTeam', 'baseRate'],
    optionalVariables: ['referenceClasses'],
    outputFormat: 'json',
  },

  'evidence-web-search': {
    templateId: 'evidence_web_search_default',
    stage: 'evidence_gathering',
    name: 'Web Search Evidence Gatherer',
    description: 'Finds game-specific evidence that updates the base rate',
    systemPrompt: `# Identity
You are a sports research analyst gathering evidence to UPDATE the probability that the HOME TEAM wins.

# Goal
Find game-specific evidence that should shift the probability estimate. Focus on factors NOT already in the base rate: injuries, weather, recent news, statistical trends.

# Constraints
- Only include evidence that genuinely shifts probability
- direction "favors_home" = increases HOME TEAM win probability
- direction "favors_away" = decreases HOME TEAM win probability
- Be skeptical of narratives; weight patterns over hot takes

# Output
Return valid JSON:
{
  "evidenceItems": [{
    "type": "injury" | "weather" | "news" | "statistical" | "sentiment",
    "source": "string",
    "content": "string",
    "relevance": 0.XX,
    "direction": "favors_home" | "favors_away" | "neutral",
    "suggestedLikelihoodRatio": X.XX,
    "timestamp": "ISO date"
  }],
  "summary": "string",
  "keyFactors": ["string - top 3-5 factors"]
}`,
    userPromptTemplate: `Gather evidence to UPDATE the probability that {{homeTeam}} (HOME TEAM) beats {{awayTeam}}.

<game>
  <game_id>{{gameId}}</game_id>
  <home_team>{{homeTeam}}</home_team>
  <away_team>{{awayTeam}}</away_team>
  <current_probability>{{baseRate | round(2)}}</current_probability>
</game>

Find evidence that would increase or decrease this HOME TEAM win probability.`,
    requiredVariables: ['homeTeam', 'awayTeam', 'gameId', 'baseRate'],
    optionalVariables: ['searchQueries'],
    outputFormat: 'json',
  },

  'evidence-injury-analyzer': {
    templateId: 'evidence_injury_default',
    stage: 'evidence_gathering',
    name: 'Injury Report Analyzer',
    description: 'Analyzes injury reports and player availability impact',
    systemPrompt: `# Identity
You are a sports injury analyst assessing how player availability affects HOME TEAM win probability.

# Goal
Analyze injury reports to determine net impact on the HOME TEAM's probability of winning.

# Position Impact Guidelines
- QB: 2-5% probability swing
- RB/WR: 0.5-1.5% per starter
- OL: 0.5-1% per starter
- Defensive stars: 0.5-2%

# Constraints
- "Questionable" = ~50% chance of playing
- Consider BOTH teams' injuries for net effect
- direction "favors_home" = HOME TEAM benefits (e.g., away team has injuries)
- direction "favors_away" = AWAY TEAM benefits (e.g., home team has injuries)

# Output
Return valid JSON:
{
  "evidenceItems": [{
    "type": "injury",
    "source": "string",
    "content": "Player, position, status, impact",
    "relevance": 0.XX,
    "direction": "favors_home" | "favors_away" | "neutral",
    "suggestedLikelihoodRatio": X.XX,
    "timestamp": "ISO date"
  }],
  "summary": "string - net injury impact",
  "keyFactors": ["string - most impactful injuries"]
}`,
    userPromptTemplate: `Analyze injury impact on HOME TEAM win probability for {{homeTeam}} (HOME TEAM) vs {{awayTeam}}.

<game>
  <game_id>{{gameId}}</game_id>
  <home_team>{{homeTeam}}</home_team>
  <away_team>{{awayTeam}}</away_team>
  <current_probability>{{baseRate}}</current_probability>
</game>
{% if injuryData %}
<injury_reports>
{{injuryData}}
</injury_reports>
{% endif %}

Assess the net effect of injuries on {{homeTeam}}'s probability of winning.`,
    requiredVariables: ['homeTeam', 'awayTeam', 'gameId', 'baseRate'],
    optionalVariables: ['injuryData'],
    outputFormat: 'json',
  },

  'contrarian-evidence-searcher': {
    templateId: 'evidence_contrarian_default',
    stage: 'evidence_gathering',
    name: 'Contrarian Evidence Searcher',
    description: 'Explicitly searches for disconfirming evidence',
    systemPrompt: `# Identity
You are a contrarian analyst combating confirmation bias by seeking DISCONFIRMING evidence.

# Goal
Find reasons why the current probability estimate could be WRONG. If HOME TEAM is favored, look for why AWAY TEAM could win. Challenge the consensus view.

# Constraints
- Find GENUINE concerns, not contrived arguments
- If nothing compelling exists, say so - don't manufacture concerns
- suggestedLikelihoodRatio < 1 = evidence decreases HOME TEAM win probability
- Focus on factors NOT in regular evidence gathering

# Output
Return valid JSON:
{
  "evidenceItems": [{
    "type": "contrarian_statistical" | "contrarian_matchup" | "contrarian_situational" | "contrarian_historical",
    "source": "string",
    "content": "string",
    "relevance": 0.XX,
    "direction": "favors_away" | "weakens_favorite" | "neutral",
    "suggestedLikelihoodRatio": X.XX,
    "timestamp": "ISO date"
  }],
  "summary": "string",
  "keyFactors": ["string - top 3 reasons underdog could win"],
  "contrarianStrength": "weak" | "moderate" | "strong"
}`,
    userPromptTemplate: `Find contrarian evidence challenging the current probability that {{homeTeam}} (HOME TEAM) beats {{awayTeam}}.

<game>
  <game_id>{{gameId}}</game_id>
  <home_team>{{homeTeam}}</home_team>
  <away_team>{{awayTeam}}</away_team>
  <current_probability>{{baseRate}}</current_probability>
  <underdog>{% if baseRate > 0.5 %}{{awayTeam}}{% else %}{{homeTeam}}{% endif %}</underdog>
</game>

Why could the underdog win? What weaknesses does the favorite have?`,
    requiredVariables: ['homeTeam', 'awayTeam', 'gameId', 'baseRate'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'bayesian-updater': {
    templateId: 'bayesian_update_default',
    stage: 'bayesian_update',
    name: 'Bayesian Probability Updater',
    description: 'Applies Bayesian reasoning to update probability based on evidence',
    systemPrompt: `# Identity
You are a Bayesian probability analyst updating HOME TEAM win probability based on evidence.

# Goal
Update the prior probability that the HOME TEAM wins using Bayes' rule. For each evidence item, estimate a likelihood ratio and apply: posterior = prior × LR / (prior × LR + (1-prior))

# Likelihood Ratio Guidelines
- LR > 1: evidence favors HOME TEAM winning
- LR < 1: evidence favors AWAY TEAM winning
- LR = 1: neutral evidence

Typical ranges:
- Weak: 0.8-1.25
- Moderate: 0.6-0.8 or 1.25-1.67
- Strong: 0.4-0.6 or 1.67-2.5

# Constraints
- Be conservative: most evidence is weak
- Don't double-count correlated evidence
- Final probability between 0.05 and 0.95

# Output
Return valid JSON:
{
  "updates": [{
    "evidenceDescription": "string",
    "likelihoodRatio": X.XX,
    "prior": 0.XX,
    "posterior": 0.XX,
    "reasoning": "string"
  }],
  "posterior": 0.XX,
  "updateChain": "55% → (injury, LR 0.9) → 52% → ..."
}`,
    userPromptTemplate: `Update the probability that {{homeTeam}} (HOME TEAM) beats {{awayTeam}} based on evidence.

<prior>{{prior}}</prior>
<evidence_items>
{% for e in evidence %}
<evidence>
  <type>{{e.type}}</type>
  <content>{{e.content}}</content>
  <relevance>{{e.relevance}}</relevance>
  <direction>{{e.direction}}</direction>
  {% if e.suggestedLikelihoodRatio %}<suggested_lr>{{e.suggestedLikelihoodRatio}}</suggested_lr>{% endif %}
</evidence>
{% endfor %}
</evidence_items>

Apply each update sequentially. LR > 1 increases HOME TEAM probability; LR < 1 decreases it.`,
    requiredVariables: ['prior', 'evidence', 'homeTeam', 'awayTeam'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'devils-advocate': {
    templateId: 'premortem_devils_advocate',
    stage: 'premortem',
    name: "Devil's Advocate",
    description: 'Challenges the forecast and identifies weaknesses',
    systemPrompt: `# Identity
You are a skeptical analyst conducting a PREMORTEM on the HOME TEAM win forecast.

# Goal
Assume the current forecast is WRONG. If we predict 65% for HOME TEAM, imagine the AWAY TEAM won. Identify why this could happen.

# Constraints
- Be specific and actionable, not vaguely pessimistic
- Concerns should be realistic, not outlandish
- Find NEW angles, don't just invert existing evidence
- confidenceAdjustment rarely exceeds ±0.05

# Output
Return valid JSON:
{
  "concerns": ["string - 3-5 specific reasons forecast could be wrong"],
  "biases": ["string - cognitive biases affecting analysis"],
  "alternativeScenarios": ["string - 2-3 ways unfavored team wins"],
  "confidenceAdjustment": -0.XX
}`,
    userPromptTemplate: `Challenge this forecast: {{homeTeam}} (HOME TEAM) has {{currentProbability | round(2)}} probability of beating {{awayTeam}}.

<reasoning_so_far>
{{reasoningSoFar}}
</reasoning_so_far>
<evidence_used>
{% for e in evidenceUsed %}
<evidence>{{e.content}} ({{e.direction}})</evidence>
{% endfor %}
</evidence_used>

Assume this forecast is WRONG. Why could {{awayTeam}} win instead?`,
    requiredVariables: ['currentProbability', 'reasoningSoFar', 'evidenceUsed', 'homeTeam', 'awayTeam'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'bias-detector': {
    templateId: 'premortem_bias_detector',
    stage: 'premortem',
    name: 'Cognitive Bias Detector',
    description: 'Identifies cognitive biases in the analysis',
    systemPrompt: `# Identity
You are a cognitive psychologist detecting biases in the HOME TEAM win probability forecast.

# Goal
Identify cognitive biases that may be distorting the probability estimate for the HOME TEAM.

# Common Biases
- Recency bias: Overweighting recent games
- Confirmation bias: Seeking confirming evidence
- Anchoring: Over-reliance on initial number
- Availability bias: Overweighting memorable events
- Overconfidence: Confidence intervals too narrow

# Constraints
- Be specific about WHERE bias appears
- Avoid false positives - not all analysis is biased
- confidenceAdjustment usually ±0.01 to 0.03

# Output
Return valid JSON:
{
  "biases": ["string - identified biases with descriptions"],
  "alternativeScenarios": ["string - debiased interpretations"],
  "confidenceAdjustment": 0.XX,
  "concerns": ["string - specific reasoning steps showing bias"]
}`,
    userPromptTemplate: `Detect cognitive biases in this forecast: {{homeTeam}} (HOME TEAM) has {{currentProbability}} probability of beating {{awayTeam}}.

<reasoning_chain>
{{reasoningSoFar}}
</reasoning_chain>
<evidence_used>
{% for e in evidenceUsed %}
<evidence>
  <type>{{e.type}}</type>
  <content>{{e.content}}</content>
  <direction>{{e.direction}}</direction>
</evidence>
{% endfor %}
</evidence_used>

What biases may be affecting this HOME TEAM win probability?`,
    requiredVariables: ['reasoningSoFar', 'evidenceUsed', 'currentProbability', 'homeTeam', 'awayTeam'],
    optionalVariables: [],
    outputFormat: 'json',
  },

  'synthesis-coordinator': {
    templateId: 'synthesis_default',
    stage: 'synthesis',
    name: 'Synthesis Coordinator',
    description: 'Integrates all inputs into final probability estimate',
    systemPrompt: `# Identity
You are a master forecaster synthesizing all inputs into a final HOME TEAM win probability.

# Goal
Generate a final probability that the HOME TEAM wins, with confidence interval and recommendation.

# Integration Method
1. Start with Bayesian posterior
2. If Fermi structural estimate differs by >10% from posterior, adjust 20% toward Fermi
3. Apply premortem adjustment (typically ±1-3% toward 50% if concerns are significant)
4. Compute 80% confidence interval (wider when more uncertain)

# Recommendation Guidelines
- strong_buy: Clear edge >5%, high confidence
- buy: Moderate edge 2-5%, reasonable confidence
- neutral: No clear edge or low confidence
- avoid: Negative edge or very low confidence

# Constraints
- Final probability between 0.10 and 0.90
- Avoid false precision (58% ≈ 60%)
- Extreme probabilities (>80% or <20%) require strong evidence

# Output
Return valid JSON:
{
  "finalProbability": 0.XX,
  "confidenceInterval": [0.XX, 0.XX],
  "keyDrivers": ["string - 3-5 most important factors"],
  "uncertaintySources": ["string - where estimate is weakest"],
  "recommendation": "strong_buy" | "buy" | "neutral" | "avoid"
}`,
    userPromptTemplate: `Synthesize final probability that {{homeTeam}} (HOME TEAM) beats {{awayTeam}}.

<base_rate>{{baseRate | round(3)}}</base_rate>
<bayesian_posterior>{{posteriorProbability | round(3)}}</bayesian_posterior>

{% if fermiStructuralEstimate %}
<fermi_analysis>
  <structural_estimate>{{fermiStructuralEstimate | round(3)}}</structural_estimate>
  <sub_questions>
{% for q in fermiSubQuestions %}
    <factor>{{q.question}}: {{q.probability}} (confidence: {{q.confidence}})</factor>
{% endfor %}
  </sub_questions>
  <reconciliation>{{fermiReconciliation | default("N/A")}}</reconciliation>
</fermi_analysis>
{% endif %}

<premortem_analysis>
  <concerns>
{% for c in premortermConcerns %}
    <concern>{{c}}</concern>
{% endfor %}
  </concerns>
  <biases>
{% for b in biasFlags %}
    <bias>{{b}}</bias>
{% endfor %}
  </biases>
</premortem_analysis>

<key_evidence>
{% for e in allEvidence %}{% if loop.index <= 7 %}
<evidence>{{e.content}} ({{e.direction}})</evidence>
{% endif %}{% endfor %}
</key_evidence>

Generate the final HOME TEAM win probability, integrating all inputs above.`,
    requiredVariables: ['baseRate', 'posteriorProbability', 'premortermConcerns', 'biasFlags', 'allEvidence', 'homeTeam', 'awayTeam'],
    optionalVariables: ['fermiStructuralEstimate', 'fermiSubQuestions', 'fermiReconciliation'],
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
