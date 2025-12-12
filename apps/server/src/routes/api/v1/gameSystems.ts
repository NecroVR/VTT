import type { FastifyPluginAsync } from 'fastify';
import { gameSystems } from '@vtt/database';
import { eq, and } from 'drizzle-orm';

/**
 * Game Systems API routes
 * Public endpoints for browsing available game systems
 */
const gameSystemsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/game-systems - List all active game systems
   * Public endpoint - no authentication required
   */
  fastify.get('/game-systems', async (request, reply) => {
    try {
      const activeSystems = await fastify.db
        .select({
          id: gameSystems.id,
          systemId: gameSystems.systemId,
          name: gameSystems.name,
          version: gameSystems.version,
          publisher: gameSystems.publisher,
          description: gameSystems.description,
          type: gameSystems.type,
        })
        .from(gameSystems)
        .where(eq(gameSystems.isActive, true));

      return reply.status(200).send({ gameSystems: activeSystems });
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch game systems');
      return reply.status(500).send({ error: 'Failed to fetch game systems' });
    }
  });

  /**
   * GET /api/v1/game-systems/:systemId - Get full details of a specific game system
   * Public endpoint - no authentication required
   */
  fastify.get<{ Params: { systemId: string } }>(
    '/game-systems/:systemId',
    async (request, reply) => {
      const { systemId } = request.params;

      try {
        const [system] = await fastify.db
          .select()
          .from(gameSystems)
          .where(and(
            eq(gameSystems.systemId, systemId),
            eq(gameSystems.isActive, true)
          ))
          .limit(1);

        if (!system) {
          return reply.status(404).send({ error: 'Game system not found' });
        }

        return reply.status(200).send({ gameSystem: system });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch game system');
        return reply.status(500).send({ error: 'Failed to fetch game system' });
      }
    }
  );

  /**
   * GET /api/v1/game-systems/:systemId/manifest - Get manifest for a game system
   * Public endpoint - no authentication required
   *
   * Note: Since manifestPath is not yet populated in the database,
   * we construct a basic manifest from available data
   */
  fastify.get<{ Params: { systemId: string } }>(
    '/game-systems/:systemId/manifest',
    async (request, reply) => {
      const { systemId } = request.params;

      try {
        const [system] = await fastify.db
          .select({
            systemId: gameSystems.systemId,
            name: gameSystems.name,
            version: gameSystems.version,
            publisher: gameSystems.publisher,
            description: gameSystems.description,
          })
          .from(gameSystems)
          .where(and(
            eq(gameSystems.systemId, systemId),
            eq(gameSystems.isActive, true)
          ))
          .limit(1);

        if (!system) {
          return reply.status(404).send({ error: 'Game system not found' });
        }

        // Construct a basic manifest from available data
        const manifest = {
          id: system.systemId,
          name: system.name,
          version: system.version,
          publisher: system.publisher,
          description: system.description || '',
        };

        return reply.status(200).send({ manifest });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch game system manifest');
        return reply.status(500).send({ error: 'Failed to fetch game system manifest' });
      }
    }
  );
};

export default gameSystemsRoute;
