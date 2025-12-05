import type { FastifyPluginAsync } from 'fastify';
import { scenes, campaigns } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Scene, CreateSceneRequest, UpdateSceneRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Scene API routes
 * All routes require authentication
 * Handles CRUD operations for scenes
 */
const scenesRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/games/:campaignId/scenes - List all scenes for a campaign
   * Returns scenes for a specific game
   */
  fastify.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/scenes',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;

      try {
        // Verify campaign exists and user has access to it
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user is a participant in the campaign (for now, any authenticated user can access)
        // This could be enhanced with a campaign_participants table

        // Fetch all scenes for the campaign
        const gameScenes = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.campaignId, campaignId));

        // Convert to Scene interface
        const formattedScenes: Scene[] = gameScenes.map(scene => ({
          id: scene.id,
          campaignId: scene.campaignId,
          name: scene.name,
          active: scene.active,
          backgroundImage: scene.backgroundImage,
          backgroundWidth: scene.backgroundWidth,
          backgroundHeight: scene.backgroundHeight,
          gridType: scene.gridType,
          gridSize: scene.gridSize,
          gridColor: scene.gridColor,
          gridAlpha: scene.gridAlpha,
          gridDistance: scene.gridDistance,
          gridUnits: scene.gridUnits,
          tokenVision: scene.tokenVision,
          fogExploration: scene.fogExploration,
          globalLight: scene.globalLight,
          darkness: scene.darkness,
          initialX: scene.initialX,
          initialY: scene.initialY,
          initialScale: scene.initialScale,
          navOrder: scene.navOrder,
          data: scene.data as Record<string, unknown>,
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt,
        }));

        return reply.status(200).send({ scenes: formattedScenes });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch scenes');
        return reply.status(500).send({ error: 'Failed to fetch scenes' });
      }
    }
  );

  /**
   * GET /api/v1/scenes/:sceneId - Get a single scene
   * Returns a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

      try {
        // Fetch scene
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // Convert to Scene interface
        const formattedScene: Scene = {
          id: scene.id,
          campaignId: scene.campaignId,
          name: scene.name,
          active: scene.active,
          backgroundImage: scene.backgroundImage,
          backgroundWidth: scene.backgroundWidth,
          backgroundHeight: scene.backgroundHeight,
          gridType: scene.gridType,
          gridSize: scene.gridSize,
          gridColor: scene.gridColor,
          gridAlpha: scene.gridAlpha,
          gridDistance: scene.gridDistance,
          gridUnits: scene.gridUnits,
          tokenVision: scene.tokenVision,
          fogExploration: scene.fogExploration,
          globalLight: scene.globalLight,
          darkness: scene.darkness,
          initialX: scene.initialX,
          initialY: scene.initialY,
          initialScale: scene.initialScale,
          navOrder: scene.navOrder,
          data: scene.data as Record<string, unknown>,
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt,
        };

        return reply.status(200).send({ scene: formattedScene });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch scene');
        return reply.status(500).send({ error: 'Failed to fetch scene' });
      }
    }
  );

  /**
   * POST /api/v1/games/:campaignId/scenes - Create a new scene
   * Creates a scene for a specific game
   */
  fastify.post<{ Params: { campaignId: string }; Body: CreateSceneRequest }>(
    '/campaigns/:campaignId/scenes',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;
      const sceneData = request.body;

      try {
        // Verify campaign exists and user has access to it
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user is the campaign owner or has permission to create scenes

        // Create scene in database
        const newScenes = await fastify.db
          .insert(scenes)
          .values({
            campaignId,
            name: sceneData.name,
            active: sceneData.active ?? false,
            backgroundImage: sceneData.backgroundImage ?? null,
            backgroundWidth: sceneData.backgroundWidth ?? null,
            backgroundHeight: sceneData.backgroundHeight ?? null,
            gridType: sceneData.gridType ?? 'square',
            gridSize: sceneData.gridSize ?? 100,
            gridColor: sceneData.gridColor ?? '#000000',
            gridAlpha: sceneData.gridAlpha ?? 0.2,
            gridDistance: sceneData.gridDistance ?? 5,
            gridUnits: sceneData.gridUnits ?? 'ft',
            tokenVision: sceneData.tokenVision ?? true,
            fogExploration: sceneData.fogExploration ?? true,
            globalLight: sceneData.globalLight ?? true,
            darkness: sceneData.darkness ?? 0,
            initialX: sceneData.initialX ?? null,
            initialY: sceneData.initialY ?? null,
            initialScale: sceneData.initialScale ?? 1,
            navOrder: sceneData.navOrder ?? 0,
            data: sceneData.data ?? {},
          })
          .returning();

        const newScene = newScenes[0];

        // Convert to Scene interface
        const formattedScene: Scene = {
          id: newScene.id,
          campaignId: newScene.campaignId,
          name: newScene.name,
          active: newScene.active,
          backgroundImage: newScene.backgroundImage,
          backgroundWidth: newScene.backgroundWidth,
          backgroundHeight: newScene.backgroundHeight,
          gridType: newScene.gridType,
          gridSize: newScene.gridSize,
          gridColor: newScene.gridColor,
          gridAlpha: newScene.gridAlpha,
          gridDistance: newScene.gridDistance,
          gridUnits: newScene.gridUnits,
          tokenVision: newScene.tokenVision,
          fogExploration: newScene.fogExploration,
          globalLight: newScene.globalLight,
          darkness: newScene.darkness,
          initialX: newScene.initialX,
          initialY: newScene.initialY,
          initialScale: newScene.initialScale,
          navOrder: newScene.navOrder,
          data: newScene.data as Record<string, unknown>,
          createdAt: newScene.createdAt,
          updatedAt: newScene.updatedAt,
        };

        return reply.status(201).send({ scene: formattedScene });
      } catch (error) {
        fastify.log.error(error, 'Failed to create scene');
        return reply.status(500).send({ error: 'Failed to create scene' });
      }
    }
  );

  /**
   * PATCH /api/v1/scenes/:sceneId - Update a scene
   * Updates a specific scene
   */
  fastify.patch<{ Params: { sceneId: string }; Body: UpdateSceneRequest }>(
    '/scenes/:sceneId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const updates = request.body;

      try {
        // Check if scene exists
        const [existingScene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!existingScene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user has permission to update this scene

        // Update scene in database
        const updatedScenes = await fastify.db
          .update(scenes)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(scenes.id, sceneId))
          .returning();

        const updatedScene = updatedScenes[0];

        // Convert to Scene interface
        const formattedScene: Scene = {
          id: updatedScene.id,
          campaignId: updatedScene.campaignId,
          name: updatedScene.name,
          active: updatedScene.active,
          backgroundImage: updatedScene.backgroundImage,
          backgroundWidth: updatedScene.backgroundWidth,
          backgroundHeight: updatedScene.backgroundHeight,
          gridType: updatedScene.gridType,
          gridSize: updatedScene.gridSize,
          gridColor: updatedScene.gridColor,
          gridAlpha: updatedScene.gridAlpha,
          gridDistance: updatedScene.gridDistance,
          gridUnits: updatedScene.gridUnits,
          tokenVision: updatedScene.tokenVision,
          fogExploration: updatedScene.fogExploration,
          globalLight: updatedScene.globalLight,
          darkness: updatedScene.darkness,
          initialX: updatedScene.initialX,
          initialY: updatedScene.initialY,
          initialScale: updatedScene.initialScale,
          navOrder: updatedScene.navOrder,
          data: updatedScene.data as Record<string, unknown>,
          createdAt: updatedScene.createdAt,
          updatedAt: updatedScene.updatedAt,
        };

        return reply.status(200).send({ scene: formattedScene });
      } catch (error) {
        fastify.log.error(error, 'Failed to update scene');
        return reply.status(500).send({ error: 'Failed to update scene' });
      }
    }
  );

  /**
   * DELETE /api/v1/scenes/:sceneId - Delete a scene
   * Deletes a specific scene and all associated tokens
   */
  fastify.delete<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

      try {
        // Check if scene exists
        const [existingScene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!existingScene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user has permission to delete this scene

        // Delete scene from database (tokens will be cascade deleted)
        await fastify.db
          .delete(scenes)
          .where(eq(scenes.id, sceneId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete scene');
        return reply.status(500).send({ error: 'Failed to delete scene' });
      }
    }
  );
};

export default scenesRoute;
