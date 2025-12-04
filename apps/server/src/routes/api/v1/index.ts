import type { FastifyPluginAsync } from 'fastify';
import usersRoute from './users.js';
import authRoute from './auth.js';
import gamesRoute from './games.js';
import scenesRoute from './scenes.js';
import tokensRoute from './tokens.js';
import actorsRoute from './actors.js';
import combatsRoute from './combats.js';
import chatRoute from './chat.js';

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
        scenes: '/api/v1/scenes',
        actors: '/api/v1/actors',
        combats: '/api/v1/combats',
        chat: '/api/v1/games/:gameId/chat',
      },
    };
  });

  // Register API routes
  await fastify.register(usersRoute);
  await fastify.register(authRoute);
  await fastify.register(gamesRoute);
  await fastify.register(scenesRoute);
  await fastify.register(tokensRoute);
  await fastify.register(actorsRoute);
  await fastify.register(combatsRoute);
  await fastify.register(chatRoute);
};

export default apiV1Routes;
