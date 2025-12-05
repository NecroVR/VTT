import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

/**
 * CORS plugin configuration
 * Enables Cross-Origin Resource Sharing for the API
 * Supports both HTTP and HTTPS origins for development flexibility
 */
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  // Build list of allowed origins (support both HTTP and HTTPS)
  const allowedOrigins = [
    fastify.config.CORS_ORIGIN,
    // Also allow HTTP version if HTTPS is configured (for development)
    fastify.config.CORS_ORIGIN.replace('https://', 'http://'),
    // Allow HTTPS version if HTTP is configured
    fastify.config.CORS_ORIGIN.replace('http://', 'https://'),
  ];

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  fastify.log.info(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
};

export default fp(corsPlugin, {
  name: 'cors-plugin',
});
