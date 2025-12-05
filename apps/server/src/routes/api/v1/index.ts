import type { FastifyPluginAsync } from 'fastify';
import usersRoute from './users.js';
import authRoute from './auth.js';
import gamesRoute from './games.js';
import scenesRoute from './scenes.js';
import tokensRoute from './tokens.js';
import actorsRoute from './actors.js';
import itemsRoute from './items.js';
import combatsRoute from './combats.js';
import chatRoute from './chat.js';
import wallsRoute from './walls.js';
import lightsRoute from './lights.js';
import effectsRoute from './effects.js';

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
        items: '/api/v1/items',
        combats: '/api/v1/combats',
        chat: '/api/v1/games/:gameId/chat',
        walls: '/api/v1/walls',
        lights: '/api/v1/lights',
        effects: '/api/v1/effects',
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
  await fastify.register(itemsRoute);
  await fastify.register(combatsRoute);
  await fastify.register(chatRoute);
  await fastify.register(wallsRoute);
  await fastify.register(lightsRoute);
  await fastify.register(effectsRoute);
};

export default apiV1Routes;
