/**
 * Item Effects Service
 *
 * Manages the generation and lifecycle of active effects from items.
 * When items are equipped, attuned, or activated, this service creates
 * corresponding active effect records in the database.
 *
 * ## Integration with Items API
 *
 * To integrate this service with the items API, modify the PATCH route
 * in `apps/server/src/routes/api/v1/items.ts` as follows:
 *
 * ### 1. Import the service at the top of the file:
 *
 * ```typescript
 * import { createItemEffectsService } from '../../../services/itemEffects.js';
 * ```
 *
 * ### 2. In the PATCH /items/:itemId route handler, after updating the item:
 *
 * ```typescript
 * // After the item update code (around line 343)
 * const updatedItems = await fastify.db
 *   .update(items)
 *   .set(updateData)
 *   .where(eq(items.id, itemId))
 *   .returning();
 *
 * const updatedItem = updatedItems[0];
 *
 * // NEW: Handle effect generation/removal when equipped or attunement changes
 * const itemEffectsService = createItemEffectsService(fastify.db);
 *
 * // Check if equipped status changed
 * if (updates.equipped !== undefined && existingItem.actorId) {
 *   if (updates.equipped === true) {
 *     // Item was equipped - generate effects
 *     // TODO: Load item template to get effect definitions
 *     // const effects = await loadItemEffects(updatedItem.templateId);
 *     // await itemEffectsService.generateEffects(
 *     //   updatedItem.id,
 *     //   existingItem.actorId,
 *     //   updatedItem.campaignId,
 *     //   effects,
 *     //   'equipped'
 *     // );
 *   } else {
 *     // Item was unequipped - remove effects
 *     await itemEffectsService.removeEffects(updatedItem.id, 'equipped');
 *   }
 * }
 *
 * // Check if attunement status changed
 * if (updates.attunement !== undefined && existingItem.actorId) {
 *   if (updates.attunement === 'attuned') {
 *     // Item was attuned - generate effects
 *     // TODO: Load item template to get effect definitions
 *     // const effects = await loadItemEffects(updatedItem.templateId);
 *     // await itemEffectsService.generateEffects(
 *     //   updatedItem.id,
 *     //   existingItem.actorId,
 *     //   updatedItem.campaignId,
 *     //   effects,
 *     //   'attuned'
 *     // );
 *   } else if (existingItem.attunement === 'attuned') {
 *     // Item attunement was removed - remove effects
 *     await itemEffectsService.removeEffects(updatedItem.id, 'attuned');
 *   }
 * }
 * ```
 *
 * ### 3. In the DELETE /items/:itemId route handler:
 *
 * ```typescript
 * // Before deleting the item (around line 413)
 * const itemEffectsService = createItemEffectsService(fastify.db);
 *
 * // Remove all effects from this item
 * await itemEffectsService.removeEffects(itemId, 'equipped');
 * await itemEffectsService.removeEffects(itemId, 'attuned');
 *
 * // Delete item from database
 * await fastify.db
 *   .delete(items)
 *   .where(eq(items.id, itemId));
 * ```
 *
 * ### Notes:
 *
 * - The service requires loading item templates to get effect definitions.
 *   This will need integration with the game systems/templates service.
 * - WebSocket events should be emitted after effect changes to notify clients.
 * - Consider adding a GET endpoint to retrieve effects for a specific item.
 */

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { activeEffects } from '@vtt/database';
import type {
  ItemEffectDefinition,
  EffectTrigger,
  EffectChange,
} from '@vtt/shared';
import type { ActiveEffect } from '@vtt/shared';

/**
 * ItemEffectsService class
 * Handles all operations related to item-generated effects
 */
export class ItemEffectsService {
  private db: NodePgDatabase<any>;

  constructor(db: NodePgDatabase<any>) {
    this.db = db;
  }

  /**
   * Generate active effects from item when equipped/attuned
   * Creates new activeEffect records in the database
   *
   * @param itemId - The ID of the item generating effects
   * @param actorId - The ID of the actor receiving the effects
   * @param campaignId - The ID of the campaign
   * @param effects - Array of effect definitions from the item template
   * @param trigger - The trigger type ('equipped' or 'attuned')
   */
  async generateEffects(
    itemId: string,
    actorId: string,
    campaignId: string,
    effects: ItemEffectDefinition[],
    trigger: 'equipped' | 'attuned'
  ): Promise<ActiveEffect[]> {
    // Filter effects that match the trigger
    const matchingEffects = effects.filter(
      (effect) => effect.trigger === trigger
    );

    if (matchingEffects.length === 0) {
      return [];
    }

    // Map trigger to effectType
    const effectType = trigger === 'equipped' ? 'buff' : 'buff';

    // Create active_effects records for each matching effect
    const createdEffects: ActiveEffect[] = [];

    for (const effectDef of matchingEffects) {
      const newEffects = await this.db
        .insert(activeEffects)
        .values({
          campaignId,
          actorId,
          tokenId: null,
          name: effectDef.name,
          icon: effectDef.icon ?? null,
          description: effectDef.description ?? null,
          effectType: effectDef.effectType ?? effectType,
          durationType: effectDef.duration?.units === 'permanent' ? 'permanent' : 'rounds',
          duration: typeof effectDef.duration?.value === 'number' ? effectDef.duration.value : null,
          startRound: null,
          startTurn: null,
          remaining: null,
          sourceActorId: null,
          sourceItemId: itemId,
          enabled: true,
          hidden: effectDef.hidden ?? false,
          changes: effectDef.changes as any,
          priority: 0,
          transfer: effectDef.transfer,
          data: {},
          sort: 0,
        })
        .returning();

      if (newEffects[0]) {
        // Convert to ActiveEffect type
        const formattedEffect: ActiveEffect = {
          id: newEffects[0].id,
          campaignId: newEffects[0].campaignId,
          actorId: newEffects[0].actorId,
          tokenId: newEffects[0].tokenId,
          name: newEffects[0].name,
          icon: newEffects[0].icon,
          description: newEffects[0].description,
          effectType: newEffects[0].effectType as ActiveEffect['effectType'],
          durationType: newEffects[0].durationType as ActiveEffect['durationType'],
          duration: newEffects[0].duration,
          startRound: newEffects[0].startRound,
          startTurn: newEffects[0].startTurn,
          remaining: newEffects[0].remaining,
          sourceActorId: newEffects[0].sourceActorId,
          sourceItemId: newEffects[0].sourceItemId,
          enabled: newEffects[0].enabled,
          hidden: newEffects[0].hidden,
          changes: newEffects[0].changes as EffectChange[],
          priority: newEffects[0].priority,
          transfer: newEffects[0].transfer,
          data: newEffects[0].data as Record<string, unknown>,
          sort: newEffects[0].sort,
          createdAt: newEffects[0].createdAt,
          updatedAt: newEffects[0].updatedAt,
        };
        createdEffects.push(formattedEffect);
      }
    }

    return createdEffects;
  }

  /**
   * Remove effects when item is unequipped/unattuned
   * Deletes all active effects that were generated by the item with the specified trigger
   *
   * @param itemId - The ID of the item whose effects should be removed
   * @param trigger - The trigger type ('equipped' or 'attuned')
   */
  async removeEffects(
    itemId: string,
    trigger: 'equipped' | 'attuned'
  ): Promise<void> {
    // Delete all active_effects where sourceItemId = itemId
    // Note: We could filter by effectType if we wanted to be more specific,
    // but for now we'll remove all effects from this item when it's unequipped/unattuned
    await this.db
      .delete(activeEffects)
      .where(eq(activeEffects.sourceItemId, itemId));
  }

  /**
   * Get all effects currently active from an item
   *
   * @param itemId - The ID of the item
   * @returns Array of active effects generated by this item
   */
  async getItemEffects(itemId: string): Promise<ActiveEffect[]> {
    const effects = await this.db
      .select()
      .from(activeEffects)
      .where(eq(activeEffects.sourceItemId, itemId));

    // Convert to ActiveEffect interface
    return effects.map((effect) => ({
      id: effect.id,
      campaignId: effect.campaignId,
      actorId: effect.actorId,
      tokenId: effect.tokenId,
      name: effect.name,
      icon: effect.icon,
      description: effect.description,
      effectType: effect.effectType as ActiveEffect['effectType'],
      durationType: effect.durationType as ActiveEffect['durationType'],
      duration: effect.duration,
      startRound: effect.startRound,
      startTurn: effect.startTurn,
      remaining: effect.remaining,
      sourceActorId: effect.sourceActorId,
      sourceItemId: effect.sourceItemId,
      enabled: effect.enabled,
      hidden: effect.hidden,
      changes: effect.changes as EffectChange[],
      priority: effect.priority,
      transfer: effect.transfer,
      data: effect.data as Record<string, unknown>,
      sort: effect.sort,
      createdAt: effect.createdAt,
      updatedAt: effect.updatedAt,
    }));
  }

  /**
   * Process effect changes (prepare for application to actor)
   * Resolves formulas like "@item.data.magicBonus" to actual values
   *
   * @param changes - Array of effect changes to resolve
   * @param itemData - The item's data object for resolving @item references
   * @param actorData - Optional actor data for resolving @actor references
   * @returns Array of effect changes with resolved values
   */
  resolveEffectChanges(
    changes: EffectChange[],
    itemData: Record<string, unknown>,
    actorData?: Record<string, unknown>
  ): EffectChange[] {
    return changes.map((change) => {
      let resolvedValue: string | number | boolean = change.value;

      // If value is a string, try to resolve references
      if (typeof resolvedValue === 'string') {
        let currentValue: string = resolvedValue;

        // Replace @item.data.X references
        const itemMatch = currentValue.match(/@item\.data\.(\w+)/);
        if (itemMatch) {
          const propertyPath = itemMatch[1];
          const itemValue = itemData[propertyPath];
          if (
            itemValue !== undefined &&
            itemValue !== null &&
            (typeof itemValue === 'string' ||
              typeof itemValue === 'number' ||
              typeof itemValue === 'boolean')
          ) {
            resolvedValue = itemValue as string | number | boolean;
            currentValue = String(itemValue);
          }
        }

        // Replace @actor.X references
        if (actorData && typeof currentValue === 'string') {
          const actorMatch = currentValue.match(/@actor\.(\w+)/);
          if (actorMatch) {
            const propertyPath = actorMatch[1];
            const actorValue = actorData[propertyPath];
            if (
              actorValue !== undefined &&
              actorValue !== null &&
              (typeof actorValue === 'string' ||
                typeof actorValue === 'number' ||
                typeof actorValue === 'boolean')
            ) {
              resolvedValue = actorValue as string | number | boolean;
            }
          }
        }
      }

      return {
        ...change,
        value: resolvedValue,
      };
    });
  }
}

/**
 * Factory function to create an ItemEffectsService instance
 * This allows the service to be used in route handlers and other contexts
 *
 * @param db - Drizzle database instance
 * @returns ItemEffectsService instance
 */
export function createItemEffectsService(
  db: NodePgDatabase<any>
): ItemEffectsService {
  return new ItemEffectsService(db);
}
