import type { FastifyPluginAsync } from 'fastify';
import { campaigns, users, STORAGE_QUOTAS } from '@vtt/database';
import { eq, or, arrayContains, sql } from 'drizzle-orm';
import type { CreateCampaignRequest, UpdateCampaignRequest, CampaignResponse, CampaignsListResponse, CampaignSettings, AddGMRequest, RemoveGMRequest, GMsListResponse } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Campaign CRUD API routes
 * All routes require authentication
 * Handles campaign creation, listing, updating, and deletion
 */
const campaignsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/campaigns - List all campaigns for current user
   * Returns campaigns where user is the owner
   */
  fastify.get(
    '/campaigns',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Get campaigns owned by user
        const userCampaigns = await fastify.db
          .select({
            id: campaigns.id,
            name: campaigns.name,
            ownerId: campaigns.ownerId,
            gmUserIds: campaigns.gmUserIds,
            gameSystemId: campaigns.gameSystemId,
            settings: campaigns.settings,
            createdAt: campaigns.createdAt,
            updatedAt: campaigns.updatedAt,
          })
          .from(campaigns)
          .where(eq(campaigns.ownerId, request.user.id));

        // Convert database records to Campaign objects
        const formattedCampaigns = userCampaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          ownerId: campaign.ownerId,
          gmUserIds: campaign.gmUserIds || [],
          gameSystemId: campaign.gameSystemId,
          settings: campaign.settings as CampaignSettings,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        }));

        return reply.status(200).send({ campaigns: formattedCampaigns });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch campaigns');
        return reply.status(500).send({ error: 'Failed to fetch campaigns' });
      }
    }
  );

  /**
   * GET /api/v1/campaigns/:id - Get a single campaign by ID
   * Only accessible if user is the owner
   */
  fastify.get<{ Params: { id: string } }>(
    '/campaigns/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;

      try {
        const [campaign] = await fastify.db
          .select({
            id: campaigns.id,
            name: campaigns.name,
            ownerId: campaigns.ownerId,
            gmUserIds: campaigns.gmUserIds,
            gameSystemId: campaigns.gameSystemId,
            settings: campaigns.settings,
            createdAt: campaigns.createdAt,
            updatedAt: campaigns.updatedAt,
          })
          .from(campaigns)
          .where(eq(campaigns.id, id))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // Check if user is the owner
        if (campaign.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        const formattedCampaign = {
          id: campaign.id,
          name: campaign.name,
          ownerId: campaign.ownerId,
          gmUserIds: campaign.gmUserIds || [],
          gameSystemId: campaign.gameSystemId,
          settings: campaign.settings as CampaignSettings,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        };

        return reply.status(200).send({ campaign: formattedCampaign });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch campaign');
        return reply.status(500).send({ error: 'Failed to fetch campaign' });
      }
    }
  );

  /**
   * POST /api/v1/campaigns - Create a new campaign
   * Creates a campaign with the current user as owner
   */
  fastify.post<{ Body: CreateCampaignRequest }>(
    '/campaigns',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { name, settings, gameSystemId } = request.body;

      // Validate input
      if (!name || name.trim() === '') {
        return reply.status(400).send({ error: 'Campaign name is required' });
      }

      if (!gameSystemId) {
        return reply.status(400).send({ error: 'Game system ID is required' });
      }

      try {
        // Default settings
        const defaultSettings: CampaignSettings = {
          gridType: 'square',
          gridSize: 50,
          snapToGrid: true,
        };

        // Merge with provided settings
        const campaignSettings = { ...defaultSettings, ...settings };

        // Create campaign
        const [newCampaign] = await fastify.db
          .insert(campaigns)
          .values({
            name: name.trim(),
            ownerId: request.user.id,
            gmUserIds: [],
            gameSystemId: gameSystemId,
            settings: campaignSettings,
          })
          .returning({
            id: campaigns.id,
            name: campaigns.name,
            ownerId: campaigns.ownerId,
            gmUserIds: campaigns.gmUserIds,
            gameSystemId: campaigns.gameSystemId,
            settings: campaigns.settings,
            createdAt: campaigns.createdAt,
            updatedAt: campaigns.updatedAt,
          });

        // Auto-upgrade user to GM tier if they're on basic tier
        if (request.user.accountTier === 'basic') {
          await fastify.db
            .update(users)
            .set({
              accountTier: 'gm',
              storageQuotaBytes: STORAGE_QUOTAS.gm,
              updatedAt: new Date(),
            })
            .where(eq(users.id, request.user.id));

          fastify.log.info(`User ${request.user.id} auto-upgraded to GM tier after creating first campaign`);
        }

        const formattedCampaign = {
          id: newCampaign.id,
          name: newCampaign.name,
          ownerId: newCampaign.ownerId,
          gmUserIds: newCampaign.gmUserIds || [],
          gameSystemId: newCampaign.gameSystemId,
          settings: newCampaign.settings as CampaignSettings,
          createdAt: newCampaign.createdAt,
          updatedAt: newCampaign.updatedAt,
        };

        return reply.status(201).send({ campaign: formattedCampaign });
      } catch (error) {
        fastify.log.error(error, 'Failed to create campaign');
        return reply.status(500).send({ error: 'Failed to create campaign' });
      }
    }
  );

  /**
   * PATCH /api/v1/campaigns/:id - Update a campaign
   * Only owner can update
   */
  fastify.patch<{ Params: { id: string }; Body: UpdateCampaignRequest }>(
    '/campaigns/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;
      const { name, settings, gameSystemId } = request.body;

      // Validate at least one field is provided
      if (!name && !settings && gameSystemId === undefined) {
        return reply.status(400).send({ error: 'At least one field (name or settings) is required' });
      }

      try {
        // Check if campaign exists and user is owner
        const [existingCampaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, id))
          .limit(1);

        if (!existingCampaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        if (existingCampaign.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can update this campaign' });
        }

        // Prevent changing gameSystemId if already set (immutability check)
        if (gameSystemId !== undefined && existingCampaign.gameSystemId) {
          if (gameSystemId !== existingCampaign.gameSystemId) {
            return reply.status(400).send({
              error: 'Cannot change game system once set. The game system is immutable after campaign creation.'
            });
          }
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (name !== undefined) {
          if (name.trim() === '') {
            return reply.status(400).send({ error: 'Campaign name cannot be empty' });
          }
          updateData.name = name.trim();
        }

        if (settings !== undefined) {
          // Merge with existing settings
          const currentSettings = existingCampaign.settings as CampaignSettings;
          updateData.settings = { ...currentSettings, ...settings };
        }

        // Allow setting gameSystemId if it's not already set
        if (gameSystemId !== undefined && !existingCampaign.gameSystemId) {
          updateData.gameSystemId = gameSystemId;
        }

        // Update campaign
        const [updatedCampaign] = await fastify.db
          .update(campaigns)
          .set(updateData)
          .where(eq(campaigns.id, id))
          .returning({
            id: campaigns.id,
            name: campaigns.name,
            ownerId: campaigns.ownerId,
            gmUserIds: campaigns.gmUserIds,
            gameSystemId: campaigns.gameSystemId,
            settings: campaigns.settings,
            createdAt: campaigns.createdAt,
            updatedAt: campaigns.updatedAt,
          });

        const formattedCampaign = {
          id: updatedCampaign.id,
          name: updatedCampaign.name,
          ownerId: updatedCampaign.ownerId,
          gmUserIds: updatedCampaign.gmUserIds || [],
          gameSystemId: updatedCampaign.gameSystemId,
          settings: updatedCampaign.settings as CampaignSettings,
          createdAt: updatedCampaign.createdAt,
          updatedAt: updatedCampaign.updatedAt,
        };

        return reply.status(200).send({ campaign: formattedCampaign });
      } catch (error) {
        fastify.log.error(error, 'Failed to update campaign');
        return reply.status(500).send({ error: 'Failed to update campaign' });
      }
    }
  );

  /**
   * DELETE /api/v1/campaigns/:id - Delete a campaign
   * Only owner can delete
   */
  fastify.delete<{ Params: { id: string } }>(
    '/campaigns/:id',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;

      try {
        // Check if campaign exists and user is owner
        const [existingCampaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, id))
          .limit(1);

        if (!existingCampaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        if (existingCampaign.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can delete this campaign' });
        }

        // Delete campaign
        await fastify.db
          .delete(campaigns)
          .where(eq(campaigns.id, id));

        return reply.status(200).send({ success: true });
      } catch (error) {
        fastify.log.error(error, 'Failed to delete campaign');
        return reply.status(500).send({ error: 'Failed to delete campaign' });
      }
    }
  );

  /**
   * POST /api/v1/campaigns/:id/gms - Add a user as GM for a campaign
   * Only the campaign owner can add GMs
   */
  fastify.post<{ Params: { id: string }; Body: AddGMRequest }>(
    '/campaigns/:id/gms',
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
        // Check if campaign exists and user is owner
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, id))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        if (campaign.ownerId !== request.user.id) {
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
        if (userId === campaign.ownerId) {
          return reply.status(400).send({ error: 'Owner is already a GM' });
        }

        // Check if user is already a GM
        const currentGmUserIds = campaign.gmUserIds || [];
        if (currentGmUserIds.includes(userId)) {
          return reply.status(400).send({ error: 'User is already a GM' });
        }

        // Add user to GM list
        const updatedGmUserIds = [...currentGmUserIds, userId];
        await fastify.db
          .update(campaigns)
          .set({ gmUserIds: updatedGmUserIds, updatedAt: new Date() })
          .where(eq(campaigns.id, id));

        return reply.status(200).send({ gmUserIds: updatedGmUserIds });
      } catch (error) {
        fastify.log.error(error, 'Failed to add GM');
        return reply.status(500).send({ error: 'Failed to add GM' });
      }
    }
  );

  /**
   * DELETE /api/v1/campaigns/:id/gms/:userId - Remove a user's GM role
   * Only the campaign owner can remove GMs
   */
  fastify.delete<{ Params: { id: string; userId: string } }>(
    '/campaigns/:id/gms/:userId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id, userId } = request.params;

      try {
        // Check if campaign exists and user is owner
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, id))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        if (campaign.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can remove GMs' });
        }

        // Can't remove owner (they're always GM)
        if (userId === campaign.ownerId) {
          return reply.status(400).send({ error: 'Cannot remove owner from GM role' });
        }

        // Remove user from GM list
        const currentGmUserIds = campaign.gmUserIds || [];
        const updatedGmUserIds = currentGmUserIds.filter(id => id !== userId);

        await fastify.db
          .update(campaigns)
          .set({ gmUserIds: updatedGmUserIds, updatedAt: new Date() })
          .where(eq(campaigns.id, id));

        return reply.status(200).send({ gmUserIds: updatedGmUserIds });
      } catch (error) {
        fastify.log.error(error, 'Failed to remove GM');
        return reply.status(500).send({ error: 'Failed to remove GM' });
      }
    }
  );

  /**
   * GET /api/v1/campaigns/:id/gms - List all GMs for a campaign
   * Only accessible to campaign owner and GMs
   */
  fastify.get<{ Params: { id: string } }>(
    '/campaigns/:id/gms',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { id } = request.params;

      try {
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, id))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // Check if user is owner or GM
        const gmUserIds = campaign.gmUserIds || [];
        const isOwner = campaign.ownerId === request.user.id;
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

export default campaignsRoute;
