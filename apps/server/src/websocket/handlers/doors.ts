import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  Door,
  DoorAddPayload,
  DoorAddedPayload,
  DoorUpdatePayload,
  DoorUpdatedPayload,
  DoorRemovePayload,
  DoorRemovedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { doors } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Helper function to send type-safe WebSocket messages
 */
function sendMessage<T>(
  socket: WebSocket,
  type: string,
  payload: T
): void {
  const message = {
    type,
    payload,
    timestamp: Date.now(),
  };
  socket.send(JSON.stringify(message));
}

/**
 * Handle door add request
 */
export async function handleDoorAdd(
  socket: WebSocket,
  message: WSMessage<DoorAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Door add');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    const {
      sceneId,
      x1,
      y1,
      x2,
      y2,
      wallShape = 'straight',
      controlPoints = [],
      snapToGrid = false,
      status = 'closed',
      isLocked = false,
      data = {},
    } = message.payload;

    // Create door in database
    const newDoors = await request.server.db
      .insert(doors)
      .values({
        sceneId,
        x1,
        y1,
        x2,
        y2,
        wallShape,
        controlPoints,
        snapToGrid,
        status,
        isLocked,
        data,
      })
      .returning();

    const newDoor = newDoors[0];

    // Convert to Door interface
    const doorPayload: Door = {
      id: newDoor.id,
      sceneId: newDoor.sceneId,
      x1: newDoor.x1,
      y1: newDoor.y1,
      x2: newDoor.x2,
      y2: newDoor.y2,
      wallShape: newDoor.wallShape as 'straight' | 'curved',
      controlPoints: newDoor.controlPoints as Array<{ x: number; y: number }> || [],
      snapToGrid: newDoor.snapToGrid,
      status: newDoor.status as 'open' | 'closed' | 'broken',
      isLocked: newDoor.isLocked,
      data: newDoor.data as Record<string, unknown>,
      createdAt: newDoor.createdAt,
    };

    // Broadcast to all players
    const addedPayload: DoorAddedPayload = { door: doorPayload };
    roomManager.broadcast(campaignId, {
      type: 'door:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ doorId: newDoor.id, sceneId, campaignId }, 'Door created');
  } catch (error) {
    request.log.error({ error }, 'Error creating door');
    sendMessage(socket, 'error', { message: 'Failed to create door' });
  }
}

/**
 * Handle door update request
 */
export async function handleDoorUpdate(
  socket: WebSocket,
  message: WSMessage<DoorUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Door update');

  const { doorId, updates } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Update door in database
    const updatedDoors = await request.server.db
      .update(doors)
      .set(updates)
      .where(eq(doors.id, doorId))
      .returning();

    if (updatedDoors.length === 0) {
      sendMessage(socket, 'error', { message: 'Door not found' });
      return;
    }

    const updatedDoor = updatedDoors[0];

    // Convert to Door interface
    const doorPayload: Door = {
      id: updatedDoor.id,
      sceneId: updatedDoor.sceneId,
      x1: updatedDoor.x1,
      y1: updatedDoor.y1,
      x2: updatedDoor.x2,
      y2: updatedDoor.y2,
      wallShape: updatedDoor.wallShape as 'straight' | 'curved',
      controlPoints: updatedDoor.controlPoints as Array<{ x: number; y: number }> || [],
      snapToGrid: updatedDoor.snapToGrid,
      status: updatedDoor.status as 'open' | 'closed' | 'broken',
      isLocked: updatedDoor.isLocked,
      data: updatedDoor.data as Record<string, unknown>,
      createdAt: updatedDoor.createdAt,
    };

    // Broadcast to all players
    const updatedPayload: DoorUpdatedPayload = { door: doorPayload };
    roomManager.broadcast(campaignId, {
      type: 'door:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ doorId, campaignId }, 'Door updated');
  } catch (error) {
    request.log.error({ error, doorId }, 'Error updating door');
    sendMessage(socket, 'error', { message: 'Failed to update door' });
  }
}

/**
 * Handle door remove request
 */
export async function handleDoorRemove(
  socket: WebSocket,
  message: WSMessage<DoorRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Door remove');

  const { doorId } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Delete door from database
    const deletedDoors = await request.server.db
      .delete(doors)
      .where(eq(doors.id, doorId))
      .returning();

    if (deletedDoors.length === 0) {
      sendMessage(socket, 'error', { message: 'Door not found' });
      return;
    }

    // Broadcast to all players
    const removedPayload: DoorRemovedPayload = { doorId };
    roomManager.broadcast(campaignId, {
      type: 'door:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ doorId, campaignId }, 'Door removed');
  } catch (error) {
    request.log.error({ error, doorId }, 'Error removing door');
    sendMessage(socket, 'error', { message: 'Failed to remove door' });
  }
}
