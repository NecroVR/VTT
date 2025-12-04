import type { FastifyPluginAsync } from 'fastify';
import usersRoute from './users.js';

/**
 * API v1 routes
 * All routes under /api/v1 prefix
 */
const apiV1Routes: FastifyPluginAsync = async (fastify) => {
  // Placeholder for v1 API routes
  fastify.get('/', async () => {
    return {
      version: 'v1',
      message: 'VTT API v1',
      endpoints: {
        health: '/health',
        websocket: '/ws',
        users: '/api/v1/users',
      },
    };
  });

  // Register API routes
  await fastify.register(usersRoute);

  // TODO: Add more API v1 routes here
  // Example:
  // fastify.register(gamesRoutes, { prefix: '/games' });
  // fastify.register(sessionsRoutes, { prefix: '/sessions' });
};

export default apiV1Routes;
