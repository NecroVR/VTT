import type { FastifyPluginAsync } from 'fastify';
import { items, actors, campaigns } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type { Item, CreateItemRequest, UpdateItemRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Item API routes
 * All routes require authentication
 * Handles CRUD operations for items
 */
const itemsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/actors/:actorId/items - List all items for an actor
   * Returns items for a specific actor
   */
  fastify.get<{ Params: { actorId: string } }>(
    '/actors/:actorId/items',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { actorId } = request.params;

      try {
        // Verify actor exists
        const [actor] = await fastify.db
          .select()
          .from(actors)
          .where(eq(actors.id, actorId))
          .limit(1);

        if (!actor) {
          return reply.status(404).send({ error: 'Actor not found' });
        }

        // TODO: Check if user has access to this actor's campaign

        // Fetch all items for the actor
        const actorItems = await fastify.db
          .select()
          .from(items)
          .where(eq(items.actorId, actorId));

        // Convert to Item interface
        const formattedItems: Item[] = actorItems.map(item => ({
          id: item.id,
          campaignId: item.campaignId,
          actorId: item.actorId,
          name: item.name,
          itemType: item.itemType,
          img: item.img,
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          price: item.price,
          equipped: item.equipped,
          data: item.data as Record<string, unknown>,
          sort: item.sort,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        return reply.status(200).send({ items: formattedItems });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch items');
        return reply.status(500).send({ error: 'Failed to fetch items' });
      }
    }
  );

  /**
   * GET /api/v1/items/:itemId - Get a single item
   * Returns a specific item
   */
  fastify.get<{ Params: { itemId: string } }>(
    '/items/:itemId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { itemId } = request.params;

      try {
        // Fetch item
        const [item] = await fastify.db
          .select()
          .from(items)
          .where(eq(items.id, itemId))
          .limit(1);

        if (!item) {
          return reply.status(404).send({ error: 'Item not found' });
        }

        // TODO: Check if user has access to this item's campaign

        // Convert to Item interface
        const formattedItem: Item = {
          id: item.id,
          campaignId: item.campaignId,
          actorId: item.actorId,
          name: item.name,
          itemType: item.itemType,
          img: item.img,
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          price: item.price,
          equipped: item.equipped,
          data: item.data as Record<string, unknown>,
          sort: item.sort,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };

        return reply.status(200).send({ item: formattedItem });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch item');
        return reply.status(500).send({ error: 'Failed to fetch item' });
      }
    }
  );

  /**
   * POST /api/v1/actors/:actorId/items - Create a new item
   * Creates an item for a specific actor
   */
  fastify.post<{ Params: { actorId: string }; Body: CreateItemRequest }>(
    '/actors/:actorId/items',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { actorId } = request.params;
      const itemData = request.body;

      // Validate required fields
      if (!itemData.name || itemData.name.trim() === '') {
        return reply.status(400).send({ error: 'Item name is required' });
      }

      if (!itemData.itemType || itemData.itemType.trim() === '') {
        return reply.status(400).send({ error: 'Item type is required' });
      }

      if (!itemData.campaignId || itemData.campaignId.trim() === '') {
        return reply.status(400).send({ error: 'Campaign ID is required' });
      }

      try {
        // Verify actor exists
        const [actor] = await fastify.db
          .select()
          .from(actors)
          .where(eq(actors.id, actorId))
          .limit(1);

        if (!actor) {
          return reply.status(404).send({ error: 'Actor not found' });
        }

        // Verify campaign exists
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, itemData.campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user has permission to create items for this actor

        // Create item in database
        const newItems = await fastify.db
          .insert(items)
          .values({
            campaignId: itemData.campaignId,
            actorId: actorId,
            name: itemData.name.trim(),
            itemType: itemData.itemType.trim(),
            img: itemData.img ?? null,
            description: itemData.description ?? null,
            quantity: itemData.quantity ?? 1,
            weight: itemData.weight ?? 0,
            price: itemData.price ?? 0,
            equipped: itemData.equipped ?? false,
            data: itemData.data ?? {},
            sort: itemData.sort ?? 0,
          })
          .returning();

        const newItem = newItems[0];

        // Convert to Item interface
        const formattedItem: Item = {
          id: newItem.id,
          campaignId: newItem.campaignId,
          actorId: newItem.actorId,
          name: newItem.name,
          itemType: newItem.itemType,
          img: newItem.img,
          description: newItem.description,
          quantity: newItem.quantity,
          weight: newItem.weight,
          price: newItem.price,
          equipped: newItem.equipped,
          data: newItem.data as Record<string, unknown>,
          sort: newItem.sort,
          createdAt: newItem.createdAt,
          updatedAt: newItem.updatedAt,
        };

        return reply.status(201).send({ item: formattedItem });
      } catch (error) {
        fastify.log.error(error, 'Failed to create item');
        return reply.status(500).send({ error: 'Failed to create item' });
      }
    }
  );

  /**
   * PATCH /api/v1/items/:itemId - Update an item
   * Updates a specific item
   */
  fastify.patch<{ Params: { itemId: string }; Body: UpdateItemRequest }>(
    '/items/:itemId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { itemId } = request.params;
      const updates = request.body;

      try {
        // Check if item exists
        const [existingItem] = await fastify.db
          .select()
          .from(items)
          .where(eq(items.id, itemId))
          .limit(1);

        if (!existingItem) {
          return reply.status(404).send({ error: 'Item not found' });
        }

        // TODO: Check if user has permission to update this item

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Item name cannot be empty' });
        }

        // Validate itemType if provided
        if (updates.itemType !== undefined && updates.itemType.trim() === '') {
          return reply.status(400).send({ error: 'Item type cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.itemType !== undefined) {
          updateData.itemType = updates.itemType.trim();
        }
        if (updates.img !== undefined) {
          updateData.img = updates.img;
        }
        if (updates.description !== undefined) {
          updateData.description = updates.description;
        }
        if (updates.quantity !== undefined) {
          updateData.quantity = updates.quantity;
        }
        if (updates.weight !== undefined) {
          updateData.weight = updates.weight;
        }
        if (updates.price !== undefined) {
          updateData.price = updates.price;
        }
        if (updates.equipped !== undefined) {
          updateData.equipped = updates.equipped;
        }
        if (updates.actorId !== undefined) {
          updateData.actorId = updates.actorId;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }

        // Update item in database
        const updatedItems = await fastify.db
          .update(items)
          .set(updateData)
          .where(eq(items.id, itemId))
          .returning();

        const updatedItem = updatedItems[0];

        // Convert to Item interface
        const formattedItem: Item = {
          id: updatedItem.id,
          campaignId: updatedItem.campaignId,
          actorId: updatedItem.actorId,
          name: updatedItem.name,
          itemType: updatedItem.itemType,
          img: updatedItem.img,
          description: updatedItem.description,
          quantity: updatedItem.quantity,
          weight: updatedItem.weight,
          price: updatedItem.price,
          equipped: updatedItem.equipped,
          data: updatedItem.data as Record<string, unknown>,
          sort: updatedItem.sort,
          createdAt: updatedItem.createdAt,
          updatedAt: updatedItem.updatedAt,
        };

        return reply.status(200).send({ item: formattedItem });
      } catch (error) {
        fastify.log.error(error, 'Failed to update item');
        return reply.status(500).send({ error: 'Failed to update item' });
      }
    }
  );

  /**
   * DELETE /api/v1/items/:itemId - Delete an item
   * Deletes a specific item
   */
  fastify.delete<{ Params: { itemId: string } }>(
    '/items/:itemId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { itemId } = request.params;

      try {
        // Check if item exists
        const [existingItem] = await fastify.db
          .select()
          .from(items)
          .where(eq(items.id, itemId))
          .limit(1);

        if (!existingItem) {
          return reply.status(404).send({ error: 'Item not found' });
        }

        // TODO: Check if user has permission to delete this item

        // Delete item from database
        await fastify.db
          .delete(items)
          .where(eq(items.id, itemId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete item');
        return reply.status(500).send({ error: 'Failed to delete item' });
      }
    }
  );
};

export default itemsRoute;
