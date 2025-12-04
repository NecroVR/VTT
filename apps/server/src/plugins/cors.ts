import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

/**
 * CORS plugin configuration
 * Enables Cross-Origin Resource Sharing for the API
 */
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: fastify.config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  fastify.log.info(`CORS enabled for origin: ${fastify.config.CORS_ORIGIN}`);
};

export default fp(corsPlugin, {
  name: 'cors-plugin',
});
