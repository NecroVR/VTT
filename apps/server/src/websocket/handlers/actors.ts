import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  ActorCreatePayload,
  ActorCreatedPayload,
  ActorUpdatePayload,
  ActorUpdatedPayload,
  ActorDeletePayload,
  ActorDeletedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { actors } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Handle actor:create event
 * Creates a new actor and broadcasts to all players in the campaign
 */
export async function handleActorCreate(
  socket: WebSocket,
  message: WSMessage<ActorCreatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Actor create');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const {
      name,
      actorType,
      img = null,
      ownerId = null,
      attributes = {},
      abilities = {},
      folderId = null,
      sort = 0,
      data = {},
    } = message.payload;

    // Create actor in database
    const newActors = await request.server.db
      .insert(actors)
      .values({
        gameId,
        name,
        actorType,
        img,
        ownerId,
        attributes,
        abilities,
        folderId,
        sort,
        data,
      })
      .returning();

    const newActor = newActors[0];

    // Broadcast to all players
    const createdPayload: ActorCreatedPayload = {
      actor: {
        id: newActor.id,
        gameId: newActor.gameId,
        name: newActor.name,
        actorType: newActor.actorType,
        img: newActor.img,
        ownerId: newActor.ownerId,
        attributes: newActor.attributes as Record<string, unknown>,
        abilities: newActor.abilities as Record<string, unknown>,
        folderId: newActor.folderId,
        sort: newActor.sort,
        data: newActor.data as Record<string, unknown>,
        createdAt: newActor.createdAt,
        updatedAt: newActor.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'actor:created',
      payload: createdPayload,
      timestamp: Date.now(),
    });

    request.log.info({ actorId: newActor.id, gameId }, 'Actor created');
  } catch (error) {
    request.log.error({ error }, 'Error creating actor');
    sendError(socket, 'Failed to create actor');
  }
}

/**
 * Handle actor:update event
 * Updates an actor and broadcasts to all players in the campaign
 */
export async function handleActorUpdate(
  socket: WebSocket,
  message: WSMessage<ActorUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Actor update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { actorId, updates } = message.payload;

    // Update actor in database
    const updatedActors = await request.server.db
      .update(actors)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(actors.id, actorId))
      .returning();

    if (updatedActors.length === 0) {
      sendError(socket, 'Actor not found');
      return;
    }

    const updatedActor = updatedActors[0];

    // Broadcast to all players
    const updatedPayload: ActorUpdatedPayload = {
      actor: {
        id: updatedActor.id,
        gameId: updatedActor.gameId,
        name: updatedActor.name,
        actorType: updatedActor.actorType,
        img: updatedActor.img,
        ownerId: updatedActor.ownerId,
        attributes: updatedActor.attributes as Record<string, unknown>,
        abilities: updatedActor.abilities as Record<string, unknown>,
        folderId: updatedActor.folderId,
        sort: updatedActor.sort,
        data: updatedActor.data as Record<string, unknown>,
        createdAt: updatedActor.createdAt,
        updatedAt: updatedActor.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'actor:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ actorId, gameId }, 'Actor updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating actor');
    sendError(socket, 'Failed to update actor');
  }
}

/**
 * Handle actor:delete event
 * Deletes an actor and broadcasts to all players in the campaign
 */
export async function handleActorDelete(
  socket: WebSocket,
  message: WSMessage<ActorDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Actor delete');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { actorId } = message.payload;

    // Delete actor from database
    const deletedActors = await request.server.db
      .delete(actors)
      .where(eq(actors.id, actorId))
      .returning();

    if (deletedActors.length === 0) {
      sendError(socket, 'Actor not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: ActorDeletedPayload = { actorId };
    roomManager.broadcast(gameId, {
      type: 'actor:deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ actorId, gameId }, 'Actor deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting actor');
    sendError(socket, 'Failed to delete actor');
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
