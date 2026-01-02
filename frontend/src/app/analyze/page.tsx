'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useGames, useForecasts, useAgents } from '@/hooks/useApi';
import { useForecastActions } from '@/context/ForecastContext';
import { PresetSelector } from '@/components/agents';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { Game, AgentPreset } from '@/types';

// Sample games for development
const SAMPLE_GAMES: Game[] = [
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
  },
  {
    id: 'game-003',
    homeTeam: 'Texas',
    awayTeam: 'Oklahoma',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    gameTime: new Date(Date.now() + 172800000).toISOString(),
    conference: 'Big 12',
    homeRanking: 7,
    awayRanking: 12,
  },
];

export default function AnalyzePage() {
  const router = useRouter();
  const { games, loading: gamesLoading, fetchGames } = useGames();
  const { startForecast, loading: forecastLoading } = useForecasts();
  const { presets, fetchPresets } = useAgents();
  const { subscribeTo } = useForecastActions();

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<AgentPreset['id']>('balanced');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGames();
    fetchPresets();
  }, [fetchGames, fetchPresets]);

  // Use sample data if no games from API
  const displayGames = games.length > 0 ? games : SAMPLE_GAMES;

  // Filter games by search
  const filteredGames = displayGames.filter((game) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      game.homeTeam.toLowerCase().includes(q) ||
      game.awayTeam.toLowerCase().includes(q)
    );
  });

  const handleStartAnalysis = async () => {
    if (!selectedGame) return;

    const result = await startForecast({
      gameId: selectedGame.id,
      homeTeam: selectedGame.homeTeam,
      awayTeam: selectedGame.awayTeam,
      gameTime: selectedGame.gameTime,
      preset: selectedPreset as 'quick' | 'balanced' | 'deep',
    });

    if (result) {
      // Subscribe to real-time updates
      subscribeTo(result.forecastId);
      // Navigate to analysis view
      router.push(`/analyze/${result.forecastId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Start Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a game and analysis mode to generate AI-powered probability estimates
        </p>
      </div>

      {/* Game Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            Select Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Games list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {gamesLoading ? (
              <div className="text-center py-8 text-slate-500">Loading games...</div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No games found. Try a different search term.
              </div>
            ) : (
              filteredGames.map((game) => (
                <GameOption
                  key={game.id}
                  game={game}
                  isSelected={selectedGame?.id === game.id}
                  onSelect={() => setSelectedGame(game)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preset Selection */}
      {selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Analysis Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PresetSelector
              selected={selectedPreset}
              onSelect={setSelectedPreset}
              presets={presets.length > 0 ? presets : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary & Start Button */}
      {selectedGame && (
        <Card variant="elevated">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                {selectedGame.awayTeam} @ {selectedGame.homeTeam}
              </h3>
              <p className="text-sm text-slate-500">
                {selectedPreset === 'quick' ? '~30 seconds' :
                 selectedPreset === 'balanced' ? '~2 minutes' : '~5 minutes'}
                {' analysis with '}
                {selectedPreset === 'quick' ? '2' :
                 selectedPreset === 'balanced' ? '5' : '8'} agents
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleStartAnalysis}
              loading={forecastLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Analyses */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Recent Analyses
        </h2>
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">
            Your recent analyses will appear here
          </p>
        </div>
      </section>
    </div>
  );
}

function GameOption({
  game,
  isSelected,
  onSelect,
}: {
  game: Game;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusLabel = game.status === 'in_progress'
    ? `LIVE ${game.quarter || ''}`
    : game.status === 'final'
    ? 'FINAL'
    : 'Upcoming';

  const statusColor = game.status === 'in_progress'
    ? 'text-green-600 bg-green-50'
    : game.status === 'final'
    ? 'text-slate-600 bg-slate-100'
    : 'text-blue-600 bg-blue-50';

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {game.awayRanking && (
            <span className="text-xs text-slate-500">#{game.awayRanking}</span>
          )}
          <span className="font-medium text-slate-900">{game.awayTeam}</span>
          <span className="text-slate-400">@</span>
          {game.homeRanking && (
            <span className="text-xs text-slate-500">#{game.homeRanking}</span>
          )}
          <span className="font-medium text-slate-900">{game.homeTeam}</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {game.conference}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {game.status === 'in_progress' && (
          <div className="text-right">
            <span className="font-bold text-slate-900">{game.awayScore}</span>
            <span className="text-slate-400 mx-1">-</span>
            <span className="font-bold text-slate-900">{game.homeScore}</span>
          </div>
        )}
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
    </button>
  );
}
