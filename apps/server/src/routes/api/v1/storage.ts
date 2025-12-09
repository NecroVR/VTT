import type { FastifyPluginAsync } from 'fastify';
import { assets, campaigns } from '@vtt/database';
import { eq } from 'drizzle-orm';
import { authenticate } from '../../../middleware/auth.js';
import { sql } from 'drizzle-orm';

// Storage quota constants (in bytes)
const STORAGE_QUOTA_BASIC = 100 * 1024 * 1024; // 100 MB
const STORAGE_QUOTA_GM = 500 * 1024 * 1024; // 500 MB

/**
 * Storage API routes
 * All routes require authentication
 * Handles storage quota information
 */
const storageRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/storage/quota - Get storage quota information for authenticated user
   * Returns tier, total quota, used storage, remaining storage, and usage percentage
   */
  fastify.get(
    '/storage/quota',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Determine user tier by checking if they are a GM of any campaign
        const userCampaigns = await fastify.db
          .select()
          .from(campaigns)
          .where(
            sql`${campaigns.ownerId} = ${request.user.id} OR ${request.user.id} = ANY(${campaigns.gmUserIds})`
          );

        const isGM = userCampaigns.length > 0;
        const tier = isGM ? 'gm' : 'basic';
        const quotaBytes = isGM ? STORAGE_QUOTA_GM : STORAGE_QUOTA_BASIC;

        // Calculate total storage used by summing all asset sizes for this user
        const result = await fastify.db
          .select({
            totalSize: sql<number>`COALESCE(SUM(${assets.size}), 0)`,
          })
          .from(assets)
          .where(eq(assets.userId, request.user.id));

        const usedBytes = Number(result[0]?.totalSize || 0);
        const remainingBytes = Math.max(0, quotaBytes - usedBytes);
        const percentUsed = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

        return reply.status(200).send({
          tier,
          quotaBytes,
          usedBytes,
          remainingBytes,
          percentUsed: Math.round(percentUsed * 100) / 100, // Round to 2 decimal places
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch storage quota');
        return reply.status(500).send({ error: 'Failed to fetch storage quota' });
      }
    }
  );
};

export default storageRoute;
