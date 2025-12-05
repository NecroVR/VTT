import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  RegionAddPayload,
  RegionAddedPayload,
  RegionUpdatePayload,
  RegionUpdatedPayload,
  RegionRemovePayload,
  RegionRemovedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { regions } from '@vtt/database';
import { eq } from 'drizzle-orm';

export async function handleRegionAdd(
  socket: WebSocket,
  message: WSMessage<RegionAddPayload>,
  request: FastifyRequest
): Promise<void> {
  const gameId = roomManager.getRoomForSocket(socket);
  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const {
      sceneId,
      name,
      shape = 'rectangle',
      x,
      y,
      width = null,
      height = null,
      radius = null,
      points = null,
      color = '#ff0000',
      alpha = 0.3,
      hidden = true,
      locked = false,
      triggerType = null,
      triggerAction = null,
      triggerData = null,
      data = {},
    } = message.payload;

    const newRegions = await request.server.db
      .insert(regions)
      .values({
        sceneId,
        name,
        shape,
        x,
        y,
        width,
        height,
        radius,
        points,
        color,
        alpha,
        hidden,
        locked,
        triggerType,
        triggerAction,
        triggerData,
        data,
      })
      .returning();

    const newRegion = newRegions[0];

    const addedPayload: RegionAddedPayload = {
      region: {
        id: newRegion.id,
        sceneId: newRegion.sceneId,
        name: newRegion.name,
        shape: newRegion.shape as any,
        x: newRegion.x,
        y: newRegion.y,
        width: newRegion.width,
        height: newRegion.height,
        radius: newRegion.radius,
        points: newRegion.points as any,
        color: newRegion.color,
        alpha: newRegion.alpha,
        hidden: newRegion.hidden,
        locked: newRegion.locked,
        triggerType: newRegion.triggerType,
        triggerAction: newRegion.triggerAction,
        triggerData: newRegion.triggerData as any,
        data: newRegion.data as Record<string, unknown>,
        createdAt: newRegion.createdAt,
        updatedAt: newRegion.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'region:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ regionId: newRegion.id, gameId }, 'Region added');
  } catch (error) {
    request.log.error({ error }, 'Error adding region');
    sendError(socket, 'Failed to add region');
  }
}

export async function handleRegionUpdate(
  socket: WebSocket,
  message: WSMessage<RegionUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  const gameId = roomManager.getRoomForSocket(socket);
  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { regionId, updates } = message.payload;

    const updatedRegions = await request.server.db
      .update(regions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(regions.id, regionId))
      .returning();

    if (updatedRegions.length === 0) {
      sendError(socket, 'Region not found');
      return;
    }

    const updatedRegion = updatedRegions[0];

    const updatedPayload: RegionUpdatedPayload = {
      region: {
        id: updatedRegion.id,
        sceneId: updatedRegion.sceneId,
        name: updatedRegion.name,
        shape: updatedRegion.shape as any,
        x: updatedRegion.x,
        y: updatedRegion.y,
        width: updatedRegion.width,
        height: updatedRegion.height,
        radius: updatedRegion.radius,
        points: updatedRegion.points as any,
        color: updatedRegion.color,
        alpha: updatedRegion.alpha,
        hidden: updatedRegion.hidden,
        locked: updatedRegion.locked,
        triggerType: updatedRegion.triggerType,
        triggerAction: updatedRegion.triggerAction,
        triggerData: updatedRegion.triggerData as any,
        data: updatedRegion.data as Record<string, unknown>,
        createdAt: updatedRegion.createdAt,
        updatedAt: updatedRegion.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'region:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ regionId, gameId }, 'Region updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating region');
    sendError(socket, 'Failed to update region');
  }
}

export async function handleRegionRemove(
  socket: WebSocket,
  message: WSMessage<RegionRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  const gameId = roomManager.getRoomForSocket(socket);
  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { regionId } = message.payload;

    const deletedRegions = await request.server.db
      .delete(regions)
      .where(eq(regions.id, regionId))
      .returning();

    if (deletedRegions.length === 0) {
      sendError(socket, 'Region not found');
      return;
    }

    const removedPayload: RegionRemovedPayload = { regionId };
    roomManager.broadcast(gameId, {
      type: 'region:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ regionId, gameId }, 'Region removed');
  } catch (error) {
    request.log.error({ error }, 'Error removing region');
    sendError(socket, 'Failed to remove region');
  }
}

function sendError(socket: WebSocket, message: string): void {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify({
      type: 'error',
      payload: { message },
      timestamp: Date.now(),
    }));
  }
}
