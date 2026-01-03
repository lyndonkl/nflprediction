'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Circle, AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { FermiSubQuestion } from '@/types';

interface FermiDecompositionPanelProps {
  subQuestions: FermiSubQuestion[];
  structuralEstimate: number | null;
  baseRate: number | null;
  reconciliation: string | null;
  className?: string;
}

/**
 * Fermi Decomposition Panel
 *
 * Cognitive Design Principles:
 * - Progressive Disclosure: Collapsed by default, expandable for details
 * - Miller's Law: 3-5 sub-questions (within 7+/-2 range)
 * - Visual Hierarchy: Structural estimate prominent, sub-questions secondary
 * - Dual Coding: Text + visual probability bars
 */
export function FermiDecompositionPanel({
  subQuestions,
  structuralEstimate,
  baseRate,
  reconciliation,
  className,
}: FermiDecompositionPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!subQuestions || subQuestions.length === 0) {
    return null;
  }

  // Calculate convergence status
  const gap = baseRate && structuralEstimate
    ? Math.abs(baseRate - structuralEstimate)
    : 0;

  const convergenceStatus = gap < 0.10
    ? 'convergent'
    : gap < 0.20
      ? 'moderate'
      : 'divergent';

  const convergenceColors = {
    convergent: 'text-green-600 bg-green-50',
    moderate: 'text-amber-600 bg-amber-50',
    divergent: 'text-red-600 bg-red-50',
  };

  const convergenceIcons = {
    convergent: <CheckCircle className="w-4 h-4" />,
    moderate: <AlertTriangle className="w-4 h-4" />,
    divergent: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <div className={clsx('bg-white rounded-lg border border-slate-200', className)}>
      {/* Collapsed Header (Tier 1 - Casual User View) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          <div className="text-left">
            <h3 className="font-medium text-slate-900">Fermi Decomposition</h3>
            <p className="text-sm text-slate-500">
              {subQuestions.length} factors analyzed → {structuralEstimate ? `${Math.round(structuralEstimate * 100)}%` : '—'} structural
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Convergence Badge */}
          <span className={clsx(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            convergenceColors[convergenceStatus]
          )}>
            {convergenceIcons[convergenceStatus]}
            {convergenceStatus === 'convergent' && 'Convergent'}
            {convergenceStatus === 'moderate' && 'Investigate'}
            {convergenceStatus === 'divergent' && 'Divergent'}
          </span>

          {/* Expand Icon */}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Comparison Bar (Always Visible) */}
      <div className="px-4 pb-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">Base Rate</span>
              <span className="font-medium">{baseRate ? `${Math.round(baseRate * 100)}%` : '—'}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(baseRate || 0) * 100}%` }}
              />
            </div>
          </div>

          <span className="text-slate-400 font-mono">vs</span>

          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">Structural</span>
              <span className="font-medium">{structuralEstimate ? `${Math.round(structuralEstimate * 100)}%` : '—'}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${(structuralEstimate || 0) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-right min-w-[60px]">
            <span className="text-xs text-slate-500">Gap</span>
            <p className="font-medium text-slate-700">{Math.round(gap * 100)}%</p>
          </div>
        </div>
      </div>

      {/* Expanded Content (Tier 2 - Power User View) */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Sub-Questions with Multiplication Chain */}
          <div className="space-y-3">
            {subQuestions.map((sq, index) => (
              <div key={index}>
                {/* Sub-question Card */}
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{sq.question}</p>
                      <p className="text-xs text-slate-500 mt-1">{sq.reasoning}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-slate-900">
                        {Math.round(sq.probability * 100)}%
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <ConfidenceIndicator confidence={sq.confidence} />
                        <span className="text-xs text-slate-500 capitalize">{sq.confidence}</span>
                      </div>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${sq.probability * 100}%` }}
                    />
                  </div>
                </div>

                {/* Multiplication Symbol (except after last item) */}
                {index < subQuestions.length - 1 && (
                  <div className="flex justify-center py-1">
                    <span className="text-slate-400 font-mono text-lg">×</span>
                  </div>
                )}
              </div>
            ))}

            {/* Equals and Structural Estimate */}
            <div className="flex justify-center py-1">
              <span className="text-slate-600 font-mono text-lg">=</span>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Structural Estimate</p>
                  <p className="text-xs text-purple-600 font-mono mt-1">
                    {subQuestions.map(sq => sq.probability.toFixed(2)).join(' × ')} = {structuralEstimate?.toFixed(2)}
                  </p>
                </div>
                <span className="text-2xl font-bold text-purple-700">
                  {structuralEstimate ? `${Math.round(structuralEstimate * 100)}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Reconciliation Note */}
          {reconciliation && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Reconciliation: </span>
                {reconciliation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Confidence indicator using consistent icon system
 */
function ConfidenceIndicator({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'text-green-500',
    medium: 'text-amber-500',
    low: 'text-slate-400',
  };

  // Filled, half-filled, or empty circle based on confidence
  if (confidence === 'high') {
    return <Circle className={clsx('w-3 h-3 fill-current', colors.high)} />;
  }
  if (confidence === 'medium') {
    return (
      <div className="relative w-3 h-3">
        <Circle className={clsx('w-3 h-3 absolute', colors.medium)} />
        <div className="absolute inset-0 overflow-hidden w-1/2">
          <Circle className={clsx('w-3 h-3 fill-current', colors.medium)} />
        </div>
      </div>
    );
  }
  return <Circle className={clsx('w-3 h-3', colors.low)} />;
}
