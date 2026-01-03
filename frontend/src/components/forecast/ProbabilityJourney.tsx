'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ProbabilityStep, BayesianUpdate, EvidenceItem } from '@/types';

interface ProbabilityJourneyProps {
  steps: ProbabilityStep[];
  finalEstimate: number;
  confidenceInterval?: [number, number];
  marketPrice?: number;
  concerns?: string[];
  biases?: string[];
  recommendation?: string;
  homeTeam: string;
}

/**
 * Probability Journey - Visual story of probability evolution
 *
 * Cognitive Design Principles:
 * - Narrative structure: shows how probability changed through stages
 * - Dual coding: visual timeline + text explanations
 * - Progressive disclosure: expandable details
 * - Clear visual encoding: position for probability, color for direction
 */
export function ProbabilityJourney({
  steps,
  finalEstimate,
  confidenceInterval,
  marketPrice,
  concerns = [],
  biases = [],
  recommendation,
  homeTeam,
}: ProbabilityJourneyProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // D3 visualization for probability flow
  useEffect(() => {
    if (!svgRef.current || steps.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 120;
    const margin = { top: 20, right: 40, bottom: 30, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scalePoint()
      .domain(steps.map((_, i) => String(i)))
      .range([0, innerWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0.3, 0.7])
      .range([innerHeight, 0]);

    // Reference lines
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0.5))
      .attr('y2', yScale(0.5))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '4,4');

    // Market price line (if provided)
    if (marketPrice) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(marketPrice))
        .attr('y2', yScale(marketPrice))
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,3');

      g.append('text')
        .attr('x', innerWidth)
        .attr('y', yScale(marketPrice) - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#f59e0b')
        .attr('font-size', '11px')
        .text(`Market ${(marketPrice * 100).toFixed(0)}%`);
    }

    // Line path
    const line = d3.line<ProbabilityStep>()
      .x((_, i) => xScale(String(i)) || 0)
      .y((d) => yScale(d.probability))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(steps)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Points
    g.selectAll('.point')
      .data(steps)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', (_, i) => xScale(String(i)) || 0)
      .attr('cy', (d) => yScale(d.probability))
      .attr('r', 6)
      .attr('fill', (d) => {
        if (d.direction === 'up') return '#16a34a';
        if (d.direction === 'down') return '#dc2626';
        return '#64748b';
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Y-axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${(+d * 100).toFixed(0)}%`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px');

  }, [steps, marketPrice]);

  const edge = marketPrice ? finalEstimate - marketPrice : null;
  const hasEdge = edge !== null && Math.abs(edge) > 0.03;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">
        Your Probability Journey
      </h3>

      {/* D3 Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <svg ref={svgRef} className="w-full" style={{ height: 120 }} />
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-8 space-y-0">
        {/* Vertical connector line */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

        {steps.map((step, index) => (
          <StepCard
            key={index}
            step={step}
            previousProbability={index > 0 ? steps[index - 1].probability : null}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>

      {/* Premortem Concerns */}
      {(concerns.length > 0 || biases.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            Premortem Check
          </div>
          {concerns.length > 0 && (
            <div className="mb-2">
              <span className="text-sm text-amber-700 font-medium">Concerns:</span>
              <ul className="mt-1 space-y-1">
                {concerns.map((concern, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {biases.length > 0 && (
            <div>
              <span className="text-sm text-amber-700 font-medium">Potential Biases:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {biases.map((bias, i) => (
                  <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    {bias}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Final Estimate Card */}
      <div className={clsx(
        'rounded-lg border-2 p-6 text-center',
        hasEdge && edge! > 0
          ? 'border-green-300 bg-gradient-to-br from-green-50 to-white'
          : hasEdge && edge! < 0
          ? 'border-red-300 bg-gradient-to-br from-red-50 to-white'
          : 'border-slate-200 bg-white'
      )}>
        {/* Primary number */}
        <div className="mb-2">
          <span className="text-5xl font-extrabold text-slate-900">
            {(finalEstimate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="text-sm text-slate-500 mb-4">
          {homeTeam} Win Probability
        </div>

        {/* Confidence interval */}
        {confidenceInterval && (
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="h-2 bg-slate-200 rounded-full w-48 relative">
              <div
                className="absolute h-full bg-blue-400 rounded-full"
                style={{
                  left: `${(confidenceInterval[0] - 0.3) * 250}%`,
                  width: `${(confidenceInterval[1] - confidenceInterval[0]) * 250}%`,
                }}
              />
              <div
                className="absolute w-1 h-4 bg-blue-600 rounded -top-1"
                style={{ left: `${(finalEstimate - 0.3) * 250}%` }}
              />
            </div>
            <span className="text-sm text-slate-600">
              {(confidenceInterval[0] * 100).toFixed(0)}% - {(confidenceInterval[1] * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Edge comparison */}
        {edge !== null && (
          <div className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full',
            hasEdge && edge > 0
              ? 'bg-green-100 text-green-700'
              : hasEdge && edge < 0
              ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-600'
          )}>
            {edge > 0 ? <TrendingUp className="w-4 h-4" /> : edge < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            <span className="font-medium">
              Edge: {edge > 0 ? '+' : ''}{(edge * 100).toFixed(1)}%
            </span>
            <span className="text-sm opacity-80">
              vs Market {marketPrice && `${(marketPrice * 100).toFixed(0)}%`}
            </span>
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-slate-700">{recommendation}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({
  step,
  previousProbability,
  isLast,
}: {
  step: ProbabilityStep;
  previousProbability: number | null;
  isLast: boolean;
}) {
  const delta = previousProbability !== null
    ? step.probability - previousProbability
    : 0;

  return (
    <div className={clsx('relative pb-4', !isLast && 'mb-2')}>
      {/* Probability marker - positioned to align with vertical line */}
      <div className="absolute -left-8 top-1">
        <div className={clsx(
          'w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm',
          step.direction === 'up' ? 'bg-green-100' :
          step.direction === 'down' ? 'bg-red-100' : 'bg-blue-500'
        )}>
          {step.direction === 'up' && (
            <TrendingUp className="w-3 h-3 text-green-600" />
          )}
          {step.direction === 'down' && (
            <TrendingDown className="w-3 h-3 text-red-600" />
          )}
          {step.direction === 'neutral' && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {(step.probability * 100).toFixed(0)}%
            </span>
            {delta !== 0 && (
              <span className={clsx(
                'ml-2 text-sm font-medium',
                delta > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {delta > 0 ? '+' : ''}{(delta * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {step.likelihoodRatio && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
              LR: {step.likelihoodRatio.toFixed(2)}
            </span>
          )}
        </div>

        <p className="text-sm text-slate-700 mb-2">{step.summary}</p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
            {step.agent}
          </span>
        </div>

        {/* Expandable detail */}
        {step.detail && (
          <details className="mt-2">
            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
              View details
            </summary>
            <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
              {step.detail}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to build probability steps from forecast context
 */
export function buildProbabilitySteps(
  baseRate: number | null,
  bayesianUpdates: BayesianUpdate[],
  evidence: EvidenceItem[]
): ProbabilityStep[] {
  const steps: ProbabilityStep[] = [];

  // Base rate step
  if (baseRate !== null) {
    steps.push({
      probability: baseRate,
      source: 'base_rate',
      agent: 'base-rate-calculator',
      summary: `Base rate from historical reference classes`,
      direction: 'neutral',
    });
  }

  // Bayesian update steps
  for (const update of bayesianUpdates) {
    const direction = update.likelihoodRatio > 1 ? 'up' : update.likelihoodRatio < 1 ? 'down' : 'neutral';
    steps.push({
      probability: update.posterior,
      source: 'bayesian_update',
      agent: 'bayesian-updater',
      summary: update.evidenceDescription,
      detail: update.reasoning,
      likelihoodRatio: update.likelihoodRatio,
      direction,
    });
  }

  return steps;
}
