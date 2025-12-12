import type { FastifyPluginAsync } from 'fastify';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Documentation routes
 * Serves markdown documentation files
 */
const docsRoute: FastifyPluginAsync = async (fastify) => {
  // Get the markup reference documentation
  fastify.get('/docs/markup-reference', async (request, reply) => {
    try {
      // In Docker, docs is at /app/docs. In dev, relative to cwd.
      // Try both paths
      const possiblePaths = [
        join(process.cwd(), 'docs', 'guides', 'DOCUMENT_MARKUP_REFERENCE.md'),
        join('/app', 'docs', 'guides', 'DOCUMENT_MARKUP_REFERENCE.md'),
      ];

      let content: string | null = null;
      for (const docsPath of possiblePaths) {
        try {
          content = await readFile(docsPath, 'utf-8');
          break;
        } catch {
          // Try next path
        }
      }

      if (!content) {
        throw new Error('Documentation file not found');
      }

      reply.type('text/plain; charset=utf-8');
      return content;
    } catch (err) {
      fastify.log.error('Failed to read documentation file: %s', err instanceof Error ? err.message : String(err));
      reply.status(404);
      return { error: 'Documentation not found' };
    }
  });

  // List available documentation
  fastify.get('/docs', async () => {
    return {
      documents: [
        {
          id: 'markup-reference',
          title: 'VTTMark Document Markup Reference',
          description: 'Complete reference for the VTTMark document markup language',
          path: '/api/v1/docs/markup-reference'
        }
      ]
    };
  });
};

export default docsRoute;
