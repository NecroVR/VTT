import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  Window,
  WindowAddPayload,
  WindowAddedPayload,
  WindowUpdatePayload,
  WindowUpdatedPayload,
  WindowRemovePayload,
  WindowRemovedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { windows } from '@vtt/database';
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
 * Handle window add request
 */
export async function handleWindowAdd(
  socket: WebSocket,
  message: WSMessage<WindowAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Window add');

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
      data = {},
    } = message.payload;

    // Create window in database
    const newWindows = await request.server.db
      .insert(windows)
      .values({
        sceneId,
        x1,
        y1,
        x2,
        y2,
        wallShape,
        controlPoints,
        snapToGrid,
        data,
      })
      .returning();

    const newWindow = newWindows[0];

    // Convert to Window interface
    const windowPayload: Window = {
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

    // Broadcast to all players
    const addedPayload: WindowAddedPayload = { window: windowPayload };
    roomManager.broadcast(campaignId, {
      type: 'window:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ windowId: newWindow.id, sceneId, campaignId }, 'Window created');
  } catch (error) {
    request.log.error({ error }, 'Error creating window');
    sendMessage(socket, 'error', { message: 'Failed to create window' });
  }
}

/**
 * Handle window update request
 */
export async function handleWindowUpdate(
  socket: WebSocket,
  message: WSMessage<WindowUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Window update');

  const { windowId, updates } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Update window in database
    const updatedWindows = await request.server.db
      .update(windows)
      .set(updates)
      .where(eq(windows.id, windowId))
      .returning();

    if (updatedWindows.length === 0) {
      sendMessage(socket, 'error', { message: 'Window not found' });
      return;
    }

    const updatedWindow = updatedWindows[0];

    // Convert to Window interface
    const windowPayload: Window = {
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

    // Broadcast to all players
    const updatedPayload: WindowUpdatedPayload = { window: windowPayload };
    roomManager.broadcast(campaignId, {
      type: 'window:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ windowId, campaignId }, 'Window updated');
  } catch (error) {
    request.log.error({ error, windowId }, 'Error updating window');
    sendMessage(socket, 'error', { message: 'Failed to update window' });
  }
}

/**
 * Handle window remove request
 */
export async function handleWindowRemove(
  socket: WebSocket,
  message: WSMessage<WindowRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Window remove');

  const { windowId } = message.payload;

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendMessage(socket, 'error', { message: 'Not in a campaign room' });
    return;
  }

  try {
    // Delete window from database
    const deletedWindows = await request.server.db
      .delete(windows)
      .where(eq(windows.id, windowId))
      .returning();

    if (deletedWindows.length === 0) {
      sendMessage(socket, 'error', { message: 'Window not found' });
      return;
    }

    // Broadcast to all players
    const removedPayload: WindowRemovedPayload = { windowId };
    roomManager.broadcast(campaignId, {
      type: 'window:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ windowId, campaignId }, 'Window removed');
  } catch (error) {
    request.log.error({ error, windowId }, 'Error removing window');
    sendMessage(socket, 'error', { message: 'Failed to remove window' });
  }
}
