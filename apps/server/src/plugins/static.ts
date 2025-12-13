import fp from 'fastify-plugin';
import staticPlugin from '@fastify/static';
import type { FastifyPluginAsync } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Static files plugin configuration
 * Serves:
 * - Uploaded assets from the uploads directory
 * - Game system assets (icons, images) from game-systems directories
 */
const staticFilesPlugin: FastifyPluginAsync = async (fastify) => {
  const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
  const gameSystemsPath = path.join(__dirname, '..', '..', '..', '..', 'game-systems');

  // Serve uploaded files
  await fastify.register(staticPlugin, {
    root: uploadsPath,
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Serve game system assets (core systems)
  await fastify.register(staticPlugin, {
    root: path.join(gameSystemsPath, 'core'),
    prefix: '/game-systems/',
    decorateReply: false,
    // Allow serving SVG files with correct MIME type
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    },
  });

  fastify.log.info(`Static files served from: ${uploadsPath}`);
  fastify.log.info(`Game system assets served from: ${gameSystemsPath}/core`);
};

export default fp(staticFilesPlugin, {
  name: 'static-files-plugin',
});
