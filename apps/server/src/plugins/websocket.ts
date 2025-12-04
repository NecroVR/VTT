import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import type { FastifyPluginAsync } from 'fastify';

/**
 * WebSocket plugin configuration
 * Enables WebSocket support for real-time communication
 */
const websocketPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      clientTracking: true,
    },
  });

  fastify.log.info('WebSocket support enabled');
};

export default fp(websocketPlugin, {
  name: 'websocket-plugin',
});
