'use client';

import { useState, useCallback } from 'react';
import type { Game, Odds, ForecastContext, AgentCard, AgentPreset } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with error handling
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Hook for fetching games
export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async (options?: { live?: boolean; date?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.live) params.set('live', 'true');
      if (options?.date) params.set('date', options.date);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<{ games: Game[] }>(`/games${query}`);
      setGames(data.games);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGame = useCallback(async (gameId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ game: Game; odds: Odds | null }>(`/games/${gameId}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch game');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { games, loading, error, fetchGames, fetchGame };
}

// Hook for forecasts
export function useForecasts() {
  const [forecasts, setForecasts] = useState<ForecastContext[]>([]);
  const [currentForecast, setCurrentForecast] = useState<ForecastContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ forecasts: ForecastContext[] }>('/forecast');
      setForecasts(data.forecasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forecasts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchForecast = useCallback(async (forecastId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ context: ForecastContext }>(`/forecast/${forecastId}`);
      setCurrentForecast(data.context);
      return data.context;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const startForecast = useCallback(async (params: {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    gameTime: string;
    preset?: 'quick' | 'balanced' | 'deep';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ forecastId: string; taskId: string; status: string }>('/forecast', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start forecast');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    forecasts,
    currentForecast,
    loading,
    error,
    fetchForecasts,
    fetchForecast,
    startForecast,
    setCurrentForecast,
  };
}

// Hook for agents
export function useAgents() {
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [presets, setPresets] = useState<AgentPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ agents: AgentCard[] }>('/agents');
      setAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPresets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ presets: AgentPreset[] }>('/agents/presets');
      setPresets(data.presets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch presets');
    } finally {
      setLoading(false);
    }
  }, []);

  return { agents, presets, loading, error, fetchAgents, fetchPresets };
}
