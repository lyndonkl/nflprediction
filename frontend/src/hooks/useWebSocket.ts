'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WSMessage, ForecastContext, ForecastingStage } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

interface UseWebSocketOptions {
  onConnected?: (clientId: string) => void;
  onStageStart?: (forecastId: string, stage: ForecastingStage) => void;
  onStageComplete?: (forecastId: string, stage: ForecastingStage, outputs: unknown) => void;
  onAgentOutput?: (forecastId: string, stage: ForecastingStage, agentId: string, output: unknown) => void;
  onPipelineComplete?: (forecastId: string, context: ForecastContext) => void;
  onPipelineError?: (forecastId: string, error: string) => void;
  onProgressUpdate?: (forecastId: string, progress: number, stage: ForecastingStage) => void;
  autoReconnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { autoReconnect = true } = options;

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);

        // Resubscribe to forecasts
        subscriptionsRef.current.forEach((forecastId) => {
          ws.send(JSON.stringify({ type: 'subscribe', forecastId }));
        });

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          handleMessage(message);
        } catch {
          console.error('Failed to parse WebSocket message:', event.data);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Auto-reconnect
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [autoReconnect]);

  // Handle incoming messages
  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'connected':
        setClientId(message.clientId);
        options.onConnected?.(message.clientId);
        break;

      case 'stage_start':
        options.onStageStart?.(message.forecastId, message.stage);
        break;

      case 'stage_complete':
        // Use contextUpdate (processed context fields) - contains all updated forecast data
        const updates = message.contextUpdate || {};
        options.onStageComplete?.(message.forecastId, message.stage, updates);
        break;

      case 'agent_output':
        options.onAgentOutput?.(message.forecastId, message.stage, message.agentId, message.output);
        break;

      case 'pipeline_complete':
        options.onPipelineComplete?.(message.forecastId, message.context);
        break;

      case 'pipeline_error':
        options.onPipelineError?.(message.forecastId, message.error);
        break;

      case 'progress_update':
        options.onProgressUpdate?.(message.forecastId, message.progress, message.stage);
        break;

      case 'pong':
        // Keep-alive response, no action needed
        break;
    }
  }, [options]);

  // Subscribe to forecast updates
  const subscribe = useCallback((forecastId: string) => {
    subscriptionsRef.current.add(forecastId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', forecastId }));
    }
  }, []);

  // Unsubscribe from forecast updates
  const unsubscribe = useCallback((forecastId: string) => {
    subscriptionsRef.current.delete(forecastId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', forecastId }));
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    clientId,
    error,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  };
}
