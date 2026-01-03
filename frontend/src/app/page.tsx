'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Filter, Calendar } from 'lucide-react';
import { useGames } from '@/hooks/useApi';
import { GameCard } from '@/components/games';
import { Button } from '@/components/ui';
import type { Game, Odds } from '@/types';

// Sample data for development
const SAMPLE_GAMES: (Game & { odds?: Odds })[] = [
  {
    id: 'game-001',
    homeTeam: 'Georgia',
    awayTeam: 'Alabama',
    homeScore: 21,
    awayScore: 17,
    status: 'in_progress',
    quarter: 'Q3',
    clock: '8:42',
    gameTime: new Date().toISOString(),
    conference: 'SEC',
    homeRanking: 3,
    awayRanking: 1,
    odds: {
      homeMoneyline: -150,
      awayMoneyline: 130,
      spread: -3.5,
      overUnder: 52.5,
      source: 'DraftKings',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: 'game-002',
    homeTeam: 'Ohio State',
    awayTeam: 'Michigan',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    gameTime: new Date(Date.now() + 86400000).toISOString(),
    conference: 'Big Ten',
    homeRanking: 2,
    awayRanking: 5,
    odds: {
      homeMoneyline: -200,
      awayMoneyline: 170,
      spread: -6.5,
      overUnder: 48.5,
      source: 'FanDuel',
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: 'game-003',
    homeTeam: 'Texas',
    awayTeam: 'Oklahoma',
    homeScore: 28,
    awayScore: 31,
    status: 'final',
    gameTime: new Date(Date.now() - 86400000).toISOString(),
    conference: 'Big 12',
    homeRanking: 7,
    awayRanking: 12,
  },
  {
    id: 'game-004',
    homeTeam: 'Clemson',
    awayTeam: 'Florida State',
    homeScore: 14,
    awayScore: 10,
    status: 'in_progress',
    quarter: 'Q2',
    clock: '3:15',
    gameTime: new Date().toISOString(),
    conference: 'ACC',
    homeRanking: 8,
    awayRanking: null,
    odds: {
      homeMoneyline: -180,
      awayMoneyline: 155,
      spread: -5,
      overUnder: 45.5,
      source: 'BetMGM',
      updatedAt: new Date().toISOString(),
    },
  },
];

export default function Dashboard() {
  const { games, loading, error, fetchGames } = useGames();
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [conference, setConference] = useState<string>('all');

  // Use sample data for now, real API integration later
  const displayGames = games.length > 0 ? games : SAMPLE_GAMES;

  // Filter games
  const filteredGames = displayGames.filter((game) => {
    if (filter === 'live' && game.status !== 'in_progress') return false;
    if (filter === 'upcoming' && game.status !== 'scheduled') return false;
    if (conference !== 'all' && game.conference !== conference) return false;
    return true;
  });

  // Group games by status for better organization
  const liveGames = filteredGames.filter((g) => g.status === 'in_progress');
  const upcomingGames = filteredGames.filter((g) => g.status === 'scheduled');
  const completedGames = filteredGames.filter((g) => g.status === 'final');

  useEffect(() => {
    // Fetch games from API on mount
    fetchGames();
  }, [fetchGames]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Games</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track games and identify betting opportunities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['all', 'live', 'upcoming'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'all' ? 'All' : f === 'live' ? 'Live' : 'Upcoming'}
              </button>
            ))}
          </div>

          {/* Conference filter - dynamically built from game data */}
          <select
            value={conference}
            onChange={(e) => setConference(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          >
            <option value="all">All Conferences</option>
            {Array.from(new Set(displayGames.map(g => g.conference).filter(Boolean)))
              .sort()
              .map(conf => (
                <option key={conf} value={conf}>{conf}</option>
              ))
            }
          </select>

          {/* Refresh button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchGames()}
            loading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Live Games Section */}
      {liveGames.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                odds={(game as typeof SAMPLE_GAMES[0]).odds}
                edge={0.08} // Would come from forecast
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Games Section */}
      {upcomingGames.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            Upcoming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                odds={(game as typeof SAMPLE_GAMES[0]).odds}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Games Section */}
      {completedGames.length > 0 && (filter === 'all') && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Completed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                odds={(game as typeof SAMPLE_GAMES[0]).odds}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {filteredGames.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No games found</h3>
          <p className="text-sm text-slate-500">
            {filter === 'live'
              ? 'No games are currently live. Check back during game times.'
              : 'No games match your current filters.'}
          </p>
        </div>
      )}
    </div>
  );
}
