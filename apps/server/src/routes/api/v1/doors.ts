import type { FastifyPluginAsync } from 'fastify';
import { doors, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Door, CreateDoorRequest, UpdateDoorRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Door API routes
 * All routes require authentication
 * Handles CRUD operations for doors
 */
const doorsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/doors - List all doors for a scene
   * Returns doors for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/doors',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

      try {
        // Verify scene exists and user has access to it
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user is a participant in the campaign (for now, any authenticated user can access)

        // Fetch all doors for the scene
        const sceneDoors = await fastify.db
          .select()
          .from(doors)
          .where(eq(doors.sceneId, sceneId));

        // Convert to Door interface
        const formattedDoors: Door[] = sceneDoors.map(door => ({
          id: door.id,
          sceneId: door.sceneId,
          x1: door.x1,
          y1: door.y1,
          x2: door.x2,
          y2: door.y2,
          wallShape: door.wallShape as 'straight' | 'curved',
          controlPoints: door.controlPoints as Array<{ x: number; y: number }> || [],
          status: door.status as 'open' | 'closed' | 'broken',
          isLocked: door.isLocked,
          snapToGrid: door.snapToGrid,
          data: door.data as Record<string, unknown>,
          createdAt: door.createdAt,
        }));

        return reply.status(200).send({ doors: formattedDoors });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch doors');
        return reply.status(500).send({ error: 'Failed to fetch doors' });
      }
    }
  );

  /**
   * GET /api/v1/doors/:doorId - Get a single door
   * Returns a specific door
   */
  fastify.get<{ Params: { doorId: string } }>(
    '/doors/:doorId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { doorId } = request.params;

      try {
        // Fetch door
        const [door] = await fastify.db
          .select()
          .from(doors)
          .where(eq(doors.id, doorId))
          .limit(1);

        if (!door) {
          return reply.status(404).send({ error: 'Door not found' });
        }

        // TODO: Check if user has access to this door's scene

        // Convert to Door interface
        const formattedDoor: Door = {
          id: door.id,
          sceneId: door.sceneId,
          x1: door.x1,
          y1: door.y1,
          x2: door.x2,
          y2: door.y2,
          wallShape: door.wallShape as 'straight' | 'curved',
          controlPoints: door.controlPoints as Array<{ x: number; y: number }> || [],
          status: door.status as 'open' | 'closed' | 'broken',
          isLocked: door.isLocked,
          snapToGrid: door.snapToGrid,
          data: door.data as Record<string, unknown>,
          createdAt: door.createdAt,
        };

        return reply.status(200).send({ door: formattedDoor });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch door');
        return reply.status(500).send({ error: 'Failed to fetch door' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/doors - Create a new door
   * Creates a door for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateDoorRequest }>(
    '/scenes/:sceneId/doors',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const doorData = request.body;

      // Validate required coordinate fields
      if (typeof doorData.x1 !== 'number') {
        return reply.status(400).send({ error: 'x1 coordinate is required and must be a number' });
      }
      if (typeof doorData.y1 !== 'number') {
        return reply.status(400).send({ error: 'y1 coordinate is required and must be a number' });
      }
      if (typeof doorData.x2 !== 'number') {
        return reply.status(400).send({ error: 'x2 coordinate is required and must be a number' });
      }
      if (typeof doorData.y2 !== 'number') {
        return reply.status(400).send({ error: 'y2 coordinate is required and must be a number' });
      }

      try {
        // Verify scene exists and user has access to it
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user is the campaign owner or has permission to create doors

        // Create door in database
        const newDoors = await fastify.db
          .insert(doors)
          .values({
            sceneId,
            x1: doorData.x1,
            y1: doorData.y1,
            x2: doorData.x2,
            y2: doorData.y2,
            wallShape: doorData.wallShape ?? 'straight',
            controlPoints: doorData.controlPoints ?? [],
            status: doorData.status ?? 'closed',
            isLocked: doorData.isLocked ?? false,
            snapToGrid: doorData.snapToGrid ?? true,
            data: doorData.data ?? {},
          })
          .returning();

        const newDoor = newDoors[0];

        // Convert to Door interface
        const formattedDoor: Door = {
          id: newDoor.id,
          sceneId: newDoor.sceneId,
          x1: newDoor.x1,
          y1: newDoor.y1,
          x2: newDoor.x2,
          y2: newDoor.y2,
          wallShape: newDoor.wallShape as 'straight' | 'curved',
          controlPoints: newDoor.controlPoints as Array<{ x: number; y: number }> || [],
          status: newDoor.status as 'open' | 'closed' | 'broken',
          isLocked: newDoor.isLocked,
          snapToGrid: newDoor.snapToGrid,
          data: newDoor.data as Record<string, unknown>,
          createdAt: newDoor.createdAt,
        };

        return reply.status(201).send({ door: formattedDoor });
      } catch (error) {
        fastify.log.error(error, 'Failed to create door');
        return reply.status(500).send({ error: 'Failed to create door' });
      }
    }
  );

  /**
   * PATCH /api/v1/doors/:doorId - Update a door
   * Updates a specific door
   */
  fastify.patch<{ Params: { doorId: string }; Body: UpdateDoorRequest }>(
    '/doors/:doorId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { doorId } = request.params;
      const updates = request.body;

      try {
        // Check if door exists
        const [existingDoor] = await fastify.db
          .select()
          .from(doors)
          .where(eq(doors.id, doorId))
          .limit(1);

        if (!existingDoor) {
          return reply.status(404).send({ error: 'Door not found' });
        }

        // TODO: Check if user has permission to update this door

        // Validate coordinate fields if provided
        if (updates.x1 !== undefined && typeof updates.x1 !== 'number') {
          return reply.status(400).send({ error: 'x1 must be a number' });
        }
        if (updates.y1 !== undefined && typeof updates.y1 !== 'number') {
          return reply.status(400).send({ error: 'y1 must be a number' });
        }
        if (updates.x2 !== undefined && typeof updates.x2 !== 'number') {
          return reply.status(400).send({ error: 'x2 must be a number' });
        }
        if (updates.y2 !== undefined && typeof updates.y2 !== 'number') {
          return reply.status(400).send({ error: 'y2 must be a number' });
        }

        // Build update object
        const updateData: any = {};

        if (updates.x1 !== undefined) {
          updateData.x1 = updates.x1;
        }
        if (updates.y1 !== undefined) {
          updateData.y1 = updates.y1;
        }
        if (updates.x2 !== undefined) {
          updateData.x2 = updates.x2;
        }
        if (updates.y2 !== undefined) {
          updateData.y2 = updates.y2;
        }
        if (updates.wallShape !== undefined) {
          updateData.wallShape = updates.wallShape;
        }
        if (updates.controlPoints !== undefined) {
          updateData.controlPoints = updates.controlPoints;
        }
        if (updates.status !== undefined) {
          updateData.status = updates.status;
        }
        if (updates.isLocked !== undefined) {
          updateData.isLocked = updates.isLocked;
        }
        if (updates.snapToGrid !== undefined) {
          updateData.snapToGrid = updates.snapToGrid;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update door in database
        const updatedDoors = await fastify.db
          .update(doors)
          .set(updateData)
          .where(eq(doors.id, doorId))
          .returning();

        const updatedDoor = updatedDoors[0];

        // Convert to Door interface
        const formattedDoor: Door = {
          id: updatedDoor.id,
          sceneId: updatedDoor.sceneId,
          x1: updatedDoor.x1,
          y1: updatedDoor.y1,
          x2: updatedDoor.x2,
          y2: updatedDoor.y2,
          wallShape: updatedDoor.wallShape as 'straight' | 'curved',
          controlPoints: updatedDoor.controlPoints as Array<{ x: number; y: number }> || [],
          status: updatedDoor.status as 'open' | 'closed' | 'broken',
          isLocked: updatedDoor.isLocked,
          snapToGrid: updatedDoor.snapToGrid,
          data: updatedDoor.data as Record<string, unknown>,
          createdAt: updatedDoor.createdAt,
        };

        return reply.status(200).send({ door: formattedDoor });
      } catch (error) {
        fastify.log.error(error, 'Failed to update door');
        return reply.status(500).send({ error: 'Failed to update door' });
      }
    }
  );

  /**
   * DELETE /api/v1/doors/:doorId - Delete a door
   * Deletes a specific door
   */
  fastify.delete<{ Params: { doorId: string } }>(
    '/doors/:doorId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { doorId } = request.params;

      try {
        // Check if door exists
        const [existingDoor] = await fastify.db
          .select()
          .from(doors)
          .where(eq(doors.id, doorId))
          .limit(1);

        if (!existingDoor) {
          return reply.status(404).send({ error: 'Door not found' });
        }

        // TODO: Check if user has permission to delete this door

        // Delete door from database
        await fastify.db
          .delete(doors)
          .where(eq(doors.id, doorId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete door');
        return reply.status(500).send({ error: 'Failed to delete door' });
      }
    }
  );
};

export default doorsRoute;
