'use client';

import { clsx } from 'clsx';
import { StageIndicator } from './StageIndicator';
import { PIPELINE_PHASES, type ForecastingStage, type ForecastContext } from '@/types';

type StageStatus = 'pending' | 'working' | 'complete' | 'error';

interface PipelineOverviewProps {
  currentStage: ForecastingStage | null;
  stageStatuses: Record<ForecastingStage, StageStatus>;
  agentCounts?: Partial<Record<ForecastingStage, number>>;
  onStageClick?: (stage: ForecastingStage) => void;
  compact?: boolean;
}

/**
 * Pipeline Overview - 7 stages chunked into 4 phases
 *
 * Cognitive Design Principles:
 * - Chunking: 7 stages grouped into 4 phases (Research, Analysis, Validation, Output)
 * - Gestalt Proximity: Stages within phase close together, phases separated
 * - Visual Hierarchy: Current phase highlighted, others dimmed
 * - Natural Mapping: Left-to-right flow matches temporal progression
 */
export function PipelineOverview({
  currentStage,
  stageStatuses,
  agentCounts = {},
  onStageClick,
  compact = true,
}: PipelineOverviewProps) {
  // Determine current phase
  const currentPhase = currentStage
    ? PIPELINE_PHASES.find((phase) => phase.stages.includes(currentStage))?.id
    : null;

  return (
    <div
      className={clsx(
        'rounded-lg bg-slate-50 p-4',
        compact ? 'overflow-x-auto' : ''
      )}
      role="region"
      aria-label="Forecasting pipeline progress"
    >
      <div className={clsx(
        'flex',
        compact ? 'gap-6 min-w-max' : 'flex-col md:flex-row gap-4'
      )}>
        {PIPELINE_PHASES.map((phase) => {
          const isCurrentPhase = phase.id === currentPhase;
          const isComplete = phase.stages.every(
            (stage) => stageStatuses[stage] === 'complete'
          );

          return (
            <div
              key={phase.id}
              className={clsx(
                'flex-1 transition-opacity',
                !isCurrentPhase && !isComplete && 'opacity-60'
              )}
            >
              {/* Phase header */}
              <div className="mb-2">
                <span className={clsx(
                  'text-xs font-semibold uppercase tracking-wider',
                  isCurrentPhase ? 'text-blue-600' : 'text-slate-500'
                )}>
                  {phase.name}
                </span>
                <p className="text-xs text-slate-400">{phase.description}</p>
              </div>

              {/* Stages within phase - close proximity = related */}
              <div className={clsx(
                'flex',
                compact ? 'gap-1' : 'flex-col gap-2'
              )}>
                {phase.stages.map((stageId) => (
                  <StageIndicator
                    key={stageId}
                    stage={stageId}
                    status={stageStatuses[stageId] || 'pending'}
                    isActive={currentStage === stageId}
                    agentCount={agentCounts[stageId]}
                    onClick={() => onStageClick?.(stageId)}
                    compact={compact}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Helper to compute stage statuses from ForecastContext
 */
export function getStageStatuses(
  context: Partial<ForecastContext> | null,
  currentStage: ForecastingStage | null,
  error?: string | null
): Record<ForecastingStage, StageStatus> {
  const stages: ForecastingStage[] = [
    'reference_class',
    'base_rate',
    'evidence_gathering',
    'bayesian_update',
    'premortem',
    'synthesis',
    'calibration',
  ];

  const statuses: Record<ForecastingStage, StageStatus> = {
    reference_class: 'pending',
    base_rate: 'pending',
    evidence_gathering: 'pending',
    bayesian_update: 'pending',
    premortem: 'pending',
    synthesis: 'pending',
    calibration: 'pending',
  };

  if (!context) return statuses;

  let foundCurrent = false;

  for (const stage of stages) {
    if (stage === currentStage) {
      statuses[stage] = error ? 'error' : 'working';
      foundCurrent = true;
    } else if (!foundCurrent) {
      // Before current stage = complete (if context has data)
      const contributions = context.agentContributions?.[stage];
      if (contributions && contributions.length > 0) {
        statuses[stage] = 'complete';
      }
    }
    // After current stage stays pending
  }

  return statuses;
}

/**
 * Helper to count agents per stage from ForecastContext
 */
export function getAgentCounts(
  context: Partial<ForecastContext> | null
): Record<ForecastingStage, number> {
  const counts: Record<ForecastingStage, number> = {
    reference_class: 0,
    base_rate: 0,
    evidence_gathering: 0,
    bayesian_update: 0,
    premortem: 0,
    synthesis: 0,
    calibration: 0,
  };

  if (!context?.agentContributions) return counts;

  for (const [stage, contributions] of Object.entries(context.agentContributions)) {
    counts[stage as ForecastingStage] = contributions?.length || 0;
  }

  return counts;
}
