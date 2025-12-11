import type { FastifyPluginAsync } from 'fastify';
import { windows, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Window, CreateWindowRequest, UpdateWindowRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Window API routes
 * All routes require authentication
 * Handles CRUD operations for windows
 */
const windowsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/windows - List all windows for a scene
   * Returns windows for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/windows',
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

        // Fetch all windows for the scene
        const sceneWindows = await fastify.db
          .select()
          .from(windows)
          .where(eq(windows.sceneId, sceneId));

        // Convert to Window interface
        const formattedWindows: Window[] = sceneWindows.map(window => ({
          id: window.id,
          sceneId: window.sceneId,
          x1: window.x1,
          y1: window.y1,
          x2: window.x2,
          y2: window.y2,
          wallShape: window.wallShape as 'straight' | 'curved',
          controlPoints: window.controlPoints as Array<{ x: number; y: number }> || [],
          snapToGrid: window.snapToGrid,
          data: window.data as Record<string, unknown>,
          createdAt: window.createdAt,
        }));

        return reply.status(200).send({ windows: formattedWindows });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch windows');
        return reply.status(500).send({ error: 'Failed to fetch windows' });
      }
    }
  );

  /**
   * GET /api/v1/windows/:windowId - Get a single window
   * Returns a specific window
   */
  fastify.get<{ Params: { windowId: string } }>(
    '/windows/:windowId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { windowId } = request.params;

      try {
        // Fetch window
        const [window] = await fastify.db
          .select()
          .from(windows)
          .where(eq(windows.id, windowId))
          .limit(1);

        if (!window) {
          return reply.status(404).send({ error: 'Window not found' });
        }

        // TODO: Check if user has access to this window's scene

        // Convert to Window interface
        const formattedWindow: Window = {
          id: window.id,
          sceneId: window.sceneId,
          x1: window.x1,
          y1: window.y1,
          x2: window.x2,
          y2: window.y2,
          wallShape: window.wallShape as 'straight' | 'curved',
          controlPoints: window.controlPoints as Array<{ x: number; y: number }> || [],
          snapToGrid: window.snapToGrid,
          data: window.data as Record<string, unknown>,
          createdAt: window.createdAt,
        };

        return reply.status(200).send({ window: formattedWindow });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch window');
        return reply.status(500).send({ error: 'Failed to fetch window' });
      }
    }
  );

  /**
   * POST /api/v1/windows - Create a new window
   * Creates a window for a specific scene
   */
  fastify.post<{ Body: CreateWindowRequest }>(
    '/windows',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const windowData = request.body;

      // Validate required fields
      if (!windowData.sceneId) {
        return reply.status(400).send({ error: 'sceneId is required' });
      }
      if (typeof windowData.x1 !== 'number') {
        return reply.status(400).send({ error: 'x1 coordinate is required and must be a number' });
      }
      if (typeof windowData.y1 !== 'number') {
        return reply.status(400).send({ error: 'y1 coordinate is required and must be a number' });
      }
      if (typeof windowData.x2 !== 'number') {
        return reply.status(400).send({ error: 'x2 coordinate is required and must be a number' });
      }
      if (typeof windowData.y2 !== 'number') {
        return reply.status(400).send({ error: 'y2 coordinate is required and must be a number' });
      }

      try {
        // Verify scene exists and user has access to it
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, windowData.sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user is the campaign owner or has permission to create windows

        // Create window in database
        const newWindows = await fastify.db
          .insert(windows)
          .values({
            sceneId: windowData.sceneId,
            x1: windowData.x1,
            y1: windowData.y1,
            x2: windowData.x2,
            y2: windowData.y2,
            wallShape: windowData.wallShape ?? 'straight',
            controlPoints: windowData.controlPoints ?? [],
            snapToGrid: windowData.snapToGrid ?? true,
            data: windowData.data ?? {},
          })
          .returning();

        const newWindow = newWindows[0];

        // Convert to Window interface
        const formattedWindow: Window = {
          id: newWindow.id,
          sceneId: newWindow.sceneId,
          x1: newWindow.x1,
          y1: newWindow.y1,
          x2: newWindow.x2,
          y2: newWindow.y2,
          wallShape: newWindow.wallShape as 'straight' | 'curved',
          controlPoints: newWindow.controlPoints as Array<{ x: number; y: number }> || [],
          snapToGrid: newWindow.snapToGrid,
          data: newWindow.data as Record<string, unknown>,
          createdAt: newWindow.createdAt,
        };

        return reply.status(201).send({ window: formattedWindow });
      } catch (error) {
        fastify.log.error(error, 'Failed to create window');
        return reply.status(500).send({ error: 'Failed to create window' });
      }
    }
  );

  /**
   * PATCH /api/v1/windows/:windowId - Update a window
   * Updates a specific window
   */
  fastify.patch<{ Params: { windowId: string }; Body: UpdateWindowRequest }>(
    '/windows/:windowId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { windowId } = request.params;
      const updates = request.body;

      try {
        // Check if window exists
        const [existingWindow] = await fastify.db
          .select()
          .from(windows)
          .where(eq(windows.id, windowId))
          .limit(1);

        if (!existingWindow) {
          return reply.status(404).send({ error: 'Window not found' });
        }

        // TODO: Check if user has permission to update this window

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
        if (updates.snapToGrid !== undefined) {
          updateData.snapToGrid = updates.snapToGrid;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update window in database
        const updatedWindows = await fastify.db
          .update(windows)
          .set(updateData)
          .where(eq(windows.id, windowId))
          .returning();

        const updatedWindow = updatedWindows[0];

        // Convert to Window interface
        const formattedWindow: Window = {
          id: updatedWindow.id,
          sceneId: updatedWindow.sceneId,
          x1: updatedWindow.x1,
          y1: updatedWindow.y1,
          x2: updatedWindow.x2,
          y2: updatedWindow.y2,
          wallShape: updatedWindow.wallShape as 'straight' | 'curved',
          controlPoints: updatedWindow.controlPoints as Array<{ x: number; y: number }> || [],
          snapToGrid: updatedWindow.snapToGrid,
          data: updatedWindow.data as Record<string, unknown>,
          createdAt: updatedWindow.createdAt,
        };

        return reply.status(200).send({ window: formattedWindow });
      } catch (error) {
        fastify.log.error(error, 'Failed to update window');
        return reply.status(500).send({ error: 'Failed to update window' });
      }
    }
  );

  /**
   * DELETE /api/v1/windows/:windowId - Delete a window
   * Deletes a specific window
   */
  fastify.delete<{ Params: { windowId: string } }>(
    '/windows/:windowId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { windowId } = request.params;

      try {
        // Check if window exists
        const [existingWindow] = await fastify.db
          .select()
          .from(windows)
          .where(eq(windows.id, windowId))
          .limit(1);

        if (!existingWindow) {
          return reply.status(404).send({ error: 'Window not found' });
        }

        // TODO: Check if user has permission to delete this window

        // Delete window from database
        await fastify.db
          .delete(windows)
          .where(eq(windows.id, windowId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete window');
        return reply.status(500).send({ error: 'Failed to delete window' });
      }
    }
  );
};

export default windowsRoute;
