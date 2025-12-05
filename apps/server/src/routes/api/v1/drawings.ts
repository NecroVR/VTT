import type { FastifyPluginAsync } from 'fastify';
import { drawings, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Drawing, CreateDrawingRequest, UpdateDrawingRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Drawing API routes
 * All routes require authentication
 * Handles CRUD operations for drawings
 */
const drawingsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/drawings - List all drawings for a scene
   * Returns drawings for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/drawings',
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

        // Fetch all drawings for the scene
        const sceneDrawings = await fastify.db
          .select()
          .from(drawings)
          .where(eq(drawings.sceneId, sceneId));

        // Convert to Drawing interface
        const formattedDrawings: Drawing[] = sceneDrawings.map(drawing => ({
          id: drawing.id,
          sceneId: drawing.sceneId,
          authorId: drawing.authorId,
          drawingType: drawing.drawingType as Drawing['drawingType'],
          x: drawing.x,
          y: drawing.y,
          z: drawing.z,
          rotation: drawing.rotation,
          points: drawing.points as Drawing['points'],
          width: drawing.width,
          height: drawing.height,
          radius: drawing.radius,
          strokeColor: drawing.strokeColor,
          strokeWidth: drawing.strokeWidth,
          strokeAlpha: drawing.strokeAlpha,
          fillColor: drawing.fillColor,
          fillAlpha: drawing.fillAlpha,
          text: drawing.text,
          fontSize: drawing.fontSize,
          fontFamily: drawing.fontFamily,
          textColor: drawing.textColor,
          hidden: drawing.hidden,
          locked: drawing.locked,
          data: drawing.data as Record<string, unknown>,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
        }));

        return reply.status(200).send({ drawings: formattedDrawings });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch drawings');
        return reply.status(500).send({ error: 'Failed to fetch drawings' });
      }
    }
  );

  /**
   * GET /api/v1/drawings/:drawingId - Get a single drawing
   * Returns a specific drawing
   */
  fastify.get<{ Params: { drawingId: string } }>(
    '/drawings/:drawingId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { drawingId } = request.params;

      try {
        // Fetch drawing
        const [drawing] = await fastify.db
          .select()
          .from(drawings)
          .where(eq(drawings.id, drawingId))
          .limit(1);

        if (!drawing) {
          return reply.status(404).send({ error: 'Drawing not found' });
        }

        // Convert to Drawing interface
        const formattedDrawing: Drawing = {
          id: drawing.id,
          sceneId: drawing.sceneId,
          authorId: drawing.authorId,
          drawingType: drawing.drawingType as Drawing['drawingType'],
          x: drawing.x,
          y: drawing.y,
          z: drawing.z,
          rotation: drawing.rotation,
          points: drawing.points as Drawing['points'],
          width: drawing.width,
          height: drawing.height,
          radius: drawing.radius,
          strokeColor: drawing.strokeColor,
          strokeWidth: drawing.strokeWidth,
          strokeAlpha: drawing.strokeAlpha,
          fillColor: drawing.fillColor,
          fillAlpha: drawing.fillAlpha,
          text: drawing.text,
          fontSize: drawing.fontSize,
          fontFamily: drawing.fontFamily,
          textColor: drawing.textColor,
          hidden: drawing.hidden,
          locked: drawing.locked,
          data: drawing.data as Record<string, unknown>,
          createdAt: drawing.createdAt,
          updatedAt: drawing.updatedAt,
        };

        return reply.status(200).send({ drawing: formattedDrawing });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch drawing');
        return reply.status(500).send({ error: 'Failed to fetch drawing' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/drawings - Create a new drawing
   * Creates a drawing for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateDrawingRequest }>(
    '/scenes/:sceneId/drawings',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const drawingData = request.body;

      // Validate required fields
      if (!drawingData.drawingType) {
        return reply.status(400).send({ error: 'Drawing type is required' });
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

        // Create drawing in database
        const newDrawings = await fastify.db
          .insert(drawings)
          .values({
            sceneId,
            authorId: request.user.id,
            drawingType: drawingData.drawingType,
            x: drawingData.x ?? 0,
            y: drawingData.y ?? 0,
            z: drawingData.z ?? 0,
            rotation: drawingData.rotation ?? 0,
            points: drawingData.points ?? null,
            width: drawingData.width ?? null,
            height: drawingData.height ?? null,
            radius: drawingData.radius ?? null,
            strokeColor: drawingData.strokeColor ?? '#000000',
            strokeWidth: drawingData.strokeWidth ?? 2,
            strokeAlpha: drawingData.strokeAlpha ?? 1,
            fillColor: drawingData.fillColor ?? null,
            fillAlpha: drawingData.fillAlpha ?? 0.5,
            text: drawingData.text ?? null,
            fontSize: drawingData.fontSize ?? null,
            fontFamily: drawingData.fontFamily ?? null,
            textColor: drawingData.textColor ?? null,
            hidden: drawingData.hidden ?? false,
            locked: drawingData.locked ?? false,
            data: drawingData.data ?? {},
          })
          .returning();

        const newDrawing = newDrawings[0];

        // Convert to Drawing interface
        const formattedDrawing: Drawing = {
          id: newDrawing.id,
          sceneId: newDrawing.sceneId,
          authorId: newDrawing.authorId,
          drawingType: newDrawing.drawingType as Drawing['drawingType'],
          x: newDrawing.x,
          y: newDrawing.y,
          z: newDrawing.z,
          rotation: newDrawing.rotation,
          points: newDrawing.points as Drawing['points'],
          width: newDrawing.width,
          height: newDrawing.height,
          radius: newDrawing.radius,
          strokeColor: newDrawing.strokeColor,
          strokeWidth: newDrawing.strokeWidth,
          strokeAlpha: newDrawing.strokeAlpha,
          fillColor: newDrawing.fillColor,
          fillAlpha: newDrawing.fillAlpha,
          text: newDrawing.text,
          fontSize: newDrawing.fontSize,
          fontFamily: newDrawing.fontFamily,
          textColor: newDrawing.textColor,
          hidden: newDrawing.hidden,
          locked: newDrawing.locked,
          data: newDrawing.data as Record<string, unknown>,
          createdAt: newDrawing.createdAt,
          updatedAt: newDrawing.updatedAt,
        };

        return reply.status(201).send({ drawing: formattedDrawing });
      } catch (error) {
        fastify.log.error(error, 'Failed to create drawing');
        return reply.status(500).send({ error: 'Failed to create drawing' });
      }
    }
  );

  /**
   * PATCH /api/v1/drawings/:drawingId - Update a drawing
   * Updates a specific drawing
   */
  fastify.patch<{ Params: { drawingId: string }; Body: UpdateDrawingRequest }>(
    '/drawings/:drawingId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { drawingId } = request.params;
      const updates = request.body;

      try {
        // Check if drawing exists
        const [existingDrawing] = await fastify.db
          .select()
          .from(drawings)
          .where(eq(drawings.id, drawingId))
          .limit(1);

        if (!existingDrawing) {
          return reply.status(404).send({ error: 'Drawing not found' });
        }

        // Update drawing in database
        const updatedDrawings = await fastify.db
          .update(drawings)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(drawings.id, drawingId))
          .returning();

        const updatedDrawing = updatedDrawings[0];

        // Convert to Drawing interface
        const formattedDrawing: Drawing = {
          id: updatedDrawing.id,
          sceneId: updatedDrawing.sceneId,
          authorId: updatedDrawing.authorId,
          drawingType: updatedDrawing.drawingType as Drawing['drawingType'],
          x: updatedDrawing.x,
          y: updatedDrawing.y,
          z: updatedDrawing.z,
          rotation: updatedDrawing.rotation,
          points: updatedDrawing.points as Drawing['points'],
          width: updatedDrawing.width,
          height: updatedDrawing.height,
          radius: updatedDrawing.radius,
          strokeColor: updatedDrawing.strokeColor,
          strokeWidth: updatedDrawing.strokeWidth,
          strokeAlpha: updatedDrawing.strokeAlpha,
          fillColor: updatedDrawing.fillColor,
          fillAlpha: updatedDrawing.fillAlpha,
          text: updatedDrawing.text,
          fontSize: updatedDrawing.fontSize,
          fontFamily: updatedDrawing.fontFamily,
          textColor: updatedDrawing.textColor,
          hidden: updatedDrawing.hidden,
          locked: updatedDrawing.locked,
          data: updatedDrawing.data as Record<string, unknown>,
          createdAt: updatedDrawing.createdAt,
          updatedAt: updatedDrawing.updatedAt,
        };

        return reply.status(200).send({ drawing: formattedDrawing });
      } catch (error) {
        fastify.log.error(error, 'Failed to update drawing');
        return reply.status(500).send({ error: 'Failed to update drawing' });
      }
    }
  );

  /**
   * DELETE /api/v1/drawings/:drawingId - Delete a drawing
   * Deletes a specific drawing
   */
  fastify.delete<{ Params: { drawingId: string } }>(
    '/drawings/:drawingId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { drawingId } = request.params;

      try {
        // Check if drawing exists
        const [existingDrawing] = await fastify.db
          .select()
          .from(drawings)
          .where(eq(drawings.id, drawingId))
          .limit(1);

        if (!existingDrawing) {
          return reply.status(404).send({ error: 'Drawing not found' });
        }

        // Delete drawing from database
        await fastify.db
          .delete(drawings)
          .where(eq(drawings.id, drawingId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete drawing');
        return reply.status(500).send({ error: 'Failed to delete drawing' });
      }
    }
  );
};

export default drawingsRoute;
