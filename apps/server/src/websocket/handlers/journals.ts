import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  JournalCreatePayload,
  JournalCreatedPayload,
  JournalUpdatePayload,
  JournalUpdatedPayload,
  JournalDeletePayload,
  JournalDeletedPayload,
  JournalShowPayload,
  JournalShownPayload,
  PageCreatePayload,
  PageCreatedPayload,
  PageUpdatePayload,
  PageUpdatedPayload,
  PageDeletePayload,
  PageDeletedPayload,
  FolderCreatePayload,
  FolderCreatedPayload,
  FolderUpdatePayload,
  FolderUpdatedPayload,
  FolderDeletePayload,
  FolderDeletedPayload,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { journals, journalPages, folders } from '@vtt/database';
import { eq, and, asc } from 'drizzle-orm';

/**
 * Handle journal:create event
 * Creates a new journal and broadcasts to all players in the game
 */
export async function handleJournalCreate(
  socket: WebSocket,
  message: WSMessage<JournalCreatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Journal create');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const {
      name,
      img = null,
      folderId = null,
      permission = 'observer',
      ownerId = null,
      sort = 0,
      data = {},
    } = message.payload;

    // Create journal in database
    const newJournals = await request.server.db
      .insert(journals)
      .values({
        gameId,
        name,
        img,
        folderId,
        permission,
        ownerId: ownerId || playerInfo.userId,
        sort,
        data,
      })
      .returning();

    const newJournal = newJournals[0];

    // Broadcast to all players
    const createdPayload: JournalCreatedPayload = {
      journal: {
        id: newJournal.id,
        gameId: newJournal.gameId,
        name: newJournal.name,
        img: newJournal.img,
        folderId: newJournal.folderId,
        permission: newJournal.permission,
        ownerId: newJournal.ownerId,
        sort: newJournal.sort,
        data: newJournal.data as Record<string, unknown>,
        createdAt: newJournal.createdAt,
        updatedAt: newJournal.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'journal:created',
      payload: createdPayload,
      timestamp: Date.now(),
    });

    request.log.info({ journalId: newJournal.id, gameId }, 'Journal created');
  } catch (error) {
    request.log.error({ error }, 'Error creating journal');
    sendError(socket, 'Failed to create journal');
  }
}

/**
 * Handle journal:update event
 * Updates a journal and broadcasts to all players in the game
 */
export async function handleJournalUpdate(
  socket: WebSocket,
  message: WSMessage<JournalUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Journal update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { journalId, updates } = message.payload;

    // Update journal in database
    const updatedJournals = await request.server.db
      .update(journals)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(journals.id, journalId))
      .returning();

    if (updatedJournals.length === 0) {
      sendError(socket, 'Journal not found');
      return;
    }

    const updatedJournal = updatedJournals[0];

    // Broadcast to all players
    const updatedPayload: JournalUpdatedPayload = {
      journal: {
        id: updatedJournal.id,
        gameId: updatedJournal.gameId,
        name: updatedJournal.name,
        img: updatedJournal.img,
        folderId: updatedJournal.folderId,
        permission: updatedJournal.permission,
        ownerId: updatedJournal.ownerId,
        sort: updatedJournal.sort,
        data: updatedJournal.data as Record<string, unknown>,
        createdAt: updatedJournal.createdAt,
        updatedAt: updatedJournal.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'journal:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ journalId, gameId }, 'Journal updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating journal');
    sendError(socket, 'Failed to update journal');
  }
}

/**
 * Handle journal:delete event
 * Deletes a journal and broadcasts to all players in the game
 */
export async function handleJournalDelete(
  socket: WebSocket,
  message: WSMessage<JournalDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Journal delete');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { journalId } = message.payload;

    // Delete journal from database (cascade will delete pages)
    const deletedJournals = await request.server.db
      .delete(journals)
      .where(eq(journals.id, journalId))
      .returning();

    if (deletedJournals.length === 0) {
      sendError(socket, 'Journal not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: JournalDeletedPayload = { journalId };
    roomManager.broadcast(gameId, {
      type: 'journal:deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ journalId, gameId }, 'Journal deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting journal');
    sendError(socket, 'Failed to delete journal');
  }
}

/**
 * Handle journal:show event
 * Shows a journal to specific players (GM feature)
 */
export async function handleJournalShow(
  socket: WebSocket,
  message: WSMessage<JournalShowPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Journal show');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { journalId, targetUserIds } = message.payload;

    // Fetch journal from database
    const [journal] = await request.server.db
      .select()
      .from(journals)
      .where(eq(journals.id, journalId))
      .limit(1);

    if (!journal) {
      sendError(socket, 'Journal not found');
      return;
    }

    // Fetch all pages for this journal
    const pages = await request.server.db
      .select()
      .from(journalPages)
      .where(eq(journalPages.journalId, journalId))
      .orderBy(asc(journalPages.sort));

    // Prepare the payload
    const shownPayload: JournalShownPayload = {
      journal: {
        id: journal.id,
        gameId: journal.gameId,
        name: journal.name,
        img: journal.img,
        folderId: journal.folderId,
        permission: journal.permission,
        ownerId: journal.ownerId,
        sort: journal.sort,
        data: journal.data as Record<string, unknown>,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt,
      },
      pages: pages.map(page => ({
        id: page.id,
        journalId: page.journalId,
        name: page.name,
        pageType: page.pageType,
        content: page.content,
        src: page.src,
        sort: page.sort,
        showInNavigation: page.showInNavigation,
        data: page.data as Record<string, unknown>,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      })),
      targetUserIds,
      shownByUserId: playerInfo.userId,
    };

    // Broadcast to specific target users only
    // Since roomManager doesn't expose sockets directly, we'll use a targeted broadcast
    // by sending the message and letting the client filter, or we send to all
    // For now, we'll include targetUserIds in the payload and let clients filter
    // A better approach would be to extend roomManager with a broadcast to specific users

    // For this implementation, we'll broadcast to all players in the room
    // and include the targetUserIds so clients can determine if they should display it
    roomManager.broadcast(gameId, {
      type: 'journal:shown',
      payload: shownPayload,
      timestamp: Date.now(),
    });

    request.log.info({
      journalId,
      gameId,
      targetUserIds,
      shownBy: playerInfo.userId
    }, 'Journal shown to players');
  } catch (error) {
    request.log.error({ error }, 'Error showing journal');
    sendError(socket, 'Failed to show journal');
  }
}

/**
 * Handle page:create event
 * Creates a new journal page and broadcasts to all players in the game
 */
export async function handlePageCreate(
  socket: WebSocket,
  message: WSMessage<PageCreatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Page create');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const {
      journalId,
      name,
      pageType = 'text',
      content = null,
      src = null,
      sort = 0,
      showInNavigation = true,
      data = {},
    } = message.payload;

    // Create page in database
    const newPages = await request.server.db
      .insert(journalPages)
      .values({
        journalId,
        name,
        pageType,
        content,
        src,
        sort,
        showInNavigation,
        data,
      })
      .returning();

    const newPage = newPages[0];

    // Broadcast to all players
    const createdPayload: PageCreatedPayload = {
      page: {
        id: newPage.id,
        journalId: newPage.journalId,
        name: newPage.name,
        pageType: newPage.pageType,
        content: newPage.content,
        src: newPage.src,
        sort: newPage.sort,
        showInNavigation: newPage.showInNavigation,
        data: newPage.data as Record<string, unknown>,
        createdAt: newPage.createdAt,
        updatedAt: newPage.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'page:created',
      payload: createdPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pageId: newPage.id, journalId, gameId }, 'Page created');
  } catch (error) {
    request.log.error({ error }, 'Error creating page');
    sendError(socket, 'Failed to create page');
  }
}

/**
 * Handle page:update event
 * Updates a journal page and broadcasts to all players in the game
 */
export async function handlePageUpdate(
  socket: WebSocket,
  message: WSMessage<PageUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Page update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { pageId, updates } = message.payload;

    // Update page in database
    const updatedPages = await request.server.db
      .update(journalPages)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(journalPages.id, pageId))
      .returning();

    if (updatedPages.length === 0) {
      sendError(socket, 'Page not found');
      return;
    }

    const updatedPage = updatedPages[0];

    // Broadcast to all players
    const updatedPayload: PageUpdatedPayload = {
      page: {
        id: updatedPage.id,
        journalId: updatedPage.journalId,
        name: updatedPage.name,
        pageType: updatedPage.pageType,
        content: updatedPage.content,
        src: updatedPage.src,
        sort: updatedPage.sort,
        showInNavigation: updatedPage.showInNavigation,
        data: updatedPage.data as Record<string, unknown>,
        createdAt: updatedPage.createdAt,
        updatedAt: updatedPage.updatedAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'page:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pageId, gameId }, 'Page updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating page');
    sendError(socket, 'Failed to update page');
  }
}

/**
 * Handle page:delete event
 * Deletes a journal page and broadcasts to all players in the game
 */
export async function handlePageDelete(
  socket: WebSocket,
  message: WSMessage<PageDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Page delete');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { pageId } = message.payload;

    // Delete page from database
    const deletedPages = await request.server.db
      .delete(journalPages)
      .where(eq(journalPages.id, pageId))
      .returning();

    if (deletedPages.length === 0) {
      sendError(socket, 'Page not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: PageDeletedPayload = { pageId };
    roomManager.broadcast(gameId, {
      type: 'page:deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ pageId, gameId }, 'Page deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting page');
    sendError(socket, 'Failed to delete page');
  }
}

/**
 * Handle folder:create event
 * Creates a new folder and broadcasts to all players in the game
 */
export async function handleFolderCreate(
  socket: WebSocket,
  message: WSMessage<FolderCreatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Folder create');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const {
      name,
      folderType,
      parentId = null,
      color = null,
      sort = 0,
      data = {},
    } = message.payload;

    // Create folder in database
    const newFolders = await request.server.db
      .insert(folders)
      .values({
        gameId,
        name,
        folderType,
        parentId,
        color,
        sort,
        data,
      })
      .returning();

    const newFolder = newFolders[0];

    // Broadcast to all players
    const createdPayload: FolderCreatedPayload = {
      folder: {
        id: newFolder.id,
        gameId: newFolder.gameId,
        name: newFolder.name,
        folderType: newFolder.folderType,
        parentId: newFolder.parentId,
        color: newFolder.color,
        sort: newFolder.sort,
        data: newFolder.data as Record<string, unknown>,
        createdAt: newFolder.createdAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'folder:created',
      payload: createdPayload,
      timestamp: Date.now(),
    });

    request.log.info({ folderId: newFolder.id, gameId }, 'Folder created');
  } catch (error) {
    request.log.error({ error }, 'Error creating folder');
    sendError(socket, 'Failed to create folder');
  }
}

/**
 * Handle folder:update event
 * Updates a folder and broadcasts to all players in the game
 */
export async function handleFolderUpdate(
  socket: WebSocket,
  message: WSMessage<FolderUpdatePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Folder update');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { folderId, updates } = message.payload;

    // Update folder in database
    const updatedFolders = await request.server.db
      .update(folders)
      .set(updates)
      .where(eq(folders.id, folderId))
      .returning();

    if (updatedFolders.length === 0) {
      sendError(socket, 'Folder not found');
      return;
    }

    const updatedFolder = updatedFolders[0];

    // Broadcast to all players
    const updatedPayload: FolderUpdatedPayload = {
      folder: {
        id: updatedFolder.id,
        gameId: updatedFolder.gameId,
        name: updatedFolder.name,
        folderType: updatedFolder.folderType,
        parentId: updatedFolder.parentId,
        color: updatedFolder.color,
        sort: updatedFolder.sort,
        data: updatedFolder.data as Record<string, unknown>,
        createdAt: updatedFolder.createdAt,
      },
    };

    roomManager.broadcast(gameId, {
      type: 'folder:updated',
      payload: updatedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ folderId, gameId }, 'Folder updated');
  } catch (error) {
    request.log.error({ error }, 'Error updating folder');
    sendError(socket, 'Failed to update folder');
  }
}

/**
 * Handle folder:delete event
 * Deletes a folder and broadcasts to all players in the game
 */
export async function handleFolderDelete(
  socket: WebSocket,
  message: WSMessage<FolderDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Folder delete');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { folderId } = message.payload;

    // Delete folder from database
    const deletedFolders = await request.server.db
      .delete(folders)
      .where(eq(folders.id, folderId))
      .returning();

    if (deletedFolders.length === 0) {
      sendError(socket, 'Folder not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: FolderDeletedPayload = { folderId };
    roomManager.broadcast(gameId, {
      type: 'folder:deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ folderId, gameId }, 'Folder deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting folder');
    sendError(socket, 'Failed to delete folder');
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
