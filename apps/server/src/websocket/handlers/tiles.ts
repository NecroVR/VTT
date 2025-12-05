import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  TileAddPayload,
  TileAddedPayload,
  TileUpdatePayload,
  TileUpdatedPayload,
  TileRemovePayload,
  TileRemovedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { tiles } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Handle tile:add event
 * Creates a new tile and broadcasts to all players in the campaign
 */
export async function handleTileAdd(
  socket: WebSocket,
  message: WSMessage<TileAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Tile add');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const {
      sceneId,
      img,
      x = 0,
      y = 0,
      z = 0,
      width,
      height,
      rotation = 0,
      tint = null,
      alpha = 1,
      hidden = false,
      locked = false,
      overhead = false,
      roof = false,
      occlusion = null,
      data = {},
    } = message.payload;

    // Create tile in database
    const newTiles = await request.server.db
      .insert(tiles)
      .values({
        sceneId,
        img,
        x,
        y,
        z,
        width,
        height,
        rotation,
        tint,
        alpha,
        hidden,
        locked,
        overhead,
        roof,
        occlusion,
        data,
      })
      .returning();

    const newTile = newTiles[0];

    // Broadcast to all players
    const addedPayload: TileAddedPayload = {
      tile: {
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
        occlusion: newTile.occlusion as any,
        data: newTile.data as Record<string, unknown>,
        createdAt: newTile.createdAt,
        updatedAt: newTile.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'tile:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tileId: newTile.id, gameId }, 'Tile added');
  } catch (error) {
    request.log.error({ error }, 'Error adding tile');
    sendError(socket, 'Failed to add tile');
  }
}

/**
 * Handle tile:update event
 * Updates a tile and broadcasts to all players in the campaign
 */
export async function handleTileUpdate(
  socket: WebSocket,
  message: WSMessage<TileUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Tile update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { tileId, updates } = message.payload;

    // Update tile in database
    const updatedTiles = await request.server.db
      .update(tiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tiles.id, tileId))
      .returning();

    if (updatedTiles.length === 0) {
      sendError(socket, 'Tile not found');
      return;
    }

    const updatedTile = updatedTiles[0];

    // Broadcast to all players
    const updatedPayload: TileUpdatedPayload = {
      tile: {
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
        occlusion: updatedTile.occlusion as any,
        data: updatedTile.data as Record<string, unknown>,
        createdAt: updatedTile.createdAt,
        updatedAt: updatedTile.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'tile:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tileId, gameId }, 'Tile updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating tile');
    sendError(socket, 'Failed to update tile');
  }
}

/**
 * Handle tile:remove event
 * Deletes a tile and broadcasts to all players in the campaign
 */
export async function handleTileRemove(
  socket: WebSocket,
  message: WSMessage<TileRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Tile remove');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { tileId } = message.payload;

    // Delete tile from database
    const deletedTiles = await request.server.db
      .delete(tiles)
      .where(eq(tiles.id, tileId))
      .returning();

    if (deletedTiles.length === 0) {
      sendError(socket, 'Tile not found');
      return;
    }

    // Broadcast to all players
    const removedPayload: TileRemovedPayload = { tileId };
    roomManager.broadcast(gameId, {
      type: 'tile:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tileId, gameId }, 'Tile removed');
  } catch (error) {
    request.log.error({ error }, 'Error removing tile');
    sendError(socket, 'Failed to remove tile');
  }
}

/**
 * Helper function to send error message
 */
function sendError(socket: WebSocket, message: string): void {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify({
      type: 'error',
      payload: { message },
      timestamp: Date.now(),
    }));
  }
}
