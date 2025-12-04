import type { FastifyPluginAsync } from 'fastify';
import healthRoute from './health.js';
import apiV1Routes from './api/v1/index.js';

/**
 * Register all HTTP routes
 */
const routes: FastifyPluginAsync = async (fastify) => {
  // Register health check route
  await fastify.register(healthRoute);

  // Register API v1 routes with prefix
  await fastify.register(apiV1Routes, { prefix: '/api/v1' });

  fastify.log.info('All HTTP routes registered');
};

export default routes;
