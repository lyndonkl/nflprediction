'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import type { Game, Odds } from '@/types';

interface GameCardProps {
  game: Game;
  odds?: Odds | null;
  edge?: number | null;
  agentStatus?: 'idle' | 'analyzing' | 'complete';
  onClick?: () => void;
}

/**
 * Game Card - Display game info with odds and edge
 *
 * Cognitive Design Principles:
 * - Visual hierarchy: Team scores prominent, odds secondary
 * - Color coding: Green (positive edge), Red (negative), Blue (neutral)
 * - Clear affordance: "Analyze" button for primary action
 * - Scannable layout for dashboard view
 */
export function GameCard({
  game,
  odds,
  edge,
  agentStatus = 'idle',
  onClick,
}: GameCardProps) {
  const statusBadge = getStatusBadge(game.status, game.quarter, game.clock);
  const edgeBadge = edge !== null && edge !== undefined ? getEdgeBadge(edge) : null;

  return (
    <Card
      variant="default"
      interactive
      onClick={onClick}
      className="hover:border-blue-300"
    >
      {/* Header: Conference & Status */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {game.conference || 'CFB'}
        </span>
        <Badge variant={statusBadge.variant} size="sm">
          {statusBadge.label}
        </Badge>
      </div>

      {/* Team Scores - Primary visual element */}
      <div className="space-y-2 mb-4">
        <TeamRow
          name={game.awayTeam}
          ranking={game.awayRanking}
          score={game.awayScore}
          isHome={false}
        />
        <TeamRow
          name={game.homeTeam}
          ranking={game.homeRanking}
          score={game.homeScore}
          isHome={true}
        />
      </div>

      {/* Odds Section - Secondary information */}
      {odds && (
        <div className="border-t border-slate-100 pt-3 space-y-1 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Moneyline</span>
            <span>
              {formatMoneyline(odds.awayMoneyline)} | {formatMoneyline(odds.homeMoneyline)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Spread</span>
            <span>{formatSpread(odds.spread)}</span>
          </div>
        </div>
      )}

      {/* Footer: Edge & Action */}
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {edgeBadge && (
            <Badge variant={edgeBadge.variant} size="sm">
              <edgeBadge.Icon className="w-3 h-3 mr-1" />
              Edge: {edge! > 0 ? '+' : ''}{(edge! * 100).toFixed(1)}%
            </Badge>
          )}
          {agentStatus === 'analyzing' && (
            <Badge variant="info" size="sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
              Analyzing...
            </Badge>
          )}
        </div>

        <Link
          href={`/analyze/${game.id}`}
          className={clsx(
            'inline-flex items-center gap-1 text-sm font-medium',
            'text-blue-600 hover:text-blue-700'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          Analyze
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}

function TeamRow({
  name,
  ranking,
  score,
  isHome,
}: {
  name: string;
  ranking?: number | null;
  score: number | null;
  isHome: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        {ranking && (
          <span className="text-xs text-slate-500">#{ranking}</span>
        )}
        <span className="font-medium text-slate-900">
          {isHome ? '@ ' : ''}{name}
        </span>
      </div>
      <span className={clsx(
        'text-xl font-bold',
        score === null ? 'text-slate-400' : 'text-slate-900'
      )}>
        {score ?? '-'}
      </span>
    </div>
  );
}

function getStatusBadge(
  status: Game['status'],
  quarter?: string,
  clock?: string
): { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' } {
  switch (status) {
    case 'in_progress':
      return {
        label: `LIVE ${quarter || ''} ${clock || ''}`.trim(),
        variant: 'success',
      };
    case 'final':
      return { label: 'FINAL', variant: 'default' };
    case 'scheduled':
    default:
      return { label: 'Scheduled', variant: 'info' };
  }
}

function getEdgeBadge(edge: number): {
  variant: 'success' | 'warning' | 'error';
  Icon: typeof TrendingUp;
} {
  if (edge > 0.03) {
    return { variant: 'success', Icon: TrendingUp };
  } else if (edge < -0.03) {
    return { variant: 'error', Icon: TrendingDown };
  }
  return { variant: 'warning', Icon: Minus };
}

function formatMoneyline(ml: number): string {
  return ml > 0 ? `+${ml}` : String(ml);
}

function formatSpread(spread: number): string {
  if (spread === 0) return 'PK';
  return spread > 0 ? `+${spread}` : String(spread);
}
