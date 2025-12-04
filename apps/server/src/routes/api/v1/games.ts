import type { FastifyPluginAsync } from 'fastify';
import { games, users } from '@vtt/database';
import { eq, or, arrayContains, sql } from 'drizzle-orm';
import type { CreateGameRequest, UpdateGameRequest, GameResponse, GamesListResponse, GameSettings, AddGMRequest, RemoveGMRequest, GMsListResponse } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Game CRUD API routes
 * All routes require authentication
 * Handles game creation, listing, updating, and deletion
 */
const gamesRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/games - List all games for current user
   * Returns games where user is the owner
   */
  fastify.get(
    '/games',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Get games owned by user
        const userGames = await fastify.db
          .select({
            id: games.id,
            name: games.name,
            ownerId: games.ownerId,
            gmUserIds: games.gmUserIds,
            settings: games.settings,
            createdAt: games.createdAt,
            updatedAt: games.updatedAt,
          })
          .from(games)
          .where(eq(games.ownerId, request.user.id));

        // Convert database records to Game objects
        const formattedGames = userGames.map(game => ({
          id: game.id,
          name: game.name,
          ownerId: game.ownerId,
          gmUserIds: game.gmUserIds || [],
          settings: game.settings as GameSettings,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        }));

        return reply.status(200).send({ games: formattedGames });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch games');
        return reply.status(500).send({ error: 'Failed to fetch games' });
      }
    }
  );

  /**
   * GET /api/v1/games/:id - Get a single game by ID
   * Only accessible if user is the owner
   */
  fastify.get<{ Params: { id: string } }>(
    '/games/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;

      try {
        const [game] = await fastify.db
          .select({
            id: games.id,
            name: games.name,
            ownerId: games.ownerId,
            gmUserIds: games.gmUserIds,
            settings: games.settings,
            createdAt: games.createdAt,
            updatedAt: games.updatedAt,
          })
          .from(games)
          .where(eq(games.id, id))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // Check if user is the owner
        if (game.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        const formattedGame = {
          id: game.id,
          name: game.name,
          ownerId: game.ownerId,
          gmUserIds: game.gmUserIds || [],
          settings: game.settings as GameSettings,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt,
        };

        return reply.status(200).send({ game: formattedGame });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch game');
        return reply.status(500).send({ error: 'Failed to fetch game' });
      }
    }
  );

  /**
   * POST /api/v1/games - Create a new game
   * Creates a game with the current user as owner
   */
  fastify.post<{ Body: CreateGameRequest }>(
    '/games',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { name, settings } = request.body;

      // Validate input
      if (!name || name.trim() === '') {
        return reply.status(400).send({ error: 'Game name is required' });
      }

      try {
        // Default settings
        const defaultSettings: GameSettings = {
          gridType: 'square',
          gridSize: 50,
          snapToGrid: true,
        };

        // Merge with provided settings
        const gameSettings = { ...defaultSettings, ...settings };

        // Create game
        const [newGame] = await fastify.db
          .insert(games)
          .values({
            name: name.trim(),
            ownerId: request.user.id,
            gmUserIds: [],
            settings: gameSettings,
          })
          .returning({
            id: games.id,
            name: games.name,
            ownerId: games.ownerId,
            gmUserIds: games.gmUserIds,
            settings: games.settings,
            createdAt: games.createdAt,
            updatedAt: games.updatedAt,
          });

        const formattedGame = {
          id: newGame.id,
          name: newGame.name,
          ownerId: newGame.ownerId,
          gmUserIds: newGame.gmUserIds || [],
          settings: newGame.settings as GameSettings,
          createdAt: newGame.createdAt,
          updatedAt: newGame.updatedAt,
        };

        return reply.status(201).send({ game: formattedGame });
      } catch (error) {
        fastify.log.error(error, 'Failed to create game');
        return reply.status(500).send({ error: 'Failed to create game' });
      }
    }
  );

  /**
   * PATCH /api/v1/games/:id - Update a game
   * Only owner can update
   */
  fastify.patch<{ Params: { id: string }; Body: UpdateGameRequest }>(
    '/games/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;
      const { name, settings } = request.body;

      // Validate at least one field is provided
      if (!name && !settings) {
        return reply.status(400).send({ error: 'At least one field (name or settings) is required' });
      }

      try {
        // Check if game exists and user is owner
        const [existingGame] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, id))
          .limit(1);

        if (!existingGame) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        if (existingGame.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can update this game' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (name !== undefined) {
          if (name.trim() === '') {
            return reply.status(400).send({ error: 'Game name cannot be empty' });
          }
          updateData.name = name.trim();
        }

        if (settings !== undefined) {
          // Merge with existing settings
          const currentSettings = existingGame.settings as GameSettings;
          updateData.settings = { ...currentSettings, ...settings };
        }

        // Update game
        const [updatedGame] = await fastify.db
          .update(games)
          .set(updateData)
          .where(eq(games.id, id))
          .returning({
            id: games.id,
            name: games.name,
            ownerId: games.ownerId,
            gmUserIds: games.gmUserIds,
            settings: games.settings,
            createdAt: games.createdAt,
            updatedAt: games.updatedAt,
          });

        const formattedGame = {
          id: updatedGame.id,
          name: updatedGame.name,
          ownerId: updatedGame.ownerId,
          gmUserIds: updatedGame.gmUserIds || [],
          settings: updatedGame.settings as GameSettings,
          createdAt: updatedGame.createdAt,
          updatedAt: updatedGame.updatedAt,
        };

        return reply.status(200).send({ game: formattedGame });
      } catch (error) {
        fastify.log.error(error, 'Failed to update game');
        return reply.status(500).send({ error: 'Failed to update game' });
      }
    }
  );

  /**
   * DELETE /api/v1/games/:id - Delete a game
   * Only owner can delete
   */
  fastify.delete<{ Params: { id: string } }>(
    '/games/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;

      try {
        // Check if game exists and user is owner
        const [existingGame] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, id))
          .limit(1);

        if (!existingGame) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        if (existingGame.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can delete this game' });
        }

        // Delete game
        await fastify.db
          .delete(games)
          .where(eq(games.id, id));

        return reply.status(200).send({ success: true });
      } catch (error) {
        fastify.log.error(error, 'Failed to delete game');
        return reply.status(500).send({ error: 'Failed to delete game' });
      }
    }
  );

  /**
   * POST /api/v1/games/:id/gms - Add a user as GM for a game
   * Only the game owner can add GMs
   */
  fastify.post<{ Params: { id: string }; Body: AddGMRequest }>(
    '/games/:id/gms',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;
      const { userId } = request.body;

      if (!userId) {
        return reply.status(400).send({ error: 'userId is required' });
      }

      try {
        // Check if game exists and user is owner
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, id))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        if (game.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can add GMs' });
        }

        // Verify the user exists
        const [targetUser] = await fastify.db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!targetUser) {
          return reply.status(404).send({ error: 'User not found' });
        }

        // Don't add owner to GM list (they're always GM)
        if (userId === game.ownerId) {
          return reply.status(400).send({ error: 'Owner is already a GM' });
        }

        // Check if user is already a GM
        const currentGmUserIds = game.gmUserIds || [];
        if (currentGmUserIds.includes(userId)) {
          return reply.status(400).send({ error: 'User is already a GM' });
        }

        // Add user to GM list
        const updatedGmUserIds = [...currentGmUserIds, userId];
        await fastify.db
          .update(games)
          .set({ gmUserIds: updatedGmUserIds, updatedAt: new Date() })
          .where(eq(games.id, id));

        return reply.status(200).send({ gmUserIds: updatedGmUserIds });
      } catch (error) {
        fastify.log.error(error, 'Failed to add GM');
        return reply.status(500).send({ error: 'Failed to add GM' });
      }
    }
  );

  /**
   * DELETE /api/v1/games/:id/gms/:userId - Remove a user's GM role
   * Only the game owner can remove GMs
   */
  fastify.delete<{ Params: { id: string; userId: string } }>(
    '/games/:id/gms/:userId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id, userId } = request.params;

      try {
        // Check if game exists and user is owner
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, id))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        if (game.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can remove GMs' });
        }

        // Can't remove owner (they're always GM)
        if (userId === game.ownerId) {
          return reply.status(400).send({ error: 'Cannot remove owner from GM role' });
        }

        // Remove user from GM list
        const currentGmUserIds = game.gmUserIds || [];
        const updatedGmUserIds = currentGmUserIds.filter(id => id !== userId);

        await fastify.db
          .update(games)
          .set({ gmUserIds: updatedGmUserIds, updatedAt: new Date() })
          .where(eq(games.id, id));

        return reply.status(200).send({ gmUserIds: updatedGmUserIds });
      } catch (error) {
        fastify.log.error(error, 'Failed to remove GM');
        return reply.status(500).send({ error: 'Failed to remove GM' });
      }
    }
  );

  /**
   * GET /api/v1/games/:id/gms - List all GMs for a game
   * Only accessible to game owner and GMs
   */
  fastify.get<{ Params: { id: string } }>(
    '/games/:id/gms',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;

      try {
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, id))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // Check if user is owner or GM
        const gmUserIds = game.gmUserIds || [];
        const isOwner = game.ownerId === request.user.id;
        const isGM = gmUserIds.includes(request.user.id);

        if (!isOwner && !isGM) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        return reply.status(200).send({ gmUserIds });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch GMs');
        return reply.status(500).send({ error: 'Failed to fetch GMs' });
      }
    }
  );
};

export default gamesRoute;
