import type { FastifyPluginAsync } from 'fastify';
import { tokens, scenes, actors, campaigns } from '@vtt/database';
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

        // TODO: Check if user is a participant in the campaign (for now, any authenticated user can access)
        // This could be enhanced with a campaign_participants table

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
          followPathName: token.followPathName ?? null,
          pathSpeed: token.pathSpeed ?? null,
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
          followPathName: token.followPathName ?? null,
          pathSpeed: token.pathSpeed ?? null,
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

  /**
   * POST /api/v1/scenes/:sceneId/tokens - Create a new token
   * Creates a token for a specific scene
   */
  fastify.post<{
    Params: { sceneId: string };
    Body: {
      name: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      imageUrl?: string | null;
      visible?: boolean;
      actorId?: string | null;
      elevation?: number;
      rotation?: number;
      locked?: boolean;
      vision?: boolean;
      visionRange?: number;
      bars?: Record<string, unknown>;
      lightBright?: number;
      lightDim?: number;
      lightColor?: string | null;
      lightAngle?: number;
      followPathName?: string | null;
      pathSpeed?: number | null;
      data?: Record<string, unknown>;
    };
  }>(
    '/scenes/:sceneId/tokens',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const tokenData = request.body;

      // Validate required fields
      if (!tokenData.name || tokenData.name.trim() === '') {
        return reply.status(400).send({ error: 'Token name is required' });
      }

      if (tokenData.x === undefined || tokenData.y === undefined) {
        return reply.status(400).send({ error: 'Token position (x, y) is required' });
      }

      try {
        // Verify scene exists
        const [scene] = await fastify.db
          .select()
          .from(scenes)
          .where(eq(scenes.id, sceneId))
          .limit(1);

        if (!scene) {
          return reply.status(404).send({ error: 'Scene not found' });
        }

        // TODO: Check if user has access to this scene's campaign

        // Fetch actor's tokenSize if actorId is provided
        let tokenSize = 1;
        if (tokenData.actorId) {
          const [actor] = await fastify.db
            .select()
            .from(actors)
            .where(eq(actors.id, tokenData.actorId))
            .limit(1);

          if (actor && actor.tokenSize) {
            tokenSize = actor.tokenSize;
          }
        }

        // Create token in database
        const newTokens = await fastify.db
          .insert(tokens)
          .values({
            sceneId,
            actorId: tokenData.actorId ?? null,
            name: tokenData.name.trim(),
            x: tokenData.x,
            y: tokenData.y,
            width: tokenData.width ?? tokenSize,
            height: tokenData.height ?? tokenSize,
            elevation: tokenData.elevation ?? 0,
            rotation: tokenData.rotation ?? 0,
            locked: tokenData.locked ?? false,
            imageUrl: tokenData.imageUrl ?? null,
            visible: tokenData.visible ?? true,
            vision: tokenData.vision ?? false,
            visionRange: tokenData.visionRange ?? 0,
            bars: tokenData.bars ?? {},
            lightBright: tokenData.lightBright ?? 0,
            lightDim: tokenData.lightDim ?? 0,
            lightColor: tokenData.lightColor ?? null,
            lightAngle: tokenData.lightAngle ?? 360,
            followPathName: tokenData.followPathName ?? null,
            pathSpeed: tokenData.pathSpeed ?? null,
            data: tokenData.data ?? {},
            ownerId: request.user.id,
          })
          .returning();

        const newToken = newTokens[0];

        // Convert to Token interface
        const formattedToken: Token = {
          id: newToken.id,
          sceneId: newToken.sceneId,
          actorId: newToken.actorId,
          name: newToken.name,
          imageUrl: newToken.imageUrl,
          x: newToken.x,
          y: newToken.y,
          width: newToken.width,
          height: newToken.height,
          elevation: newToken.elevation,
          rotation: newToken.rotation,
          locked: newToken.locked,
          ownerId: newToken.ownerId,
          visible: newToken.visible,
          vision: newToken.vision,
          visionRange: newToken.visionRange,
          bars: newToken.bars as Record<string, unknown>,
          lightBright: newToken.lightBright,
          lightDim: newToken.lightDim,
          lightColor: newToken.lightColor,
          lightAngle: newToken.lightAngle,
          followPathName: newToken.followPathName ?? null,
          pathSpeed: newToken.pathSpeed ?? null,
          data: newToken.data as Record<string, unknown>,
          createdAt: newToken.createdAt,
          updatedAt: newToken.updatedAt,
        };

        return reply.status(201).send({ token: formattedToken });
      } catch (error) {
        fastify.log.error(error, 'Failed to create token');
        return reply.status(500).send({ error: 'Failed to create token' });
      }
    }
  );

  /**
   * PATCH /api/v1/tokens/:tokenId - Update a token
   * Updates a specific token
   */
  fastify.patch<{
    Params: { tokenId: string };
    Body: {
      name?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      imageUrl?: string | null;
      visible?: boolean;
      actorId?: string | null;
      elevation?: number;
      rotation?: number;
      locked?: boolean;
      vision?: boolean;
      visionRange?: number;
      bars?: Record<string, unknown>;
      lightBright?: number;
      lightDim?: number;
      lightColor?: string | null;
      lightAngle?: number;
      followPathName?: string | null;
      pathSpeed?: number | null;
      data?: Record<string, unknown>;
    };
  }>(
    '/tokens/:tokenId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { tokenId } = request.params;
      const updates = request.body;

      try {
        // Check if token exists
        const [existingToken] = await fastify.db
          .select()
          .from(tokens)
          .where(eq(tokens.id, tokenId))
          .limit(1);

        if (!existingToken) {
          return reply.status(404).send({ error: 'Token not found' });
        }

        // TODO: Check if user has permission to update this token

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Token name cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.x !== undefined) {
          updateData.x = updates.x;
        }
        if (updates.y !== undefined) {
          updateData.y = updates.y;
        }
        if (updates.width !== undefined) {
          updateData.width = updates.width;
        }
        if (updates.height !== undefined) {
          updateData.height = updates.height;
        }
        if (updates.imageUrl !== undefined) {
          updateData.imageUrl = updates.imageUrl;
        }
        if (updates.visible !== undefined) {
          updateData.visible = updates.visible;
        }
        if (updates.actorId !== undefined) {
          updateData.actorId = updates.actorId;
        }
        if (updates.elevation !== undefined) {
          updateData.elevation = updates.elevation;
        }
        if (updates.rotation !== undefined) {
          updateData.rotation = updates.rotation;
        }
        if (updates.locked !== undefined) {
          updateData.locked = updates.locked;
        }
        if (updates.vision !== undefined) {
          updateData.vision = updates.vision;
        }
        if (updates.visionRange !== undefined) {
          updateData.visionRange = updates.visionRange;
        }
        if (updates.bars !== undefined) {
          updateData.bars = updates.bars;
        }
        if (updates.lightBright !== undefined) {
          updateData.lightBright = updates.lightBright;
        }
        if (updates.lightDim !== undefined) {
          updateData.lightDim = updates.lightDim;
        }
        if (updates.lightColor !== undefined) {
          updateData.lightColor = updates.lightColor;
        }
        if (updates.lightAngle !== undefined) {
          updateData.lightAngle = updates.lightAngle;
        }
        if (updates.followPathName !== undefined) {
          updateData.followPathName = updates.followPathName;
        }
        if (updates.pathSpeed !== undefined) {
          updateData.pathSpeed = updates.pathSpeed;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update token in database
        const updatedTokens = await fastify.db
          .update(tokens)
          .set(updateData)
          .where(eq(tokens.id, tokenId))
          .returning();

        const updatedToken = updatedTokens[0];

        // Convert to Token interface
        const formattedToken: Token = {
          id: updatedToken.id,
          sceneId: updatedToken.sceneId,
          actorId: updatedToken.actorId,
          name: updatedToken.name,
          imageUrl: updatedToken.imageUrl,
          x: updatedToken.x,
          y: updatedToken.y,
          width: updatedToken.width,
          height: updatedToken.height,
          elevation: updatedToken.elevation,
          rotation: updatedToken.rotation,
          locked: updatedToken.locked,
          ownerId: updatedToken.ownerId,
          visible: updatedToken.visible,
          vision: updatedToken.vision,
          visionRange: updatedToken.visionRange,
          bars: updatedToken.bars as Record<string, unknown>,
          lightBright: updatedToken.lightBright,
          lightDim: updatedToken.lightDim,
          lightColor: updatedToken.lightColor,
          lightAngle: updatedToken.lightAngle,
          followPathName: updatedToken.followPathName ?? null,
          pathSpeed: updatedToken.pathSpeed ?? null,
          data: updatedToken.data as Record<string, unknown>,
          createdAt: updatedToken.createdAt,
          updatedAt: updatedToken.updatedAt,
        };

        return reply.status(200).send({ token: formattedToken });
      } catch (error) {
        fastify.log.error(error, 'Failed to update token');
        return reply.status(500).send({ error: 'Failed to update token' });
      }
    }
  );
};

export default tokensRoute;
