import type { FastifyPluginAsync } from 'fastify';
import { combats, combatants, games } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type {
  Combat,
  Combatant,
  CreateCombatRequest,
  UpdateCombatRequest,
  CreateCombatantRequest,
  UpdateCombatantRequest,
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Combat API routes
 * All routes require authentication
 * Handles CRUD operations for combats and combatants
 */
const combatsRoute: FastifyPluginAsync = async (fastify) => {
  // ==================== COMBAT ROUTES ====================

  /**
   * GET /api/v1/games/:gameId/combats - List all combats for a game
   * Returns combats for a specific game
   * Optional query parameter: active (boolean) - filter by active status
   */
  fastify.get<{ Params: { gameId: string }; Querystring: { active?: string } }>(
    '/games/:gameId/combats',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const { active } = request.query;

      try {
        // Verify game exists and user has access to it
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user is a participant in the game

        // Build where conditions based on query parameters
        const whereConditions = [eq(combats.gameId, gameId)];

        // Add active filter if provided
        if (active !== undefined) {
          const activeValue = active === 'true';
          whereConditions.push(eq(combats.active, activeValue));
        }

        // Fetch combats for the game with optional active filter
        const gameCombats = await fastify.db
          .select()
          .from(combats)
          .where(and(...whereConditions));

        // Convert to Combat interface
        const formattedCombats: Combat[] = gameCombats.map(combat => ({
          id: combat.id,
          sceneId: combat.sceneId,
          gameId: combat.gameId,
          active: combat.active,
          round: combat.round,
          turn: combat.turn,
          sort: combat.sort,
          data: combat.data as Record<string, unknown>,
          createdAt: combat.createdAt,
          updatedAt: combat.updatedAt,
        }));

        return reply.status(200).send({ combats: formattedCombats });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch combats');
        return reply.status(500).send({ error: 'Failed to fetch combats' });
      }
    }
  );

  /**
   * GET /api/v1/combats/:combatId - Get a single combat with combatants
   * Returns a specific combat and its combatants
   */
  fastify.get<{ Params: { combatId: string } }>(
    '/combats/:combatId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { combatId } = request.params;

      try {
        // Fetch combat
        const [combat] = await fastify.db
          .select()
          .from(combats)
          .where(eq(combats.id, combatId))
          .limit(1);

        if (!combat) {
          return reply.status(404).send({ error: 'Combat not found' });
        }

        // TODO: Check if user has access to this combat's game

        // Fetch combatants for this combat
        const combatCombatants = await fastify.db
          .select()
          .from(combatants)
          .where(eq(combatants.combatId, combatId));

        // Convert to Combat interface
        const formattedCombat: Combat = {
          id: combat.id,
          sceneId: combat.sceneId,
          gameId: combat.gameId,
          active: combat.active,
          round: combat.round,
          turn: combat.turn,
          sort: combat.sort,
          data: combat.data as Record<string, unknown>,
          createdAt: combat.createdAt,
          updatedAt: combat.updatedAt,
        };

        // Convert combatants
        const formattedCombatants: Combatant[] = combatCombatants.map(combatant => ({
          id: combatant.id,
          combatId: combatant.combatId,
          actorId: combatant.actorId,
          tokenId: combatant.tokenId,
          initiative: combatant.initiative,
          initiativeModifier: combatant.initiativeModifier,
          hidden: combatant.hidden,
          defeated: combatant.defeated,
          data: combatant.data as Record<string, unknown>,
          createdAt: combatant.createdAt,
        }));

        return reply.status(200).send({
          combat: formattedCombat,
          combatants: formattedCombatants,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch combat');
        return reply.status(500).send({ error: 'Failed to fetch combat' });
      }
    }
  );

  /**
   * POST /api/v1/games/:gameId/combats - Create a new combat encounter
   * Creates a combat for a specific game
   */
  fastify.post<{ Params: { gameId: string }; Body: CreateCombatRequest }>(
    '/games/:gameId/combats',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const combatData = request.body;

      try {
        // Verify game exists and user has access to it
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user is the game owner or has GM permissions

        // Create combat in database
        const newCombats = await fastify.db
          .insert(combats)
          .values({
            gameId,
            sceneId: combatData.sceneId ?? null,
            active: combatData.active ?? false,
            round: combatData.round ?? 0,
            turn: combatData.turn ?? 0,
            sort: combatData.sort ?? 0,
            data: combatData.data ?? {},
          })
          .returning();

        const newCombat = newCombats[0];

        // Convert to Combat interface
        const formattedCombat: Combat = {
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
        };

        return reply.status(201).send({ combat: formattedCombat });
      } catch (error) {
        fastify.log.error(error, 'Failed to create combat');
        return reply.status(500).send({ error: 'Failed to create combat' });
      }
    }
  );

  /**
   * PATCH /api/v1/combats/:combatId - Update a combat
   * Updates a specific combat (advance turn, update round, etc.)
   */
  fastify.patch<{ Params: { combatId: string }; Body: UpdateCombatRequest }>(
    '/combats/:combatId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { combatId } = request.params;
      const updates = request.body;

      try {
        // Check if combat exists
        const [existingCombat] = await fastify.db
          .select()
          .from(combats)
          .where(eq(combats.id, combatId))
          .limit(1);

        if (!existingCombat) {
          return reply.status(404).send({ error: 'Combat not found' });
        }

        // TODO: Check if user has permission to update this combat (GM only)

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.sceneId !== undefined) {
          updateData.sceneId = updates.sceneId;
        }
        if (updates.active !== undefined) {
          updateData.active = updates.active;
        }
        if (updates.round !== undefined) {
          updateData.round = updates.round;
        }
        if (updates.turn !== undefined) {
          updateData.turn = updates.turn;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update combat in database
        const updatedCombats = await fastify.db
          .update(combats)
          .set(updateData)
          .where(eq(combats.id, combatId))
          .returning();

        const updatedCombat = updatedCombats[0];

        // Convert to Combat interface
        const formattedCombat: Combat = {
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
        };

        return reply.status(200).send({ combat: formattedCombat });
      } catch (error) {
        fastify.log.error(error, 'Failed to update combat');
        return reply.status(500).send({ error: 'Failed to update combat' });
      }
    }
  );

  /**
   * DELETE /api/v1/combats/:combatId - Delete a combat
   * Deletes a specific combat (and all its combatants via cascade)
   */
  fastify.delete<{ Params: { combatId: string } }>(
    '/combats/:combatId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { combatId } = request.params;

      try {
        // Check if combat exists
        const [existingCombat] = await fastify.db
          .select()
          .from(combats)
          .where(eq(combats.id, combatId))
          .limit(1);

        if (!existingCombat) {
          return reply.status(404).send({ error: 'Combat not found' });
        }

        // TODO: Check if user has permission to delete this combat (GM only)

        // Delete combat from database (cascade will delete combatants)
        await fastify.db.delete(combats).where(eq(combats.id, combatId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete combat');
        return reply.status(500).send({ error: 'Failed to delete combat' });
      }
    }
  );

  // ==================== COMBATANT ROUTES ====================

  /**
   * POST /api/v1/combats/:combatId/combatants - Add combatant to combat
   * Creates a combatant in a specific combat
   */
  fastify.post<{ Params: { combatId: string }; Body: CreateCombatantRequest }>(
    '/combats/:combatId/combatants',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { combatId } = request.params;
      const combatantData = request.body;

      try {
        // Verify combat exists
        const [combat] = await fastify.db
          .select()
          .from(combats)
          .where(eq(combats.id, combatId))
          .limit(1);

        if (!combat) {
          return reply.status(404).send({ error: 'Combat not found' });
        }

        // TODO: Check if user has permission to add combatants (GM only)

        // Validate that at least actorId or tokenId is provided
        if (!combatantData.actorId && !combatantData.tokenId) {
          return reply.status(400).send({
            error: 'Either actorId or tokenId must be provided',
          });
        }

        // Create combatant in database
        const newCombatants = await fastify.db
          .insert(combatants)
          .values({
            combatId,
            actorId: combatantData.actorId ?? null,
            tokenId: combatantData.tokenId ?? null,
            initiative: combatantData.initiative ?? null,
            initiativeModifier: combatantData.initiativeModifier ?? 0,
            hidden: combatantData.hidden ?? false,
            defeated: combatantData.defeated ?? false,
            data: combatantData.data ?? {},
          })
          .returning();

        const newCombatant = newCombatants[0];

        // Convert to Combatant interface
        const formattedCombatant: Combatant = {
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
        };

        return reply.status(201).send({ combatant: formattedCombatant });
      } catch (error) {
        fastify.log.error(error, 'Failed to create combatant');
        return reply.status(500).send({ error: 'Failed to create combatant' });
      }
    }
  );

  /**
   * PATCH /api/v1/combatants/:combatantId - Update combatant
   * Updates a specific combatant (initiative, HP, status, etc.)
   */
  fastify.patch<{ Params: { combatantId: string }; Body: UpdateCombatantRequest }>(
    '/combatants/:combatantId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { combatantId } = request.params;
      const updates = request.body;

      try {
        // Check if combatant exists
        const [existingCombatant] = await fastify.db
          .select()
          .from(combatants)
          .where(eq(combatants.id, combatantId))
          .limit(1);

        if (!existingCombatant) {
          return reply.status(404).send({ error: 'Combatant not found' });
        }

        // TODO: Check if user has permission to update this combatant

        // Build update object
        const updateData: any = {};

        if (updates.actorId !== undefined) {
          updateData.actorId = updates.actorId;
        }
        if (updates.tokenId !== undefined) {
          updateData.tokenId = updates.tokenId;
        }
        if (updates.initiative !== undefined) {
          updateData.initiative = updates.initiative;
        }
        if (updates.initiativeModifier !== undefined) {
          updateData.initiativeModifier = updates.initiativeModifier;
        }
        if (updates.hidden !== undefined) {
          updateData.hidden = updates.hidden;
        }
        if (updates.defeated !== undefined) {
          updateData.defeated = updates.defeated;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update combatant in database
        const updatedCombatants = await fastify.db
          .update(combatants)
          .set(updateData)
          .where(eq(combatants.id, combatantId))
          .returning();

        const updatedCombatant = updatedCombatants[0];

        // Convert to Combatant interface
        const formattedCombatant: Combatant = {
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
        };

        return reply.status(200).send({ combatant: formattedCombatant });
      } catch (error) {
        fastify.log.error(error, 'Failed to update combatant');
        return reply.status(500).send({ error: 'Failed to update combatant' });
      }
    }
  );

  /**
   * DELETE /api/v1/combatants/:combatantId - Remove combatant
   * Deletes a specific combatant from combat
   */
  fastify.delete<{ Params: { combatantId: string } }>(
    '/combatants/:combatantId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { combatantId } = request.params;

      try {
        // Check if combatant exists
        const [existingCombatant] = await fastify.db
          .select()
          .from(combatants)
          .where(eq(combatants.id, combatantId))
          .limit(1);

        if (!existingCombatant) {
          return reply.status(404).send({ error: 'Combatant not found' });
        }

        // TODO: Check if user has permission to delete this combatant

        // Delete combatant from database
        await fastify.db.delete(combatants).where(eq(combatants.id, combatantId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete combatant');
        return reply.status(500).send({ error: 'Failed to delete combatant' });
      }
    }
  );
};

export default combatsRoute;
