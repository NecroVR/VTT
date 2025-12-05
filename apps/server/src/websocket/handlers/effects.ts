import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  EffectAddPayload,
  EffectAddedPayload,
  EffectUpdatePayload,
  EffectUpdatedPayload,
  EffectRemovePayload,
  EffectRemovedPayload,
  EffectTogglePayload,
  EffectToggledPayload,
  EffectType,
  DurationType,
  EffectChange,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { activeEffects } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Handle effect:add event
 * Creates a new active effect and broadcasts to all players
 */
export async function handleEffectAdd(
  socket: WebSocket,
  message: WSMessage<EffectAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Effect add');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const {
      actorId = null,
      tokenId = null,
      name,
      icon = null,
      description = null,
      effectType = 'temporary',
      durationType = 'rounds',
      duration = null,
      startRound = null,
      startTurn = null,
      remaining = null,
      sourceActorId = null,
      sourceItemId = null,
      enabled = true,
      hidden = false,
      changes = [],
      priority = 0,
      transfer = false,
      data = {},
      sort = 0,
    } = message.payload;

    // Create effect in database
    const newEffects = await request.server.db
      .insert(activeEffects)
      .values({
        campaignId,
        actorId,
        tokenId,
        name,
        icon,
        description,
        effectType,
        durationType,
        duration,
        startRound,
        startTurn,
        remaining,
        sourceActorId,
        sourceItemId,
        enabled,
        hidden,
        changes,
        priority,
        transfer,
        data,
        sort,
      })
      .returning();

    const newEffect = newEffects[0];

    // Broadcast to all players
    const addedPayload: EffectAddedPayload = {
      effect: {
        id: newEffect.id,
        campaignId: newEffect.campaignId,
        actorId: newEffect.actorId,
        tokenId: newEffect.tokenId,
        name: newEffect.name,
        icon: newEffect.icon,
        description: newEffect.description,
        effectType: newEffect.effectType as EffectType,
        durationType: newEffect.durationType as DurationType,
        duration: newEffect.duration,
        startRound: newEffect.startRound,
        startTurn: newEffect.startTurn,
        remaining: newEffect.remaining,
        sourceActorId: newEffect.sourceActorId,
        sourceItemId: newEffect.sourceItemId,
        enabled: newEffect.enabled,
        hidden: newEffect.hidden,
        changes: newEffect.changes as EffectChange[],
        priority: newEffect.priority,
        transfer: newEffect.transfer,
        data: newEffect.data as Record<string, unknown>,
        sort: newEffect.sort,
        createdAt: newEffect.createdAt,
        updatedAt: newEffect.updatedAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'effect:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ effectId: newEffect.id, campaignId }, 'Effect added');
  } catch (error) {
    request.log.error({ error }, 'Error adding effect');
    sendError(socket, 'Failed to add effect');
  }
}

/**
 * Handle effect:update event
 * Updates an active effect and broadcasts to all players
 */
export async function handleEffectUpdate(
  socket: WebSocket,
  message: WSMessage<EffectUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Effect update');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { effectId, updates } = message.payload;

    // Update effect in database
    const updatedEffects = await request.server.db
      .update(activeEffects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(activeEffects.id, effectId))
      .returning();

    if (updatedEffects.length === 0) {
      sendError(socket, 'Effect not found');
      return;
    }

    const updatedEffect = updatedEffects[0];

    // Broadcast to all players
    const updatedPayload: EffectUpdatedPayload = {
      effect: {
        id: updatedEffect.id,
        campaignId: updatedEffect.campaignId,
        actorId: updatedEffect.actorId,
        tokenId: updatedEffect.tokenId,
        name: updatedEffect.name,
        icon: updatedEffect.icon,
        description: updatedEffect.description,
        effectType: updatedEffect.effectType as EffectType,
        durationType: updatedEffect.durationType as DurationType,
        duration: updatedEffect.duration,
        startRound: updatedEffect.startRound,
        startTurn: updatedEffect.startTurn,
        remaining: updatedEffect.remaining,
        sourceActorId: updatedEffect.sourceActorId,
        sourceItemId: updatedEffect.sourceItemId,
        enabled: updatedEffect.enabled,
        hidden: updatedEffect.hidden,
        changes: updatedEffect.changes as EffectChange[],
        priority: updatedEffect.priority,
        transfer: updatedEffect.transfer,
        data: updatedEffect.data as Record<string, unknown>,
        sort: updatedEffect.sort,
        createdAt: updatedEffect.createdAt,
        updatedAt: updatedEffect.updatedAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'effect:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ effectId, campaignId }, 'Effect updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating effect');
    sendError(socket, 'Failed to update effect');
  }
}

/**
 * Handle effect:remove event
 * Removes an active effect and broadcasts to all players
 */
export async function handleEffectRemove(
  socket: WebSocket,
  message: WSMessage<EffectRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Effect remove');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { effectId } = message.payload;

    // Delete effect from database
    const deletedEffects = await request.server.db
      .delete(activeEffects)
      .where(eq(activeEffects.id, effectId))
      .returning();

    if (deletedEffects.length === 0) {
      sendError(socket, 'Effect not found');
      return;
    }

    // Broadcast to all players
    const removedPayload: EffectRemovedPayload = { effectId };
    roomManager.broadcast(campaignId, {
      type: 'effect:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ effectId, campaignId }, 'Effect removed');
  } catch (error) {
    request.log.error({ error }, 'Error removing effect');
    sendError(socket, 'Failed to remove effect');
  }
}

/**
 * Handle effect:toggle event
 * Toggles an active effect's enabled state and broadcasts to all players
 */
export async function handleEffectToggle(
  socket: WebSocket,
  message: WSMessage<EffectTogglePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Effect toggle');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { effectId, enabled } = message.payload;

    // Update effect enabled state in database
    const updatedEffects = await request.server.db
      .update(activeEffects)
      .set({
        enabled,
        updatedAt: new Date(),
      })
      .where(eq(activeEffects.id, effectId))
      .returning();

    if (updatedEffects.length === 0) {
      sendError(socket, 'Effect not found');
      return;
    }

    const updatedEffect = updatedEffects[0];

    // Broadcast to all players
    const toggledPayload: EffectToggledPayload = {
      effect: {
        id: updatedEffect.id,
        campaignId: updatedEffect.campaignId,
        actorId: updatedEffect.actorId,
        tokenId: updatedEffect.tokenId,
        name: updatedEffect.name,
        icon: updatedEffect.icon,
        description: updatedEffect.description,
        effectType: updatedEffect.effectType as EffectType,
        durationType: updatedEffect.durationType as DurationType,
        duration: updatedEffect.duration,
        startRound: updatedEffect.startRound,
        startTurn: updatedEffect.startTurn,
        remaining: updatedEffect.remaining,
        sourceActorId: updatedEffect.sourceActorId,
        sourceItemId: updatedEffect.sourceItemId,
        enabled: updatedEffect.enabled,
        hidden: updatedEffect.hidden,
        changes: updatedEffect.changes as EffectChange[],
        priority: updatedEffect.priority,
        transfer: updatedEffect.transfer,
        data: updatedEffect.data as Record<string, unknown>,
        sort: updatedEffect.sort,
        createdAt: updatedEffect.createdAt,
        updatedAt: updatedEffect.updatedAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'effect:toggled',
      payload: toggledPayload,
      timestamp: Date.now(),
    });

    request.log.info({ effectId, enabled, campaignId }, 'Effect toggled');
  } catch (error) {
    request.log.error({ error }, 'Error toggling effect');
    sendError(socket, 'Failed to toggle effect');
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
