'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useForecasts } from '@/hooks/useApi';
import { useForecastState, useForecastActions } from '@/context/ForecastContext';
import { PipelineOverview, getStageStatuses, getAgentCounts } from '@/components/agents/PipelineOverview';
import { ProbabilityJourney, buildProbabilitySteps } from '@/components/forecast/ProbabilityJourney';
import { EdgeCalculator } from '@/components/forecast/EdgeCalculator';
import { FermiDecompositionPanel } from '@/components/forecast/FermiDecompositionPanel';
import { CalmProgress } from '@/components/ui/Progress';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { ForecastContext, ProbabilityStep, ForecastingStage } from '@/types';

// Sample forecast for development
const SAMPLE_FORECAST: ForecastContext = {
  forecastId: 'sample-001',
  gameId: 'game-001',
  homeTeam: 'Georgia',
  awayTeam: 'Alabama',
  gameTime: new Date().toISOString(),
  currentStage: 'synthesis',
  status: 'completed',
  progress: 100,
  referenceClasses: [
    { description: 'Top 5 SEC rivalry games', historicalSampleSize: 45, relevanceScore: 0.85, category: 'conference_rivalry' },
    { description: 'Home favorites by 3-7 points', historicalSampleSize: 200, relevanceScore: 0.7, category: 'spread_class' },
  ],
  baseRate: 0.55,
  baseRateConfidence: [0.42, 0.68],
  fermiSubQuestions: [
    { question: 'Can Georgia offense score 24+ points?', probability: 0.75, confidence: 'high', reasoning: 'Georgia averages 32 PPG at home' },
    { question: 'Can Georgia defense hold Alabama under 28?', probability: 0.65, confidence: 'medium', reasoning: 'Top 5 defense but Alabama has elite weapons' },
    { question: 'Will Georgia avoid critical turnovers?', probability: 0.80, confidence: 'medium', reasoning: 'Georgia has low turnover rate this season' },
  ],
  fermiStructuralEstimate: 0.39, // 0.75 * 0.65 * 0.80
  fermiReconciliation: 'Structural estimate (39%) is lower than base rate (55%), suggesting sub-questions may be overly pessimistic or not fully independent',
  evidence: [
    { type: 'injury', source: 'ESPN', content: 'Alabama starting RB questionable with ankle', relevance: 0.7, direction: 'favors_home', suggestedLikelihoodRatio: 1.1, timestamp: new Date().toISOString() },
    { type: 'weather', source: 'Weather.com', content: 'Clear conditions, 55°F expected', relevance: 0.3, direction: 'neutral', timestamp: new Date().toISOString() },
  ],
  bayesianUpdates: [
    { evidenceDescription: 'Alabama RB injury (questionable)', likelihoodRatio: 1.1, prior: 0.55, posterior: 0.57, reasoning: 'Starting RB out reduces Alabama offensive efficiency by ~5%' },
    { evidenceDescription: 'Georgia home field advantage', likelihoodRatio: 1.05, prior: 0.57, posterior: 0.58, reasoning: 'Sanford Stadium has strong home record in big games' },
  ],
  posteriorProbability: 0.58,
  premortermConcerns: [
    'Alabama has historically performed well as slight underdogs in rivalry games',
    'Georgia may be overvalued due to recency bias from recent success',
  ],
  biasFlags: ['Recency bias towards Georgia', 'Home field overweight'],
  confidenceAdjustment: -0.02,
  finalProbability: 0.56,
  confidenceInterval: [0.48, 0.64],
  recommendation: 'Slight edge on Georgia at current market price',
  keyDrivers: ['Alabama RB injury', 'Home field advantage', 'Historical rivalry patterns'],
  agentContributions: {
    reference_class: [{ agentId: 'reference-class-historical', agentName: 'Historical Matchup Finder', output: {}, confidence: 0.8, timestamp: new Date().toISOString(), latencyMs: 2500 }],
    base_rate: [{ agentId: 'base-rate-calculator', agentName: 'Base Rate Calculator', output: {}, confidence: 0.75, timestamp: new Date().toISOString(), latencyMs: 1800 }],
    fermi_decomposition: [{ agentId: 'fermi-decomposer', agentName: 'Fermi Decomposer', output: {}, confidence: 0.7, timestamp: new Date().toISOString(), latencyMs: 2200 }],
    evidence_gathering: [{ agentId: 'evidence-web-search', agentName: 'Web Search Evidence', output: {}, confidence: 0.7, timestamp: new Date().toISOString(), latencyMs: 3200 }],
    bayesian_update: [{ agentId: 'bayesian-updater', agentName: 'Bayesian Updater', output: {}, confidence: 0.8, timestamp: new Date().toISOString(), latencyMs: 2100 }],
    premortem: [{ agentId: 'devils-advocate', agentName: "Devil's Advocate", output: {}, confidence: 0.75, timestamp: new Date().toISOString(), latencyMs: 2400 }],
    synthesis: [{ agentId: 'synthesis-coordinator', agentName: 'Synthesis Coordinator', output: {}, confidence: 0.85, timestamp: new Date().toISOString(), latencyMs: 2000 }],
    calibration: [],
  },
};

export default function ForecastDetailPage() {
  const params = useParams();
  const router = useRouter();
  const forecastId = params.forecastId as string;

  const { fetchForecast, loading } = useForecasts();
  const { activeForecast } = useForecastState();
  const { subscribeTo, setActiveForecast } = useForecastActions();

  const [forecast, setForecast] = useState<ForecastContext | null>(null);
  const [selectedStage, setSelectedStage] = useState<ForecastingStage | null>(null);

  useEffect(() => {
    // Subscribe to updates
    subscribeTo(forecastId);

    // Fetch initial data
    const loadForecast = async () => {
      const data = await fetchForecast(forecastId);
      if (data) {
        setForecast(data);
        setActiveForecast(data);
      } else {
        // Use sample data for development
        setForecast(SAMPLE_FORECAST);
        setActiveForecast(SAMPLE_FORECAST);
      }
    };
    loadForecast();
  }, [forecastId, fetchForecast, subscribeTo, setActiveForecast]);

  // Use active forecast from context (updated via WebSocket) if available
  const displayForecast = activeForecast?.forecastId === forecastId
    ? activeForecast
    : forecast || SAMPLE_FORECAST;

  const isRunning = displayForecast.status === 'running';
  const isComplete = displayForecast.status === 'completed';

  // Build probability steps for visualization
  // Journey: Base Rate → Bayesian Updates → Synthesis (final)
  // Fermi and premortem are shown as separate informational panels
  const probabilitySteps: ProbabilityStep[] = buildProbabilitySteps(
    displayForecast.baseRate,
    displayForecast.bayesianUpdates,
    displayForecast.finalProbability,
    displayForecast.recommendation
  );

  // Fallback if no steps built
  const displaySteps = probabilitySteps.length > 0
    ? probabilitySteps
    : [
        {
          probability: displayForecast.baseRate || 0.5,
          source: 'base_rate' as const,
          agent: 'base-rate-calculator',
          summary: 'Starting base rate from historical reference classes',
          direction: 'neutral' as const,
        },
      ];

  // Market price (would come from odds API)
  const marketPrice = 0.52;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/analyze"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {displayForecast.awayTeam} @ {displayForecast.homeTeam}
            </h1>
            <p className="text-sm text-slate-500">
              Analysis {isRunning ? 'in progress...' : isComplete ? 'complete' : 'pending'}
            </p>
          </div>
        </div>

        {isComplete && (
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ExternalLink className="w-4 h-4" />}
          >
            Export
          </Button>
        )}
      </div>

      {/* Progress indicator (if running) */}
      {isRunning && displayForecast.currentStage && (
        <Card>
          <CardContent>
            <CalmProgress
              progress={displayForecast.progress}
              stage={displayForecast.currentStage.replace('_', ' ')}
              estimatedTimeRemaining={(100 - displayForecast.progress) * 1000}
            />
          </CardContent>
        </Card>
      )}

      {/* Pipeline Overview */}
      <PipelineOverview
        currentStage={displayForecast.currentStage}
        stageStatuses={getStageStatuses(displayForecast, displayForecast.currentStage)}
        agentCounts={getAgentCounts(displayForecast)}
        onStageClick={(stage) => setSelectedStage(selectedStage === stage ? null : stage)}
        compact={true}
      />

      {/* Stage Details Panel (when a stage is selected) */}
      {selectedStage && (
        <StageDetailsPanel
          stage={selectedStage}
          context={displayForecast}
          onClose={() => setSelectedStage(null)}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Probability Journey */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent>
              <ProbabilityJourney
                steps={displaySteps}
                finalEstimate={displayForecast.finalProbability || displayForecast.posteriorProbability || displayForecast.baseRate || 0.5}
                confidenceInterval={displayForecast.confidenceInterval || undefined}
                marketPrice={marketPrice}
                concerns={displayForecast.premortermConcerns}
                biases={displayForecast.biasFlags}
                recommendation={displayForecast.recommendation || undefined}
                homeTeam={displayForecast.homeTeam}
              />
            </CardContent>
          </Card>

          {/* Fermi Decomposition Panel */}
          {displayForecast.fermiSubQuestions && displayForecast.fermiSubQuestions.length > 0 && (
            <FermiDecompositionPanel
              subQuestions={displayForecast.fermiSubQuestions}
              structuralEstimate={displayForecast.fermiStructuralEstimate}
              baseRate={displayForecast.baseRate}
              reconciliation={displayForecast.fermiReconciliation}
            />
          )}

          {/* Key Drivers */}
          {displayForecast.keyDrivers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {displayForecast.keyDrivers.map((driver, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 mt-1">•</span>
                      {driver}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Evidence Summary */}
          {displayForecast.evidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayForecast.evidence.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        item.direction === 'favors_home' ? 'bg-green-100 text-green-700' :
                        item.direction === 'favors_away' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.type}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{item.content}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Source: {item.source}
                          {item.suggestedLikelihoodRatio && (
                            <span className="ml-2">• LR: {item.suggestedLikelihoodRatio.toFixed(2)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Edge Calculator & Actions */}
        <div className="space-y-6">
          <EdgeCalculator
            marketPrice={marketPrice}
            agentEstimate={displayForecast.finalProbability || displayForecast.posteriorProbability}
            agentConfidenceInterval={displayForecast.confidenceInterval}
            initialEstimate={displayForecast.finalProbability || 0.5}
            homeTeam={displayForecast.homeTeam}
            awayTeam={displayForecast.awayTeam}
          />

          {/* Reference Classes */}
          {displayForecast.referenceClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reference Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {displayForecast.referenceClasses.map((rc, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex justify-between text-slate-700">
                        <span>{rc.description}</span>
                        <span className="text-slate-500">n={rc.historicalSampleSize}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${rc.relevanceScore * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Stage Details Panel - shows details for selected stage
 */
function StageDetailsPanel({
  stage,
  context,
  onClose,
}: {
  stage: ForecastingStage;
  context: ForecastContext;
  onClose: () => void;
}) {
  const stageInfo: Record<ForecastingStage, { title: string; description: string }> = {
    reference_class: {
      title: 'Reference Class Analysis',
      description: 'Finding similar historical matchups to establish base expectations',
    },
    base_rate: {
      title: 'Base Rate Calculation',
      description: 'Computing the starting probability from historical reference classes',
    },
    fermi_decomposition: {
      title: 'Fermi Decomposition',
      description: 'Breaking down the question into independent sub-questions',
    },
    evidence_gathering: {
      title: 'Evidence Gathering',
      description: 'Collecting current information about injuries, weather, trends, etc.',
    },
    bayesian_update: {
      title: 'Bayesian Update',
      description: 'Updating probability estimates using collected evidence',
    },
    premortem: {
      title: 'Premortem Analysis',
      description: 'Identifying potential biases and blind spots in the analysis',
    },
    synthesis: {
      title: 'Synthesis',
      description: 'Combining all inputs to generate the final probability estimate',
    },
    calibration: {
      title: 'Calibration',
      description: 'Logging prediction for future accuracy tracking',
    },
  };

  const info = stageInfo[stage];
  const contributions = context.agentContributions?.[stage] || [];

  // Get stage-specific data
  const getStageData = () => {
    switch (stage) {
      case 'reference_class':
        return context.referenceClasses;
      case 'base_rate':
        return { baseRate: context.baseRate, confidence: context.baseRateConfidence };
      case 'fermi_decomposition':
        return {
          subQuestions: context.fermiSubQuestions,
          structuralEstimate: context.fermiStructuralEstimate,
          reconciliation: context.fermiReconciliation,
        };
      case 'evidence_gathering':
        return context.evidence;
      case 'bayesian_update':
        return { updates: context.bayesianUpdates, posterior: context.posteriorProbability };
      case 'premortem':
        return { concerns: context.premortermConcerns, biases: context.biasFlags };
      case 'synthesis':
        return {
          finalProbability: context.finalProbability,
          confidenceInterval: context.confidenceInterval,
          recommendation: context.recommendation,
          keyDrivers: context.keyDrivers,
        };
      default:
        return null;
    }
  };

  const stageData = getStageData();

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">{info.title}</CardTitle>
          <p className="text-sm text-slate-500">{info.description}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Close stage details"
        >
          <span className="text-xl">&times;</span>
        </button>
      </CardHeader>
      <CardContent>
        {/* Agent contributions */}
        {contributions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Agents ({contributions.length})</h4>
            <div className="space-y-2">
              {contributions.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-white rounded">
                  <span className="text-slate-700">{c.agentName || c.agentId}</span>
                  <span className="text-slate-500">{c.latencyMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stage-specific data */}
        {stageData && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Output</h4>
            <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-48 text-slate-600">
              {JSON.stringify(stageData, null, 2)}
            </pre>
          </div>
        )}

        {!contributions.length && !stageData && (
          <p className="text-sm text-slate-500 italic">No data available for this stage yet</p>
        )}
      </CardContent>
    </Card>
  );
}
