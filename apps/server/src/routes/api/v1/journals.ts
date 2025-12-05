import type { FastifyPluginAsync } from 'fastify';
import { folders, journals, journalPages, games } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type {
  Folder,
  Journal,
  JournalPage,
  CreateFolderRequest,
  UpdateFolderRequest,
  CreateJournalRequest,
  UpdateJournalRequest,
  CreateJournalPageRequest,
  UpdateJournalPageRequest,
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Journal API routes
 * All routes require authentication
 * Handles CRUD operations for folders, journals, and journal pages
 */
const journalsRoute: FastifyPluginAsync = async (fastify) => {
  // ========================================
  // FOLDER ROUTES
  // ========================================

  /**
   * GET /api/v1/games/:gameId/folders - List folders for a game
   * Returns folders for a specific game, optionally filtered by folderType
   */
  fastify.get<{ Params: { gameId: string }; Querystring: { folderType?: string } }>(
    '/games/:gameId/folders',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const { folderType } = request.query;

      try {
        // Verify game exists
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user has access to this game

        // Fetch folders for the game
        let gameFolders;
        if (folderType) {
          gameFolders = await fastify.db
            .select()
            .from(folders)
            .where(and(eq(folders.gameId, gameId), eq(folders.folderType, folderType)));
        } else {
          gameFolders = await fastify.db
            .select()
            .from(folders)
            .where(eq(folders.gameId, gameId));
        }

        // Convert to Folder interface
        const formattedFolders: Folder[] = gameFolders.map(folder => ({
          id: folder.id,
          gameId: folder.gameId,
          name: folder.name,
          folderType: folder.folderType,
          parentId: folder.parentId,
          color: folder.color,
          sort: folder.sort,
          data: folder.data as Record<string, unknown>,
          createdAt: folder.createdAt,
        }));

        return reply.status(200).send({ folders: formattedFolders });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch folders');
        return reply.status(500).send({ error: 'Failed to fetch folders' });
      }
    }
  );

  /**
   * POST /api/v1/games/:gameId/folders - Create a new folder
   * Creates a folder for a specific game
   */
  fastify.post<{ Params: { gameId: string }; Body: CreateFolderRequest }>(
    '/games/:gameId/folders',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const folderData = request.body;

      // Validate required fields
      if (!folderData.name || folderData.name.trim() === '') {
        return reply.status(400).send({ error: 'Folder name is required' });
      }

      if (!folderData.folderType || folderData.folderType.trim() === '') {
        return reply.status(400).send({ error: 'Folder type is required' });
      }

      try {
        // Verify game exists
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user has permission to create folders in this game

        // Create folder in database
        const newFolders = await fastify.db
          .insert(folders)
          .values({
            gameId,
            name: folderData.name.trim(),
            folderType: folderData.folderType.trim(),
            parentId: folderData.parentId ?? null,
            color: folderData.color ?? null,
            sort: folderData.sort ?? 0,
            data: folderData.data ?? {},
          })
          .returning();

        const newFolder = newFolders[0];

        // Convert to Folder interface
        const formattedFolder: Folder = {
          id: newFolder.id,
          gameId: newFolder.gameId,
          name: newFolder.name,
          folderType: newFolder.folderType,
          parentId: newFolder.parentId,
          color: newFolder.color,
          sort: newFolder.sort,
          data: newFolder.data as Record<string, unknown>,
          createdAt: newFolder.createdAt,
        };

        return reply.status(201).send({ folder: formattedFolder });
      } catch (error) {
        fastify.log.error(error, 'Failed to create folder');
        return reply.status(500).send({ error: 'Failed to create folder' });
      }
    }
  );

  /**
   * PATCH /api/v1/folders/:folderId - Update a folder
   * Updates a specific folder
   */
  fastify.patch<{ Params: { folderId: string }; Body: UpdateFolderRequest }>(
    '/folders/:folderId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { folderId } = request.params;
      const updates = request.body;

      try {
        // Check if folder exists
        const [existingFolder] = await fastify.db
          .select()
          .from(folders)
          .where(eq(folders.id, folderId))
          .limit(1);

        if (!existingFolder) {
          return reply.status(404).send({ error: 'Folder not found' });
        }

        // TODO: Check if user has permission to update this folder

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Folder name cannot be empty' });
        }

        // Validate folderType if provided
        if (updates.folderType !== undefined && updates.folderType.trim() === '') {
          return reply.status(400).send({ error: 'Folder type cannot be empty' });
        }

        // Build update object
        const updateData: any = {};

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.folderType !== undefined) {
          updateData.folderType = updates.folderType.trim();
        }
        if (updates.parentId !== undefined) {
          updateData.parentId = updates.parentId;
        }
        if (updates.color !== undefined) {
          updateData.color = updates.color;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update folder in database
        const updatedFolders = await fastify.db
          .update(folders)
          .set(updateData)
          .where(eq(folders.id, folderId))
          .returning();

        const updatedFolder = updatedFolders[0];

        // Convert to Folder interface
        const formattedFolder: Folder = {
          id: updatedFolder.id,
          gameId: updatedFolder.gameId,
          name: updatedFolder.name,
          folderType: updatedFolder.folderType,
          parentId: updatedFolder.parentId,
          color: updatedFolder.color,
          sort: updatedFolder.sort,
          data: updatedFolder.data as Record<string, unknown>,
          createdAt: updatedFolder.createdAt,
        };

        return reply.status(200).send({ folder: formattedFolder });
      } catch (error) {
        fastify.log.error(error, 'Failed to update folder');
        return reply.status(500).send({ error: 'Failed to update folder' });
      }
    }
  );

  /**
   * DELETE /api/v1/folders/:folderId - Delete a folder
   * Deletes a specific folder
   */
  fastify.delete<{ Params: { folderId: string } }>(
    '/folders/:folderId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { folderId } = request.params;

      try {
        // Check if folder exists
        const [existingFolder] = await fastify.db
          .select()
          .from(folders)
          .where(eq(folders.id, folderId))
          .limit(1);

        if (!existingFolder) {
          return reply.status(404).send({ error: 'Folder not found' });
        }

        // TODO: Check if user has permission to delete this folder

        // Delete folder from database
        await fastify.db
          .delete(folders)
          .where(eq(folders.id, folderId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete folder');
        return reply.status(500).send({ error: 'Failed to delete folder' });
      }
    }
  );

  // ========================================
  // JOURNAL ROUTES
  // ========================================

  /**
   * GET /api/v1/games/:gameId/journals - List journals for a game
   * Returns journals for a specific game, optionally filtered by folderId
   */
  fastify.get<{ Params: { gameId: string }; Querystring: { folderId?: string } }>(
    '/games/:gameId/journals',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const { folderId } = request.query;

      try {
        // Verify game exists
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user has access to this game

        // Fetch journals for the game
        let gameJournals;
        if (folderId) {
          gameJournals = await fastify.db
            .select()
            .from(journals)
            .where(and(eq(journals.gameId, gameId), eq(journals.folderId, folderId)));
        } else {
          gameJournals = await fastify.db
            .select()
            .from(journals)
            .where(eq(journals.gameId, gameId));
        }

        // Convert to Journal interface
        const formattedJournals: Journal[] = gameJournals.map(journal => ({
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
        }));

        return reply.status(200).send({ journals: formattedJournals });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch journals');
        return reply.status(500).send({ error: 'Failed to fetch journals' });
      }
    }
  );

  /**
   * GET /api/v1/journals/:journalId - Get a journal with all its pages
   * Returns a specific journal with its pages array
   */
  fastify.get<{ Params: { journalId: string } }>(
    '/journals/:journalId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { journalId } = request.params;

      try {
        // Fetch journal
        const [journal] = await fastify.db
          .select()
          .from(journals)
          .where(eq(journals.id, journalId))
          .limit(1);

        if (!journal) {
          return reply.status(404).send({ error: 'Journal not found' });
        }

        // TODO: Check if user has access to this journal's game

        // Fetch all pages for this journal
        const pages = await fastify.db
          .select()
          .from(journalPages)
          .where(eq(journalPages.journalId, journalId));

        // Convert to JournalPage interface
        const formattedPages: JournalPage[] = pages.map(page => ({
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
        }));

        // Convert to Journal interface with pages
        const formattedJournal = {
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
          pages: formattedPages,
        };

        return reply.status(200).send({ journal: formattedJournal });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch journal');
        return reply.status(500).send({ error: 'Failed to fetch journal' });
      }
    }
  );

  /**
   * POST /api/v1/games/:gameId/journals - Create a new journal
   * Creates a journal for a specific game
   */
  fastify.post<{ Params: { gameId: string }; Body: CreateJournalRequest }>(
    '/games/:gameId/journals',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const journalData = request.body;

      // Validate required fields
      if (!journalData.name || journalData.name.trim() === '') {
        return reply.status(400).send({ error: 'Journal name is required' });
      }

      try {
        // Verify game exists
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user has permission to create journals in this game

        // Create journal in database
        const newJournals = await fastify.db
          .insert(journals)
          .values({
            gameId,
            name: journalData.name.trim(),
            img: journalData.img ?? null,
            folderId: journalData.folderId ?? null,
            permission: journalData.permission ?? 'observer',
            ownerId: journalData.ownerId ?? null,
            sort: journalData.sort ?? 0,
            data: journalData.data ?? {},
          })
          .returning();

        const newJournal = newJournals[0];

        // Convert to Journal interface
        const formattedJournal: Journal = {
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
        };

        return reply.status(201).send({ journal: formattedJournal });
      } catch (error) {
        fastify.log.error(error, 'Failed to create journal');
        return reply.status(500).send({ error: 'Failed to create journal' });
      }
    }
  );

  /**
   * PATCH /api/v1/journals/:journalId - Update a journal
   * Updates a specific journal
   */
  fastify.patch<{ Params: { journalId: string }; Body: UpdateJournalRequest }>(
    '/journals/:journalId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { journalId } = request.params;
      const updates = request.body;

      try {
        // Check if journal exists
        const [existingJournal] = await fastify.db
          .select()
          .from(journals)
          .where(eq(journals.id, journalId))
          .limit(1);

        if (!existingJournal) {
          return reply.status(404).send({ error: 'Journal not found' });
        }

        // TODO: Check if user has permission to update this journal

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Journal name cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.img !== undefined) {
          updateData.img = updates.img;
        }
        if (updates.folderId !== undefined) {
          updateData.folderId = updates.folderId;
        }
        if (updates.permission !== undefined) {
          updateData.permission = updates.permission;
        }
        if (updates.ownerId !== undefined) {
          updateData.ownerId = updates.ownerId;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update journal in database
        const updatedJournals = await fastify.db
          .update(journals)
          .set(updateData)
          .where(eq(journals.id, journalId))
          .returning();

        const updatedJournal = updatedJournals[0];

        // Convert to Journal interface
        const formattedJournal: Journal = {
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
        };

        return reply.status(200).send({ journal: formattedJournal });
      } catch (error) {
        fastify.log.error(error, 'Failed to update journal');
        return reply.status(500).send({ error: 'Failed to update journal' });
      }
    }
  );

  /**
   * DELETE /api/v1/journals/:journalId - Delete a journal
   * Deletes a specific journal (cascade deletes all pages)
   */
  fastify.delete<{ Params: { journalId: string } }>(
    '/journals/:journalId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { journalId } = request.params;

      try {
        // Check if journal exists
        const [existingJournal] = await fastify.db
          .select()
          .from(journals)
          .where(eq(journals.id, journalId))
          .limit(1);

        if (!existingJournal) {
          return reply.status(404).send({ error: 'Journal not found' });
        }

        // TODO: Check if user has permission to delete this journal

        // Delete journal from database (cascades to pages)
        await fastify.db
          .delete(journals)
          .where(eq(journals.id, journalId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete journal');
        return reply.status(500).send({ error: 'Failed to delete journal' });
      }
    }
  );

  // ========================================
  // JOURNAL PAGE ROUTES
  // ========================================

  /**
   * GET /api/v1/journals/:journalId/pages - List pages for a journal
   * Returns all pages for a specific journal
   */
  fastify.get<{ Params: { journalId: string } }>(
    '/journals/:journalId/pages',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { journalId } = request.params;

      try {
        // Verify journal exists
        const [journal] = await fastify.db
          .select()
          .from(journals)
          .where(eq(journals.id, journalId))
          .limit(1);

        if (!journal) {
          return reply.status(404).send({ error: 'Journal not found' });
        }

        // TODO: Check if user has access to this journal

        // Fetch all pages for the journal
        const pages = await fastify.db
          .select()
          .from(journalPages)
          .where(eq(journalPages.journalId, journalId));

        // Convert to JournalPage interface
        const formattedPages: JournalPage[] = pages.map(page => ({
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
        }));

        return reply.status(200).send({ journalPages: formattedPages });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch journal pages');
        return reply.status(500).send({ error: 'Failed to fetch journal pages' });
      }
    }
  );

  /**
   * POST /api/v1/journals/:journalId/pages - Create a new journal page
   * Creates a page for a specific journal
   */
  fastify.post<{ Params: { journalId: string }; Body: CreateJournalPageRequest }>(
    '/journals/:journalId/pages',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { journalId } = request.params;
      const pageData = request.body;

      // Validate required fields
      if (!pageData.name || pageData.name.trim() === '') {
        return reply.status(400).send({ error: 'Page name is required' });
      }

      try {
        // Verify journal exists
        const [journal] = await fastify.db
          .select()
          .from(journals)
          .where(eq(journals.id, journalId))
          .limit(1);

        if (!journal) {
          return reply.status(404).send({ error: 'Journal not found' });
        }

        // TODO: Check if user has permission to create pages in this journal

        // Create page in database
        const newPages = await fastify.db
          .insert(journalPages)
          .values({
            journalId,
            name: pageData.name.trim(),
            pageType: pageData.pageType ?? 'text',
            content: pageData.content ?? null,
            src: pageData.src ?? null,
            sort: pageData.sort ?? 0,
            showInNavigation: pageData.showInNavigation ?? true,
            data: pageData.data ?? {},
          })
          .returning();

        const newPage = newPages[0];

        // Convert to JournalPage interface
        const formattedPage: JournalPage = {
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
        };

        return reply.status(201).send({ journalPage: formattedPage });
      } catch (error) {
        fastify.log.error(error, 'Failed to create journal page');
        return reply.status(500).send({ error: 'Failed to create journal page' });
      }
    }
  );

  /**
   * PATCH /api/v1/pages/:pageId - Update a journal page
   * Updates a specific journal page
   */
  fastify.patch<{ Params: { pageId: string }; Body: UpdateJournalPageRequest }>(
    '/pages/:pageId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pageId } = request.params;
      const updates = request.body;

      try {
        // Check if page exists
        const [existingPage] = await fastify.db
          .select()
          .from(journalPages)
          .where(eq(journalPages.id, pageId))
          .limit(1);

        if (!existingPage) {
          return reply.status(404).send({ error: 'Journal page not found' });
        }

        // TODO: Check if user has permission to update this page

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Page name cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.pageType !== undefined) {
          updateData.pageType = updates.pageType;
        }
        if (updates.content !== undefined) {
          updateData.content = updates.content;
        }
        if (updates.src !== undefined) {
          updateData.src = updates.src;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }
        if (updates.showInNavigation !== undefined) {
          updateData.showInNavigation = updates.showInNavigation;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update page in database
        const updatedPages = await fastify.db
          .update(journalPages)
          .set(updateData)
          .where(eq(journalPages.id, pageId))
          .returning();

        const updatedPage = updatedPages[0];

        // Convert to JournalPage interface
        const formattedPage: JournalPage = {
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
        };

        return reply.status(200).send({ journalPage: formattedPage });
      } catch (error) {
        fastify.log.error(error, 'Failed to update journal page');
        return reply.status(500).send({ error: 'Failed to update journal page' });
      }
    }
  );

  /**
   * DELETE /api/v1/pages/:pageId - Delete a journal page
   * Deletes a specific journal page
   */
  fastify.delete<{ Params: { pageId: string } }>(
    '/pages/:pageId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pageId } = request.params;

      try {
        // Check if page exists
        const [existingPage] = await fastify.db
          .select()
          .from(journalPages)
          .where(eq(journalPages.id, pageId))
          .limit(1);

        if (!existingPage) {
          return reply.status(404).send({ error: 'Journal page not found' });
        }

        // TODO: Check if user has permission to delete this page

        // Delete page from database
        await fastify.db
          .delete(journalPages)
          .where(eq(journalPages.id, pageId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete journal page');
        return reply.status(500).send({ error: 'Failed to delete journal page' });
      }
    }
  );

  /**
   * PATCH /api/v1/pages/:pageId/reorder - Reorder a journal page
   * Updates the sort order of a specific journal page
   */
  fastify.patch<{ Params: { pageId: string }; Body: { sort: number } }>(
    '/pages/:pageId/reorder',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { pageId } = request.params;
      const { sort } = request.body;

      // Validate sort value
      if (sort === undefined || typeof sort !== 'number') {
        return reply.status(400).send({ error: 'Sort value is required and must be a number' });
      }

      try {
        // Check if page exists
        const [existingPage] = await fastify.db
          .select()
          .from(journalPages)
          .where(eq(journalPages.id, pageId))
          .limit(1);

        if (!existingPage) {
          return reply.status(404).send({ error: 'Journal page not found' });
        }

        // TODO: Check if user has permission to reorder this page

        // Update page sort in database
        const updatedPages = await fastify.db
          .update(journalPages)
          .set({
            sort,
            updatedAt: new Date(),
          })
          .where(eq(journalPages.id, pageId))
          .returning();

        const updatedPage = updatedPages[0];

        // Convert to JournalPage interface
        const formattedPage: JournalPage = {
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
        };

        return reply.status(200).send({ journalPage: formattedPage });
      } catch (error) {
        fastify.log.error(error, 'Failed to reorder journal page');
        return reply.status(500).send({ error: 'Failed to reorder journal page' });
      }
    }
  );
};

export default journalsRoute;
