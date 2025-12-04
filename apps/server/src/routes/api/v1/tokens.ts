import type { FastifyPluginAsync } from 'fastify';
import { tokens, games } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type { Token } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Token API routes
 * All routes require authentication
 * Handles fetching tokens for a game
 */
const tokensRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/games/:gameId/tokens - List all tokens for a game
   * Returns tokens for a specific game
   */
  fastify.get<{ Params: { gameId: string } }>(
    '/games/:gameId/tokens',
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

        // Fetch all tokens for the game
        const gameTokens = await fastify.db
          .select()
          .from(tokens)
          .where(eq(tokens.gameId, gameId));

        // Convert to Token interface
        const formattedTokens: Token[] = gameTokens.map(token => ({
          id: token.id,
          gameId: token.gameId,
          name: token.name,
          imageUrl: token.imageUrl,
          x: token.x,
          y: token.y,
          width: token.width,
          height: token.height,
          ownerId: token.ownerId,
          visible: token.visible,
          data: token.data as Record<string, unknown>,
          createdAt: token.createdAt.toISOString(),
        }));

        return reply.status(200).send({ tokens: formattedTokens });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch tokens');
        return reply.status(500).send({ error: 'Failed to fetch tokens' });
      }
    }
  );

  /**
   * GET /api/v1/games/:gameId/tokens/:tokenId - Get a single token
   * Returns a specific token
   */
  fastify.get<{ Params: { gameId: string; tokenId: string } }>(
    '/games/:gameId/tokens/:tokenId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId, tokenId } = request.params;

      try {
        // Fetch token
        const [token] = await fastify.db
          .select()
          .from(tokens)
          .where(and(eq(tokens.id, tokenId), eq(tokens.gameId, gameId)))
          .limit(1);

        if (!token) {
          return reply.status(404).send({ error: 'Token not found' });
        }

        // Convert to Token interface
        const formattedToken: Token = {
          id: token.id,
          gameId: token.gameId,
          name: token.name,
          imageUrl: token.imageUrl,
          x: token.x,
          y: token.y,
          width: token.width,
          height: token.height,
          ownerId: token.ownerId,
          visible: token.visible,
          data: token.data as Record<string, unknown>,
          createdAt: token.createdAt.toISOString(),
        };

        return reply.status(200).send({ token: formattedToken });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch token');
        return reply.status(500).send({ error: 'Failed to fetch token' });
      }
    }
  );
};

export default tokensRoute;
