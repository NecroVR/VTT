import type { FastifyPluginAsync } from 'fastify';
import { ambientLights, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { AmbientLight, CreateAmbientLightRequest, UpdateAmbientLightRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Ambient Lights API routes
 * All routes require authentication
 * Handles CRUD operations for ambient lights
 */
const lightsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/lights - List all lights for a scene
   * Returns lights for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/lights',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

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

        // Fetch all lights for the scene
        const sceneLights = await fastify.db
          .select()
          .from(ambientLights)
          .where(eq(ambientLights.sceneId, sceneId));

        // Convert to AmbientLight interface
        const formattedLights: AmbientLight[] = sceneLights.map(light => ({
          id: light.id,
          sceneId: light.sceneId,
          x: light.x,
          y: light.y,
          rotation: light.rotation,
          bright: light.bright,
          dim: light.dim,
          angle: light.angle,
          color: light.color,
          alpha: light.alpha,
          animationType: light.animationType,
          animationSpeed: light.animationSpeed,
          animationIntensity: light.animationIntensity,
          walls: light.walls,
          vision: light.vision,
          snapToGrid: light.snapToGrid ?? false,
          data: light.data as Record<string, unknown>,
          createdAt: light.createdAt,
        }));

        return reply.status(200).send({ ambientLights: formattedLights });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch lights');
        return reply.status(500).send({ error: 'Failed to fetch lights' });
      }
    }
  );

  /**
   * GET /api/v1/lights/:lightId - Get a single light
   * Returns a specific ambient light
   */
  fastify.get<{ Params: { lightId: string } }>(
    '/lights/:lightId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { lightId } = request.params;

      try {
        // Fetch light
        const [light] = await fastify.db
          .select()
          .from(ambientLights)
          .where(eq(ambientLights.id, lightId))
          .limit(1);

        if (!light) {
          return reply.status(404).send({ error: 'Light not found' });
        }

        // TODO: Check if user has access to this light's scene's game

        // Convert to AmbientLight interface
        const formattedLight: AmbientLight = {
          id: light.id,
          sceneId: light.sceneId,
          x: light.x,
          y: light.y,
          rotation: light.rotation,
          bright: light.bright,
          dim: light.dim,
          angle: light.angle,
          color: light.color,
          alpha: light.alpha,
          animationType: light.animationType,
          animationSpeed: light.animationSpeed,
          animationIntensity: light.animationIntensity,
          walls: light.walls,
          vision: light.vision,
          snapToGrid: light.snapToGrid ?? false,
          data: light.data as Record<string, unknown>,
          createdAt: light.createdAt,
        };

        return reply.status(200).send({ ambientLight: formattedLight });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch light');
        return reply.status(500).send({ error: 'Failed to fetch light' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/lights - Create a new light
   * Creates an ambient light for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateAmbientLightRequest }>(
    '/scenes/:sceneId/lights',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const lightData = request.body;

      // Validate required fields
      if (lightData.x === undefined || lightData.x === null) {
        return reply.status(400).send({ error: 'Light x position is required' });
      }

      if (lightData.y === undefined || lightData.y === null) {
        return reply.status(400).send({ error: 'Light y position is required' });
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

        // TODO: Check if user has permission to create lights in this scene

        // Create light in database
        const newLights = await fastify.db
          .insert(ambientLights)
          .values({
            sceneId,
            x: lightData.x,
            y: lightData.y,
            rotation: lightData.rotation ?? 0,
            bright: lightData.bright ?? 20,
            dim: lightData.dim ?? 40,
            angle: lightData.angle ?? 360,
            color: lightData.color ?? '#ffffff',
            alpha: lightData.alpha ?? 0.5,
            animationType: lightData.animationType ?? null,
            animationSpeed: lightData.animationSpeed ?? 5,
            animationIntensity: lightData.animationIntensity ?? 5,
            walls: lightData.walls ?? true,
            vision: lightData.vision ?? false,
            data: lightData.data ?? {},
          })
          .returning();

        const newLight = newLights[0];

        // Convert to AmbientLight interface
        const formattedLight: AmbientLight = {
          id: newLight.id,
          sceneId: newLight.sceneId,
          x: newLight.x,
          y: newLight.y,
          rotation: newLight.rotation,
          bright: newLight.bright,
          dim: newLight.dim,
          angle: newLight.angle,
          color: newLight.color,
          alpha: newLight.alpha,
          animationType: newLight.animationType,
          animationSpeed: newLight.animationSpeed,
          animationIntensity: newLight.animationIntensity,
          walls: newLight.walls,
          vision: newLight.vision,
          snapToGrid: newLight.snapToGrid ?? false,
          data: newLight.data as Record<string, unknown>,
          createdAt: newLight.createdAt,
        };

        return reply.status(201).send({ ambientLight: formattedLight });
      } catch (error) {
        fastify.log.error(error, 'Failed to create light');
        return reply.status(500).send({ error: 'Failed to create light' });
      }
    }
  );

  /**
   * PATCH /api/v1/lights/:lightId - Update a light
   * Updates a specific ambient light
   */
  fastify.patch<{ Params: { lightId: string }; Body: UpdateAmbientLightRequest }>(
    '/lights/:lightId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { lightId } = request.params;
      const updates = request.body;

      try {
        // Check if light exists
        const [existingLight] = await fastify.db
          .select()
          .from(ambientLights)
          .where(eq(ambientLights.id, lightId))
          .limit(1);

        if (!existingLight) {
          return reply.status(404).send({ error: 'Light not found' });
        }

        // TODO: Check if user has permission to update this light

        // Build update object
        const updateData: any = {};

        if (updates.x !== undefined) {
          updateData.x = updates.x;
        }
        if (updates.y !== undefined) {
          updateData.y = updates.y;
        }
        if (updates.rotation !== undefined) {
          updateData.rotation = updates.rotation;
        }
        if (updates.bright !== undefined) {
          updateData.bright = updates.bright;
        }
        if (updates.dim !== undefined) {
          updateData.dim = updates.dim;
        }
        if (updates.angle !== undefined) {
          updateData.angle = updates.angle;
        }
        if (updates.color !== undefined) {
          updateData.color = updates.color;
        }
        if (updates.alpha !== undefined) {
          updateData.alpha = updates.alpha;
        }
        if (updates.animationType !== undefined) {
          updateData.animationType = updates.animationType;
        }
        if (updates.animationSpeed !== undefined) {
          updateData.animationSpeed = updates.animationSpeed;
        }
        if (updates.animationIntensity !== undefined) {
          updateData.animationIntensity = updates.animationIntensity;
        }
        if (updates.walls !== undefined) {
          updateData.walls = updates.walls;
        }
        if (updates.vision !== undefined) {
          updateData.vision = updates.vision;
        }
        if (updates.snapToGrid !== undefined) {
          updateData.snapToGrid = updates.snapToGrid;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update light in database
        const updatedLights = await fastify.db
          .update(ambientLights)
          .set(updateData)
          .where(eq(ambientLights.id, lightId))
          .returning();

        const updatedLight = updatedLights[0];

        // Convert to AmbientLight interface
        const formattedLight: AmbientLight = {
          id: updatedLight.id,
          sceneId: updatedLight.sceneId,
          x: updatedLight.x,
          y: updatedLight.y,
          rotation: updatedLight.rotation,
          bright: updatedLight.bright,
          dim: updatedLight.dim,
          angle: updatedLight.angle,
          color: updatedLight.color,
          alpha: updatedLight.alpha,
          animationType: updatedLight.animationType,
          animationSpeed: updatedLight.animationSpeed,
          animationIntensity: updatedLight.animationIntensity,
          walls: updatedLight.walls,
          vision: updatedLight.vision,
          snapToGrid: updatedLight.snapToGrid ?? false,
          data: updatedLight.data as Record<string, unknown>,
          createdAt: updatedLight.createdAt,
        };

        return reply.status(200).send({ ambientLight: formattedLight });
      } catch (error) {
        fastify.log.error(error, 'Failed to update light');
        return reply.status(500).send({ error: 'Failed to update light' });
      }
    }
  );

  /**
   * DELETE /api/v1/lights/:lightId - Delete a light
   * Deletes a specific ambient light
   */
  fastify.delete<{ Params: { lightId: string } }>(
    '/lights/:lightId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { lightId } = request.params;

      try {
        // Check if light exists
        const [existingLight] = await fastify.db
          .select()
          .from(ambientLights)
          .where(eq(ambientLights.id, lightId))
          .limit(1);

        if (!existingLight) {
          return reply.status(404).send({ error: 'Light not found' });
        }

        // TODO: Check if user has permission to delete this light

        // Delete light from database
        await fastify.db
          .delete(ambientLights)
          .where(eq(ambientLights.id, lightId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete light');
        return reply.status(500).send({ error: 'Failed to delete light' });
      }
    }
  );
};

export default lightsRoute;
