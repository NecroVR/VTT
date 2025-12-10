import type { FastifyPluginAsync } from 'fastify';
import { pathPoints, scenes } from '@vtt/database';
import { eq, and, asc } from 'drizzle-orm';
import type {
  PathPoint,
  PathPointCreateInput,
  PathPointUpdateInput,
  AssembledPath,
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Path API routes (Point-based system)
 * All routes require authentication
 * Handles CRUD operations for path points
 */
const pathsRoute: FastifyPluginAsync = async (fastify) => {
  // ========================================
  // PATH POINTS ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/scenes/:sceneId/path-points - List all path points for a scene
   * Returns all path points for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/path-points',
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

        // TODO: Check if user is a participant in the campaign

        // Fetch all path points for the scene, ordered by pathName and pathIndex
        const points = await fastify.db
          .select()
          .from(pathPoints)
          .where(eq(pathPoints.sceneId, sceneId))
          .orderBy(asc(pathPoints.pathName), asc(pathPoints.pathIndex));

        // Convert to PathPoint interface
        const formattedPoints: PathPoint[] = points.map(point => ({
          id: point.id,
          sceneId: point.sceneId,
          pathName: point.pathName,
          pathIndex: point.pathIndex,
          x: point.x,
          y: point.y,
          color: point.color,
          visible: point.visible,
          data: point.data as Record<string, unknown>,
          createdAt: point.createdAt,
          updatedAt: point.updatedAt,
        }));

        return reply.status(200).send({ pathPoints: formattedPoints });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch path points');
        return reply.status(500).send({ error: 'Failed to fetch path points' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/path-points - Create a path point
   * Creates a new path point for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: PathPointCreateInput }>(
    '/scenes/:sceneId/path-points',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const pointData = request.body;

      // Validate required fields
      if (!pointData.pathName || typeof pointData.pathName !== 'string') {
        return reply.status(400).send({ error: 'pathName is required and must be a string' });
      }

      if (typeof pointData.pathIndex !== 'number' || pointData.pathIndex < 0) {
        return reply.status(400).send({ error: 'pathIndex must be a non-negative number' });
      }

      if (typeof pointData.x !== 'number' || typeof pointData.y !== 'number') {
        return reply.status(400).send({ error: 'x and y coordinates must be numbers' });
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

        // TODO: Check if user is the campaign owner or has permission to create path points

        // Create path point in database
        const newPoints = await fastify.db
          .insert(pathPoints)
          .values({
            sceneId,
            pathName: pointData.pathName,
            pathIndex: pointData.pathIndex,
            x: pointData.x,
            y: pointData.y,
            color: pointData.color ?? '#ffff00',
            visible: pointData.visible ?? true,
            data: pointData.data ?? {},
          })
          .returning();

        const newPoint = newPoints[0];

        // Convert to PathPoint interface
        const formattedPoint: PathPoint = {
          id: newPoint.id,
          sceneId: newPoint.sceneId,
          pathName: newPoint.pathName,
          pathIndex: newPoint.pathIndex,
          x: newPoint.x,
          y: newPoint.y,
          color: newPoint.color,
          visible: newPoint.visible,
          data: newPoint.data as Record<string, unknown>,
          createdAt: newPoint.createdAt,
          updatedAt: newPoint.updatedAt,
        };

        return reply.status(201).send({ pathPoint: formattedPoint });
      } catch (error) {
        fastify.log.error(error, 'Failed to create path point');
        // Check for unique constraint violation
        if ((error as any).code === '23505') {
          return reply.status(409).send({ error: 'A point with this pathName and pathIndex already exists' });
        }
        return reply.status(500).send({ error: 'Failed to create path point' });
      }
    }
  );

  /**
   * GET /api/v1/path-points/:pointId - Get a single path point
   * Returns a specific path point
   */
  fastify.get<{ Params: { pointId: string } }>(
    '/path-points/:pointId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pointId } = request.params;

      try {
        // Fetch path point
        const [point] = await fastify.db
          .select()
          .from(pathPoints)
          .where(eq(pathPoints.id, pointId))
          .limit(1);

        if (!point) {
          return reply.status(404).send({ error: 'Path point not found' });
        }

        // TODO: Check if user has access to this path point's scene

        // Convert to PathPoint interface
        const formattedPoint: PathPoint = {
          id: point.id,
          sceneId: point.sceneId,
          pathName: point.pathName,
          pathIndex: point.pathIndex,
          x: point.x,
          y: point.y,
          color: point.color,
          visible: point.visible,
          data: point.data as Record<string, unknown>,
          createdAt: point.createdAt,
          updatedAt: point.updatedAt,
        };

        return reply.status(200).send({ pathPoint: formattedPoint });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch path point');
        return reply.status(500).send({ error: 'Failed to fetch path point' });
      }
    }
  );

  /**
   * PATCH /api/v1/path-points/:pointId - Update a path point
   * Updates a specific path point
   */
  fastify.patch<{ Params: { pointId: string }; Body: PathPointUpdateInput }>(
    '/path-points/:pointId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pointId } = request.params;
      const updates = request.body;

      try {
        // Check if path point exists
        const [existingPoint] = await fastify.db
          .select()
          .from(pathPoints)
          .where(eq(pathPoints.id, pointId))
          .limit(1);

        if (!existingPoint) {
          return reply.status(404).send({ error: 'Path point not found' });
        }

        // TODO: Check if user has permission to update this path point

        // Validate pathIndex if provided
        if (updates.pathIndex !== undefined && (typeof updates.pathIndex !== 'number' || updates.pathIndex < 0)) {
          return reply.status(400).send({ error: 'pathIndex must be a non-negative number' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.pathName !== undefined) {
          updateData.pathName = updates.pathName;
        }
        if (updates.pathIndex !== undefined) {
          updateData.pathIndex = updates.pathIndex;
        }
        if (updates.x !== undefined) {
          updateData.x = updates.x;
        }
        if (updates.y !== undefined) {
          updateData.y = updates.y;
        }
        if (updates.color !== undefined) {
          updateData.color = updates.color;
        }
        if (updates.visible !== undefined) {
          updateData.visible = updates.visible;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update path point in database
        const updatedPoints = await fastify.db
          .update(pathPoints)
          .set(updateData)
          .where(eq(pathPoints.id, pointId))
          .returning();

        const updatedPoint = updatedPoints[0];

        // Convert to PathPoint interface
        const formattedPoint: PathPoint = {
          id: updatedPoint.id,
          sceneId: updatedPoint.sceneId,
          pathName: updatedPoint.pathName,
          pathIndex: updatedPoint.pathIndex,
          x: updatedPoint.x,
          y: updatedPoint.y,
          color: updatedPoint.color,
          visible: updatedPoint.visible,
          data: updatedPoint.data as Record<string, unknown>,
          createdAt: updatedPoint.createdAt,
          updatedAt: updatedPoint.updatedAt,
        };

        return reply.status(200).send({ pathPoint: formattedPoint });
      } catch (error) {
        fastify.log.error(error, 'Failed to update path point');
        // Check for unique constraint violation
        if ((error as any).code === '23505') {
          return reply.status(409).send({ error: 'A point with this pathName and pathIndex already exists' });
        }
        return reply.status(500).send({ error: 'Failed to update path point' });
      }
    }
  );

  /**
   * DELETE /api/v1/path-points/:pointId - Delete a path point
   * Deletes a specific path point
   */
  fastify.delete<{ Params: { pointId: string } }>(
    '/path-points/:pointId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pointId } = request.params;

      try {
        // Check if path point exists
        const [existingPoint] = await fastify.db
          .select()
          .from(pathPoints)
          .where(eq(pathPoints.id, pointId))
          .limit(1);

        if (!existingPoint) {
          return reply.status(404).send({ error: 'Path point not found' });
        }

        // TODO: Check if user has permission to delete this path point

        // Delete path point from database
        await fastify.db
          .delete(pathPoints)
          .where(eq(pathPoints.id, pointId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete path point');
        return reply.status(500).send({ error: 'Failed to delete path point' });
      }
    }
  );

  // ========================================
  // ASSEMBLED PATHS ENDPOINT
  // ========================================

  /**
   * GET /api/v1/scenes/:sceneId/paths - Get all assembled paths (grouped points)
   * Returns all paths for a scene, assembled from points grouped by pathName
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

        // TODO: Check if user is a participant in the campaign

        // Fetch all path points for the scene
        const points = await fastify.db
          .select()
          .from(pathPoints)
          .where(eq(pathPoints.sceneId, sceneId))
          .orderBy(asc(pathPoints.pathName), asc(pathPoints.pathIndex));

        // Group points by pathName
        const pointsByPath = new Map<string, typeof points>();
        for (const point of points) {
          if (!pointsByPath.has(point.pathName)) {
            pointsByPath.set(point.pathName, []);
          }
          pointsByPath.get(point.pathName)!.push(point);
        }

        // Assemble paths
        const assembledPaths: AssembledPath[] = [];

        // Build assembled paths from grouped points
        for (const [pathName, pathPointsData] of pointsByPath) {
          // Get color and visible from first point (if exists)
          const firstPoint = pathPointsData[0];

          assembledPaths.push({
            pathName,
            sceneId,
            points: pathPointsData.map(p => ({
              id: p.id,
              x: p.x,
              y: p.y,
              pathIndex: p.pathIndex,
            })),
            color: firstPoint?.color ?? '#ffff00',
            visible: firstPoint?.visible ?? true,
          });
        }

        return reply.status(200).send({ paths: assembledPaths });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch assembled paths');
        return reply.status(500).send({ error: 'Failed to fetch assembled paths' });
      }
    }
  );
};

export default pathsRoute;
