'use client';

import { useState } from 'react';
import { useForecastState } from '@/context/ForecastContext';
import { AmbientAgentStatus } from '@/components/agents';
import { PipelineOverview, getStageStatuses, getAgentCounts } from '@/components/agents/PipelineOverview';

/**
 * Header Agent Status - Global agent activity indicator
 *
 * Shows ambient status in header, expands to pipeline overview on click
 */
export function HeaderAgentStatus() {
  const { activeForecast, isConnected } = useForecastState();
  const [expanded, setExpanded] = useState(false);

  // Calculate agent statistics from active forecast
  const totalAgents = activeForecast
    ? Object.values(activeForecast.agentContributions).flat().length
    : 0;

  const completedAgents = activeForecast
    ? Object.values(activeForecast.agentContributions)
        .flat()
        .filter((c) => c?.output).length
    : 0;

  const workingAgents = activeForecast?.status === 'running' ? 1 : 0;
  const errorAgents = activeForecast?.status === 'failed' ? 1 : 0;

  // Determine current phase for display
  const currentPhase = activeForecast?.currentStage
    ? getPhaseForStage(activeForecast.currentStage)
    : undefined;

  if (!isConnected && !activeForecast) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="w-2 h-2 bg-slate-400 rounded-full" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <AmbientAgentStatus
        totalAgents={totalAgents || 8}
        workingAgents={workingAgents}
        completedAgents={completedAgents}
        errorAgents={errorAgents}
        currentPhase={currentPhase}
        expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      />

      {/* Expanded pipeline view */}
      {expanded && activeForecast && (
        <div className="absolute right-0 top-full mt-2 w-[600px] bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50">
          <PipelineOverview
            currentStage={activeForecast.currentStage}
            stageStatuses={getStageStatuses(activeForecast, activeForecast.currentStage)}
            agentCounts={getAgentCounts(activeForecast)}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}

function getPhaseForStage(stage: string): string {
  const phaseMap: Record<string, string> = {
    reference_class: 'Research',
    base_rate: 'Research',
    evidence_gathering: 'Analysis',
    bayesian_update: 'Analysis',
    premortem: 'Validation',
    synthesis: 'Output',
    calibration: 'Output',
  };
  return phaseMap[stage] || 'Unknown';
}
