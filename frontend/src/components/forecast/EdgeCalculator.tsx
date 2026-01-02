'use client';

import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

interface EdgeCalculatorProps {
  marketPrice: number;
  agentEstimate?: number | null;
  agentConfidenceInterval?: [number, number] | null;
  initialEstimate?: number;
  onEstimateChange?: (estimate: number) => void;
  onUseAgentEstimate?: () => void;
  homeTeam: string;
  awayTeam: string;
}

/**
 * Edge Calculator - User probability vs market comparison
 *
 * Cognitive Design Principles:
 * - Large slider for primary interaction (Fitts's Law)
 * - Clear visual comparison: user estimate vs market
 * - Color-coded edge indication
 * - Agent suggestion with "Use This" option
 */
export function EdgeCalculator({
  marketPrice,
  agentEstimate,
  agentConfidenceInterval,
  initialEstimate = 0.5,
  onEstimateChange,
  onUseAgentEstimate,
  homeTeam,
  awayTeam,
}: EdgeCalculatorProps) {
  const [userEstimate, setUserEstimate] = useState(initialEstimate);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) / 100;
    setUserEstimate(value);
    onEstimateChange?.(value);
  }, [onEstimateChange]);

  const edge = userEstimate - marketPrice;
  const edgeDisplay = getEdgeDisplay(edge);

  const handleUseAgent = useCallback(() => {
    if (agentEstimate !== null && agentEstimate !== undefined) {
      setUserEstimate(agentEstimate);
      onEstimateChange?.(agentEstimate);
      onUseAgentEstimate?.();
    }
  }, [agentEstimate, onEstimateChange, onUseAgentEstimate]);

  return (
    <div className="space-y-6">
      {/* Main Probability Slider */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-4">
          Your Probability Estimate: {homeTeam} Win
        </label>

        {/* Large percentage display */}
        <div className="text-center mb-4">
          <span className="text-5xl font-bold text-slate-900">
            {(userEstimate * 100).toFixed(0)}%
          </span>
        </div>

        {/* Slider */}
        <div className="relative pt-2 pb-6">
          {/* Track */}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={userEstimate * 100}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gradient-to-r from-red-200 via-slate-200 to-green-200 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-6
                       [&::-webkit-slider-thumb]:h-6
                       [&::-webkit-slider-thumb]:bg-blue-600
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-md
                       [&::-webkit-slider-thumb]:border-2
                       [&::-webkit-slider-thumb]:border-white"
            aria-label={`Probability estimate for ${homeTeam} win`}
          />

          {/* Labels */}
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{awayTeam} wins</span>
            <span>50%</span>
            <span>{homeTeam} wins</span>
          </div>

          {/* Market price marker */}
          <div
            className="absolute top-0 w-0.5 h-5 bg-amber-500"
            style={{ left: `${marketPrice * 100}%`, transform: 'translateX(-50%)' }}
            title={`Market: ${(marketPrice * 100).toFixed(0)}%`}
          >
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-amber-600 whitespace-nowrap">
              Market
            </div>
          </div>
        </div>

        {/* Edge Display */}
        <div className={clsx(
          'flex items-center justify-center gap-2 py-3 rounded-lg mt-4',
          edgeDisplay.bgColor
        )}>
          <edgeDisplay.Icon className={clsx('w-5 h-5', edgeDisplay.textColor)} />
          <span className={clsx('font-semibold', edgeDisplay.textColor)}>
            Edge: {edge > 0 ? '+' : ''}{(edge * 100).toFixed(1)}%
          </span>
        </div>

        {/* Comparison Row */}
        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-500">Your Estimate</div>
            <div className="text-xl font-bold text-slate-900">
              {(userEstimate * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-500">Market Price</div>
            <div className="text-xl font-bold text-slate-900">
              {(marketPrice * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Agent Suggestion (if available) */}
      {agentEstimate !== null && agentEstimate !== undefined && (
        <div className={clsx(
          'bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6',
          Math.abs(agentEstimate - marketPrice) > 0.03 && 'ring-2 ring-blue-300'
        )}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Agent Suggestion</span>
            </div>
            {agentConfidenceInterval && (
              <span className="text-sm text-blue-600">
                {(agentConfidenceInterval[0] * 100).toFixed(0)}% - {(agentConfidenceInterval[1] * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-blue-900">
              {(agentEstimate * 100).toFixed(0)}%
            </span>
            <span className="text-blue-600 ml-2">± {agentConfidenceInterval ? ((agentConfidenceInterval[1] - agentConfidenceInterval[0]) * 50).toFixed(0) : '?'}%</span>
          </div>

          {/* Agent edge */}
          <div className="text-center text-sm text-blue-700 mb-4">
            Agent edge vs market: {agentEstimate - marketPrice > 0 ? '+' : ''}{((agentEstimate - marketPrice) * 100).toFixed(1)}%
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleUseAgent}
              leftIcon={<ArrowRight className="w-4 h-4" />}
              className="flex-1"
            >
              Use This Estimate
            </Button>
            <Button
              variant="outline"
              className="flex-1"
            >
              See Why
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getEdgeDisplay(edge: number): {
  Icon: typeof TrendingUp;
  bgColor: string;
  textColor: string;
} {
  if (edge > 0.03) {
    return {
      Icon: TrendingUp,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    };
  } else if (edge < -0.03) {
    return {
      Icon: TrendingDown,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    };
  }
  return {
    Icon: Minus,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
  };
}
