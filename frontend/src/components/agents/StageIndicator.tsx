'use client';

import { clsx } from 'clsx';
import { Check, X, Circle, Loader2 } from 'lucide-react';
import type { ForecastingStage } from '@/types';
import { STAGE_INFO } from '@/types';

type StageStatus = 'pending' | 'working' | 'complete' | 'error';

interface StageIndicatorProps {
  stage: ForecastingStage;
  status: StageStatus;
  isActive?: boolean;
  agentCount?: number;
  onClick?: () => void;
  compact?: boolean;
}

/**
 * Individual Stage Indicator
 *
 * Cognitive Design Principles:
 * - Clear status encoding with icons (not color alone)
 * - Compact view fits pipeline overview
 * - Click for progressive disclosure to stage details
 */
export function StageIndicator({
  stage,
  status,
  isActive = false,
  agentCount = 0,
  onClick,
  compact = false,
}: StageIndicatorProps) {
  const info = STAGE_INFO[stage];

  const StatusIcon = {
    pending: Circle,
    working: Loader2,
    complete: Check,
    error: X,
  }[status];

  const statusStyles = {
    pending: 'text-slate-400',
    working: 'text-blue-600',
    complete: 'text-green-600',
    error: 'text-red-600',
  };

  const bgStyles = {
    pending: '',
    working: 'bg-blue-50',
    complete: 'bg-green-50',
    error: 'bg-red-50',
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={clsx(
          'flex flex-col items-center p-2 rounded-md transition-colors relative',
          'hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
          isActive && 'bg-blue-50 ring-2 ring-blue-200',
          bgStyles[status]
        )}
        title={info.description}
        aria-label={`${info.name}: ${status}${agentCount > 1 ? ` (${agentCount} agents in parallel)` : ''}`}
      >
        {/* Agent count badge - prominent when multiple agents */}
        {agentCount > 1 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
            {agentCount}
          </span>
        )}
        <StatusIcon
          className={clsx(
            'w-5 h-5',
            statusStyles[status],
            status === 'working' && 'animate-spin'
          )}
        />
        <span className={clsx(
          'mt-1 text-xs font-medium',
          isActive ? 'text-blue-700' : 'text-slate-600'
        )}>
          {info.shortName}
        </span>
        {agentCount === 1 && (
          <span className="text-xs text-slate-400">(1)</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg transition-colors w-full text-left',
        'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
        isActive && 'bg-blue-50 border border-blue-200',
        status === 'error' && 'bg-red-50 border border-red-200'
      )}
      aria-label={`${info.name}: ${status}. ${info.description}`}
    >
      <StatusIcon
        className={clsx(
          'w-5 h-5 flex-shrink-0',
          statusStyles[status],
          status === 'working' && 'animate-spin'
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={clsx(
            'font-medium truncate',
            isActive ? 'text-blue-900' : 'text-slate-900'
          )}>
            {info.name}
          </span>
          {agentCount > 1 ? (
            <span className="text-xs text-white bg-purple-600 px-2 py-0.5 rounded-full font-medium">
              {agentCount} agents parallel
            </span>
          ) : agentCount === 1 ? (
            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              1 agent
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-500 truncate">{info.description}</p>
      </div>
    </button>
  );
}
