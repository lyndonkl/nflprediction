'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { ForecastContext as ForecastContextType, ForecastingStage } from '@/types';

interface ForecastState {
  activeForecast: ForecastContextType | null;
  forecasts: Map<string, ForecastContextType>;
  isConnected: boolean;
  error: string | null;
}

interface ForecastActions {
  setActiveForecast: (forecast: ForecastContextType | null) => void;
  updateForecast: (forecastId: string, updates: Partial<ForecastContextType>) => void;
  subscribeTo: (forecastId: string) => void;
  unsubscribeFrom: (forecastId: string) => void;
}

const ForecastStateContext = createContext<ForecastState | null>(null);
const ForecastActionsContext = createContext<ForecastActions | null>(null);

export function ForecastProvider({ children }: { children: ReactNode }) {
  const [activeForecast, setActiveForecast] = useState<ForecastContextType | null>(null);
  const [forecasts, setForecasts] = useState<Map<string, ForecastContextType>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const updateForecast = useCallback((forecastId: string, updates: Partial<ForecastContextType>) => {
    setForecasts((prev) => {
      const next = new Map(prev);
      const existing = next.get(forecastId);
      if (existing) {
        next.set(forecastId, { ...existing, ...updates });
      }
      return next;
    });

    // Update active forecast if it's the one being updated
    setActiveForecast((prev) => {
      if (prev?.forecastId === forecastId) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, []);

  // WebSocket handlers
  const handleStageStart = useCallback((forecastId: string, stage: ForecastingStage) => {
    updateForecast(forecastId, { currentStage: stage, status: 'running' });
  }, [updateForecast]);

  const handleStageComplete = useCallback((forecastId: string, stage: ForecastingStage, outputs: unknown) => {
    // Stage complete - could update specific stage outputs here
    console.log('Stage complete:', forecastId, stage, outputs);
  }, []);

  const handlePipelineComplete = useCallback((forecastId: string, context: ForecastContextType) => {
    setForecasts((prev) => {
      const next = new Map(prev);
      next.set(forecastId, context);
      return next;
    });
    setActiveForecast((prev) => {
      if (prev?.forecastId === forecastId) {
        return context;
      }
      return prev;
    });
  }, []);

  const handlePipelineError = useCallback((forecastId: string, errorMsg: string) => {
    updateForecast(forecastId, { status: 'failed' });
    setError(errorMsg);
  }, [updateForecast]);

  const handleProgressUpdate = useCallback((forecastId: string, progress: number, stage: ForecastingStage) => {
    updateForecast(forecastId, { progress, currentStage: stage });
  }, [updateForecast]);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    onStageStart: handleStageStart,
    onStageComplete: handleStageComplete,
    onPipelineComplete: handlePipelineComplete,
    onPipelineError: handlePipelineError,
    onProgressUpdate: handleProgressUpdate,
  });

  const state: ForecastState = {
    activeForecast,
    forecasts,
    isConnected,
    error,
  };

  const actions: ForecastActions = {
    setActiveForecast,
    updateForecast,
    subscribeTo: subscribe,
    unsubscribeFrom: unsubscribe,
  };

  return (
    <ForecastStateContext.Provider value={state}>
      <ForecastActionsContext.Provider value={actions}>
        {children}
      </ForecastActionsContext.Provider>
    </ForecastStateContext.Provider>
  );
}

export function useForecastState() {
  const context = useContext(ForecastStateContext);
  if (!context) {
    throw new Error('useForecastState must be used within a ForecastProvider');
  }
  return context;
}

export function useForecastActions() {
  const context = useContext(ForecastActionsContext);
  if (!context) {
    throw new Error('useForecastActions must be used within a ForecastProvider');
  }
  return context;
}
