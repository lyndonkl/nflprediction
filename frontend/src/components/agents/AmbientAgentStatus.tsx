'use client';

import { clsx } from 'clsx';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface AmbientAgentStatusProps {
  totalAgents: number;
  workingAgents: number;
  completedAgents: number;
  errorAgents: number;
  currentPhase?: string;
  onClick?: () => void;
  expanded?: boolean;
}

/**
 * Ambient Agent Status Indicator
 *
 * Cognitive Design Principles Applied:
 * - Single aggregate indicator (reduces visual noise)
 * - Color coding: Blue (working), Green (done), Red (error)
 * - Click to expand for progressive disclosure
 * - Fits one working memory chunk
 */
export function AmbientAgentStatus({
  totalAgents,
  workingAgents,
  completedAgents,
  errorAgents,
  currentPhase,
  onClick,
  expanded = false,
}: AmbientAgentStatusProps) {
  // Determine aggregate state (single visual encoding)
  const state = errorAgents > 0
    ? 'error'
    : workingAgents > 0
    ? 'working'
    : completedAgents === totalAgents
    ? 'complete'
    : 'idle';

  // Single text summary - fits one chunk
  const summary = (() => {
    switch (state) {
      case 'error':
        return `${errorAgents} agent error${errorAgents > 1 ? 's' : ''}`;
      case 'working':
        return `${workingAgents} agent${workingAgents > 1 ? 's' : ''} analyzing...`;
      case 'complete':
        return 'Analysis complete';
      default:
        return 'Ready';
    }
  })();

  const stateStyles = {
    idle: 'text-slate-500',
    working: 'text-blue-600',
    complete: 'text-green-600',
    error: 'text-red-600',
  };

  const dotStyles = {
    idle: 'bg-slate-400',
    working: 'bg-blue-500 animate-pulse',
    complete: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'transition-colors hover:bg-slate-100',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        stateStyles[state]
      )}
      aria-expanded={expanded}
      aria-label={`Agent status: ${summary}. Click to ${expanded ? 'collapse' : 'expand'} details.`}
    >
      {/* Status dot - preattentive feature */}
      {state === 'error' ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <span className={clsx('w-2 h-2 rounded-full', dotStyles[state])} />
      )}

      {/* Text summary */}
      <span className="text-sm font-medium">{summary}</span>

      {/* Current phase hint if working */}
      {currentPhase && state === 'working' && (
        <span className="text-xs text-slate-400">({currentPhase})</span>
      )}

      {/* Expand affordance */}
      <ChevronDown
        className={clsx(
          'w-4 h-4 transition-transform',
          expanded && 'rotate-180'
        )}
      />
    </button>
  );
}
