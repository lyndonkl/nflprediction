// Core types for the prediction app

export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  status: 'scheduled' | 'in_progress' | 'final';
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
}

export interface Odds {
  gameId: string;
  homeMoneyline: number;
  awayMoneyline: number;
  spreadLine: number;
  spreadPrice: number;
  totalLine: number;
  overPrice: number;
  underPrice: number;
  updatedAt: Date;
}

export interface Position {
  id: string;
  gameId: string;
  contractType: 'moneyline' | 'spread' | 'total';
  side: 'YES' | 'NO';
  entryPrice: number;
  quantity: number;
  entryTime: Date;
  status: 'open' | 'closed';
}

export interface ForecastContext {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  currentStage: string;
  baseRate: number | null;
  evidence: Evidence[];
  posteriorProbability: number | null;
  finalProbability: number | null;
}

export interface Evidence {
  type: 'injury' | 'weather' | 'news' | 'statistical' | 'sentiment';
  source: string;
  content: string;
  relevance: number;
  direction: 'favors_home' | 'favors_away' | 'neutral';
  likelihoodRatio?: number;
}
