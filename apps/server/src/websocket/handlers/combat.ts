import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  CombatStartPayload,
  CombatStartedPayload,
  CombatEndPayload,
  CombatEndedPayload,
  CombatUpdatePayload,
  CombatUpdatedPayload,
  CombatantAddPayload,
  CombatantAddedPayload,
  CombatantUpdatePayload,
  CombatantUpdatedPayload,
  CombatantRemovePayload,
  CombatantRemovedPayload,
  CombatNextTurnPayload,
  CombatTurnChangedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { combats, combatants } from '@vtt/database';
import { eq, and } from 'drizzle-orm';

/**
 * Handle combat:start event
 * Creates a new combat encounter and optionally adds initial combatants
 */
export async function handleCombatStart(
  socket: WebSocket,
  message: WSMessage<CombatStartPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Combat start');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { sceneId = null, combatants: initialCombatants = [] } = message.payload;

    // Create combat in database
    const newCombats = await request.server.db
      .insert(combats)
      .values({
        gameId,
        sceneId,
        active: true,
        round: 1,
        turn: 0,
        sort: 0,
        data: {},
      })
      .returning();

    const newCombat = newCombats[0];

    // Add initial combatants if provided
    const newCombatants = [];
    if (initialCombatants.length > 0) {
      const combatantValues = initialCombatants.map((c) => ({
        combatId: newCombat.id,
        actorId: c.actorId || null,
        tokenId: c.tokenId || null,
        initiative: c.initiative || null,
        initiativeModifier: c.initiativeModifier || 0,
        hidden: c.hidden || false,
        defeated: c.defeated || false,
        data: c.data || {},
      }));

      const insertedCombatants = await request.server.db
        .insert(combatants)
        .values(combatantValues)
        .returning();

      newCombatants.push(...insertedCombatants);
    }

    // Broadcast to all players
    const startedPayload: CombatStartedPayload = {
      combat: {
        id: newCombat.id,
        sceneId: newCombat.sceneId,
        gameId: newCombat.gameId,
        active: newCombat.active,
        round: newCombat.round,
        turn: newCombat.turn,
        sort: newCombat.sort,
        data: newCombat.data as Record<string, unknown>,
        createdAt: newCombat.createdAt,
        updatedAt: newCombat.updatedAt,
      },
      combatants: newCombatants.map((c) => ({
        id: c.id,
        combatId: c.combatId,
        actorId: c.actorId,
        tokenId: c.tokenId,
        initiative: c.initiative,
        initiativeModifier: c.initiativeModifier,
        hidden: c.hidden,
        defeated: c.defeated,
        data: c.data as Record<string, unknown>,
        createdAt: c.createdAt,
      })),
    };

    roomManager.broadcast(gameId, {
      type: 'combat:started',
      payload: startedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ combatId: newCombat.id, gameId }, 'Combat started');
  } catch (error) {
    request.log.error({ error }, 'Error starting combat');
    sendError(socket, 'Failed to start combat');
  }
}

/**
 * Handle combat:end event
 * Ends a combat encounter
 */
export async function handleCombatEnd(
  socket: WebSocket,
  message: WSMessage<CombatEndPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Combat end');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { combatId } = message.payload;

    // Delete combat from database (cascade will delete combatants)
    const deletedCombats = await request.server.db
      .delete(combats)
      .where(eq(combats.id, combatId))
      .returning();

    if (deletedCombats.length === 0) {
      sendError(socket, 'Combat not found');
      return;
    }

    // Broadcast to all players
    const endedPayload: CombatEndedPayload = { combatId };
    roomManager.broadcast(gameId, {
      type: 'combat:ended',
      payload: endedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ combatId, gameId }, 'Combat ended');
  } catch (error) {
    request.log.error({ error }, 'Error ending combat');
    sendError(socket, 'Failed to end combat');
  }
}

/**
 * Handle combat:update event
 * Updates combat properties (round, turn, etc.)
 */
export async function handleCombatUpdate(
  socket: WebSocket,
  message: WSMessage<CombatUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Combat update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { combatId, updates } = message.payload;

    // Update combat in database
    const updatedCombats = await request.server.db
      .update(combats)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(combats.id, combatId))
      .returning();

    if (updatedCombats.length === 0) {
      sendError(socket, 'Combat not found');
      return;
    }

    const updatedCombat = updatedCombats[0];

    // Broadcast to all players
    const updatedPayload: CombatUpdatedPayload = {
      combat: {
        id: updatedCombat.id,
        sceneId: updatedCombat.sceneId,
        gameId: updatedCombat.gameId,
        active: updatedCombat.active,
        round: updatedCombat.round,
        turn: updatedCombat.turn,
        sort: updatedCombat.sort,
        data: updatedCombat.data as Record<string, unknown>,
        createdAt: updatedCombat.createdAt,
        updatedAt: updatedCombat.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'combat:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ combatId, gameId }, 'Combat updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating combat');
    sendError(socket, 'Failed to update combat');
  }
}

/**
 * Handle combatant:add event
 * Adds a combatant to a combat encounter
 */
export async function handleCombatantAdd(
  socket: WebSocket,
  message: WSMessage<CombatantAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Combatant add');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const {
      combatId,
      actorId = null,
      tokenId = null,
      initiative = null,
      initiativeModifier = 0,
      hidden = false,
      defeated = false,
      data = {},
    } = message.payload;

    // Create combatant in database
    const newCombatants = await request.server.db
      .insert(combatants)
      .values({
        combatId,
        actorId,
        tokenId,
        initiative,
        initiativeModifier,
        hidden,
        defeated,
        data,
      })
      .returning();

    const newCombatant = newCombatants[0];

    // Broadcast to all players
    const addedPayload: CombatantAddedPayload = {
      combatant: {
        id: newCombatant.id,
        combatId: newCombatant.combatId,
        actorId: newCombatant.actorId,
        tokenId: newCombatant.tokenId,
        initiative: newCombatant.initiative,
        initiativeModifier: newCombatant.initiativeModifier,
        hidden: newCombatant.hidden,
        defeated: newCombatant.defeated,
        data: newCombatant.data as Record<string, unknown>,
        createdAt: newCombatant.createdAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'combatant:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ combatantId: newCombatant.id, combatId, gameId }, 'Combatant added');
  } catch (error) {
    request.log.error({ error }, 'Error adding combatant');
    sendError(socket, 'Failed to add combatant');
  }
}

/**
 * Handle combatant:update event
 * Updates a combatant (initiative, HP, conditions, etc.)
 */
export async function handleCombatantUpdate(
  socket: WebSocket,
  message: WSMessage<CombatantUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Combatant update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { combatantId, updates } = message.payload;

    // Update combatant in database
    const updatedCombatants = await request.server.db
      .update(combatants)
      .set(updates)
      .where(eq(combatants.id, combatantId))
      .returning();

    if (updatedCombatants.length === 0) {
      sendError(socket, 'Combatant not found');
      return;
    }

    const updatedCombatant = updatedCombatants[0];

    // Broadcast to all players
    const updatedPayload: CombatantUpdatedPayload = {
      combatant: {
        id: updatedCombatant.id,
        combatId: updatedCombatant.combatId,
        actorId: updatedCombatant.actorId,
        tokenId: updatedCombatant.tokenId,
        initiative: updatedCombatant.initiative,
        initiativeModifier: updatedCombatant.initiativeModifier,
        hidden: updatedCombatant.hidden,
        defeated: updatedCombatant.defeated,
        data: updatedCombatant.data as Record<string, unknown>,
        createdAt: updatedCombatant.createdAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'combatant:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ combatantId, gameId }, 'Combatant updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating combatant');
    sendError(socket, 'Failed to update combatant');
  }
}

/**
 * Handle combatant:remove event
 * Removes a combatant from combat
 */
export async function handleCombatantRemove(
  socket: WebSocket,
  message: WSMessage<CombatantRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Combatant remove');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { combatantId } = message.payload;

    // Delete combatant from database
    const deletedCombatants = await request.server.db
      .delete(combatants)
      .where(eq(combatants.id, combatantId))
      .returning();

    if (deletedCombatants.length === 0) {
      sendError(socket, 'Combatant not found');
      return;
    }

    // Broadcast to all players
    const removedPayload: CombatantRemovedPayload = { combatantId };
    roomManager.broadcast(gameId, {
      type: 'combatant:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ combatantId, gameId }, 'Combatant removed');
  } catch (error) {
    request.log.error({ error }, 'Error removing combatant');
    sendError(socket, 'Failed to remove combatant');
  }
}

/**
 * Handle combat:next-turn event
 * Advances to the next turn in combat
 */
export async function handleCombatNextTurn(
  socket: WebSocket,
  message: WSMessage<CombatNextTurnPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Combat next turn');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { combatId } = message.payload;

    // Fetch current combat
    const [combat] = await request.server.db
      .select()
      .from(combats)
      .where(eq(combats.id, combatId))
      .limit(1);

    if (!combat) {
      sendError(socket, 'Combat not found');
      return;
    }

    // Fetch all combatants for this combat
    const allCombatants = await request.server.db
      .select()
      .from(combatants)
      .where(eq(combatants.combatId, combatId));

    // Calculate next turn
    const nextTurn = combat.turn + 1;
    let nextRound = combat.round;
    let actualTurn = nextTurn;

    // If we've gone through all combatants, advance to next round
    if (nextTurn >= allCombatants.length) {
      nextRound += 1;
      actualTurn = 0;
    }

    // Update combat
    const updatedCombats = await request.server.db
      .update(combats)
      .set({
        round: nextRound,
        turn: actualTurn,
        updatedAt: new Date(),
      })
      .where(eq(combats.id, combatId))
      .returning();

    const updatedCombat = updatedCombats[0];

    // Get the current combatant
    const currentCombatantId = allCombatants[actualTurn]?.id || null;

    // Broadcast to all players
    const turnChangedPayload: CombatTurnChangedPayload = {
      combat: {
        id: updatedCombat.id,
        sceneId: updatedCombat.sceneId,
        gameId: updatedCombat.gameId,
        active: updatedCombat.active,
        round: updatedCombat.round,
        turn: updatedCombat.turn,
        sort: updatedCombat.sort,
        data: updatedCombat.data as Record<string, unknown>,
        createdAt: updatedCombat.createdAt,
        updatedAt: updatedCombat.updatedAt,
      },
      currentCombatantId,
    };

    roomManager.broadcast(gameId, {
      type: 'combat:turn-changed',
      payload: turnChangedPayload,
      timestamp: Date.now(),
    });

    request.log.info({
      combatId,
      round: nextRound,
      turn: actualTurn,
      currentCombatantId,
      gameId
    }, 'Combat turn advanced');
  } catch (error) {
    request.log.error({ error }, 'Error advancing combat turn');
    sendError(socket, 'Failed to advance turn');
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
