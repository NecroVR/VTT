import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  DrawingCreatePayload,
  DrawingCreatedPayload,
  DrawingUpdatePayload,
  DrawingUpdatedPayload,
  DrawingDeletePayload,
  DrawingDeletedPayload,
  DrawingStreamPayload,
  DrawingStreamedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { drawings } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Handle drawing:create event
 * Creates a new drawing and broadcasts to all players in the game
 */
export async function handleDrawingCreate(
  socket: WebSocket,
  message: WSMessage<DrawingCreatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Drawing create');

  const gameId = roomManager.getRoomForSocket(socket);
  const userId = (request as any).userId;

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  if (!userId) {
    sendError(socket, 'User ID not found');
    return;
  }

  try {
    const {
      sceneId,
      drawingType,
      x = 0,
      y = 0,
      z = 0,
      rotation = 0,
      points = null,
      width = null,
      height = null,
      radius = null,
      strokeColor = '#000000',
      strokeWidth = 2,
      strokeAlpha = 1,
      fillColor = null,
      fillAlpha = 0.5,
      text = null,
      fontSize = null,
      fontFamily = null,
      textColor = null,
      hidden = false,
      locked = false,
      data = {},
    } = message.payload;

    // Create drawing in database
    const newDrawings = await request.server.db
      .insert(drawings)
      .values({
        sceneId,
        authorId: userId,
        drawingType,
        x,
        y,
        z,
        rotation,
        points,
        width,
        height,
        radius,
        strokeColor,
        strokeWidth,
        strokeAlpha,
        fillColor,
        fillAlpha,
        text,
        fontSize,
        fontFamily,
        textColor,
        hidden,
        locked,
        data,
      })
      .returning();

    const newDrawing = newDrawings[0];

    // Broadcast to all players
    const createdPayload: DrawingCreatedPayload = {
      drawing: {
        id: newDrawing.id,
        sceneId: newDrawing.sceneId,
        authorId: newDrawing.authorId,
        drawingType: newDrawing.drawingType as any,
        x: newDrawing.x,
        y: newDrawing.y,
        z: newDrawing.z,
        rotation: newDrawing.rotation,
        points: newDrawing.points as any,
        width: newDrawing.width,
        height: newDrawing.height,
        radius: newDrawing.radius,
        strokeColor: newDrawing.strokeColor,
        strokeWidth: newDrawing.strokeWidth,
        strokeAlpha: newDrawing.strokeAlpha,
        fillColor: newDrawing.fillColor,
        fillAlpha: newDrawing.fillAlpha,
        text: newDrawing.text,
        fontSize: newDrawing.fontSize,
        fontFamily: newDrawing.fontFamily,
        textColor: newDrawing.textColor,
        hidden: newDrawing.hidden,
        locked: newDrawing.locked,
        data: newDrawing.data as Record<string, unknown>,
        createdAt: newDrawing.createdAt,
        updatedAt: newDrawing.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'drawing:created',
      payload: createdPayload,
      timestamp: Date.now(),
    });

    request.log.info({ drawingId: newDrawing.id, gameId }, 'Drawing created');
  } catch (error) {
    request.log.error({ error }, 'Error creating drawing');
    sendError(socket, 'Failed to create drawing');
  }
}

/**
 * Handle drawing:update event
 * Updates a drawing and broadcasts to all players in the game
 */
export async function handleDrawingUpdate(
  socket: WebSocket,
  message: WSMessage<DrawingUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Drawing update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { drawingId, updates } = message.payload;

    // Update drawing in database
    const updatedDrawings = await request.server.db
      .update(drawings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(drawings.id, drawingId))
      .returning();

    if (updatedDrawings.length === 0) {
      sendError(socket, 'Drawing not found');
      return;
    }

    const updatedDrawing = updatedDrawings[0];

    // Broadcast to all players
    const updatedPayload: DrawingUpdatedPayload = {
      drawing: {
        id: updatedDrawing.id,
        sceneId: updatedDrawing.sceneId,
        authorId: updatedDrawing.authorId,
        drawingType: updatedDrawing.drawingType as any,
        x: updatedDrawing.x,
        y: updatedDrawing.y,
        z: updatedDrawing.z,
        rotation: updatedDrawing.rotation,
        points: updatedDrawing.points as any,
        width: updatedDrawing.width,
        height: updatedDrawing.height,
        radius: updatedDrawing.radius,
        strokeColor: updatedDrawing.strokeColor,
        strokeWidth: updatedDrawing.strokeWidth,
        strokeAlpha: updatedDrawing.strokeAlpha,
        fillColor: updatedDrawing.fillColor,
        fillAlpha: updatedDrawing.fillAlpha,
        text: updatedDrawing.text,
        fontSize: updatedDrawing.fontSize,
        fontFamily: updatedDrawing.fontFamily,
        textColor: updatedDrawing.textColor,
        hidden: updatedDrawing.hidden,
        locked: updatedDrawing.locked,
        data: updatedDrawing.data as Record<string, unknown>,
        createdAt: updatedDrawing.createdAt,
        updatedAt: updatedDrawing.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'drawing:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ drawingId, gameId }, 'Drawing updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating drawing');
    sendError(socket, 'Failed to update drawing');
  }
}

/**
 * Handle drawing:delete event
 * Deletes a drawing and broadcasts to all players in the game
 */
export async function handleDrawingDelete(
  socket: WebSocket,
  message: WSMessage<DrawingDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Drawing delete');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { drawingId } = message.payload;

    // Delete drawing from database
    const deletedDrawings = await request.server.db
      .delete(drawings)
      .where(eq(drawings.id, drawingId))
      .returning();

    if (deletedDrawings.length === 0) {
      sendError(socket, 'Drawing not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: DrawingDeletedPayload = { drawingId };
    roomManager.broadcast(gameId, {
      type: 'drawing:deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ drawingId, gameId }, 'Drawing deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting drawing');
    sendError(socket, 'Failed to delete drawing');
  }
}

/**
 * Handle drawing:stream event
 * Streams freehand drawing points in real-time (does not persist)
 * This allows for collaborative live drawing
 */
export async function handleDrawingStream(
  socket: WebSocket,
  message: WSMessage<DrawingStreamPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Drawing stream');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { drawingId, points } = message.payload;

    // Broadcast to all players (excluding sender for performance)
    const streamedPayload: DrawingStreamedPayload = {
      drawingId,
      points,
    };

    roomManager.broadcast(gameId, {
      type: 'drawing:streamed',
      payload: streamedPayload,
      timestamp: Date.now(),
    }, socket); // Exclude sender

    request.log.debug({ drawingId, pointsCount: points.length }, 'Drawing streamed');
  } catch (error) {
    request.log.error({ error }, 'Error streaming drawing');
    sendError(socket, 'Failed to stream drawing');
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
