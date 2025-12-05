import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  CompendiumEntityType,
  CompendiumCreatePayload,
  CompendiumCreatedPayload,
  CompendiumUpdatePayload,
  CompendiumUpdatedPayload,
  CompendiumDeletePayload,
  CompendiumDeletedPayload,
  CompendiumEntryCreatePayload,
  CompendiumEntryCreatedPayload,
  CompendiumEntryUpdatePayload,
  CompendiumEntryUpdatedPayload,
  CompendiumEntryDeletePayload,
  CompendiumEntryDeletedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { compendiums, compendiumEntries } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Generate search text from entry name and entity data
 */
function generateSearchText(name: string, entityData: Record<string, unknown>): string {
  const parts = [name];

  if (entityData.description) {
    parts.push(String(entityData.description));
  }
  if (entityData.actorType) {
    parts.push(String(entityData.actorType));
  }
  if (entityData.itemType) {
    parts.push(String(entityData.itemType));
  }

  function extractText(obj: any): void {
    if (typeof obj === 'string') {
      parts.push(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(extractText);
    }
  }

  extractText(entityData);
  return parts.join(' ');
}

/**
 * Handle compendium:create event
 * Creates a new compendium and broadcasts to all players in the campaign
 */
export async function handleCompendiumCreate(
  socket: WebSocket,
  message: WSMessage<CompendiumCreatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Compendium create');

  const campaignId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!campaignId || !playerInfo) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const {
      name,
      label,
      entityType,
      system = null,
      packageId = null,
      locked = false,
      private: isPrivate = false,
      data = {},
    } = message.payload;

    // Create compendium in database
    const newCompendiums = await request.server.db
      .insert(compendiums)
      .values({
        campaignId,
        name,
        label,
        entityType,
        system,
        packageId,
        locked,
        private: isPrivate,
        data,
      })
      .returning();

    const newCompendium = newCompendiums[0];

    // Broadcast to all players
    const createdPayload: CompendiumCreatedPayload = {
      compendium: {
        id: newCompendium.id,
        campaignId: newCompendium.campaignId,
        name: newCompendium.name,
        label: newCompendium.label,
        entityType: newCompendium.entityType as CompendiumEntityType,
        system: newCompendium.system,
        packageId: newCompendium.packageId,
        locked: newCompendium.locked,
        private: newCompendium.private,
        data: newCompendium.data as Record<string, unknown>,
        createdAt: newCompendium.createdAt,
        updatedAt: newCompendium.updatedAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'compendium:created',
      payload: createdPayload,
      timestamp: Date.now(),
    });

    request.log.info({ compendiumId: newCompendium.id, campaignId }, 'Compendium created');
  } catch (error) {
    request.log.error({ error }, 'Error creating compendium');
    sendError(socket, 'Failed to create compendium');
  }
}

/**
 * Handle compendium:update event
 * Updates a compendium and broadcasts to all players in the campaign
 */
export async function handleCompendiumUpdate(
  socket: WebSocket,
  message: WSMessage<CompendiumUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Compendium update');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { compendiumId, updates } = message.payload;

    // Check if compendium exists and is not locked
    const [existingCompendium] = await request.server.db
      .select()
      .from(compendiums)
      .where(eq(compendiums.id, compendiumId))
      .limit(1);

    if (!existingCompendium) {
      sendError(socket, 'Compendium not found');
      return;
    }

    if (existingCompendium.locked) {
      sendError(socket, 'Compendium is locked and cannot be modified');
      return;
    }

    // Update compendium in database
    const updatedCompendiums = await request.server.db
      .update(compendiums)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(compendiums.id, compendiumId))
      .returning();

    if (updatedCompendiums.length === 0) {
      sendError(socket, 'Compendium not found');
      return;
    }

    const updatedCompendium = updatedCompendiums[0];

    // Broadcast to all players
    const updatedPayload: CompendiumUpdatedPayload = {
      compendium: {
        id: updatedCompendium.id,
        campaignId: updatedCompendium.campaignId,
        name: updatedCompendium.name,
        label: updatedCompendium.label,
        entityType: updatedCompendium.entityType as CompendiumEntityType,
        system: updatedCompendium.system,
        packageId: updatedCompendium.packageId,
        locked: updatedCompendium.locked,
        private: updatedCompendium.private,
        data: updatedCompendium.data as Record<string, unknown>,
        createdAt: updatedCompendium.createdAt,
        updatedAt: updatedCompendium.updatedAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'compendium:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ compendiumId, campaignId }, 'Compendium updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating compendium');
    sendError(socket, 'Failed to update compendium');
  }
}

/**
 * Handle compendium:delete event
 * Deletes a compendium and broadcasts to all players in the campaign
 */
export async function handleCompendiumDelete(
  socket: WebSocket,
  message: WSMessage<CompendiumDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Compendium delete');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { compendiumId } = message.payload;

    // Check if compendium exists and is not locked
    const [existingCompendium] = await request.server.db
      .select()
      .from(compendiums)
      .where(eq(compendiums.id, compendiumId))
      .limit(1);

    if (!existingCompendium) {
      sendError(socket, 'Compendium not found');
      return;
    }

    if (existingCompendium.locked) {
      sendError(socket, 'Compendium is locked and cannot be deleted');
      return;
    }

    // Delete compendium from database
    const deletedCompendiums = await request.server.db
      .delete(compendiums)
      .where(eq(compendiums.id, compendiumId))
      .returning();

    if (deletedCompendiums.length === 0) {
      sendError(socket, 'Compendium not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: CompendiumDeletedPayload = { compendiumId };
    roomManager.broadcast(campaignId, {
      type: 'compendium:deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ compendiumId, campaignId }, 'Compendium deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting compendium');
    sendError(socket, 'Failed to delete compendium');
  }
}

/**
 * Handle compendium:entry-create event
 * Creates a new compendium entry and broadcasts to all players in the campaign
 */
export async function handleCompendiumEntryCreate(
  socket: WebSocket,
  message: WSMessage<CompendiumEntryCreatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Compendium entry create');

  const campaignId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!campaignId || !playerInfo) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const {
      compendiumId,
      name,
      img = null,
      entityType,
      entityData,
      folderId = null,
      sort = 0,
      tags = null,
      data = {},
    } = message.payload;

    // Verify compendium exists and is not locked
    const [compendium] = await request.server.db
      .select()
      .from(compendiums)
      .where(eq(compendiums.id, compendiumId))
      .limit(1);

    if (!compendium) {
      sendError(socket, 'Compendium not found');
      return;
    }

    if (compendium.locked) {
      sendError(socket, 'Compendium is locked and cannot be modified');
      return;
    }

    // Verify entity type matches compendium
    if (entityType !== compendium.entityType) {
      sendError(socket, `Entity type ${entityType} does not match compendium type ${compendium.entityType}`);
      return;
    }

    // Generate search text
    const searchText = generateSearchText(name, entityData);

    // Create entry in database
    const newEntries = await request.server.db
      .insert(compendiumEntries)
      .values({
        compendiumId,
        name,
        img,
        entityType,
        entityData,
        folderId,
        sort,
        searchText,
        tags,
        data,
      })
      .returning();

    const newEntry = newEntries[0];

    // Broadcast to all players
    const createdPayload: CompendiumEntryCreatedPayload = {
      entry: {
        id: newEntry.id,
        compendiumId: newEntry.compendiumId,
        name: newEntry.name,
        img: newEntry.img,
        entityType: newEntry.entityType as CompendiumEntityType,
        entityData: newEntry.entityData as Record<string, unknown>,
        folderId: newEntry.folderId,
        sort: newEntry.sort,
        searchText: newEntry.searchText,
        tags: newEntry.tags,
        data: newEntry.data as Record<string, unknown>,
        createdAt: newEntry.createdAt,
        updatedAt: newEntry.updatedAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'compendium:entry-created',
      payload: createdPayload,
      timestamp: Date.now(),
    });

    request.log.info({ entryId: newEntry.id, compendiumId, campaignId }, 'Compendium entry created');
  } catch (error) {
    request.log.error({ error }, 'Error creating compendium entry');
    sendError(socket, 'Failed to create compendium entry');
  }
}

/**
 * Handle compendium:entry-update event
 * Updates a compendium entry and broadcasts to all players in the campaign
 */
export async function handleCompendiumEntryUpdate(
  socket: WebSocket,
  message: WSMessage<CompendiumEntryUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Compendium entry update');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { entryId, updates } = message.payload;

    // Check if entry exists
    const [existingEntry] = await request.server.db
      .select()
      .from(compendiumEntries)
      .where(eq(compendiumEntries.id, entryId))
      .limit(1);

    if (!existingEntry) {
      sendError(socket, 'Entry not found');
      return;
    }

    // Check if compendium is locked
    const [compendium] = await request.server.db
      .select()
      .from(compendiums)
      .where(eq(compendiums.id, existingEntry.compendiumId))
      .limit(1);

    if (compendium?.locked) {
      sendError(socket, 'Compendium is locked and cannot be modified');
      return;
    }

    // Build update object
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    // Regenerate search text if name or entity data changed
    if (updates.name !== undefined || updates.entityData !== undefined) {
      const name = updates.name ?? existingEntry.name;
      const entityData = updates.entityData ?? (existingEntry.entityData as Record<string, unknown>);
      updateData.searchText = generateSearchText(name, entityData);
    }

    // Update entry in database
    const updatedEntries = await request.server.db
      .update(compendiumEntries)
      .set(updateData)
      .where(eq(compendiumEntries.id, entryId))
      .returning();

    if (updatedEntries.length === 0) {
      sendError(socket, 'Entry not found');
      return;
    }

    const updatedEntry = updatedEntries[0];

    // Broadcast to all players
    const updatedPayload: CompendiumEntryUpdatedPayload = {
      entry: {
        id: updatedEntry.id,
        compendiumId: updatedEntry.compendiumId,
        name: updatedEntry.name,
        img: updatedEntry.img,
        entityType: updatedEntry.entityType as CompendiumEntityType,
        entityData: updatedEntry.entityData as Record<string, unknown>,
        folderId: updatedEntry.folderId,
        sort: updatedEntry.sort,
        searchText: updatedEntry.searchText,
        tags: updatedEntry.tags,
        data: updatedEntry.data as Record<string, unknown>,
        createdAt: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
      },
    };

    roomManager.broadcast(campaignId, {
      type: 'compendium:entry-updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ entryId, campaignId }, 'Compendium entry updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating compendium entry');
    sendError(socket, 'Failed to update compendium entry');
  }
}

/**
 * Handle compendium:entry-delete event
 * Deletes a compendium entry and broadcasts to all players in the campaign
 */
export async function handleCompendiumEntryDelete(
  socket: WebSocket,
  message: WSMessage<CompendiumEntryDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Compendium entry delete');

  const campaignId = roomManager.getRoomForSocket(socket);

  if (!campaignId) {
    sendError(socket, 'Not in a campaign room');
    return;
  }

  try {
    const { entryId } = message.payload;

    // Check if entry exists
    const [existingEntry] = await request.server.db
      .select()
      .from(compendiumEntries)
      .where(eq(compendiumEntries.id, entryId))
      .limit(1);

    if (!existingEntry) {
      sendError(socket, 'Entry not found');
      return;
    }

    // Check if compendium is locked
    const [compendium] = await request.server.db
      .select()
      .from(compendiums)
      .where(eq(compendiums.id, existingEntry.compendiumId))
      .limit(1);

    if (compendium?.locked) {
      sendError(socket, 'Compendium is locked and cannot be modified');
      return;
    }

    // Delete entry from database
    const deletedEntries = await request.server.db
      .delete(compendiumEntries)
      .where(eq(compendiumEntries.id, entryId))
      .returning();

    if (deletedEntries.length === 0) {
      sendError(socket, 'Entry not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: CompendiumEntryDeletedPayload = {
      entryId,
      compendiumId: existingEntry.compendiumId,
    };

    roomManager.broadcast(campaignId, {
      type: 'compendium:entry-deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ entryId, campaignId }, 'Compendium entry deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting compendium entry');
    sendError(socket, 'Failed to delete compendium entry');
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
