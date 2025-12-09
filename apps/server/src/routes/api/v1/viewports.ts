import type { FastifyPluginAsync } from 'fastify';
import { sceneViewports, scenes } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type { SceneViewport, SaveViewportRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Viewport API routes
 * All routes require authentication
 * Handles saving and loading user viewport positions for scenes
 */
const viewportsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/viewport - Get user's viewport for a scene
   * Returns the saved viewport position for the authenticated user on this scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/viewport',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const userId = request.user.id;

      try {
        // Verify scene exists
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user has access to this scene's campaign
        // For now, any authenticated user can access any scene

        // Fetch user's viewport for this scene
        const [viewport] = await fastify.db
          .select()
          .from(sceneViewports)
          .where(
            and(
              eq(sceneViewports.userId, userId),
              eq(sceneViewports.sceneId, sceneId)
            )
          )
          .limit(1);

        if (!viewport) {
          return reply.status(200).send({ viewport: null });
        }

        // Convert to SceneViewport interface
        const formattedViewport: SceneViewport = {
          id: viewport.id,
          userId: viewport.userId,
          sceneId: viewport.sceneId,
          cameraX: viewport.cameraX,
          cameraY: viewport.cameraY,
          zoom: viewport.zoom,
          updatedAt: viewport.updatedAt,
        };

        return reply.status(200).send({ viewport: formattedViewport });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch viewport');
        return reply.status(500).send({ error: 'Failed to fetch viewport' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/viewport - Save user's viewport for a scene
   * Upserts the viewport position for the authenticated user on this scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: SaveViewportRequest }>(
    '/scenes/:sceneId/viewport',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const { cameraX, cameraY, zoom } = request.body;
      const userId = request.user.id;

      // Validate request body
      if (typeof cameraX !== 'number' || typeof cameraY !== 'number' || typeof zoom !== 'number') {
        return reply.status(400).send({ error: 'Invalid viewport data: cameraX, cameraY, and zoom must be numbers' });
      }

      try {
        // Verify scene exists
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user has access to this scene's campaign
        // For now, any authenticated user can save viewport for any scene

        // Upsert viewport
        const upsertedViewports = await fastify.db
          .insert(sceneViewports)
          .values({
            userId,
            sceneId,
            cameraX,
            cameraY,
            zoom,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [sceneViewports.userId, sceneViewports.sceneId],
            set: {
              cameraX,
              cameraY,
              zoom,
              updatedAt: new Date(),
            },
          })
          .returning();

        const upsertedViewport = upsertedViewports[0];

        // Convert to SceneViewport interface
        const formattedViewport: SceneViewport = {
          id: upsertedViewport.id,
          userId: upsertedViewport.userId,
          sceneId: upsertedViewport.sceneId,
          cameraX: upsertedViewport.cameraX,
          cameraY: upsertedViewport.cameraY,
          zoom: upsertedViewport.zoom,
          updatedAt: upsertedViewport.updatedAt,
        };

        return reply.status(200).send({ viewport: formattedViewport });
      } catch (error) {
        fastify.log.error(error, 'Failed to save viewport');
        return reply.status(500).send({ error: 'Failed to save viewport' });
      }
    }
  );
};

export default viewportsRoute;
