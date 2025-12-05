import type { FastifyPluginAsync } from 'fastify';
import { fogExploration, scenes } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type {
  FogExploration,
  UpdateFogExplorationRequest,
  RevealAreaRequest,
  HideAreaRequest,
  FogGrid,
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Fog of War API routes
 * All routes require authentication
 * Handles fog exploration tracking for scenes
 */
const fogRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/fog - Get fog state for current user
   * Returns the fog exploration data for the authenticated user in a scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/fog',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const userId = request.user.id;

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

        // Fetch fog exploration data for this user and scene
        const [fog] = await fastify.db
          .select()
          .from(fogExploration)
          .where(
            and(
              eq(fogExploration.sceneId, sceneId),
              eq(fogExploration.userId, userId)
            )
          )
          .limit(1);

        if (!fog) {
          // Create initial fog exploration data
          const [newFog] = await fastify.db
            .insert(fogExploration)
            .values({
              sceneId,
              userId,
              exploredGrid: [],
              revealedGrid: [],
              gridCellSize: 50,
            })
            .returning();

          const formattedFog: FogExploration = {
            id: newFog.id,
            sceneId: newFog.sceneId,
            userId: newFog.userId,
            exploredGrid: newFog.exploredGrid as FogGrid,
            revealedGrid: newFog.revealedGrid as FogGrid,
            gridCellSize: newFog.gridCellSize,
            createdAt: newFog.createdAt,
            updatedAt: newFog.updatedAt,
          };

          return reply.status(200).send({ fog: formattedFog });
        }

        const formattedFog: FogExploration = {
          id: fog.id,
          sceneId: fog.sceneId,
          userId: fog.userId,
          exploredGrid: fog.exploredGrid as FogGrid,
          revealedGrid: fog.revealedGrid as FogGrid,
          gridCellSize: fog.gridCellSize,
          createdAt: fog.createdAt,
          updatedAt: fog.updatedAt,
        };

        return reply.status(200).send({ fog: formattedFog });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch fog exploration data');
        return reply.status(500).send({ error: 'Failed to fetch fog exploration data' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/fog/reveal - GM reveal area
   * Reveals an area of the fog permanently (GM only)
   */
  fastify.post<{ Params: { sceneId: string }; Body: RevealAreaRequest }>(
    '/scenes/:sceneId/fog/reveal',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const { x, y, width, height } = request.body;

      try {
        // TODO: Check if user is GM for this scene

        // Verify scene exists
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // Get all fog exploration entries for this scene
        const fogs = await fastify.db
          .select()
          .from(fogExploration)
          .where(eq(fogExploration.sceneId, sceneId));

        // Update revealed grid for each user
        for (const fog of fogs) {
          const revealedGrid = (fog.revealedGrid as FogGrid) || [];

          // Ensure grid is large enough
          const maxY = y + height;
          const maxX = x + width;

          while (revealedGrid.length < maxY) {
            revealedGrid.push([]);
          }

          for (let row = y; row < maxY; row++) {
            while (revealedGrid[row].length < maxX) {
              revealedGrid[row].push(false);
            }
            for (let col = x; col < maxX; col++) {
              revealedGrid[row][col] = true;
            }
          }

          await fastify.db
            .update(fogExploration)
            .set({
              revealedGrid,
              updatedAt: new Date(),
            })
            .where(eq(fogExploration.id, fog.id));
        }

        return reply.status(200).send({ success: true, message: 'Area revealed' });
      } catch (error) {
        fastify.log.error(error, 'Failed to reveal area');
        return reply.status(500).send({ error: 'Failed to reveal area' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/fog/hide - GM hide area
   * Hides an area (removes from revealed areas)
   */
  fastify.post<{ Params: { sceneId: string }; Body: HideAreaRequest }>(
    '/scenes/:sceneId/fog/hide',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const { x, y, width, height } = request.body;

      try {
        // TODO: Check if user is GM for this scene

        // Verify scene exists
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // Get all fog exploration entries for this scene
        const fogs = await fastify.db
          .select()
          .from(fogExploration)
          .where(eq(fogExploration.sceneId, sceneId));

        // Update revealed grid for each user
        for (const fog of fogs) {
          const revealedGrid = (fog.revealedGrid as FogGrid) || [];

          const maxY = y + height;
          const maxX = x + width;

          for (let row = y; row < maxY && row < revealedGrid.length; row++) {
            for (let col = x; col < maxX && col < revealedGrid[row].length; col++) {
              revealedGrid[row][col] = false;
            }
          }

          await fastify.db
            .update(fogExploration)
            .set({
              revealedGrid,
              updatedAt: new Date(),
            })
            .where(eq(fogExploration.id, fog.id));
        }

        return reply.status(200).send({ success: true, message: 'Area hidden' });
      } catch (error) {
        fastify.log.error(error, 'Failed to hide area');
        return reply.status(500).send({ error: 'Failed to hide area' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/fog/reset - GM reset all fog
   * Resets all fog exploration for a scene
   */
  fastify.post<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/fog/reset',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

      try {
        // TODO: Check if user is GM for this scene

        // Verify scene exists
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // Reset all fog exploration entries for this scene
        await fastify.db
          .update(fogExploration)
          .set({
            exploredGrid: [],
            revealedGrid: [],
            updatedAt: new Date(),
          })
          .where(eq(fogExploration.sceneId, sceneId));

        return reply.status(200).send({ success: true, message: 'Fog reset' });
      } catch (error) {
        fastify.log.error(error, 'Failed to reset fog');
        return reply.status(500).send({ error: 'Failed to reset fog' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/fog/explore - Update explored areas
   * Updates the explored grid based on token vision
   */
  fastify.post<{ Params: { sceneId: string }; Body: UpdateFogExplorationRequest }>(
    '/scenes/:sceneId/fog/explore',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const userId = request.user.id;
      const { exploredGrid } = request.body;

      if (!exploredGrid) {
        return reply.status(400).send({ error: 'exploredGrid is required' });
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

        // Get or create fog exploration entry
        const [existingFog] = await fastify.db
          .select()
          .from(fogExploration)
          .where(
            and(
              eq(fogExploration.sceneId, sceneId),
              eq(fogExploration.userId, userId)
            )
          )
          .limit(1);

        if (!existingFog) {
          // Create new entry
          const [newFog] = await fastify.db
            .insert(fogExploration)
            .values({
              sceneId,
              userId,
              exploredGrid,
              revealedGrid: [],
              gridCellSize: 50,
            })
            .returning();

          const formattedFog: FogExploration = {
            id: newFog.id,
            sceneId: newFog.sceneId,
            userId: newFog.userId,
            exploredGrid: newFog.exploredGrid as FogGrid,
            revealedGrid: newFog.revealedGrid as FogGrid,
            gridCellSize: newFog.gridCellSize,
            createdAt: newFog.createdAt,
            updatedAt: newFog.updatedAt,
          };

          return reply.status(200).send({ fog: formattedFog });
        }

        // Merge existing explored areas with new ones
        const currentExplored = (existingFog.exploredGrid as FogGrid) || [];
        const mergedGrid = mergeGrids(currentExplored, exploredGrid);

        // Update existing entry
        const [updatedFog] = await fastify.db
          .update(fogExploration)
          .set({
            exploredGrid: mergedGrid,
            updatedAt: new Date(),
          })
          .where(eq(fogExploration.id, existingFog.id))
          .returning();

        const formattedFog: FogExploration = {
          id: updatedFog.id,
          sceneId: updatedFog.sceneId,
          userId: updatedFog.userId,
          exploredGrid: updatedFog.exploredGrid as FogGrid,
          revealedGrid: updatedFog.revealedGrid as FogGrid,
          gridCellSize: updatedFog.gridCellSize,
          createdAt: updatedFog.createdAt,
          updatedAt: updatedFog.updatedAt,
        };

        return reply.status(200).send({ fog: formattedFog });
      } catch (error) {
        fastify.log.error(error, 'Failed to update explored areas');
        return reply.status(500).send({ error: 'Failed to update explored areas' });
      }
    }
  );
};

/**
 * Merge two grids, combining explored areas
 */
function mergeGrids(grid1: FogGrid, grid2: FogGrid): FogGrid {
  const maxRows = Math.max(grid1.length, grid2.length);
  const result: FogGrid = [];

  for (let row = 0; row < maxRows; row++) {
    const row1 = grid1[row] || [];
    const row2 = grid2[row] || [];
    const maxCols = Math.max(row1.length, row2.length);
    const resultRow: boolean[] = [];

    for (let col = 0; col < maxCols; col++) {
      // Cell is explored if it's explored in either grid
      resultRow[col] = (row1[col] || false) || (row2[col] || false);
    }

    result.push(resultRow);
  }

  return result;
}

export default fogRoute;
