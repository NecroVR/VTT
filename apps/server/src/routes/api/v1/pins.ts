import type { FastifyPluginAsync } from 'fastify';
import { scenePins, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { ScenePin, CreateScenePinRequest, UpdateScenePinRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Scene Pin API routes
 * All routes require authentication
 * Handles CRUD operations for scene pins (map markers)
 */
const pinsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/pins - List all pins for a scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/pins',
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

        const scenePinsData = await fastify.db
          .select()
          .from(scenePins)
          .where(eq(scenePins.sceneId, sceneId));

        const formattedPins: ScenePin[] = scenePinsData.map(pin => ({
          id: pin.id,
          sceneId: pin.sceneId,
          x: pin.x,
          y: pin.y,
          icon: pin.icon,
          iconSize: pin.iconSize,
          iconTint: pin.iconTint,
          text: pin.text,
          fontSize: pin.fontSize,
          textAnchor: pin.textAnchor,
          textColor: pin.textColor,
          journalId: pin.journalId,
          pageId: pin.pageId,
          global: pin.global,
          data: pin.data as Record<string, unknown>,
          createdAt: pin.createdAt,
          updatedAt: pin.updatedAt,
        }));

        return reply.status(200).send({ pins: formattedPins });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch pins');
        return reply.status(500).send({ error: 'Failed to fetch pins' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/pins - Create a new pin
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateScenePinRequest }>(
    '/scenes/:sceneId/pins',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const pinData = request.body;

      try {
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        const newPins = await fastify.db
          .insert(scenePins)
          .values({
            sceneId,
            x: pinData.x,
            y: pinData.y,
            icon: pinData.icon ?? null,
            iconSize: pinData.iconSize ?? 40,
            iconTint: pinData.iconTint ?? null,
            text: pinData.text ?? null,
            fontSize: pinData.fontSize ?? 24,
            textAnchor: pinData.textAnchor ?? 'bottom',
            textColor: pinData.textColor ?? '#ffffff',
            journalId: pinData.journalId ?? null,
            pageId: pinData.pageId ?? null,
            global: pinData.global ?? false,
            data: pinData.data ?? {},
          })
          .returning();

        const newPin = newPins[0];

        const formattedPin: ScenePin = {
          id: newPin.id,
          sceneId: newPin.sceneId,
          x: newPin.x,
          y: newPin.y,
          icon: newPin.icon,
          iconSize: newPin.iconSize,
          iconTint: newPin.iconTint,
          text: newPin.text,
          fontSize: newPin.fontSize,
          textAnchor: newPin.textAnchor,
          textColor: newPin.textColor,
          journalId: newPin.journalId,
          pageId: newPin.pageId,
          global: newPin.global,
          data: newPin.data as Record<string, unknown>,
          createdAt: newPin.createdAt,
          updatedAt: newPin.updatedAt,
        };

        return reply.status(201).send({ pin: formattedPin });
      } catch (error) {
        fastify.log.error(error, 'Failed to create pin');
        return reply.status(500).send({ error: 'Failed to create pin' });
      }
    }
  );

  /**
   * PATCH /api/v1/pins/:pinId - Update a pin
   */
  fastify.patch<{ Params: { pinId: string }; Body: UpdateScenePinRequest }>(
    '/pins/:pinId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pinId } = request.params;
      const updates = request.body;

      try {
        const [existingPin] = await fastify.db
          .select()
          .from(scenePins)
          .where(eq(scenePins.id, pinId))
          .limit(1);

        if (!existingPin) {
          return reply.status(404).send({ error: 'Pin not found' });
        }

        const updatedPins = await fastify.db
          .update(scenePins)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(scenePins.id, pinId))
          .returning();

        const updatedPin = updatedPins[0];

        const formattedPin: ScenePin = {
          id: updatedPin.id,
          sceneId: updatedPin.sceneId,
          x: updatedPin.x,
          y: updatedPin.y,
          icon: updatedPin.icon,
          iconSize: updatedPin.iconSize,
          iconTint: updatedPin.iconTint,
          text: updatedPin.text,
          fontSize: updatedPin.fontSize,
          textAnchor: updatedPin.textAnchor,
          textColor: updatedPin.textColor,
          journalId: updatedPin.journalId,
          pageId: updatedPin.pageId,
          global: updatedPin.global,
          data: updatedPin.data as Record<string, unknown>,
          createdAt: updatedPin.createdAt,
          updatedAt: updatedPin.updatedAt,
        };

        return reply.status(200).send({ pin: formattedPin });
      } catch (error) {
        fastify.log.error(error, 'Failed to update pin');
        return reply.status(500).send({ error: 'Failed to update pin' });
      }
    }
  );

  /**
   * DELETE /api/v1/pins/:pinId - Delete a pin
   */
  fastify.delete<{ Params: { pinId: string } }>(
    '/pins/:pinId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pinId } = request.params;

      try {
        const [existingPin] = await fastify.db
          .select()
          .from(scenePins)
          .where(eq(scenePins.id, pinId))
          .limit(1);

        if (!existingPin) {
          return reply.status(404).send({ error: 'Pin not found' });
        }

        await fastify.db
          .delete(scenePins)
          .where(eq(scenePins.id, pinId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete pin');
        return reply.status(500).send({ error: 'Failed to delete pin' });
      }
    }
  );
};

export default pinsRoute;
