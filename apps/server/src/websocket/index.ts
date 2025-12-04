import type { FastifyPluginAsync } from 'fastify';
import { handleGameWebSocket } from './handlers/game.js';

/**
 * Register all WebSocket routes and handlers
 */
const websocketHandlers: FastifyPluginAsync = async (fastify) => {
  // Register WebSocket route at /ws
  fastify.get('/ws', { websocket: true }, handleGameWebSocket);

  fastify.log.info('WebSocket handlers registered at /ws');
};

export default websocketHandlers;
