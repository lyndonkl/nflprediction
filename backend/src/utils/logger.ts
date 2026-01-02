import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

/**
 * Create a child logger with context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Logger for pipeline operations
 */
export const pipelineLogger = createLogger({ module: 'pipeline' });

/**
 * Logger for agent operations
 */
export const agentLogger = createLogger({ module: 'agent' });

/**
 * Logger for WebSocket operations
 */
export const wsLogger = createLogger({ module: 'websocket' });

/**
 * Logger for external API calls
 */
export const apiLogger = createLogger({ module: 'external-api' });

/**
 * Logger for server operations
 */
export const serverLogger = createLogger({ module: 'server' });
