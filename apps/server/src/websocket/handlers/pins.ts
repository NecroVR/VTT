import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  PinAddPayload,
  PinAddedPayload,
  PinUpdatePayload,
  PinUpdatedPayload,
  PinRemovePayload,
  PinRemovedPayload,
  PinClickPayload,
  PinOpenedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { scenePins } from '@vtt/database';
import { eq } from 'drizzle-orm';

export async function handlePinAdd(
  socket: WebSocket,
  message: WSMessage<PinAddPayload>,
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
      x,
      y,
      icon = null,
      iconSize = 40,
      iconTint = null,
      text = null,
      fontSize = 24,
      textAnchor = 'bottom',
      textColor = '#ffffff',
      journalId = null,
      pageId = null,
      global = false,
      data = {},
    } = message.payload;

    const newPins = await request.server.db
      .insert(scenePins)
      .values({
        sceneId,
        x,
        y,
        icon,
        iconSize,
        iconTint,
        text,
        fontSize,
        textAnchor,
        textColor,
        journalId,
        pageId,
        global,
        data,
      })
      .returning();

    const newPin = newPins[0];

    const addedPayload: PinAddedPayload = {
      pin: {
        id: newPin.id,
        sceneId: newPin.sceneId,
        x: newPin.x,
        y: newPin.y,
        icon: newPin.icon,
        iconSize: newPin.iconSize,
        iconTint: newPin.iconTint,
        text: newPin.text,
        fontSize: newPin.fontSize,
        textAnchor: newPin.textAnchor,
        textColor: newPin.textColor,
        journalId: newPin.journalId,
        pageId: newPin.pageId,
        global: newPin.global,
        data: newPin.data as Record<string, unknown>,
        createdAt: newPin.createdAt,
        updatedAt: newPin.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'pin:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pinId: newPin.id, gameId }, 'Pin added');
  } catch (error) {
    request.log.error({ error }, 'Error adding pin');
    sendError(socket, 'Failed to add pin');
  }
}

export async function handlePinUpdate(
  socket: WebSocket,
  message: WSMessage<PinUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  const gameId = roomManager.getRoomForSocket(socket);
  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { pinId, updates } = message.payload;

    const updatedPins = await request.server.db
      .update(scenePins)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(scenePins.id, pinId))
      .returning();

    if (updatedPins.length === 0) {
      sendError(socket, 'Pin not found');
      return;
    }

    const updatedPin = updatedPins[0];

    const updatedPayload: PinUpdatedPayload = {
      pin: {
        id: updatedPin.id,
        sceneId: updatedPin.sceneId,
        x: updatedPin.x,
        y: updatedPin.y,
        icon: updatedPin.icon,
        iconSize: updatedPin.iconSize,
        iconTint: updatedPin.iconTint,
        text: updatedPin.text,
        fontSize: updatedPin.fontSize,
        textAnchor: updatedPin.textAnchor,
        textColor: updatedPin.textColor,
        journalId: updatedPin.journalId,
        pageId: updatedPin.pageId,
        global: updatedPin.global,
        data: updatedPin.data as Record<string, unknown>,
        createdAt: updatedPin.createdAt,
        updatedAt: updatedPin.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'pin:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pinId, gameId }, 'Pin updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating pin');
    sendError(socket, 'Failed to update pin');
  }
}

export async function handlePinRemove(
  socket: WebSocket,
  message: WSMessage<PinRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  const gameId = roomManager.getRoomForSocket(socket);
  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { pinId } = message.payload;

    const deletedPins = await request.server.db
      .delete(scenePins)
      .where(eq(scenePins.id, pinId))
      .returning();

    if (deletedPins.length === 0) {
      sendError(socket, 'Pin not found');
      return;
    }

    const removedPayload: PinRemovedPayload = { pinId };
    roomManager.broadcast(gameId, {
      type: 'pin:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pinId, gameId }, 'Pin removed');
  } catch (error) {
    request.log.error({ error }, 'Error removing pin');
    sendError(socket, 'Failed to remove pin');
  }
}

export async function handlePinClick(
  socket: WebSocket,
  message: WSMessage<PinClickPayload>,
  request: FastifyRequest
): Promise<void> {
  const gameId = roomManager.getRoomForSocket(socket);
  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { pinId } = message.payload;

    // Fetch pin to get journal info
    const [pin] = await request.server.db
      .select()
      .from(scenePins)
      .where(eq(scenePins.id, pinId))
      .limit(1);

    if (!pin) {
      sendError(socket, 'Pin not found');
      return;
    }

    const openedPayload: PinOpenedPayload = {
      pinId,
      journalId: pin.journalId,
      pageId: pin.pageId,
    };

    roomManager.broadcast(gameId, {
      type: 'pin:opened',
      payload: openedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pinId, gameId }, 'Pin clicked');
  } catch (error) {
    request.log.error({ error }, 'Error handling pin click');
    sendError(socket, 'Failed to handle pin click');
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
