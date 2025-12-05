import fp from 'fastify-plugin';
import staticPlugin from '@fastify/static';
import type { FastifyPluginAsync } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Static files plugin configuration
 * Serves uploaded assets from the uploads directory
 */
const staticFilesPlugin: FastifyPluginAsync = async (fastify) => {
  const uploadsPath = path.join(__dirname, '..', '..', 'uploads');

  await fastify.register(staticPlugin, {
    root: uploadsPath,
    prefix: '/uploads/',
    decorateReply: false,
  });

  fastify.log.info(`Static files served from: ${uploadsPath}`);
};

export default fp(staticFilesPlugin, {
  name: 'static-files-plugin',
});
