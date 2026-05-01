
import { WebSocketService } from './WebSocketService';

/**
 * WebSocket service singleton instance
 * This allows other parts of the application to access the WebSocket service
 */
let wsServiceInstance: WebSocketService | null = null;

export function setWebSocketService(instance: WebSocketService): void {
  wsServiceInstance = instance;
}

export function getWebSocketService(): WebSocketService {
  if (!wsServiceInstance) {
    throw new Error('WebSocket service not initialized. Call setWebSocketService first.');
  }
  return wsServiceInstance;
}

export function hasWebSocketService(): boolean {
  return wsServiceInstance !== null;
}
