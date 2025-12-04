import type { FastifyPluginAsync } from 'fastify';
import { walls, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Wall, CreateWallRequest, UpdateWallRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Wall API routes
 * All routes require authentication
 * Handles CRUD operations for walls
 */
const wallsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/walls - List all walls for a scene
   * Returns walls for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/walls',
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

        // TODO: Check if user is a participant in the game (for now, any authenticated user can access)

        // Fetch all walls for the scene
        const sceneWalls = await fastify.db
          .select()
          .from(walls)
          .where(eq(walls.sceneId, sceneId));

        // Convert to Wall interface
        const formattedWalls: Wall[] = sceneWalls.map(wall => ({
          id: wall.id,
          sceneId: wall.sceneId,
          x1: wall.x1,
          y1: wall.y1,
          x2: wall.x2,
          y2: wall.y2,
          wallType: wall.wallType,
          move: wall.move,
          sense: wall.sense,
          sound: wall.sound,
          door: wall.door,
          doorState: wall.doorState,
          data: wall.data as Record<string, unknown>,
          createdAt: wall.createdAt,
        }));

        return reply.status(200).send({ walls: formattedWalls });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch walls');
        return reply.status(500).send({ error: 'Failed to fetch walls' });
      }
    }
  );

  /**
   * GET /api/v1/walls/:wallId - Get a single wall
   * Returns a specific wall
   */
  fastify.get<{ Params: { wallId: string } }>(
    '/walls/:wallId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { wallId } = request.params;

      try {
        // Fetch wall
        const [wall] = await fastify.db
          .select()
          .from(walls)
          .where(eq(walls.id, wallId))
          .limit(1);

        if (!wall) {
          return reply.status(404).send({ error: 'Wall not found' });
        }

        // TODO: Check if user has access to this wall's scene

        // Convert to Wall interface
        const formattedWall: Wall = {
          id: wall.id,
          sceneId: wall.sceneId,
          x1: wall.x1,
          y1: wall.y1,
          x2: wall.x2,
          y2: wall.y2,
          wallType: wall.wallType,
          move: wall.move,
          sense: wall.sense,
          sound: wall.sound,
          door: wall.door,
          doorState: wall.doorState,
          data: wall.data as Record<string, unknown>,
          createdAt: wall.createdAt,
        };

        return reply.status(200).send({ wall: formattedWall });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch wall');
        return reply.status(500).send({ error: 'Failed to fetch wall' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/walls - Create a new wall
   * Creates a wall for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateWallRequest }>(
    '/scenes/:sceneId/walls',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const wallData = request.body;

      // Validate required coordinate fields
      if (typeof wallData.x1 !== 'number') {
        return reply.status(400).send({ error: 'x1 coordinate is required and must be a number' });
      }
      if (typeof wallData.y1 !== 'number') {
        return reply.status(400).send({ error: 'y1 coordinate is required and must be a number' });
      }
      if (typeof wallData.x2 !== 'number') {
        return reply.status(400).send({ error: 'x2 coordinate is required and must be a number' });
      }
      if (typeof wallData.y2 !== 'number') {
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

        // TODO: Check if user is the game owner or has permission to create walls

        // Create wall in database
        const newWalls = await fastify.db
          .insert(walls)
          .values({
            sceneId,
            x1: wallData.x1,
            y1: wallData.y1,
            x2: wallData.x2,
            y2: wallData.y2,
            wallType: wallData.wallType ?? 'normal',
            move: wallData.move ?? 'block',
            sense: wallData.sense ?? 'block',
            sound: wallData.sound ?? 'block',
            door: wallData.door ?? 'none',
            doorState: wallData.doorState ?? 'closed',
            data: wallData.data ?? {},
          })
          .returning();

        const newWall = newWalls[0];

        // Convert to Wall interface
        const formattedWall: Wall = {
          id: newWall.id,
          sceneId: newWall.sceneId,
          x1: newWall.x1,
          y1: newWall.y1,
          x2: newWall.x2,
          y2: newWall.y2,
          wallType: newWall.wallType,
          move: newWall.move,
          sense: newWall.sense,
          sound: newWall.sound,
          door: newWall.door,
          doorState: newWall.doorState,
          data: newWall.data as Record<string, unknown>,
          createdAt: newWall.createdAt,
        };

        return reply.status(201).send({ wall: formattedWall });
      } catch (error) {
        fastify.log.error(error, 'Failed to create wall');
        return reply.status(500).send({ error: 'Failed to create wall' });
      }
    }
  );

  /**
   * PATCH /api/v1/walls/:wallId - Update a wall
   * Updates a specific wall
   */
  fastify.patch<{ Params: { wallId: string }; Body: UpdateWallRequest }>(
    '/walls/:wallId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { wallId } = request.params;
      const updates = request.body;

      try {
        // Check if wall exists
        const [existingWall] = await fastify.db
          .select()
          .from(walls)
          .where(eq(walls.id, wallId))
          .limit(1);

        if (!existingWall) {
          return reply.status(404).send({ error: 'Wall not found' });
        }

        // TODO: Check if user has permission to update this wall

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
        if (updates.wallType !== undefined) {
          updateData.wallType = updates.wallType;
        }
        if (updates.move !== undefined) {
          updateData.move = updates.move;
        }
        if (updates.sense !== undefined) {
          updateData.sense = updates.sense;
        }
        if (updates.sound !== undefined) {
          updateData.sound = updates.sound;
        }
        if (updates.door !== undefined) {
          updateData.door = updates.door;
        }
        if (updates.doorState !== undefined) {
          updateData.doorState = updates.doorState;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update wall in database
        const updatedWalls = await fastify.db
          .update(walls)
          .set(updateData)
          .where(eq(walls.id, wallId))
          .returning();

        const updatedWall = updatedWalls[0];

        // Convert to Wall interface
        const formattedWall: Wall = {
          id: updatedWall.id,
          sceneId: updatedWall.sceneId,
          x1: updatedWall.x1,
          y1: updatedWall.y1,
          x2: updatedWall.x2,
          y2: updatedWall.y2,
          wallType: updatedWall.wallType,
          move: updatedWall.move,
          sense: updatedWall.sense,
          sound: updatedWall.sound,
          door: updatedWall.door,
          doorState: updatedWall.doorState,
          data: updatedWall.data as Record<string, unknown>,
          createdAt: updatedWall.createdAt,
        };

        return reply.status(200).send({ wall: formattedWall });
      } catch (error) {
        fastify.log.error(error, 'Failed to update wall');
        return reply.status(500).send({ error: 'Failed to update wall' });
      }
    }
  );

  /**
   * DELETE /api/v1/walls/:wallId - Delete a wall
   * Deletes a specific wall
   */
  fastify.delete<{ Params: { wallId: string } }>(
    '/walls/:wallId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { wallId } = request.params;

      try {
        // Check if wall exists
        const [existingWall] = await fastify.db
          .select()
          .from(walls)
          .where(eq(walls.id, wallId))
          .limit(1);

        if (!existingWall) {
          return reply.status(404).send({ error: 'Wall not found' });
        }

        // TODO: Check if user has permission to delete this wall

        // Delete wall from database
        await fastify.db
          .delete(walls)
          .where(eq(walls.id, wallId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete wall');
        return reply.status(500).send({ error: 'Failed to delete wall' });
      }
    }
  );
};

export default wallsRoute;
