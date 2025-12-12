import type { FastifyPluginAsync } from 'fastify';
import { items, actors, campaigns } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type { Item, CreateItemRequest, UpdateItemRequest, AttunementState, ItemRarity } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';
import { ItemTemplateValidator } from '../../../services/itemTemplateValidator.js';
import { createItemEffectsService } from '../../../services/itemEffects.js';
import { gameSystemLoader } from '../../../services/gameSystemLoader.js';

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
          templateId: item.templateId,
          identified: item.identified,
          attunement: item.attunement as AttunementState | null,
          rarity: item.rarity as ItemRarity | null,
          containerId: item.containerId,
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
          templateId: item.templateId,
          identified: item.identified,
          attunement: item.attunement as AttunementState | null,
          rarity: item.rarity as ItemRarity | null,
          containerId: item.containerId,
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

        // Validate item data against template if templateId is provided
        if (itemData.templateId && campaign.gameSystemId) {
          try {
            const gameSystem = gameSystemLoader.getSystem(campaign.gameSystemId);

            if (!gameSystem) {
              return reply.status(400).send({
                error: `Game system '${campaign.gameSystemId}' not found`
              });
            }

            // Find the item template
            const foundTemplate = gameSystem.system.itemTemplates?.find(
              t => t.id === itemData.templateId
            );

            if (!foundTemplate) {
              return reply.status(400).send({
                error: `Item template '${itemData.templateId}' not found in game system '${campaign.gameSystemId}'`
              });
            }

            // Type assertion - we know itemTemplates are ItemTemplates
            const template = foundTemplate as import('@vtt/shared').ItemTemplate;

            // Validate item data against template
            const validator = new ItemTemplateValidator();
            const validationResult = validator.validateItem(
              itemData.data ?? {},
              template
            );

            if (!validationResult.valid) {
              return reply.status(400).send({
                error: 'Item validation failed',
                validationErrors: validationResult.errors,
                validationWarnings: validationResult.warnings,
              });
            }

            // Apply template defaults and compute fields
            const dataWithDefaults = validator.applyDefaults(itemData.data ?? {}, template);
            const computedFields = validator.computeFields(dataWithDefaults, template);

            // Merge computed fields into data
            itemData.data = { ...dataWithDefaults, ...computedFields };

          } catch (error) {
            fastify.log.error(error, 'Failed to validate item against template');
            return reply.status(500).send({
              error: 'Failed to validate item template'
            });
          }
        }

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
            templateId: itemData.templateId ?? null,
            identified: itemData.identified ?? true,
            attunement: itemData.attunement ?? null,
            rarity: itemData.rarity ?? null,
            containerId: itemData.containerId ?? null,
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
          templateId: newItem.templateId,
          identified: newItem.identified,
          attunement: newItem.attunement as AttunementState | null,
          rarity: newItem.rarity as ItemRarity | null,
          containerId: newItem.containerId,
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
        if (updates.templateId !== undefined) {
          updateData.templateId = updates.templateId;
        }
        if (updates.identified !== undefined) {
          updateData.identified = updates.identified;
        }
        if (updates.attunement !== undefined) {
          updateData.attunement = updates.attunement;
        }
        if (updates.rarity !== undefined) {
          updateData.rarity = updates.rarity;
        }
        if (updates.containerId !== undefined) {
          updateData.containerId = updates.containerId;
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

        // Handle effect generation/removal when equipped or attunement status changes
        const itemEffectsService = createItemEffectsService(fastify.db);

        try {
          // Check if equipped status changed
          if (updates.equipped !== undefined && existingItem.actorId) {
            if (updates.equipped === true && existingItem.templateId) {
              // Item was equipped - try to generate effects
              const campaign = await fastify.db
                .select()
                .from(campaigns)
                .where(eq(campaigns.id, existingItem.campaignId))
                .limit(1);

              if (campaign[0]?.gameSystemId) {
                const gameSystem = gameSystemLoader.getSystem(campaign[0].gameSystemId);

                if (gameSystem) {
                  const foundTemplate = gameSystem.system.itemTemplates?.find(
                    t => t.id === existingItem.templateId
                  );

                  // Type assertion - we know itemTemplates are ItemTemplates
                  const template = foundTemplate as import('@vtt/shared').ItemTemplate | undefined;

                  if (template?.effects && template.effects.length > 0) {
                    await itemEffectsService.generateEffects(
                      updatedItem.id,
                      existingItem.actorId,
                      updatedItem.campaignId,
                      template.effects,
                      'equipped'
                    );
                    fastify.log.info(`Generated effects for equipped item ${updatedItem.id}`);
                  }
                }
              }
            } else if (updates.equipped === false) {
              // Item was unequipped - remove effects
              await itemEffectsService.removeEffects(updatedItem.id, 'equipped');
              fastify.log.info(`Removed equipped effects for item ${updatedItem.id}`);
            }
          }

          // Check if attunement status changed
          if (updates.attunement !== undefined && existingItem.actorId) {
            if (updates.attunement === 'attuned' && existingItem.templateId) {
              // Item was attuned - try to generate effects
              const campaign = await fastify.db
                .select()
                .from(campaigns)
                .where(eq(campaigns.id, existingItem.campaignId))
                .limit(1);

              if (campaign[0]?.gameSystemId) {
                const gameSystem = gameSystemLoader.getSystem(campaign[0].gameSystemId);

                if (gameSystem) {
                  const foundTemplate = gameSystem.system.itemTemplates?.find(
                    t => t.id === existingItem.templateId
                  );

                  // Type assertion - we know itemTemplates are ItemTemplates
                  const template = foundTemplate as import('@vtt/shared').ItemTemplate | undefined;

                  if (template?.effects && template.effects.length > 0) {
                    await itemEffectsService.generateEffects(
                      updatedItem.id,
                      existingItem.actorId,
                      updatedItem.campaignId,
                      template.effects,
                      'attuned'
                    );
                    fastify.log.info(`Generated effects for attuned item ${updatedItem.id}`);
                  }
                }
              }
            } else if (existingItem.attunement === 'attuned' && updates.attunement !== 'attuned') {
              // Item attunement was removed - remove effects
              await itemEffectsService.removeEffects(updatedItem.id, 'attuned');
              fastify.log.info(`Removed attunement effects for item ${updatedItem.id}`);
            }
          }
        } catch (error) {
          fastify.log.error(error, 'Failed to manage item effects');
          // Continue with the response even if effect management fails
          // This prevents item updates from being blocked by effect errors
        }

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
          templateId: updatedItem.templateId,
          identified: updatedItem.identified,
          attunement: updatedItem.attunement as AttunementState | null,
          rarity: updatedItem.rarity as ItemRarity | null,
          containerId: updatedItem.containerId,
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

        // Remove all effects from this item before deletion
        try {
          const itemEffectsService = createItemEffectsService(fastify.db);
          await itemEffectsService.removeEffects(itemId, 'equipped');
          await itemEffectsService.removeEffects(itemId, 'attuned');
          fastify.log.info(`Removed all effects for deleted item ${itemId}`);
        } catch (error) {
          fastify.log.error(error, 'Failed to remove item effects before deletion');
          // Continue with deletion even if effect cleanup fails
        }

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
