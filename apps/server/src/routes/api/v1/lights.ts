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
          animationReverse: light.animationReverse ?? false,
          walls: light.walls,
          vision: light.vision,
          snapToGrid: light.snapToGrid ?? false,
          negative: light.negative ?? false,
          priority: light.priority ?? 0,
          luminosity: light.luminosity ?? 0.5,
          saturation: light.saturation ?? 0,
          contrast: light.contrast ?? 0,
          shadows: light.shadows ?? 0,
          attenuation: light.attenuation ?? 0.5,
          coloration: light.coloration ?? 1,
          darknessMin: light.darknessMin ?? 0,
          darknessMax: light.darknessMax ?? 1,
          hidden: light.hidden ?? false,
          elevation: light.elevation ?? 0,
          followPathName: light.followPathName ?? null,
          pathSpeed: light.pathSpeed ?? null,
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
          animationReverse: light.animationReverse ?? false,
          walls: light.walls,
          vision: light.vision,
          snapToGrid: light.snapToGrid ?? false,
          negative: light.negative ?? false,
          priority: light.priority ?? 0,
          luminosity: light.luminosity ?? 0.5,
          saturation: light.saturation ?? 0,
          contrast: light.contrast ?? 0,
          shadows: light.shadows ?? 0,
          attenuation: light.attenuation ?? 0.5,
          coloration: light.coloration ?? 1,
          darknessMin: light.darknessMin ?? 0,
          darknessMax: light.darknessMax ?? 1,
          hidden: light.hidden ?? false,
          elevation: light.elevation ?? 0,
          followPathName: light.followPathName ?? null,
          pathSpeed: light.pathSpeed ?? null,
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
            animationReverse: lightData.animationReverse ?? false,
            walls: lightData.walls ?? true,
            vision: lightData.vision ?? false,
            snapToGrid: lightData.snapToGrid ?? false,
            negative: lightData.negative ?? false,
            priority: lightData.priority ?? 0,
            luminosity: lightData.luminosity ?? 0.5,
            saturation: lightData.saturation ?? 0,
            contrast: lightData.contrast ?? 0,
            shadows: lightData.shadows ?? 0,
            attenuation: lightData.attenuation ?? 0.5,
            coloration: lightData.coloration ?? 1,
            darknessMin: lightData.darknessMin ?? 0,
            darknessMax: lightData.darknessMax ?? 1,
            hidden: lightData.hidden ?? false,
            elevation: lightData.elevation ?? 0,
            followPathName: lightData.followPathName ?? null,
            pathSpeed: lightData.pathSpeed ?? null,
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
          animationReverse: newLight.animationReverse ?? false,
          walls: newLight.walls,
          vision: newLight.vision,
          snapToGrid: newLight.snapToGrid ?? false,
          negative: newLight.negative ?? false,
          priority: newLight.priority ?? 0,
          luminosity: newLight.luminosity ?? 0.5,
          saturation: newLight.saturation ?? 0,
          contrast: newLight.contrast ?? 0,
          shadows: newLight.shadows ?? 0,
          attenuation: newLight.attenuation ?? 0.5,
          coloration: newLight.coloration ?? 1,
          darknessMin: newLight.darknessMin ?? 0,
          darknessMax: newLight.darknessMax ?? 1,
          hidden: newLight.hidden ?? false,
          elevation: newLight.elevation ?? 0,
          followPathName: newLight.followPathName ?? null,
          pathSpeed: newLight.pathSpeed ?? null,
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
        if (updates.animationReverse !== undefined) {
          updateData.animationReverse = updates.animationReverse;
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
        if (updates.negative !== undefined) {
          updateData.negative = updates.negative;
        }
        if (updates.priority !== undefined) {
          updateData.priority = updates.priority;
        }
        if (updates.luminosity !== undefined) {
          updateData.luminosity = updates.luminosity;
        }
        if (updates.saturation !== undefined) {
          updateData.saturation = updates.saturation;
        }
        if (updates.contrast !== undefined) {
          updateData.contrast = updates.contrast;
        }
        if (updates.shadows !== undefined) {
          updateData.shadows = updates.shadows;
        }
        if (updates.attenuation !== undefined) {
          updateData.attenuation = updates.attenuation;
        }
        if (updates.coloration !== undefined) {
          updateData.coloration = updates.coloration;
        }
        if (updates.darknessMin !== undefined) {
          updateData.darknessMin = updates.darknessMin;
        }
        if (updates.darknessMax !== undefined) {
          updateData.darknessMax = updates.darknessMax;
        }
        if (updates.hidden !== undefined) {
          updateData.hidden = updates.hidden;
        }
        if (updates.elevation !== undefined) {
          updateData.elevation = updates.elevation;
        }
        if (updates.followPathName !== undefined) {
          updateData.followPathName = updates.followPathName;
        }
        if (updates.pathSpeed !== undefined) {
          updateData.pathSpeed = updates.pathSpeed;
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
          animationReverse: updatedLight.animationReverse ?? false,
          walls: updatedLight.walls,
          vision: updatedLight.vision,
          snapToGrid: updatedLight.snapToGrid ?? false,
          negative: updatedLight.negative ?? false,
          priority: updatedLight.priority ?? 0,
          luminosity: updatedLight.luminosity ?? 0.5,
          saturation: updatedLight.saturation ?? 0,
          contrast: updatedLight.contrast ?? 0,
          shadows: updatedLight.shadows ?? 0,
          attenuation: updatedLight.attenuation ?? 0.5,
          coloration: updatedLight.coloration ?? 1,
          darknessMin: updatedLight.darknessMin ?? 0,
          darknessMax: updatedLight.darknessMax ?? 1,
          hidden: updatedLight.hidden ?? false,
          elevation: updatedLight.elevation ?? 0,
          followPathName: updatedLight.followPathName ?? null,
          pathSpeed: updatedLight.pathSpeed ?? null,
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
