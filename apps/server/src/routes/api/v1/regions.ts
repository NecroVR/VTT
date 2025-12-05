import type { FastifyPluginAsync } from 'fastify';
import { regions, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Region, CreateRegionRequest, UpdateRegionRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Region API routes
 * All routes require authentication
 * Handles CRUD operations for regions (trigger zones)
 */
const regionsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/regions - List all regions for a scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/regions',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

      try {
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        const sceneRegions = await fastify.db
          .select()
          .from(regions)
          .where(eq(regions.sceneId, sceneId));

        const formattedRegions: Region[] = sceneRegions.map(region => ({
          id: region.id,
          sceneId: region.sceneId,
          name: region.name,
          shape: region.shape as Region['shape'],
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          radius: region.radius,
          points: region.points as Region['points'],
          color: region.color,
          alpha: region.alpha,
          hidden: region.hidden,
          locked: region.locked,
          triggerType: region.triggerType,
          triggerAction: region.triggerAction,
          triggerData: region.triggerData as Record<string, unknown> | null,
          data: region.data as Record<string, unknown>,
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
        }));

        return reply.status(200).send({ regions: formattedRegions });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch regions');
        return reply.status(500).send({ error: 'Failed to fetch regions' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/regions - Create a new region
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateRegionRequest }>(
    '/scenes/:sceneId/regions',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const regionData = request.body;

      if (!regionData.name) {
        return reply.status(400).send({ error: 'Name is required' });
      }

      try {
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        const newRegions = await fastify.db
          .insert(regions)
          .values({
            sceneId,
            name: regionData.name,
            shape: regionData.shape ?? 'rectangle',
            x: regionData.x,
            y: regionData.y,
            width: regionData.width ?? null,
            height: regionData.height ?? null,
            radius: regionData.radius ?? null,
            points: regionData.points ?? null,
            color: regionData.color ?? '#ff0000',
            alpha: regionData.alpha ?? 0.3,
            hidden: regionData.hidden ?? true,
            locked: regionData.locked ?? false,
            triggerType: regionData.triggerType ?? null,
            triggerAction: regionData.triggerAction ?? null,
            triggerData: regionData.triggerData ?? null,
            data: regionData.data ?? {},
          })
          .returning();

        const newRegion = newRegions[0];

        const formattedRegion: Region = {
          id: newRegion.id,
          sceneId: newRegion.sceneId,
          name: newRegion.name,
          shape: newRegion.shape as Region['shape'],
          x: newRegion.x,
          y: newRegion.y,
          width: newRegion.width,
          height: newRegion.height,
          radius: newRegion.radius,
          points: newRegion.points as Region['points'],
          color: newRegion.color,
          alpha: newRegion.alpha,
          hidden: newRegion.hidden,
          locked: newRegion.locked,
          triggerType: newRegion.triggerType,
          triggerAction: newRegion.triggerAction,
          triggerData: newRegion.triggerData as Record<string, unknown> | null,
          data: newRegion.data as Record<string, unknown>,
          createdAt: newRegion.createdAt,
          updatedAt: newRegion.updatedAt,
        };

        return reply.status(201).send({ region: formattedRegion });
      } catch (error) {
        fastify.log.error(error, 'Failed to create region');
        return reply.status(500).send({ error: 'Failed to create region' });
      }
    }
  );

  /**
   * PATCH /api/v1/regions/:regionId - Update a region
   */
  fastify.patch<{ Params: { regionId: string }; Body: UpdateRegionRequest }>(
    '/regions/:regionId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { regionId } = request.params;
      const updates = request.body;

      try {
        const [existingRegion] = await fastify.db
          .select()
          .from(regions)
          .where(eq(regions.id, regionId))
          .limit(1);

        if (!existingRegion) {
          return reply.status(404).send({ error: 'Region not found' });
        }

        const updatedRegions = await fastify.db
          .update(regions)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(regions.id, regionId))
          .returning();

        const updatedRegion = updatedRegions[0];

        const formattedRegion: Region = {
          id: updatedRegion.id,
          sceneId: updatedRegion.sceneId,
          name: updatedRegion.name,
          shape: updatedRegion.shape as Region['shape'],
          x: updatedRegion.x,
          y: updatedRegion.y,
          width: updatedRegion.width,
          height: updatedRegion.height,
          radius: updatedRegion.radius,
          points: updatedRegion.points as Region['points'],
          color: updatedRegion.color,
          alpha: updatedRegion.alpha,
          hidden: updatedRegion.hidden,
          locked: updatedRegion.locked,
          triggerType: updatedRegion.triggerType,
          triggerAction: updatedRegion.triggerAction,
          triggerData: updatedRegion.triggerData as Record<string, unknown> | null,
          data: updatedRegion.data as Record<string, unknown>,
          createdAt: updatedRegion.createdAt,
          updatedAt: updatedRegion.updatedAt,
        };

        return reply.status(200).send({ region: formattedRegion });
      } catch (error) {
        fastify.log.error(error, 'Failed to update region');
        return reply.status(500).send({ error: 'Failed to update region' });
      }
    }
  );

  /**
   * DELETE /api/v1/regions/:regionId - Delete a region
   */
  fastify.delete<{ Params: { regionId: string } }>(
    '/regions/:regionId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { regionId } = request.params;

      try {
        const [existingRegion] = await fastify.db
          .select()
          .from(regions)
          .where(eq(regions.id, regionId))
          .limit(1);

        if (!existingRegion) {
          return reply.status(404).send({ error: 'Region not found' });
        }

        await fastify.db
          .delete(regions)
          .where(eq(regions.id, regionId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete region');
        return reply.status(500).send({ error: 'Failed to delete region' });
      }
    }
  );
};

export default regionsRoute;
