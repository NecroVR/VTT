import type { FastifyPluginAsync } from 'fastify';
import { actors, games } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { Actor, CreateActorRequest, UpdateActorRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Actor API routes
 * All routes require authentication
 * Handles CRUD operations for actors
 */
const actorsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/games/:gameId/actors - List all actors for a game
   * Returns actors for a specific game
   */
  fastify.get<{ Params: { gameId: string } }>(
    '/games/:gameId/actors',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;

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

        // TODO: Check if user is a participant in the game (for now, any authenticated user can access)
        // This could be enhanced with a game_participants table

        // Fetch all actors for the game
        const gameActors = await fastify.db
          .select()
          .from(actors)
          .where(eq(actors.gameId, gameId));

        // Convert to Actor interface
        const formattedActors: Actor[] = gameActors.map(actor => ({
          id: actor.id,
          gameId: actor.gameId,
          name: actor.name,
          actorType: actor.actorType,
          img: actor.img,
          ownerId: actor.ownerId,
          attributes: actor.attributes as Record<string, unknown>,
          abilities: actor.abilities as Record<string, unknown>,
          folderId: actor.folderId,
          sort: actor.sort,
          tokenSize: actor.tokenSize,
          data: actor.data as Record<string, unknown>,
          createdAt: actor.createdAt,
          updatedAt: actor.updatedAt,
        }));

        return reply.status(200).send({ actors: formattedActors });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch actors');
        return reply.status(500).send({ error: 'Failed to fetch actors' });
      }
    }
  );

  /**
   * GET /api/v1/actors/:actorId - Get a single actor
   * Returns a specific actor
   */
  fastify.get<{ Params: { actorId: string } }>(
    '/actors/:actorId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { actorId } = request.params;

      try {
        // Fetch actor
        const [actor] = await fastify.db
          .select()
          .from(actors)
          .where(eq(actors.id, actorId))
          .limit(1);

        if (!actor) {
          return reply.status(404).send({ error: 'Actor not found' });
        }

        // TODO: Check if user has access to this actor's game

        // Convert to Actor interface
        const formattedActor: Actor = {
          id: actor.id,
          gameId: actor.gameId,
          name: actor.name,
          actorType: actor.actorType,
          img: actor.img,
          ownerId: actor.ownerId,
          attributes: actor.attributes as Record<string, unknown>,
          abilities: actor.abilities as Record<string, unknown>,
          folderId: actor.folderId,
          sort: actor.sort,
          tokenSize: actor.tokenSize,
          data: actor.data as Record<string, unknown>,
          createdAt: actor.createdAt,
          updatedAt: actor.updatedAt,
        };

        return reply.status(200).send({ actor: formattedActor });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch actor');
        return reply.status(500).send({ error: 'Failed to fetch actor' });
      }
    }
  );

  /**
   * POST /api/v1/games/:gameId/actors - Create a new actor
   * Creates an actor for a specific game
   */
  fastify.post<{ Params: { gameId: string }; Body: CreateActorRequest }>(
    '/games/:gameId/actors',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const actorData = request.body;

      // Validate required fields
      if (!actorData.name || actorData.name.trim() === '') {
        return reply.status(400).send({ error: 'Actor name is required' });
      }

      if (!actorData.actorType || actorData.actorType.trim() === '') {
        return reply.status(400).send({ error: 'Actor type is required' });
      }

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

        // TODO: Check if user is the game owner or has permission to create actors

        // Create actor in database
        const newActors = await fastify.db
          .insert(actors)
          .values({
            gameId,
            name: actorData.name.trim(),
            actorType: actorData.actorType.trim(),
            img: actorData.img ?? null,
            ownerId: actorData.ownerId ?? null,
            attributes: actorData.attributes ?? {},
            abilities: actorData.abilities ?? {},
            folderId: actorData.folderId ?? null,
            sort: actorData.sort ?? 0,
            tokenSize: actorData.tokenSize ?? 1,
            data: actorData.data ?? {},
          })
          .returning();

        const newActor = newActors[0];

        // Convert to Actor interface
        const formattedActor: Actor = {
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
          tokenSize: newActor.tokenSize,
          data: newActor.data as Record<string, unknown>,
          createdAt: newActor.createdAt,
          updatedAt: newActor.updatedAt,
        };

        return reply.status(201).send({ actor: formattedActor });
      } catch (error) {
        fastify.log.error(error, 'Failed to create actor');
        return reply.status(500).send({ error: 'Failed to create actor' });
      }
    }
  );

  /**
   * PATCH /api/v1/actors/:actorId - Update an actor
   * Updates a specific actor
   */
  fastify.patch<{ Params: { actorId: string }; Body: UpdateActorRequest }>(
    '/actors/:actorId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { actorId } = request.params;
      const updates = request.body;

      try {
        // Check if actor exists
        const [existingActor] = await fastify.db
          .select()
          .from(actors)
          .where(eq(actors.id, actorId))
          .limit(1);

        if (!existingActor) {
          return reply.status(404).send({ error: 'Actor not found' });
        }

        // TODO: Check if user has permission to update this actor

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Actor name cannot be empty' });
        }

        // Validate actorType if provided
        if (updates.actorType !== undefined && updates.actorType.trim() === '') {
          return reply.status(400).send({ error: 'Actor type cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.actorType !== undefined) {
          updateData.actorType = updates.actorType.trim();
        }
        if (updates.img !== undefined) {
          updateData.img = updates.img;
        }
        if (updates.ownerId !== undefined) {
          updateData.ownerId = updates.ownerId;
        }
        if (updates.attributes !== undefined) {
          updateData.attributes = updates.attributes;
        }
        if (updates.abilities !== undefined) {
          updateData.abilities = updates.abilities;
        }
        if (updates.folderId !== undefined) {
          updateData.folderId = updates.folderId;
        }
        if (updates.sort !== undefined) {
          updateData.sort = updates.sort;
        }
        if (updates.tokenSize !== undefined) {
          updateData.tokenSize = updates.tokenSize;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update actor in database
        const updatedActors = await fastify.db
          .update(actors)
          .set(updateData)
          .where(eq(actors.id, actorId))
          .returning();

        const updatedActor = updatedActors[0];

        // Convert to Actor interface
        const formattedActor: Actor = {
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
          tokenSize: updatedActor.tokenSize,
          data: updatedActor.data as Record<string, unknown>,
          createdAt: updatedActor.createdAt,
          updatedAt: updatedActor.updatedAt,
        };

        return reply.status(200).send({ actor: formattedActor });
      } catch (error) {
        fastify.log.error(error, 'Failed to update actor');
        return reply.status(500).send({ error: 'Failed to update actor' });
      }
    }
  );

  /**
   * DELETE /api/v1/actors/:actorId - Delete an actor
   * Deletes a specific actor
   */
  fastify.delete<{ Params: { actorId: string } }>(
    '/actors/:actorId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { actorId } = request.params;

      try {
        // Check if actor exists
        const [existingActor] = await fastify.db
          .select()
          .from(actors)
          .where(eq(actors.id, actorId))
          .limit(1);

        if (!existingActor) {
          return reply.status(404).send({ error: 'Actor not found' });
        }

        // TODO: Check if user has permission to delete this actor

        // Delete actor from database
        await fastify.db
          .delete(actors)
          .where(eq(actors.id, actorId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete actor');
        return reply.status(500).send({ error: 'Failed to delete actor' });
      }
    }
  );
};

export default actorsRoute;
