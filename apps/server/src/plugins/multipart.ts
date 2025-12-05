import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Multipart plugin configuration
 * Enables file uploads via multipart/form-data
 */
const multipartPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1, // Max 1 file per upload
    },
  });

  fastify.log.info('Multipart file upload enabled (10MB limit)');
};

export default fp(multipartPlugin, {
  name: 'multipart-plugin',
});
