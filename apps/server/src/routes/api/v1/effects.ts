import type { FastifyPluginAsync } from 'fastify';
import { activeEffects, actors, tokens, campaigns } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { ActiveEffect, CreateActiveEffectRequest, UpdateActiveEffectRequest, EffectChange } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Active Effects API routes
 * All routes require authentication
 * Handles CRUD operations for active effects
 */
const effectsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/actors/:actorId/effects - List all effects for an actor
   * Returns effects for a specific actor
   */
  fastify.get<{ Params: { actorId: string } }>(
    '/actors/:actorId/effects',
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

        // TODO: Check if user has access to this actor's game

        // Fetch all effects for the actor
        const actorEffects = await fastify.db
          .select()
          .from(activeEffects)
          .where(eq(activeEffects.actorId, actorId));

        // Convert to ActiveEffect interface
        const formattedEffects: ActiveEffect[] = actorEffects.map(effect => ({
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

        return reply.status(200).send({ effects: formattedEffects });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch actor effects');
        return reply.status(500).send({ error: 'Failed to fetch actor effects' });
      }
    }
  );

  /**
   * GET /api/v1/tokens/:tokenId/effects - List all effects for a token
   * Returns effects for a specific token
   */
  fastify.get<{ Params: { tokenId: string } }>(
    '/tokens/:tokenId/effects',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { tokenId } = request.params;

      try {
        // Verify token exists
        const [token] = await fastify.db
          .select()
          .from(tokens)
          .where(eq(tokens.id, tokenId))
          .limit(1);

        if (!token) {
          return reply.status(404).send({ error: 'Token not found' });
        }

        // TODO: Check if user has access to this token's game

        // Fetch all effects for the token
        const tokenEffects = await fastify.db
          .select()
          .from(activeEffects)
          .where(eq(activeEffects.tokenId, tokenId));

        // Convert to ActiveEffect interface
        const formattedEffects: ActiveEffect[] = tokenEffects.map(effect => ({
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

        return reply.status(200).send({ effects: formattedEffects });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch token effects');
        return reply.status(500).send({ error: 'Failed to fetch token effects' });
      }
    }
  );

  /**
   * GET /api/v1/games/:campaignId/effects - List all effects in a campaign
   * Returns all effects for a specific game
   */
  fastify.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/effects',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;

      try {
        // Verify campaign exists and user has access to it
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user is a participant in the campaign

        // Fetch all effects for the campaign
        const gameEffects = await fastify.db
          .select()
          .from(activeEffects)
          .where(eq(activeEffects.campaignId, campaignId));

        // Convert to ActiveEffect interface
        const formattedEffects: ActiveEffect[] = gameEffects.map(effect => ({
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

        return reply.status(200).send({ effects: formattedEffects });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch game effects');
        return reply.status(500).send({ error: 'Failed to fetch game effects' });
      }
    }
  );

  /**
   * GET /api/v1/effects/:effectId - Get a single effect
   * Returns a specific active effect
   */
  fastify.get<{ Params: { effectId: string } }>(
    '/effects/:effectId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { effectId } = request.params;

      try {
        // Fetch effect
        const [effect] = await fastify.db
          .select()
          .from(activeEffects)
          .where(eq(activeEffects.id, effectId))
          .limit(1);

        if (!effect) {
          return reply.status(404).send({ error: 'Effect not found' });
        }

        // TODO: Check if user has access to this effect's game

        // Convert to ActiveEffect interface
        const formattedEffect: ActiveEffect = {
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
        };

        return reply.status(200).send({ effect: formattedEffect });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch effect');
        return reply.status(500).send({ error: 'Failed to fetch effect' });
      }
    }
  );

  /**
   * POST /api/v1/actors/:actorId/effects - Create a new effect on an actor
   * Creates an active effect for a specific actor
   */
  fastify.post<{ Params: { actorId: string }; Body: CreateActiveEffectRequest }>(
    '/actors/:actorId/effects',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { actorId } = request.params;
      const effectData = request.body;

      // Validate required fields
      if (!effectData.name || effectData.name.trim() === '') {
        return reply.status(400).send({ error: 'Effect name is required' });
      }

      if (!effectData.campaignId || effectData.campaignId.trim() === '') {
        return reply.status(400).send({ error: 'Game ID is required' });
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
          .where(eq(campaigns.id, effectData.campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user has permission to create effects for this actor

        // Create effect in database
        const newEffects = await fastify.db
          .insert(activeEffects)
          .values({
            campaignId: effectData.campaignId,
            actorId: actorId,
            tokenId: effectData.tokenId ?? null,
            name: effectData.name.trim(),
            icon: effectData.icon ?? null,
            description: effectData.description ?? null,
            effectType: effectData.effectType ?? 'buff',
            durationType: effectData.durationType ?? 'permanent',
            duration: effectData.duration ?? null,
            startRound: effectData.startRound ?? null,
            startTurn: effectData.startTurn ?? null,
            remaining: effectData.remaining ?? null,
            sourceActorId: effectData.sourceActorId ?? null,
            sourceItemId: effectData.sourceItemId ?? null,
            enabled: effectData.enabled ?? true,
            hidden: effectData.hidden ?? false,
            changes: effectData.changes ?? [],
            priority: effectData.priority ?? 0,
            transfer: effectData.transfer ?? false,
            data: effectData.data ?? {},
            sort: effectData.sort ?? 0,
          })
          .returning();

        const newEffect = newEffects[0];

        // Convert to ActiveEffect interface
        const formattedEffect: ActiveEffect = {
          id: newEffect.id,
          campaignId: newEffect.campaignId,
          actorId: newEffect.actorId,
          tokenId: newEffect.tokenId,
          name: newEffect.name,
          icon: newEffect.icon,
          description: newEffect.description,
          effectType: newEffect.effectType as ActiveEffect['effectType'],
          durationType: newEffect.durationType as ActiveEffect['durationType'],
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
        };

        return reply.status(201).send({ effect: formattedEffect });
      } catch (error) {
        fastify.log.error(error, 'Failed to create effect');
        return reply.status(500).send({ error: 'Failed to create effect' });
      }
    }
  );

  /**
   * POST /api/v1/tokens/:tokenId/effects - Create a new effect on a token
   * Creates an active effect for a specific token
   */
  fastify.post<{ Params: { tokenId: string }; Body: CreateActiveEffectRequest }>(
    '/tokens/:tokenId/effects',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { tokenId } = request.params;
      const effectData = request.body;

      // Validate required fields
      if (!effectData.name || effectData.name.trim() === '') {
        return reply.status(400).send({ error: 'Effect name is required' });
      }

      if (!effectData.campaignId || effectData.campaignId.trim() === '') {
        return reply.status(400).send({ error: 'Game ID is required' });
      }

      try {
        // Verify token exists
        const [token] = await fastify.db
          .select()
          .from(tokens)
          .where(eq(tokens.id, tokenId))
          .limit(1);

        if (!token) {
          return reply.status(404).send({ error: 'Token not found' });
        }

        // Verify campaign exists
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, effectData.campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user has permission to create effects for this token

        // Create effect in database
        const newEffects = await fastify.db
          .insert(activeEffects)
          .values({
            campaignId: effectData.campaignId,
            actorId: effectData.actorId ?? null,
            tokenId: tokenId,
            name: effectData.name.trim(),
            icon: effectData.icon ?? null,
            description: effectData.description ?? null,
            effectType: effectData.effectType ?? 'buff',
            durationType: effectData.durationType ?? 'permanent',
            duration: effectData.duration ?? null,
            startRound: effectData.startRound ?? null,
            startTurn: effectData.startTurn ?? null,
            remaining: effectData.remaining ?? null,
            sourceActorId: effectData.sourceActorId ?? null,
            sourceItemId: effectData.sourceItemId ?? null,
            enabled: effectData.enabled ?? true,
            hidden: effectData.hidden ?? false,
            changes: effectData.changes ?? [],
            priority: effectData.priority ?? 0,
            transfer: effectData.transfer ?? false,
            data: effectData.data ?? {},
            sort: effectData.sort ?? 0,
          })
          .returning();

        const newEffect = newEffects[0];

        // Convert to ActiveEffect interface
        const formattedEffect: ActiveEffect = {
          id: newEffect.id,
          campaignId: newEffect.campaignId,
          actorId: newEffect.actorId,
          tokenId: newEffect.tokenId,
          name: newEffect.name,
          icon: newEffect.icon,
          description: newEffect.description,
          effectType: newEffect.effectType as ActiveEffect['effectType'],
          durationType: newEffect.durationType as ActiveEffect['durationType'],
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
        };

        return reply.status(201).send({ effect: formattedEffect });
      } catch (error) {
        fastify.log.error(error, 'Failed to create effect');
        return reply.status(500).send({ error: 'Failed to create effect' });
      }
    }
  );

  /**
   * PATCH /api/v1/effects/:effectId - Update an effect
   * Updates a specific active effect
   */
  fastify.patch<{ Params: { effectId: string }; Body: UpdateActiveEffectRequest }>(
    '/effects/:effectId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { effectId } = request.params;
      const updates = request.body;

      try {
        // Check if effect exists
        const [existingEffect] = await fastify.db
          .select()
          .from(activeEffects)
          .where(eq(activeEffects.id, effectId))
          .limit(1);

        if (!existingEffect) {
          return reply.status(404).send({ error: 'Effect not found' });
        }

        // TODO: Check if user has permission to update this effect

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Effect name cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.icon !== undefined) {
          updateData.icon = updates.icon;
        }
        if (updates.description !== undefined) {
          updateData.description = updates.description;
        }
        if (updates.effectType !== undefined) {
          updateData.effectType = updates.effectType;
        }
        if (updates.durationType !== undefined) {
          updateData.durationType = updates.durationType;
        }
        if (updates.duration !== undefined) {
          updateData.duration = updates.duration;
        }
        if (updates.startRound !== undefined) {
          updateData.startRound = updates.startRound;
        }
        if (updates.startTurn !== undefined) {
          updateData.startTurn = updates.startTurn;
        }
        if (updates.remaining !== undefined) {
          updateData.remaining = updates.remaining;
        }
        if (updates.sourceActorId !== undefined) {
          updateData.sourceActorId = updates.sourceActorId;
        }
        if (updates.sourceItemId !== undefined) {
          updateData.sourceItemId = updates.sourceItemId;
        }
        if (updates.enabled !== undefined) {
          updateData.enabled = updates.enabled;
        }
        if (updates.hidden !== undefined) {
          updateData.hidden = updates.hidden;
        }
        if (updates.changes !== undefined) {
          updateData.changes = updates.changes;
        }
        if (updates.priority !== undefined) {
          updateData.priority = updates.priority;
        }
        if (updates.transfer !== undefined) {
          updateData.transfer = updates.transfer;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }

        // Update effect in database
        const updatedEffects = await fastify.db
          .update(activeEffects)
          .set(updateData)
          .where(eq(activeEffects.id, effectId))
          .returning();

        const updatedEffect = updatedEffects[0];

        // Convert to ActiveEffect interface
        const formattedEffect: ActiveEffect = {
          id: updatedEffect.id,
          campaignId: updatedEffect.campaignId,
          actorId: updatedEffect.actorId,
          tokenId: updatedEffect.tokenId,
          name: updatedEffect.name,
          icon: updatedEffect.icon,
          description: updatedEffect.description,
          effectType: updatedEffect.effectType as ActiveEffect['effectType'],
          durationType: updatedEffect.durationType as ActiveEffect['durationType'],
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
        };

        return reply.status(200).send({ effect: formattedEffect });
      } catch (error) {
        fastify.log.error(error, 'Failed to update effect');
        return reply.status(500).send({ error: 'Failed to update effect' });
      }
    }
  );

  /**
   * PATCH /api/v1/effects/:effectId/toggle - Toggle effect enabled state
   * Toggles the enabled state of a specific active effect
   */
  fastify.patch<{ Params: { effectId: string } }>(
    '/effects/:effectId/toggle',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { effectId } = request.params;

      try {
        // Check if effect exists
        const [existingEffect] = await fastify.db
          .select()
          .from(activeEffects)
          .where(eq(activeEffects.id, effectId))
          .limit(1);

        if (!existingEffect) {
          return reply.status(404).send({ error: 'Effect not found' });
        }

        // TODO: Check if user has permission to toggle this effect

        // Toggle the enabled state
        const updatedEffects = await fastify.db
          .update(activeEffects)
          .set({
            enabled: !existingEffect.enabled,
            updatedAt: new Date(),
          })
          .where(eq(activeEffects.id, effectId))
          .returning();

        const updatedEffect = updatedEffects[0];

        // Convert to ActiveEffect interface
        const formattedEffect: ActiveEffect = {
          id: updatedEffect.id,
          campaignId: updatedEffect.campaignId,
          actorId: updatedEffect.actorId,
          tokenId: updatedEffect.tokenId,
          name: updatedEffect.name,
          icon: updatedEffect.icon,
          description: updatedEffect.description,
          effectType: updatedEffect.effectType as ActiveEffect['effectType'],
          durationType: updatedEffect.durationType as ActiveEffect['durationType'],
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
        };

        return reply.status(200).send({ effect: formattedEffect });
      } catch (error) {
        fastify.log.error(error, 'Failed to toggle effect');
        return reply.status(500).send({ error: 'Failed to toggle effect' });
      }
    }
  );

  /**
   * DELETE /api/v1/effects/:effectId - Delete an effect
   * Deletes a specific active effect
   */
  fastify.delete<{ Params: { effectId: string } }>(
    '/effects/:effectId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { effectId } = request.params;

      try {
        // Check if effect exists
        const [existingEffect] = await fastify.db
          .select()
          .from(activeEffects)
          .where(eq(activeEffects.id, effectId))
          .limit(1);

        if (!existingEffect) {
          return reply.status(404).send({ error: 'Effect not found' });
        }

        // TODO: Check if user has permission to delete this effect

        // Delete effect from database
        await fastify.db
          .delete(activeEffects)
          .where(eq(activeEffects.id, effectId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete effect');
        return reply.status(500).send({ error: 'Failed to delete effect' });
      }
    }
  );
};

export default effectsRoute;
