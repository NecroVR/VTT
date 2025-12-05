import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  MeasureStartPayload,
  MeasureStartedPayload,
  MeasureUpdatePayload,
  MeasureUpdatedPayload,
  MeasureEndPayload,
  MeasureEndedPayload,
  TemplatePlacePayload,
  TemplatePlacedPayload,
  TemplateUpdatePayload,
  TemplateUpdatedPayload,
  TemplateRemovePayload,
  TemplateRemovedPayload,
  RulerMeasurement,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { measurementTemplates } from '@vtt/database';
import { eq } from 'drizzle-orm';

// Track active ruler measurements (client-side only, not persisted)
const activeMeasurements = new Map<string, RulerMeasurement>();

/**
 * Handle measure:start event
 * Starts a ruler measurement and broadcasts to all players
 */
export async function handleMeasureStart(
  socket: WebSocket,
  message: WSMessage<MeasureStartPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Measure start');

  const campaignId = roomManager.getRoomForSocket(socket);
  const userId = (request as any).userId;

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  if (!userId) {
    sendError(socket, 'User ID not found');
    return;
  }

  const { sceneId, x, y } = message.payload;

  const measurement: RulerMeasurement = {
    userId,
    sceneId,
    waypoints: [{ x, y }],
    color: '#00ff00', // Default green color
  };

  activeMeasurements.set(userId, measurement);

  // Broadcast to all players in the room
  const startedPayload: MeasureStartedPayload = { measurement };
  roomManager.broadcast(campaignId, {
    type: 'measure:started',
    payload: startedPayload,
    timestamp: Date.now(),
  });

  request.log.info({ userId, sceneId, campaignId }, 'Measurement started');
}

/**
 * Handle measure:update event
 * Updates a ruler measurement and broadcasts to all players
 */
export async function handleMeasureUpdate(
  socket: WebSocket,
  message: WSMessage<MeasureUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Measure update');

  const campaignId = roomManager.getRoomForSocket(socket);
  const userId = (request as any).userId;

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  if (!userId) {
    sendError(socket, 'User ID not found');
    return;
  }

  const measurement = activeMeasurements.get(userId);

  if (!measurement) {
    sendError(socket, 'No active measurement');
    return;
  }

  const { x, y, addWaypoint } = message.payload;

  if (addWaypoint) {
    // Add a new waypoint
    measurement.waypoints.push({ x, y });
  } else {
    // Update the last waypoint
    measurement.waypoints[measurement.waypoints.length - 1] = { x, y };
  }

  // Broadcast to all players in the room
  const updatedPayload: MeasureUpdatedPayload = { measurement };
  roomManager.broadcast(campaignId, {
    type: 'measure:updated',
    payload: updatedPayload,
    timestamp: Date.now(),
  });

  request.log.debug({ userId, waypoints: measurement.waypoints.length }, 'Measurement updated');
}

/**
 * Handle measure:end event
 * Ends a ruler measurement and broadcasts to all players
 */
export async function handleMeasureEnd(
  socket: WebSocket,
  message: WSMessage<MeasureEndPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Measure end');

  const campaignId = roomManager.getRoomForSocket(socket);
  const userId = (request as any).userId;

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  if (!userId) {
    sendError(socket, 'User ID not found');
    return;
  }

  // Remove the active measurement
  activeMeasurements.delete(userId);

  // Broadcast to all players in the room
  const endedPayload: MeasureEndedPayload = { userId };
  roomManager.broadcast(campaignId, {
    type: 'measure:ended',
    payload: endedPayload,
    timestamp: Date.now(),
  });

  request.log.info({ userId, campaignId }, 'Measurement ended');
}

/**
 * Handle template:place event
 * Places a measurement template and broadcasts to all players
 */
export async function handleTemplatePlace(
  socket: WebSocket,
  message: WSMessage<TemplatePlacePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Template place');

  const campaignId = roomManager.getRoomForSocket(socket);
  const userId = (request as any).userId;

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  if (!userId) {
    sendError(socket, 'User ID not found');
    return;
  }

  try {
    const {
      sceneId,
      templateType,
      x,
      y,
      distance,
      direction = null,
      angle = null,
      width = null,
      color = '#ff0000',
      fillAlpha = 0.3,
      borderColor = null,
      hidden = false,
      data = {},
    } = message.payload;

    // Create template in database
    const newTemplates = await request.server.db
      .insert(measurementTemplates)
      .values({
        sceneId,
        templateType,
        x,
        y,
        distance,
        direction,
        angle,
        width,
        color,
        fillAlpha,
        borderColor,
        hidden,
        ownerId: userId,
        data,
      })
      .returning();

    const newTemplate = newTemplates[0];

    // Broadcast to all players
    const placedPayload: TemplatePlacedPayload = {
      template: {
        id: newTemplate.id,
        sceneId: newTemplate.sceneId,
        templateType: newTemplate.templateType as 'circle' | 'cone' | 'ray' | 'rectangle',
        x: newTemplate.x,
        y: newTemplate.y,
        distance: newTemplate.distance,
        direction: newTemplate.direction,
        angle: newTemplate.angle,
        width: newTemplate.width,
        color: newTemplate.color,
        fillAlpha: newTemplate.fillAlpha,
        borderColor: newTemplate.borderColor,
        hidden: newTemplate.hidden,
        ownerId: newTemplate.ownerId,
        data: newTemplate.data as Record<string, unknown>,
        createdAt: newTemplate.createdAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'template:placed',
      payload: placedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ templateId: newTemplate.id, campaignId }, 'Template placed');
  } catch (error) {
    request.log.error({ error }, 'Error placing template');
    sendError(socket, 'Failed to place template');
  }
}

/**
 * Handle template:update event
 * Updates a measurement template and broadcasts to all players
 */
export async function handleTemplateUpdate(
  socket: WebSocket,
  message: WSMessage<TemplateUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Template update');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { templateId, updates } = message.payload;

    // Update template in database
    const updatedTemplates = await request.server.db
      .update(measurementTemplates)
      .set(updates)
      .where(eq(measurementTemplates.id, templateId))
      .returning();

    if (updatedTemplates.length === 0) {
      sendError(socket, 'Template not found');
      return;
    }

    const updatedTemplate = updatedTemplates[0];

    // Broadcast to all players
    const updatedPayload: TemplateUpdatedPayload = {
      template: {
        id: updatedTemplate.id,
        sceneId: updatedTemplate.sceneId,
        templateType: updatedTemplate.templateType as 'circle' | 'cone' | 'ray' | 'rectangle',
        x: updatedTemplate.x,
        y: updatedTemplate.y,
        distance: updatedTemplate.distance,
        direction: updatedTemplate.direction,
        angle: updatedTemplate.angle,
        width: updatedTemplate.width,
        color: updatedTemplate.color,
        fillAlpha: updatedTemplate.fillAlpha,
        borderColor: updatedTemplate.borderColor,
        hidden: updatedTemplate.hidden,
        ownerId: updatedTemplate.ownerId,
        data: updatedTemplate.data as Record<string, unknown>,
        createdAt: updatedTemplate.createdAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'template:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ templateId, campaignId }, 'Template updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating template');
    sendError(socket, 'Failed to update template');
  }
}

/**
 * Handle template:remove event
 * Removes a measurement template and broadcasts to all players
 */
export async function handleTemplateRemove(
  socket: WebSocket,
  message: WSMessage<TemplateRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Template remove');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { templateId } = message.payload;

    // Delete template from database
    const deletedTemplates = await request.server.db
      .delete(measurementTemplates)
      .where(eq(measurementTemplates.id, templateId))
      .returning();

    if (deletedTemplates.length === 0) {
      sendError(socket, 'Template not found');
      return;
    }

    // Broadcast to all players
    const removedPayload: TemplateRemovedPayload = { templateId };
    roomManager.broadcast(campaignId, {
      type: 'template:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ templateId, campaignId }, 'Template removed');
  } catch (error) {
    request.log.error({ error }, 'Error removing template');
    sendError(socket, 'Failed to remove template');
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
