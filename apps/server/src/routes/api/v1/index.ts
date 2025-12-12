import type { FastifyPluginAsync } from 'fastify';
import usersRoute from './users.js';
import authRoute from './auth.js';
import campaignsRoute from './campaigns.js';
import scenesRoute from './scenes.js';
import tokensRoute from './tokens.js';
import actorsRoute from './actors.js';
import itemsRoute from './items.js';
import combatsRoute from './combats.js';
import chatRoute from './chat.js';
import wallsRoute from './walls.js';
import windowsRoute from './windows.js';
import doorsRoute from './doors.js';
import lightsRoute from './lights.js';
import effectsRoute from './effects.js';
import assetsRoute from './assets.js';
import fogRoute from './fog.js';
import journalsRoute from './journals.js';
import templatesRoute from './templates.js';
import drawingsRoute from './drawings.js';
import tilesRoute from './tiles.js';
import regionsRoute from './regions.js';
import pinsRoute from './pins.js';
import compendiumsRoute from './compendiums.js';
import storageRoute from './storage.js';
import viewportsRoute from './viewports.js';
import pathsRoute from './paths.js';
import docsRoute from './docs.js';

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
        campaigns: '/api/v1/campaigns',
        scenes: '/api/v1/scenes',
        actors: '/api/v1/actors',
        items: '/api/v1/items',
        combats: '/api/v1/combats',
        chat: '/api/v1/campaigns/:campaignId/chat',
        walls: '/api/v1/walls',
        windows: '/api/v1/windows',
        doors: '/api/v1/doors',
        lights: '/api/v1/lights',
        effects: '/api/v1/effects',
        assets: '/api/v1/assets',
        fog: '/api/v1/scenes/:sceneId/fog',
        folders: '/api/v1/campaigns/:campaignId/folders',
        journals: '/api/v1/campaigns/:campaignId/journals',
        pages: '/api/v1/journals/:journalId/pages',
        templates: '/api/v1/scenes/:sceneId/templates',
        drawings: '/api/v1/scenes/:sceneId/drawings',
        tiles: '/api/v1/scenes/:sceneId/tiles',
        regions: '/api/v1/scenes/:sceneId/regions',
        pins: '/api/v1/scenes/:sceneId/pins',
        compendiums: '/api/v1/compendiums',
        compendiumEntries: '/api/v1/compendium-entries/:entryId',
        storage: '/api/v1/storage/quota',
        viewports: '/api/v1/scenes/:sceneId/viewport',
        paths: '/api/v1/scenes/:sceneId/paths',
        docs: '/api/v1/docs',
      },
    };
  });

  // Register API routes
  await fastify.register(usersRoute);
  await fastify.register(authRoute);
  await fastify.register(campaignsRoute);
  await fastify.register(scenesRoute);
  await fastify.register(tokensRoute);
  await fastify.register(actorsRoute);
  await fastify.register(itemsRoute);
  await fastify.register(combatsRoute);
  await fastify.register(chatRoute);
  await fastify.register(wallsRoute);
  await fastify.register(windowsRoute);
  await fastify.register(doorsRoute);
  await fastify.register(lightsRoute);
  await fastify.register(effectsRoute);
  await fastify.register(assetsRoute);
  await fastify.register(fogRoute);
  await fastify.register(journalsRoute);
  await fastify.register(templatesRoute);
  await fastify.register(drawingsRoute);
  await fastify.register(tilesRoute);
  await fastify.register(regionsRoute);
  await fastify.register(pinsRoute);
  await fastify.register(compendiumsRoute);
  await fastify.register(storageRoute);
  await fastify.register(viewportsRoute);
  await fastify.register(pathsRoute);
  await fastify.register(docsRoute);
};

export default apiV1Routes;
