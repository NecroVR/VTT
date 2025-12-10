import type { FastifyPluginAsync } from 'fastify';
import { paths, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Path, PathCreateInput, PathUpdateInput } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Path API routes
 * All routes require authentication
 * Handles CRUD operations for paths
 */
const pathsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/paths - List all paths for a scene
   * Returns paths for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/paths',
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

        // Fetch all paths for the scene
        const scenePaths = await fastify.db
          .select()
          .from(paths)
          .where(eq(paths.sceneId, sceneId));

        // Convert to Path interface
        const formattedPaths: Path[] = scenePaths.map(path => ({
          id: path.id,
          sceneId: path.sceneId,
          name: path.name,
          nodes: path.nodes as Array<{ x: number; y: number }>,
          speed: path.speed,
          loop: path.loop,
          assignedObjectId: path.assignedObjectId ?? null,
          assignedObjectType: path.assignedObjectType as 'token' | 'light' | null,
          visible: path.visible,
          color: path.color,
          data: path.data as Record<string, unknown>,
          createdAt: path.createdAt,
          updatedAt: path.updatedAt,
        }));

        return reply.status(200).send({ paths: formattedPaths });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch paths');
        return reply.status(500).send({ error: 'Failed to fetch paths' });
      }
    }
  );

  /**
   * GET /api/v1/paths/:pathId - Get a single path
   * Returns a specific path
   */
  fastify.get<{ Params: { pathId: string } }>(
    '/paths/:pathId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pathId } = request.params;

      try {
        // Fetch path
        const [path] = await fastify.db
          .select()
          .from(paths)
          .where(eq(paths.id, pathId))
          .limit(1);

        if (!path) {
          return reply.status(404).send({ error: 'Path not found' });
        }

        // TODO: Check if user has access to this path's scene

        // Convert to Path interface
        const formattedPath: Path = {
          id: path.id,
          sceneId: path.sceneId,
          name: path.name,
          nodes: path.nodes as Array<{ x: number; y: number }>,
          speed: path.speed,
          loop: path.loop,
          assignedObjectId: path.assignedObjectId ?? null,
          assignedObjectType: path.assignedObjectType as 'token' | 'light' | null,
          visible: path.visible,
          color: path.color,
          data: path.data as Record<string, unknown>,
          createdAt: path.createdAt,
          updatedAt: path.updatedAt,
        };

        return reply.status(200).send({ path: formattedPath });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch path');
        return reply.status(500).send({ error: 'Failed to fetch path' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/paths - Create a new path
   * Creates a path for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: PathCreateInput }>(
    '/scenes/:sceneId/paths',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const pathData = request.body;

      // Validate required fields
      if (!pathData.nodes || !Array.isArray(pathData.nodes)) {
        return reply.status(400).send({ error: 'Nodes array is required' });
      }

      if (pathData.nodes.length < 2) {
        return reply.status(400).send({ error: 'Path must have at least 2 nodes' });
      }

      // Validate nodes structure
      for (const node of pathData.nodes) {
        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
          return reply.status(400).send({ error: 'Each node must have x and y coordinates as numbers' });
        }
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

        // TODO: Check if user is the campaign owner or has permission to create paths

        // Create path in database
        const newPaths = await fastify.db
          .insert(paths)
          .values({
            sceneId,
            name: pathData.name ?? 'New Path',
            nodes: pathData.nodes,
            speed: pathData.speed ?? 50,
            loop: pathData.loop ?? true,
            assignedObjectId: pathData.assignedObjectId ?? null,
            assignedObjectType: pathData.assignedObjectType ?? null,
            visible: pathData.visible ?? true,
            color: pathData.color ?? '#ffff00',
            data: pathData.data ?? {},
          })
          .returning();

        const newPath = newPaths[0];

        // Convert to Path interface
        const formattedPath: Path = {
          id: newPath.id,
          sceneId: newPath.sceneId,
          name: newPath.name,
          nodes: newPath.nodes as Array<{ x: number; y: number }>,
          speed: newPath.speed,
          loop: newPath.loop,
          assignedObjectId: newPath.assignedObjectId ?? null,
          assignedObjectType: newPath.assignedObjectType as 'token' | 'light' | null,
          visible: newPath.visible,
          color: newPath.color,
          data: newPath.data as Record<string, unknown>,
          createdAt: newPath.createdAt,
          updatedAt: newPath.updatedAt,
        };

        return reply.status(201).send({ path: formattedPath });
      } catch (error) {
        fastify.log.error(error, 'Failed to create path');
        return reply.status(500).send({ error: 'Failed to create path' });
      }
    }
  );

  /**
   * PATCH /api/v1/paths/:pathId - Update a path
   * Updates a specific path
   */
  fastify.patch<{ Params: { pathId: string }; Body: PathUpdateInput }>(
    '/paths/:pathId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pathId } = request.params;
      const updates = request.body;

      try {
        // Check if path exists
        const [existingPath] = await fastify.db
          .select()
          .from(paths)
          .where(eq(paths.id, pathId))
          .limit(1);

        if (!existingPath) {
          return reply.status(404).send({ error: 'Path not found' });
        }

        // TODO: Check if user has permission to update this path

        // Validate nodes if provided
        if (updates.nodes !== undefined) {
          if (!Array.isArray(updates.nodes)) {
            return reply.status(400).send({ error: 'Nodes must be an array' });
          }

          if (updates.nodes.length < 2) {
            return reply.status(400).send({ error: 'Path must have at least 2 nodes' });
          }

          for (const node of updates.nodes) {
            if (typeof node.x !== 'number' || typeof node.y !== 'number') {
              return reply.status(400).send({ error: 'Each node must have x and y coordinates as numbers' });
            }
          }
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name;
        }
        if (updates.nodes !== undefined) {
          updateData.nodes = updates.nodes;
        }
        if (updates.speed !== undefined) {
          updateData.speed = updates.speed;
        }
        if (updates.loop !== undefined) {
          updateData.loop = updates.loop;
        }
        if (updates.assignedObjectId !== undefined) {
          updateData.assignedObjectId = updates.assignedObjectId;
        }
        if (updates.assignedObjectType !== undefined) {
          updateData.assignedObjectType = updates.assignedObjectType;
        }
        if (updates.visible !== undefined) {
          updateData.visible = updates.visible;
        }
        if (updates.color !== undefined) {
          updateData.color = updates.color;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update path in database
        const updatedPaths = await fastify.db
          .update(paths)
          .set(updateData)
          .where(eq(paths.id, pathId))
          .returning();

        const updatedPath = updatedPaths[0];

        // Convert to Path interface
        const formattedPath: Path = {
          id: updatedPath.id,
          sceneId: updatedPath.sceneId,
          name: updatedPath.name,
          nodes: updatedPath.nodes as Array<{ x: number; y: number }>,
          speed: updatedPath.speed,
          loop: updatedPath.loop,
          assignedObjectId: updatedPath.assignedObjectId ?? null,
          assignedObjectType: updatedPath.assignedObjectType as 'token' | 'light' | null,
          visible: updatedPath.visible,
          color: updatedPath.color,
          data: updatedPath.data as Record<string, unknown>,
          createdAt: updatedPath.createdAt,
          updatedAt: updatedPath.updatedAt,
        };

        return reply.status(200).send({ path: formattedPath });
      } catch (error) {
        fastify.log.error(error, 'Failed to update path');
        return reply.status(500).send({ error: 'Failed to update path' });
      }
    }
  );

  /**
   * DELETE /api/v1/paths/:pathId - Delete a path
   * Deletes a specific path
   */
  fastify.delete<{ Params: { pathId: string } }>(
    '/paths/:pathId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pathId } = request.params;

      try {
        // Check if path exists
        const [existingPath] = await fastify.db
          .select()
          .from(paths)
          .where(eq(paths.id, pathId))
          .limit(1);

        if (!existingPath) {
          return reply.status(404).send({ error: 'Path not found' });
        }

        // TODO: Check if user has permission to delete this path

        // Delete path from database
        await fastify.db
          .delete(paths)
          .where(eq(paths.id, pathId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete path');
        return reply.status(500).send({ error: 'Failed to delete path' });
      }
    }
  );
};

export default pathsRoute;
