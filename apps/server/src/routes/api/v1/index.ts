import type { FastifyPluginAsync } from 'fastify';
import usersRoute from './users.js';
import authRoute from './auth.js';
import gamesRoute from './games.js';

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
        auth: '/api/v1/auth',
        games: '/api/v1/games',
      },
    };
  });

  // Register API routes
  await fastify.register(usersRoute);
  await fastify.register(authRoute);
  await fastify.register(gamesRoute);
};

export default apiV1Routes;
