import { z } from 'zod';

// ============================================
// Stage 1: Reference Class Selection
// ============================================

export const ReferenceClassInputSchema = z.object({
  gameId: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeRanking: z.number().optional(),
  awayRanking: z.number().optional(),
  conference: z.string(),
  venue: z.string(),
  isRivalry: z.boolean(),
});

export type ReferenceClassInput = z.infer<typeof ReferenceClassInputSchema>;

export const ReferenceClassMatchSchema = z.object({
  description: z.string(),
  historicalSampleSize: z.number(),
  relevanceScore: z.number().min(0).max(1),
  category: z.string(),
});

export type ReferenceClassMatch = z.infer<typeof ReferenceClassMatchSchema>;

export const ReferenceClassOutputSchema = z.object({
  matches: z.array(ReferenceClassMatchSchema),
  reasoning: z.string(),
  recommendedClass: z.string(),
});

export type ReferenceClassOutput = z.infer<typeof ReferenceClassOutputSchema>;

// ============================================
// Stage 2: Base Rate Anchoring
// ============================================

export const BaseRateInputSchema = z.object({
  referenceClasses: z.array(ReferenceClassMatchSchema),
  teamForProbability: z.string(),
});

export type BaseRateInput = z.infer<typeof BaseRateInputSchema>;

export const BaseRateOutputSchema = z.object({
  probability: z.number().min(0).max(1),
  confidenceInterval: z.tuple([z.number(), z.number()]),
  sampleSize: z.number(),
  sources: z.array(z.string()),
  reasoning: z.string(),
});

export type BaseRateOutput = z.infer<typeof BaseRateOutputSchema>;

// ============================================
// Stage 3: Evidence Gathering
// ============================================

export const EvidenceInputSchema = z.object({
  gameId: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  baseRate: z.number(),
  searchQueries: z.array(z.string()).optional(),
});

export type EvidenceInput = z.infer<typeof EvidenceInputSchema>;

export const EvidenceItemSchema = z.object({
  type: z.enum(['injury', 'weather', 'news', 'statistical', 'sentiment']),
  source: z.string(),
  content: z.string(),
  relevance: z.number().min(0).max(1),
  direction: z.enum(['favors_home', 'favors_away', 'neutral']),
  suggestedLikelihoodRatio: z.number().optional(),
  timestamp: z.coerce.date(),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const EvidenceOutputSchema = z.object({
  evidenceItems: z.array(EvidenceItemSchema),
  summary: z.string(),
  keyFactors: z.array(z.string()),
});

export type EvidenceOutput = z.infer<typeof EvidenceOutputSchema>;

// ============================================
// Stage 4: Bayesian Update
// ============================================

export const BayesianUpdateInputSchema = z.object({
  prior: z.number().min(0).max(1),
  evidence: z.array(EvidenceItemSchema),
});

export type BayesianUpdateInput = z.infer<typeof BayesianUpdateInputSchema>;

export const BayesianUpdateSchema = z.object({
  evidenceDescription: z.string(),
  likelihoodRatio: z.number(),
  prior: z.number(),
  posterior: z.number(),
  reasoning: z.string(),
});

export type BayesianUpdate = z.infer<typeof BayesianUpdateSchema>;

export const BayesianUpdateOutputSchema = z.object({
  updates: z.array(BayesianUpdateSchema),
  posterior: z.number().min(0).max(1),
  updateChain: z.string(),
});

export type BayesianUpdateOutput = z.infer<typeof BayesianUpdateOutputSchema>;

// ============================================
// Stage 5: Premortem & Bias Check
// ============================================

export const PremortemInputSchema = z.object({
  currentProbability: z.number().min(0).max(1),
  reasoningSoFar: z.string(),
  evidenceUsed: z.array(EvidenceItemSchema),
});

export type PremortemInput = z.infer<typeof PremortemInputSchema>;

export const PremortemOutputSchema = z.object({
  concerns: z.array(z.string()),
  biases: z.array(z.string()),
  alternativeScenarios: z.array(z.string()),
  confidenceAdjustment: z.number().optional(),
});

export type PremortemOutput = z.infer<typeof PremortemOutputSchema>;

// ============================================
// Stage 6: Synthesis
// ============================================

export const SynthesisInputSchema = z.object({
  baseRate: z.number(),
  posteriorProbability: z.number(),
  premortermConcerns: z.array(z.string()),
  biasFlags: z.array(z.string()),
  allEvidence: z.array(EvidenceItemSchema),
});

export type SynthesisInput = z.infer<typeof SynthesisInputSchema>;

export const SynthesisOutputSchema = z.object({
  finalProbability: z.number().min(0).max(1),
  confidenceInterval: z.tuple([z.number(), z.number()]),
  keyDrivers: z.array(z.string()),
  uncertaintySources: z.array(z.string()),
  recommendation: z.enum(['strong_buy', 'buy', 'neutral', 'avoid']),
});

export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;

// ============================================
// Stage 7: Calibration
// ============================================

export const CalibrationInputSchema = z.object({
  predictionId: z.string(),
  predictedProbability: z.number().min(0).max(1),
  actualOutcome: z.boolean().optional(),
});

export type CalibrationInput = z.infer<typeof CalibrationInputSchema>;

export const CalibrationOutputSchema = z.object({
  predictionLogged: z.boolean(),
  brierScore: z.number().optional(),
  calibrationBucket: z.string(),
  historicalAccuracyInBucket: z.number().optional(),
});

export type CalibrationOutput = z.infer<typeof CalibrationOutputSchema>;

// ============================================
// Probability Step for UI Journey Display
// ============================================

export interface ProbabilityStep {
  probability: number;
  source: 'base_rate' | 'evidence' | 'premortem' | 'synthesis';
  agent: string;
  summary: string;
  detail?: string;
  likelihoodRatio?: number;
  direction?: 'up' | 'down' | 'neutral';
  timestamp: Date;
}
