import type { FastifyPluginAsync } from 'fastify';
import { tokens, scenes, games } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type { Token } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Token API routes
 * All routes require authentication
 * Handles fetching tokens for scenes
 */
const tokensRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/tokens - List all tokens for a scene
   * Returns tokens for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/tokens',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

      try {
        // Verify scene exists and get its game
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user is a participant in the game (for now, any authenticated user can access)
        // This could be enhanced with a game_participants table

        // Fetch all tokens for the scene
        const sceneTokens = await fastify.db
          .select()
          .from(tokens)
          .where(eq(tokens.sceneId, sceneId));

        // Convert to Token interface
        const formattedTokens: Token[] = sceneTokens.map(token => ({
          id: token.id,
          sceneId: token.sceneId,
          actorId: token.actorId,
          name: token.name,
          imageUrl: token.imageUrl,
          x: token.x,
          y: token.y,
          width: token.width,
          height: token.height,
          elevation: token.elevation,
          rotation: token.rotation,
          locked: token.locked,
          ownerId: token.ownerId,
          visible: token.visible,
          vision: token.vision,
          visionRange: token.visionRange,
          bars: token.bars as Record<string, unknown>,
          lightBright: token.lightBright,
          lightDim: token.lightDim,
          lightColor: token.lightColor,
          lightAngle: token.lightAngle,
          data: token.data as Record<string, unknown>,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
        }));

        return reply.status(200).send({ tokens: formattedTokens });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch tokens');
        return reply.status(500).send({ error: 'Failed to fetch tokens' });
      }
    }
  );

  /**
   * GET /api/v1/scenes/:sceneId/tokens/:tokenId - Get a single token
   * Returns a specific token
   */
  fastify.get<{ Params: { sceneId: string; tokenId: string } }>(
    '/scenes/:sceneId/tokens/:tokenId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId, tokenId } = request.params;

      try {
        // Fetch token
        const [token] = await fastify.db
          .select()
          .from(tokens)
          .where(and(eq(tokens.id, tokenId), eq(tokens.sceneId, sceneId)))
          .limit(1);

        if (!token) {
          return reply.status(404).send({ error: 'Token not found' });
        }

        // Convert to Token interface
        const formattedToken: Token = {
          id: token.id,
          sceneId: token.sceneId,
          actorId: token.actorId,
          name: token.name,
          imageUrl: token.imageUrl,
          x: token.x,
          y: token.y,
          width: token.width,
          height: token.height,
          elevation: token.elevation,
          rotation: token.rotation,
          locked: token.locked,
          ownerId: token.ownerId,
          visible: token.visible,
          vision: token.vision,
          visionRange: token.visionRange,
          bars: token.bars as Record<string, unknown>,
          lightBright: token.lightBright,
          lightDim: token.lightDim,
          lightColor: token.lightColor,
          lightAngle: token.lightAngle,
          data: token.data as Record<string, unknown>,
          createdAt: token.createdAt,
          updatedAt: token.updatedAt,
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
