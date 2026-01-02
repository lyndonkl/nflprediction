import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type {
  WSClientMessage,
  WSServerMessage,
} from '../types/websocket.types.js';
import { wsLogger } from '../utils/logger.js';
import { generateId } from '../utils/id.generator.js';

export interface ConnectedClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>; // forecast IDs
  connectedAt: Date;
}

/**
 * WebSocket Manager - handles WebSocket connections and subscriptions
 */
class WSManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private subscriptionsByForecast: Map<string, Set<string>> = new Map(); // forecastId -> clientIds

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => this.handleConnection(ws));
    this.wss.on('error', (error) => {
      wsLogger.error({ error }, 'WebSocket server error');
    });

    wsLogger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = generateId();
    const client: ConnectedClient = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);
    wsLogger.info({ clientId }, 'Client connected');

    // Send welcome message
    this.sendToClient(client, {
      type: 'connected',
      clientId,
      timestamp: new Date(),
    });

    // Handle incoming messages
    ws.on('message', (data) => this.handleMessage(client, data.toString()));

    // Handle disconnection
    ws.on('close', () => this.handleDisconnect(client));

    // Handle errors
    ws.on('error', (error) => {
      wsLogger.error({ clientId, error }, 'Client WebSocket error');
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(client: ConnectedClient, data: string): void {
    try {
      const message = JSON.parse(data) as WSClientMessage;

      switch (message.type) {
        case 'subscribe':
          this.subscribe(client, message.forecastId);
          break;
        case 'unsubscribe':
          this.unsubscribe(client, message.forecastId);
          break;
        case 'ping':
          this.sendToClient(client, { type: 'pong', timestamp: new Date() });
          break;
        default:
          wsLogger.warn({ clientId: client.id, message }, 'Unknown message type');
      }
    } catch (error) {
      wsLogger.error({ clientId: client.id, error }, 'Failed to parse message');
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(client: ConnectedClient): void {
    // Remove all subscriptions
    for (const forecastId of client.subscriptions) {
      this.subscriptionsByForecast.get(forecastId)?.delete(client.id);
    }

    this.clients.delete(client.id);
    wsLogger.info({ clientId: client.id }, 'Client disconnected');
  }

  /**
   * Subscribe client to forecast updates
   */
  subscribe(client: ConnectedClient, forecastId: string): void {
    client.subscriptions.add(forecastId);

    if (!this.subscriptionsByForecast.has(forecastId)) {
      this.subscriptionsByForecast.set(forecastId, new Set());
    }
    this.subscriptionsByForecast.get(forecastId)!.add(client.id);

    wsLogger.debug({ clientId: client.id, forecastId }, 'Client subscribed');

    this.sendToClient(client, {
      type: 'subscribed',
      forecastId,
      timestamp: new Date(),
    });
  }

  /**
   * Unsubscribe client from forecast updates
   */
  unsubscribe(client: ConnectedClient, forecastId: string): void {
    client.subscriptions.delete(forecastId);
    this.subscriptionsByForecast.get(forecastId)?.delete(client.id);

    wsLogger.debug({ clientId: client.id, forecastId }, 'Client unsubscribed');

    this.sendToClient(client, {
      type: 'unsubscribed',
      forecastId,
      timestamp: new Date(),
    });
  }

  /**
   * Send message to a specific client
   */
  sendToClient(client: ConnectedClient, message: WSServerMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients subscribed to a forecast
   */
  broadcastToForecast(forecastId: string, message: WSServerMessage): void {
    const clientIds = this.subscriptionsByForecast.get(forecastId);
    if (!clientIds || clientIds.size === 0) return;

    const payload = JSON.stringify(message);
    let sentCount = 0;

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
        sentCount++;
      }
    }

    wsLogger.debug({ forecastId, sentCount }, 'Broadcast sent');
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(message: WSServerMessage): void {
    const payload = JSON.stringify(message);

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): ConnectedClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients subscribed to a forecast
   */
  getSubscribers(forecastId: string): ConnectedClient[] {
    const clientIds = this.subscriptionsByForecast.get(forecastId);
    if (!clientIds) return [];

    return Array.from(clientIds)
      .map((id) => this.clients.get(id))
      .filter((c): c is ConnectedClient => c !== undefined);
  }

  /**
   * Get connection statistics
   */
  stats(): {
    totalClients: number;
    totalSubscriptions: number;
    forecastsWithSubscribers: number;
  } {
    let totalSubscriptions = 0;
    for (const client of this.clients.values()) {
      totalSubscriptions += client.subscriptions.size;
    }

    return {
      totalClients: this.clients.size,
      totalSubscriptions,
      forecastsWithSubscribers: this.subscriptionsByForecast.size,
    };
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.wss) {
      // Close all client connections
      for (const client of this.clients.values()) {
        client.ws.close();
      }
      this.wss.close();
      this.clients.clear();
      this.subscriptionsByForecast.clear();
      wsLogger.info('WebSocket server shut down');
    }
  }
}

// Singleton instance
export const wsManager = new WSManager();
