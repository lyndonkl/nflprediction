import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import 'dotenv/config';

import gamesRouter from './routes/games.js';
import forecastRouter from './routes/forecast.js';
import positionsRouter from './routes/positions.js';
import agentsRouter from './routes/agents.js';

import { wsManager } from './websocket/ws.manager.js';
import { wsBroadcaster } from './websocket/ws.broadcaster.js';
import { config } from './config/index.js';
import { serverLogger } from './utils/logger.js';

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/games', gamesRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/agents', agentsRouter);

// Health check
app.get('/health', (_req, res) => {
  const wsStats = wsManager.stats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    websocket: {
      clients: wsStats.totalClients,
      subscriptions: wsStats.totalSubscriptions,
    },
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
wsManager.initialize(server);

// Initialize WebSocket broadcaster (connects pipeline events to WebSocket)
wsBroadcaster.initialize();

// Start server
server.listen(PORT, () => {
  serverLogger.info({ port: PORT }, 'Backend server started');
  serverLogger.info({ path: '/ws' }, 'WebSocket server available');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  serverLogger.info('SIGTERM received, shutting down');
  wsManager.shutdown();
  server.close(() => {
    serverLogger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  serverLogger.info('SIGINT received, shutting down');
  wsManager.shutdown();
  server.close(() => {
    serverLogger.info('Server closed');
    process.exit(0);
  });
});
