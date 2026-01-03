import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // External APIs
  oddsApiKey: process.env.ODDS_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // LLM Settings
  llm: {
    provider: 'openai' as const,
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '16000', 10),
  },

  // Pipeline Settings
  pipeline: {
    defaultTimeout: parseInt(process.env.PIPELINE_TIMEOUT || '120000', 10),
    stageTimeout: parseInt(process.env.STAGE_TIMEOUT || '30000', 10),
    progressBroadcastInterval: 2000, // ms
  },

  // Cache TTLs (in ms)
  cache: {
    liveGame: 5000,
    scheduledGame: 60000,
    odds: 60000,
    referenceClass: 86400000, // 24h
  },

  // ESPN API
  espn: {
    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football',
  },

  // Odds API
  oddsApi: {
    baseUrl: 'https://api.the-odds-api.com/v4',
    sport: 'americanfootball_ncaaf',
  },

  // Web Search Configuration for Responses API
  webSearch: {
    enabled: true,
    searchContextSize: 'medium' as const, // low | medium | high
    allowedDomains: [
      'espn.com',
      '247sports.com',
      'sports-reference.com',
      'collegefootballnews.com',
      'si.com',
      'cbssports.com',
      'foxsports.com',
      'bleacherreport.com',
      'on3.com',
      'rivals.com',
    ],
    userLocation: {
      type: 'approximate' as const,
      country: 'US',
      timezone: 'America/New_York',
    },
  },
};

export type Config = typeof config;
