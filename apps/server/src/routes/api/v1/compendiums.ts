import type { FastifyPluginAsync } from 'fastify';
import { compendiums, compendiumEntries, campaigns, actors, items } from '@vtt/database';
import { eq, and, sql, ilike, inArray, isNull } from 'drizzle-orm';
import type {
  Compendium,
  CompendiumEntry,
  CompendiumEntityType,
  CreateCompendiumRequest,
  UpdateCompendiumRequest,
  CreateCompendiumEntryRequest,
  UpdateCompendiumEntryRequest,
  CompendiumImportData,
  CompendiumInstantiateRequest,
  CompendiumInstantiateResponse,
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Compendium API routes
 * Handles CRUD operations for compendiums and their entries
 * Includes import/export and instantiation functionality
 */
const compendiumsRoute: FastifyPluginAsync = async (fastify) => {

  // =====================================================
  // COMPENDIUM ROUTES
  // =====================================================

  /**
   * GET /api/v1/compendiums - List all accessible compendiums
   * Returns system-wide compendiums and user's game compendiums
   */
  fastify.get(
    '/compendiums',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Get all system-wide compendiums (campaignId is null)
        const systemCompendiums = await fastify.db
          .select()
          .from(compendiums)
          .where(isNull(compendiums.campaignId));

        // TODO: Get compendiums from user's campaigns
        // For now, just return system compendiums

        const formattedCompendiums: Compendium[] = systemCompendiums.map(formatCompendium);

        return reply.status(200).send({ compendiums: formattedCompendiums });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch compendiums');
        return reply.status(500).send({ error: 'Failed to fetch compendiums' });
      }
    }
  );

  /**
   * GET /api/v1/games/:campaignId/compendiums - List game-specific compendiums
   * Returns compendiums for a specific game plus system-wide compendiums
   */
  fastify.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/compendiums',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;

      try {
        // Verify campaign exists
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user has access to this campaign

        // Get system-wide and game-specific compendiums
        const gameCompendiums = await fastify.db
          .select()
          .from(compendiums)
          .where(
            sql`${compendiums.campaignId} IS NULL OR ${compendiums.campaignId} = ${campaignId}`
          );

        const formattedCompendiums: Compendium[] = gameCompendiums.map(formatCompendium);

        return reply.status(200).send({ compendiums: formattedCompendiums });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch game compendiums');
        return reply.status(500).send({ error: 'Failed to fetch game compendiums' });
      }
    }
  );

  /**
   * POST /api/v1/games/:campaignId/compendiums - Create a compendium
   * Creates a new compendium for a campaign
   */
  fastify.post<{ Params: { campaignId: string }; Body: CreateCompendiumRequest }>(
    '/campaigns/:campaignId/compendiums',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;
      const compendiumData = request.body;

      // Validate required fields
      if (!compendiumData.name || compendiumData.name.trim() === '') {
        return reply.status(400).send({ error: 'Compendium name is required' });
      }

      if (!compendiumData.label || compendiumData.label.trim() === '') {
        return reply.status(400).send({ error: 'Compendium label is required' });
      }

      if (!compendiumData.entityType) {
        return reply.status(400).send({ error: 'Entity type is required' });
      }

      try {
        // Verify campaign exists
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user is the campaign owner

        // Create compendium
        const newCompendiums = await fastify.db
          .insert(compendiums)
          .values({
            campaignId,
            name: compendiumData.name.trim(),
            label: compendiumData.label.trim(),
            entityType: compendiumData.entityType,
            system: compendiumData.system ?? null,
            packageId: compendiumData.packageId ?? null,
            locked: compendiumData.locked ?? false,
            private: compendiumData.private ?? false,
            data: compendiumData.data ?? {},
          })
          .returning();

        const newCompendium = newCompendiums[0];
        const formattedCompendium = formatCompendium(newCompendium);

        return reply.status(201).send({ compendium: formattedCompendium });
      } catch (error) {
        fastify.log.error(error, 'Failed to create compendium');
        return reply.status(500).send({ error: 'Failed to create compendium' });
      }
    }
  );

  /**
   * PATCH /api/v1/compendiums/:compendiumId - Update a compendium
   * Updates compendium metadata
   */
  fastify.patch<{ Params: { compendiumId: string }; Body: UpdateCompendiumRequest }>(
    '/compendiums/:compendiumId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { compendiumId } = request.params;
      const updates = request.body;

      try {
        // Check if compendium exists
        const [existingCompendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, compendiumId))
          .limit(1);

        if (!existingCompendium) {
          return reply.status(404).send({ error: 'Compendium not found' });
        }

        // Check if compendium is locked
        if (existingCompendium.locked) {
          return reply.status(403).send({ error: 'Compendium is locked and cannot be modified' });
        }

        // TODO: Check if user has permission to update this compendium

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined && updates.name.trim() !== '') {
          updateData.name = updates.name.trim();
        }
        if (updates.label !== undefined && updates.label.trim() !== '') {
          updateData.label = updates.label.trim();
        }
        if (updates.locked !== undefined) {
          updateData.locked = updates.locked;
        }
        if (updates.private !== undefined) {
          updateData.private = updates.private;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update compendium
        const updatedCompendiums = await fastify.db
          .update(compendiums)
          .set(updateData)
          .where(eq(compendiums.id, compendiumId))
          .returning();

        const updatedCompendium = updatedCompendiums[0];
        const formattedCompendium = formatCompendium(updatedCompendium);

        return reply.status(200).send({ compendium: formattedCompendium });
      } catch (error) {
        fastify.log.error(error, 'Failed to update compendium');
        return reply.status(500).send({ error: 'Failed to update compendium' });
      }
    }
  );

  /**
   * DELETE /api/v1/compendiums/:compendiumId - Delete a compendium
   * Deletes a compendium and all its entries
   */
  fastify.delete<{ Params: { compendiumId: string } }>(
    '/compendiums/:compendiumId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { compendiumId } = request.params;

      try {
        // Check if compendium exists
        const [existingCompendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, compendiumId))
          .limit(1);

        if (!existingCompendium) {
          return reply.status(404).send({ error: 'Compendium not found' });
        }

        // Check if compendium is locked
        if (existingCompendium.locked) {
          return reply.status(403).send({ error: 'Compendium is locked and cannot be deleted' });
        }

        // TODO: Check if user has permission to delete this compendium

        // Delete compendium (cascade will delete entries)
        await fastify.db
          .delete(compendiums)
          .where(eq(compendiums.id, compendiumId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete compendium');
        return reply.status(500).send({ error: 'Failed to delete compendium' });
      }
    }
  );

  // =====================================================
  // COMPENDIUM ENTRY ROUTES
  // =====================================================

  /**
   * GET /api/v1/compendiums/:compendiumId/entries - List entries (paginated)
   * Returns entries for a specific compendium with pagination
   */
  fastify.get<{
    Params: { compendiumId: string };
    Querystring: { page?: string; pageSize?: string };
  }>(
    '/compendiums/:compendiumId/entries',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { compendiumId } = request.params;
      const page = parseInt(request.query.page || '1', 10);
      const pageSize = parseInt(request.query.pageSize || '50', 10);
      const offset = (page - 1) * pageSize;

      try {
        // Verify compendium exists
        const [compendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, compendiumId))
          .limit(1);

        if (!compendium) {
          return reply.status(404).send({ error: 'Compendium not found' });
        }

        // TODO: Check if user has access to this compendium

        // Get total count
        const [countResult] = await fastify.db
          .select({ count: sql<number>`count(*)::int` })
          .from(compendiumEntries)
          .where(eq(compendiumEntries.compendiumId, compendiumId));

        const total = countResult?.count || 0;

        // Get entries
        const entries = await fastify.db
          .select()
          .from(compendiumEntries)
          .where(eq(compendiumEntries.compendiumId, compendiumId))
          .orderBy(compendiumEntries.sort, compendiumEntries.name)
          .limit(pageSize)
          .offset(offset);

        const formattedEntries: CompendiumEntry[] = entries.map(formatCompendiumEntry);

        return reply.status(200).send({
          entries: formattedEntries,
          total,
          page,
          pageSize,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch compendium entries');
        return reply.status(500).send({ error: 'Failed to fetch compendium entries' });
      }
    }
  );

  /**
   * GET /api/v1/compendiums/:compendiumId/entries/search - Search entries
   * Full-text search across compendium entries
   */
  fastify.get<{
    Params: { compendiumId: string };
    Querystring: { query: string; tags?: string; limit?: string; offset?: string };
  }>(
    '/compendiums/:compendiumId/entries/search',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { compendiumId } = request.params;
      const { query } = request.query;
      const limit = parseInt(request.query.limit || '50', 10);
      const offset = parseInt(request.query.offset || '0', 10);
      const tags = request.query.tags ? request.query.tags.split(',') : [];

      if (!query || query.trim() === '') {
        return reply.status(400).send({ error: 'Search query is required' });
      }

      try {
        // Verify compendium exists
        const [compendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, compendiumId))
          .limit(1);

        if (!compendium) {
          return reply.status(404).send({ error: 'Compendium not found' });
        }

        // Build search query with tag filtering
        const whereConditions = [
          eq(compendiumEntries.compendiumId, compendiumId),
          sql`to_tsvector('english', ${compendiumEntries.searchText}) @@ plainto_tsquery('english', ${query})`
        ];

        if (tags.length > 0) {
          whereConditions.push(sql`${compendiumEntries.tags} && ${tags}`);
        }

        const entries = await fastify.db
          .select()
          .from(compendiumEntries)
          .where(and(...whereConditions))
          .orderBy(
            sql`ts_rank(to_tsvector('english', ${compendiumEntries.searchText}), plainto_tsquery('english', ${query})) DESC`
          )
          .limit(limit)
          .offset(offset);

        const formattedEntries: CompendiumEntry[] = entries.map(formatCompendiumEntry);

        return reply.status(200).send({
          entries: formattedEntries,
          total: entries.length,
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to search compendium entries');
        return reply.status(500).send({ error: 'Failed to search compendium entries' });
      }
    }
  );

  /**
   * POST /api/v1/compendiums/:compendiumId/entries - Create an entry
   * Adds a new entry to a compendium
   */
  fastify.post<{ Params: { compendiumId: string }; Body: CreateCompendiumEntryRequest }>(
    '/compendiums/:compendiumId/entries',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { compendiumId } = request.params;
      const entryData = request.body;

      // Validate required fields
      if (!entryData.name || entryData.name.trim() === '') {
        return reply.status(400).send({ error: 'Entry name is required' });
      }

      if (!entryData.entityType) {
        return reply.status(400).send({ error: 'Entity type is required' });
      }

      if (!entryData.entityData) {
        return reply.status(400).send({ error: 'Entity data is required' });
      }

      try {
        // Verify compendium exists
        const [compendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, compendiumId))
          .limit(1);

        if (!compendium) {
          return reply.status(404).send({ error: 'Compendium not found' });
        }

        // Check if compendium is locked
        if (compendium.locked) {
          return reply.status(403).send({ error: 'Compendium is locked and cannot be modified' });
        }

        // Verify entity type matches compendium
        if (entryData.entityType !== compendium.entityType) {
          return reply.status(400).send({
            error: `Entity type ${entryData.entityType} does not match compendium type ${compendium.entityType}`,
          });
        }

        // TODO: Check if user has permission to add entries to this compendium

        // Generate search text from name and entity data
        const searchText = generateSearchText(entryData.name, entryData.entityData);

        // Create entry
        const newEntries = await fastify.db
          .insert(compendiumEntries)
          .values({
            compendiumId,
            name: entryData.name.trim(),
            img: entryData.img ?? null,
            entityType: entryData.entityType,
            entityData: entryData.entityData,
            folderId: entryData.folderId ?? null,
            sort: entryData.sort ?? 0,
            searchText,
            tags: entryData.tags ?? null,
            data: entryData.data ?? {},
          })
          .returning();

        const newEntry = newEntries[0];
        const formattedEntry = formatCompendiumEntry(newEntry);

        return reply.status(201).send({ entry: formattedEntry });
      } catch (error) {
        fastify.log.error(error, 'Failed to create compendium entry');
        return reply.status(500).send({ error: 'Failed to create compendium entry' });
      }
    }
  );

  /**
   * GET /api/v1/compendium-entries/:entryId - Get a single entry
   * Returns a specific compendium entry
   */
  fastify.get<{ Params: { entryId: string } }>(
    '/compendium-entries/:entryId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { entryId } = request.params;

      try {
        const [entry] = await fastify.db
          .select()
          .from(compendiumEntries)
          .where(eq(compendiumEntries.id, entryId))
          .limit(1);

        if (!entry) {
          return reply.status(404).send({ error: 'Entry not found' });
        }

        // TODO: Check if user has access to this entry's compendium

        const formattedEntry = formatCompendiumEntry(entry);

        return reply.status(200).send({ entry: formattedEntry });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch compendium entry');
        return reply.status(500).send({ error: 'Failed to fetch compendium entry' });
      }
    }
  );

  /**
   * PATCH /api/v1/compendium-entries/:entryId - Update an entry
   * Updates a specific compendium entry
   */
  fastify.patch<{ Params: { entryId: string }; Body: UpdateCompendiumEntryRequest }>(
    '/compendium-entries/:entryId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { entryId } = request.params;
      const updates = request.body;

      try {
        // Check if entry exists
        const [existingEntry] = await fastify.db
          .select()
          .from(compendiumEntries)
          .where(eq(compendiumEntries.id, entryId))
          .limit(1);

        if (!existingEntry) {
          return reply.status(404).send({ error: 'Entry not found' });
        }

        // Check if compendium is locked
        const [compendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, existingEntry.compendiumId))
          .limit(1);

        if (compendium?.locked) {
          return reply.status(403).send({ error: 'Compendium is locked and cannot be modified' });
        }

        // TODO: Check if user has permission to update this entry

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined && updates.name.trim() !== '') {
          updateData.name = updates.name.trim();
        }
        if (updates.img !== undefined) {
          updateData.img = updates.img;
        }
        if (updates.entityData !== undefined) {
          updateData.entityData = updates.entityData;
        }
        if (updates.folderId !== undefined) {
          updateData.folderId = updates.folderId;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }
        if (updates.tags !== undefined) {
          updateData.tags = updates.tags;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Regenerate search text if name or entity data changed
        if (updates.name !== undefined || updates.entityData !== undefined) {
          const name = updates.name ?? existingEntry.name;
          const entityData = updates.entityData ?? (existingEntry.entityData as Record<string, unknown>);
          updateData.searchText = generateSearchText(name, entityData);
        }

        // Update entry
        const updatedEntries = await fastify.db
          .update(compendiumEntries)
          .set(updateData)
          .where(eq(compendiumEntries.id, entryId))
          .returning();

        const updatedEntry = updatedEntries[0];
        const formattedEntry = formatCompendiumEntry(updatedEntry);

        return reply.status(200).send({ entry: formattedEntry });
      } catch (error) {
        fastify.log.error(error, 'Failed to update compendium entry');
        return reply.status(500).send({ error: 'Failed to update compendium entry' });
      }
    }
  );

  /**
   * DELETE /api/v1/compendium-entries/:entryId - Delete an entry
   * Deletes a specific compendium entry
   */
  fastify.delete<{ Params: { entryId: string } }>(
    '/compendium-entries/:entryId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { entryId } = request.params;

      try {
        // Check if entry exists
        const [existingEntry] = await fastify.db
          .select()
          .from(compendiumEntries)
          .where(eq(compendiumEntries.id, entryId))
          .limit(1);

        if (!existingEntry) {
          return reply.status(404).send({ error: 'Entry not found' });
        }

        // Check if compendium is locked
        const [compendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, existingEntry.compendiumId))
          .limit(1);

        if (compendium?.locked) {
          return reply.status(403).send({ error: 'Compendium is locked and cannot be modified' });
        }

        // TODO: Check if user has permission to delete this entry

        // Delete entry
        await fastify.db
          .delete(compendiumEntries)
          .where(eq(compendiumEntries.id, entryId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete compendium entry');
        return reply.status(500).send({ error: 'Failed to delete compendium entry' });
      }
    }
  );

  // =====================================================
  // IMPORT/EXPORT ROUTES
  // =====================================================

  /**
   * POST /api/v1/compendiums/:compendiumId/import - Import entries from JSON
   * Imports multiple entries into a compendium from JSON data
   */
  fastify.post<{ Params: { compendiumId: string }; Body: CompendiumImportData }>(
    '/compendiums/:compendiumId/import',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { compendiumId } = request.params;
      const importData = request.body;

      if (!importData.entries || !Array.isArray(importData.entries)) {
        return reply.status(400).send({ error: 'Invalid import data: entries array required' });
      }

      try {
        // Verify compendium exists
        const [compendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, compendiumId))
          .limit(1);

        if (!compendium) {
          return reply.status(404).send({ error: 'Compendium not found' });
        }

        // Check if compendium is locked
        if (compendium.locked) {
          return reply.status(403).send({ error: 'Compendium is locked and cannot be modified' });
        }

        // TODO: Check if user has permission to import to this compendium

        // Insert entries in batch
        const entriesToInsert = importData.entries.map((entry, index) => ({
          compendiumId,
          name: entry.name,
          img: entry.img ?? null,
          entityType: compendium.entityType,
          entityData: entry.entityData,
          folderId: null,
          sort: index,
          searchText: generateSearchText(entry.name, entry.entityData),
          tags: entry.tags ?? null,
          data: entry.data ?? {},
        }));

        const insertedEntries = await fastify.db
          .insert(compendiumEntries)
          .values(entriesToInsert)
          .returning();

        return reply.status(201).send({
          imported: insertedEntries.length,
          entries: insertedEntries.map(formatCompendiumEntry),
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to import compendium entries');
        return reply.status(500).send({ error: 'Failed to import compendium entries' });
      }
    }
  );

  /**
   * GET /api/v1/compendiums/:compendiumId/export - Export compendium as JSON
   * Exports all entries from a compendium as JSON
   */
  fastify.get<{ Params: { compendiumId: string } }>(
    '/compendiums/:compendiumId/export',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { compendiumId } = request.params;

      try {
        // Verify compendium exists
        const [compendium] = await fastify.db
          .select()
          .from(compendiums)
          .where(eq(compendiums.id, compendiumId))
          .limit(1);

        if (!compendium) {
          return reply.status(404).send({ error: 'Compendium not found' });
        }

        // TODO: Check if user has access to this compendium

        // Get all entries
        const entries = await fastify.db
          .select()
          .from(compendiumEntries)
          .where(eq(compendiumEntries.compendiumId, compendiumId))
          .orderBy(compendiumEntries.sort, compendiumEntries.name);

        const exportData: CompendiumImportData = {
          name: compendium.name,
          label: compendium.label,
          entityType: compendium.entityType as CompendiumEntityType,
          system: compendium.system ?? undefined,
          entries: entries.map(entry => ({
            name: entry.name,
            img: entry.img ?? undefined,
            entityData: entry.entityData as Record<string, unknown>,
            tags: entry.tags ?? undefined,
            data: entry.data as Record<string, unknown>,
          })),
        };

        return reply.status(200).send(exportData);
      } catch (error) {
        fastify.log.error(error, 'Failed to export compendium');
        return reply.status(500).send({ error: 'Failed to export compendium' });
      }
    }
  );

  // =====================================================
  // INSTANTIATION ROUTE
  // =====================================================

  /**
   * POST /api/v1/compendium-entries/:entryId/instantiate - Create entity from entry
   * Creates an actual game entity (Actor, Item, etc.) from a compendium entry
   */
  fastify.post<{ Params: { entryId: string }; Body: CompendiumInstantiateRequest }>(
    '/compendium-entries/:entryId/instantiate',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { entryId } = request.params;
      const { campaignId, sceneId, actorId } = request.body;

      if (!campaignId) {
        return reply.status(400).send({ error: 'Campaign ID is required' });
      }

      try {
        // Get entry
        const [entry] = await fastify.db
          .select()
          .from(compendiumEntries)
          .where(eq(compendiumEntries.id, entryId))
          .limit(1);

        if (!entry) {
          return reply.status(404).send({ error: 'Entry not found' });
        }

        // Verify campaign exists
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user has access to this campaign

        let entityId: string;
        const entityData = entry.entityData as Record<string, unknown>;

        // Create entity based on type
        switch (entry.entityType) {
          case 'Actor': {
            const newActors = await fastify.db
              .insert(actors)
              .values({
                campaignId,
                name: entry.name,
                actorType: (entityData.actorType as string) || 'character',
                img: entry.img,
                attributes: (entityData.attributes as Record<string, unknown>) || {},
                abilities: (entityData.abilities as Record<string, unknown>) || {},
                data: entityData,
              })
              .returning();
            entityId = newActors[0].id;
            break;
          }

          case 'Item': {
            if (!actorId) {
              return reply.status(400).send({
                error: 'Actor ID is required to instantiate an Item',
              });
            }

            const newItems = await fastify.db
              .insert(items)
              .values({
                campaignId,
                actorId,
                name: entry.name,
                itemType: (entityData.itemType as string) || 'item',
                img: entry.img,
                description: (entityData.description as string) || null,
                quantity: (entityData.quantity as number) || 1,
                weight: (entityData.weight as number) || 0,
                price: (entityData.price as number) || 0,
                equipped: (entityData.equipped as boolean) || false,
                data: entityData,
              })
              .returning();
            entityId = newItems[0].id;
            break;
          }

          case 'JournalEntry':
          case 'Scene':
            return reply.status(501).send({
              error: `Instantiation of ${entry.entityType} not yet implemented`,
            });

          default:
            return reply.status(400).send({
              error: `Unknown entity type: ${entry.entityType}`,
            });
        }

        const response: CompendiumInstantiateResponse = {
          entityId,
          entityType: entry.entityType,
        };

        return reply.status(201).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to instantiate compendium entry');
        return reply.status(500).send({ error: 'Failed to instantiate compendium entry' });
      }
    }
  );
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format database compendium to API response format
 */
function formatCompendium(compendium: any): Compendium {
  return {
    id: compendium.id,
    campaignId: compendium.campaignId,
    name: compendium.name,
    label: compendium.label,
    entityType: compendium.entityType as CompendiumEntityType,
    system: compendium.system,
    packageId: compendium.packageId,
    locked: compendium.locked,
    private: compendium.private,
    data: compendium.data as Record<string, unknown>,
    createdAt: compendium.createdAt,
    updatedAt: compendium.updatedAt,
  };
}

/**
 * Format database entry to API response format
 */
function formatCompendiumEntry(entry: any): CompendiumEntry {
  return {
    id: entry.id,
    compendiumId: entry.compendiumId,
    name: entry.name,
    img: entry.img,
    entityType: entry.entityType as CompendiumEntityType,
    entityData: entry.entityData as Record<string, unknown>,
    folderId: entry.folderId,
    sort: entry.sort,
    searchText: entry.searchText,
    tags: entry.tags,
    data: entry.data as Record<string, unknown>,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

/**
 * Generate search text from entry name and entity data
 */
function generateSearchText(name: string, entityData: Record<string, unknown>): string {
  const parts = [name];

  // Add common searchable fields
  if (entityData.description) {
    parts.push(String(entityData.description));
  }
  if (entityData.actorType) {
    parts.push(String(entityData.actorType));
  }
  if (entityData.itemType) {
    parts.push(String(entityData.itemType));
  }

  // Recursively extract text from nested objects
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

export default compendiumsRoute;
