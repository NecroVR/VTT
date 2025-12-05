import type { FastifyPluginAsync } from 'fastify';
import { tiles, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Tile, CreateTileRequest, UpdateTileRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Tile API routes
 * All routes require authentication
 * Handles CRUD operations for tiles
 */
const tilesRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/tiles - List all tiles for a scene
   * Returns tiles for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/tiles',
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

        // Fetch all tiles for the scene
        const sceneTiles = await fastify.db
          .select()
          .from(tiles)
          .where(eq(tiles.sceneId, sceneId));

        // Convert to Tile interface
        const formattedTiles: Tile[] = sceneTiles.map(tile => ({
          id: tile.id,
          sceneId: tile.sceneId,
          img: tile.img,
          x: tile.x,
          y: tile.y,
          z: tile.z,
          width: tile.width,
          height: tile.height,
          rotation: tile.rotation,
          tint: tile.tint,
          alpha: tile.alpha,
          hidden: tile.hidden,
          locked: tile.locked,
          overhead: tile.overhead,
          roof: tile.roof,
          occlusion: tile.occlusion as Record<string, unknown> | null,
          data: tile.data as Record<string, unknown>,
          createdAt: tile.createdAt,
          updatedAt: tile.updatedAt,
        }));

        return reply.status(200).send({ tiles: formattedTiles });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch tiles');
        return reply.status(500).send({ error: 'Failed to fetch tiles' });
      }
    }
  );

  /**
   * GET /api/v1/tiles/:tileId - Get a single tile
   * Returns a specific tile
   */
  fastify.get<{ Params: { tileId: string } }>(
    '/tiles/:tileId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { tileId } = request.params;

      try {
        // Fetch tile
        const [tile] = await fastify.db
          .select()
          .from(tiles)
          .where(eq(tiles.id, tileId))
          .limit(1);

        if (!tile) {
          return reply.status(404).send({ error: 'Tile not found' });
        }

        // Convert to Tile interface
        const formattedTile: Tile = {
          id: tile.id,
          sceneId: tile.sceneId,
          img: tile.img,
          x: tile.x,
          y: tile.y,
          z: tile.z,
          width: tile.width,
          height: tile.height,
          rotation: tile.rotation,
          tint: tile.tint,
          alpha: tile.alpha,
          hidden: tile.hidden,
          locked: tile.locked,
          overhead: tile.overhead,
          roof: tile.roof,
          occlusion: tile.occlusion as Record<string, unknown> | null,
          data: tile.data as Record<string, unknown>,
          createdAt: tile.createdAt,
          updatedAt: tile.updatedAt,
        };

        return reply.status(200).send({ tile: formattedTile });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch tile');
        return reply.status(500).send({ error: 'Failed to fetch tile' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/tiles - Create a new tile
   * Creates a tile for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateTileRequest }>(
    '/scenes/:sceneId/tiles',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const tileData = request.body;

      // Validate required fields
      if (!tileData.img || !tileData.width || !tileData.height) {
        return reply.status(400).send({ error: 'Image URL, width, and height are required' });
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

        // Create tile in database
        const newTiles = await fastify.db
          .insert(tiles)
          .values({
            sceneId,
            img: tileData.img,
            x: tileData.x ?? 0,
            y: tileData.y ?? 0,
            z: tileData.z ?? 0,
            width: tileData.width,
            height: tileData.height,
            rotation: tileData.rotation ?? 0,
            tint: tileData.tint ?? null,
            alpha: tileData.alpha ?? 1,
            hidden: tileData.hidden ?? false,
            locked: tileData.locked ?? false,
            overhead: tileData.overhead ?? false,
            roof: tileData.roof ?? false,
            occlusion: tileData.occlusion ?? null,
            data: tileData.data ?? {},
          })
          .returning();

        const newTile = newTiles[0];

        // Convert to Tile interface
        const formattedTile: Tile = {
          id: newTile.id,
          sceneId: newTile.sceneId,
          img: newTile.img,
          x: newTile.x,
          y: newTile.y,
          z: newTile.z,
          width: newTile.width,
          height: newTile.height,
          rotation: newTile.rotation,
          tint: newTile.tint,
          alpha: newTile.alpha,
          hidden: newTile.hidden,
          locked: newTile.locked,
          overhead: newTile.overhead,
          roof: newTile.roof,
          occlusion: newTile.occlusion as Record<string, unknown> | null,
          data: newTile.data as Record<string, unknown>,
          createdAt: newTile.createdAt,
          updatedAt: newTile.updatedAt,
        };

        return reply.status(201).send({ tile: formattedTile });
      } catch (error) {
        fastify.log.error(error, 'Failed to create tile');
        return reply.status(500).send({ error: 'Failed to create tile' });
      }
    }
  );

  /**
   * PATCH /api/v1/tiles/:tileId - Update a tile
   * Updates a specific tile
   */
  fastify.patch<{ Params: { tileId: string }; Body: UpdateTileRequest }>(
    '/tiles/:tileId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { tileId } = request.params;
      const updates = request.body;

      try {
        // Check if tile exists
        const [existingTile] = await fastify.db
          .select()
          .from(tiles)
          .where(eq(tiles.id, tileId))
          .limit(1);

        if (!existingTile) {
          return reply.status(404).send({ error: 'Tile not found' });
        }

        // Update tile in database
        const updatedTiles = await fastify.db
          .update(tiles)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(tiles.id, tileId))
          .returning();

        const updatedTile = updatedTiles[0];

        // Convert to Tile interface
        const formattedTile: Tile = {
          id: updatedTile.id,
          sceneId: updatedTile.sceneId,
          img: updatedTile.img,
          x: updatedTile.x,
          y: updatedTile.y,
          z: updatedTile.z,
          width: updatedTile.width,
          height: updatedTile.height,
          rotation: updatedTile.rotation,
          tint: updatedTile.tint,
          alpha: updatedTile.alpha,
          hidden: updatedTile.hidden,
          locked: updatedTile.locked,
          overhead: updatedTile.overhead,
          roof: updatedTile.roof,
          occlusion: updatedTile.occlusion as Record<string, unknown> | null,
          data: updatedTile.data as Record<string, unknown>,
          createdAt: updatedTile.createdAt,
          updatedAt: updatedTile.updatedAt,
        };

        return reply.status(200).send({ tile: formattedTile });
      } catch (error) {
        fastify.log.error(error, 'Failed to update tile');
        return reply.status(500).send({ error: 'Failed to update tile' });
      }
    }
  );

  /**
   * DELETE /api/v1/tiles/:tileId - Delete a tile
   * Deletes a specific tile
   */
  fastify.delete<{ Params: { tileId: string } }>(
    '/tiles/:tileId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { tileId } = request.params;

      try {
        // Check if tile exists
        const [existingTile] = await fastify.db
          .select()
          .from(tiles)
          .where(eq(tiles.id, tileId))
          .limit(1);

        if (!existingTile) {
          return reply.status(404).send({ error: 'Tile not found' });
        }

        // Delete tile from database
        await fastify.db
          .delete(tiles)
          .where(eq(tiles.id, tileId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete tile');
        return reply.status(500).send({ error: 'Failed to delete tile' });
      }
    }
  );
};

export default tilesRoute;
