import type { FastifyPluginAsync } from 'fastify';
import type { FileCompendiumType, FileCompendiumSearchResult, FileCompendiumEntry } from '@vtt/shared';
import { gameSystemLoader } from '../../../services/gameSystemLoader.js';

/**
 * File-based Compendium API routes
 * Public endpoints for browsing game content from file-based compendiums
 * No authentication required - these are read-only endpoints for SRD/OGL content
 */
const compendiumRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/compendium/:systemId/types - Get available compendium types
   * Returns list of types that have entries for this system
   */
  fastify.get<{ Params: { systemId: string } }>(
    '/compendium/:systemId/types',
    async (request, reply) => {
      const { systemId } = request.params;

      try {
        // Get the system
        const system = gameSystemLoader.getSystem(systemId);

        if (!system) {
          return reply.status(404).send({ error: 'Game system not found' });
        }

        // Get types that have at least one entry
        const types: FileCompendiumType[] = [];
        const allTypes: FileCompendiumType[] = [
          'items',
          'spells',
          'monsters',
          'races',
          'classes',
          'backgrounds',
          'features',
          'conditions',
        ];

        for (const type of allTypes) {
          const entryMap = system.compendium[type];
          if (entryMap && entryMap.size > 0) {
            types.push(type);
          }
        }

        return reply.status(200).send({ types });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch compendium types');
        return reply.status(500).send({ error: 'Failed to fetch compendium types' });
      }
    }
  );

  /**
   * GET /api/v1/compendium/:systemId/:type - List compendium entries
   * Query parameters:
   * - search: Text search (optional)
   * - filter[fieldName]: Filter by field value (optional, can have multiple)
   * - page: Page number (default: 1)
   * - limit: Results per page (default: 20, max: 100)
   */
  fastify.get<{
    Params: { systemId: string; type: string };
    Querystring: {
      search?: string;
      page?: string;
      limit?: string;
      [key: string]: string | undefined;
    };
  }>(
    '/compendium/:systemId/:type',
    async (request, reply) => {
      const { systemId, type } = request.params;
      const { search, page, limit, ...filterParams } = request.query;

      // Validate compendium type
      const validTypes: FileCompendiumType[] = [
        'items',
        'spells',
        'monsters',
        'races',
        'classes',
        'backgrounds',
        'features',
        'conditions',
      ];

      if (!validTypes.includes(type as FileCompendiumType)) {
        return reply.status(400).send({
          error: `Invalid compendium type '${type}'. Valid types: ${validTypes.join(', ')}`,
        });
      }

      try {
        // Parse pagination parameters
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 20;

        if (isNaN(pageNum) || pageNum < 1) {
          return reply.status(400).send({ error: 'Invalid page number' });
        }

        if (isNaN(limitNum) || limitNum < 1) {
          return reply.status(400).send({ error: 'Invalid limit' });
        }

        // Extract filter parameters (those starting with "filter[")
        const filters: Record<string, string | string[]> = {};
        for (const [key, value] of Object.entries(filterParams)) {
          const match = key.match(/^filter\[(.+)\]$/);
          if (match && value !== undefined) {
            const filterKey = match[1];
            filters[filterKey] = value;
          }
        }

        // Get compendium entries from gameSystemLoader
        const result = gameSystemLoader.getCompendiumEntries(
          systemId,
          type as FileCompendiumType,
          {
            search,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
            page: pageNum,
            limit: limitNum,
          }
        );

        // Format response to match FileCompendiumSearchResult
        const response: FileCompendiumSearchResult = {
          entries: result.entries,
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore,
        };

        return reply.status(200).send(response);
      } catch (error) {
        if (error instanceof Error) {
          // Check if error is about system not found
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: error.message });
          }

          // Check if error is about invalid type
          if (error.message.includes('Invalid compendium type')) {
            return reply.status(400).send({ error: error.message });
          }
        }

        fastify.log.error(error, 'Failed to fetch compendium entries');
        return reply.status(500).send({ error: 'Failed to fetch compendium entries' });
      }
    }
  );

  /**
   * GET /api/v1/compendium/:systemId/:type/:entryId - Get single compendium entry
   * Returns a specific entry or 404 if not found
   */
  fastify.get<{
    Params: { systemId: string; type: string; entryId: string };
  }>(
    '/compendium/:systemId/:type/:entryId',
    async (request, reply) => {
      const { systemId, type, entryId } = request.params;

      // Validate compendium type
      const validTypes: FileCompendiumType[] = [
        'items',
        'spells',
        'monsters',
        'races',
        'classes',
        'backgrounds',
        'features',
        'conditions',
      ];

      if (!validTypes.includes(type as FileCompendiumType)) {
        return reply.status(400).send({
          error: `Invalid compendium type '${type}'. Valid types: ${validTypes.join(', ')}`,
        });
      }

      try {
        // Get compendium entry from gameSystemLoader
        const entry = gameSystemLoader.getCompendiumEntry(
          systemId,
          type as FileCompendiumType,
          entryId
        );

        if (!entry) {
          return reply.status(404).send({ error: 'Compendium entry not found' });
        }

        return reply.status(200).send({ entry });
      } catch (error) {
        if (error instanceof Error) {
          // Check if error is about system not found
          if (error.message.includes('not found')) {
            return reply.status(404).send({ error: error.message });
          }

          // Check if error is about invalid type
          if (error.message.includes('Invalid compendium type')) {
            return reply.status(400).send({ error: error.message });
          }
        }

        fastify.log.error(error, 'Failed to fetch compendium entry');
        return reply.status(500).send({ error: 'Failed to fetch compendium entry' });
      }
    }
  );
};

export default compendiumRoute;
