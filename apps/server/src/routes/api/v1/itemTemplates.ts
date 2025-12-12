import type { FastifyPluginAsync } from 'fastify';
import { itemTemplates, campaigns } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import type {
  CustomItemTemplate,
  CreateItemTemplateRequest,
  UpdateItemTemplateRequest,
  ItemTemplate
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';
import { gameSystemLoader } from '../../../services/gameSystemLoader.js';

/**
 * Item Templates API routes
 * All routes require authentication
 * Handles CRUD operations for campaign-specific custom item templates
 */
const itemTemplatesRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * Helper function to check if user has access to a campaign
   */
  const checkCampaignAccess = async (campaignId: string, userId: string): Promise<boolean> => {
    // Check if user is the campaign owner or GM
    const [campaign] = await fastify.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return false;
    }

    // User has access if they are the owner or a GM
    if (campaign.ownerId === userId) {
      return true;
    }

    if (campaign.gmUserIds && campaign.gmUserIds.includes(userId)) {
      return true;
    }

    // TODO: Add check for campaign members when that table is created
    return false;
  };

  /**
   * Helper function to check if user has GM access to a campaign
   */
  const checkGMAccess = async (campaignId: string, userId: string): Promise<boolean> => {
    const [campaign] = await fastify.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return false;
    }

    // User has GM access if they are the owner or a GM
    if (campaign.ownerId === userId) {
      return true;
    }

    if (campaign.gmUserIds && campaign.gmUserIds.includes(userId)) {
      return true;
    }

    return false;
  };

  /**
   * GET /api/v1/campaigns/:campaignId/item-templates - List all item templates
   * Returns both game system templates and custom campaign templates
   */
  fastify.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/item-templates',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;

      try {
        // Verify user has access to this campaign
        const hasAccess = await checkCampaignAccess(campaignId, request.user.id);
        if (!hasAccess) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Get campaign to find game system
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // Get game system templates
        const gameSystemTemplates: ItemTemplate[] = [];
        if (campaign.gameSystemId) {
          const loadedSystem = gameSystemLoader.getSystem(campaign.gameSystemId);
          if (loadedSystem && loadedSystem.system.itemTemplates) {
            // Filter and cast EntityTemplates to ItemTemplates (only item types)
            const itemTypeTemplates = loadedSystem.system.itemTemplates.filter(
              t => t.entityType === 'item'
            ) as ItemTemplate[];
            gameSystemTemplates.push(...itemTypeTemplates);
          }
        }

        // Get custom templates for this campaign
        const customTemplateRecords = await fastify.db
          .select()
          .from(itemTemplates)
          .where(eq(itemTemplates.campaignId, campaignId));

        // Convert custom templates to CustomItemTemplate format
        const customTemplates: CustomItemTemplate[] = customTemplateRecords.map(template => ({
          // Database metadata
          dbId: template.id,
          campaignId: template.campaignId,
          createdBy: template.createdBy,
          shared: template.shared,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,

          // ItemTemplate properties
          entityType: 'item' as const,
          id: template.templateId,
          systemId: template.systemId,
          name: template.name,
          category: template.category as any,
          extends: template.extends || undefined,
          fields: (template.fields as any[]) || [],
          computedFields: (template.computedFields as any[]) || [],
          sections: (template.sections as any[]) || [],
          rolls: (template.rolls as any[]) || [],
          actions: (template.actions as any[]) || [],
          physical: (template.physical as any) || undefined,
          equippable: (template.equippable as any) || undefined,
          activation: (template.activation as any) || undefined,
          consumes: (template.consumes as any) || undefined,
          effects: (template.effects as any[]) || [],
          container: (template.container as any) || undefined,
        }));

        return reply.status(200).send({
          templates: {
            gameSystem: gameSystemTemplates,
            custom: customTemplates,
          },
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch item templates');
        return reply.status(500).send({ error: 'Failed to fetch item templates' });
      }
    }
  );

  /**
   * GET /api/v1/campaigns/:campaignId/item-templates/:templateId - Get a specific template
   * Returns either a game system template or custom template
   */
  fastify.get<{ Params: { campaignId: string; templateId: string } }>(
    '/campaigns/:campaignId/item-templates/:templateId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, templateId } = request.params;

      try {
        // Verify user has access to this campaign
        const hasAccess = await checkCampaignAccess(campaignId, request.user.id);
        if (!hasAccess) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // First, check if it's a custom template
        const [customTemplate] = await fastify.db
          .select()
          .from(itemTemplates)
          .where(
            and(
              eq(itemTemplates.campaignId, campaignId),
              eq(itemTemplates.templateId, templateId)
            )
          )
          .limit(1);

        if (customTemplate) {
          const formattedTemplate: CustomItemTemplate = {
            dbId: customTemplate.id,
            campaignId: customTemplate.campaignId,
            createdBy: customTemplate.createdBy,
            shared: customTemplate.shared,
            createdAt: customTemplate.createdAt,
            updatedAt: customTemplate.updatedAt,
            entityType: 'item' as const,
            id: customTemplate.templateId,
            systemId: customTemplate.systemId,
            name: customTemplate.name,
            category: customTemplate.category as any,
            extends: customTemplate.extends || undefined,
            fields: (customTemplate.fields as any[]) || [],
            computedFields: (customTemplate.computedFields as any[]) || [],
            sections: (customTemplate.sections as any[]) || [],
            rolls: (customTemplate.rolls as any[]) || [],
            actions: (customTemplate.actions as any[]) || [],
            physical: (customTemplate.physical as any) || undefined,
            equippable: (customTemplate.equippable as any) || undefined,
            activation: (customTemplate.activation as any) || undefined,
            consumes: (customTemplate.consumes as any) || undefined,
            effects: (customTemplate.effects as any[]) || [],
            container: (customTemplate.container as any) || undefined,
          };

          return reply.status(200).send({ template: formattedTemplate, source: 'custom' });
        }

        // If not custom, check game system templates
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        if (campaign.gameSystemId) {
          const loadedSystem = gameSystemLoader.getSystem(campaign.gameSystemId);
          if (loadedSystem && loadedSystem.system.itemTemplates) {
            const systemTemplate = loadedSystem.system.itemTemplates.find(
              t => t.entityType === 'item' && t.id === templateId
            ) as ItemTemplate | undefined;

            if (systemTemplate) {
              return reply.status(200).send({ template: systemTemplate, source: 'gameSystem' });
            }
          }
        }

        return reply.status(404).send({ error: 'Item template not found' });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch item template');
        return reply.status(500).send({ error: 'Failed to fetch item template' });
      }
    }
  );

  /**
   * POST /api/v1/campaigns/:campaignId/item-templates - Create a custom template
   * Only GMs and campaign owners can create templates
   */
  fastify.post<{ Params: { campaignId: string }; Body: CreateItemTemplateRequest }>(
    '/campaigns/:campaignId/item-templates',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;
      const templateData = request.body;

      try {
        // Verify user has GM access to this campaign
        const hasGMAccess = await checkGMAccess(campaignId, request.user.id);
        if (!hasGMAccess) {
          return reply.status(403).send({ error: 'Only GMs can create item templates' });
        }

        // Validate required fields
        if (!templateData.name || templateData.name.trim() === '') {
          return reply.status(400).send({ error: 'Template name is required' });
        }

        if (!templateData.systemId || templateData.systemId.trim() === '') {
          return reply.status(400).send({ error: 'System ID is required' });
        }

        if (!templateData.category) {
          return reply.status(400).send({ error: 'Template category is required' });
        }

        // Verify campaign exists and system ID matches
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        if (campaign.gameSystemId !== templateData.systemId) {
          return reply.status(400).send({
            error: `System ID must match campaign game system (${campaign.gameSystemId})`,
          });
        }

        // Generate template ID from name (lowercase, replace spaces with hyphens)
        const generatedTemplateId = templateData.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        // Check if template ID already exists in this campaign
        const [existingTemplate] = await fastify.db
          .select()
          .from(itemTemplates)
          .where(
            and(
              eq(itemTemplates.campaignId, campaignId),
              eq(itemTemplates.templateId, generatedTemplateId)
            )
          )
          .limit(1);

        if (existingTemplate) {
          return reply.status(400).send({
            error: `Template ID '${generatedTemplateId}' already exists in this campaign`,
          });
        }

        // Create template in database
        const newTemplates = await fastify.db
          .insert(itemTemplates)
          .values({
            campaignId,
            createdBy: request.user.id,
            systemId: templateData.systemId,
            templateId: generatedTemplateId,
            name: templateData.name.trim(),
            category: templateData.category,
            extends: templateData.extends || null,
            fields: templateData.fields || [],
            computedFields: templateData.computedFields || [],
            sections: templateData.sections || [],
            rolls: templateData.rolls || [],
            actions: templateData.actions || [],
            physical: templateData.physical || null,
            equippable: templateData.equippable || null,
            activation: templateData.activation || null,
            consumes: templateData.consumes || null,
            effects: templateData.effects || [],
            container: templateData.container || null,
            shared: templateData.shared ?? false,
          })
          .returning();

        const newTemplate = newTemplates[0];

        // Format response
        const formattedTemplate: CustomItemTemplate = {
          dbId: newTemplate.id,
          campaignId: newTemplate.campaignId,
          createdBy: newTemplate.createdBy,
          shared: newTemplate.shared,
          createdAt: newTemplate.createdAt,
          updatedAt: newTemplate.updatedAt,
          entityType: 'item' as const,
          id: newTemplate.templateId,
          systemId: newTemplate.systemId,
          name: newTemplate.name,
          category: newTemplate.category as any,
          extends: newTemplate.extends || undefined,
          fields: (newTemplate.fields as any[]) || [],
          computedFields: (newTemplate.computedFields as any[]) || [],
          sections: (newTemplate.sections as any[]) || [],
          rolls: (newTemplate.rolls as any[]) || [],
          actions: (newTemplate.actions as any[]) || [],
          physical: (newTemplate.physical as any) || undefined,
          equippable: (newTemplate.equippable as any) || undefined,
          activation: (newTemplate.activation as any) || undefined,
          consumes: (newTemplate.consumes as any) || undefined,
          effects: (newTemplate.effects as any[]) || [],
          container: (newTemplate.container as any) || undefined,
        };

        return reply.status(201).send({ template: formattedTemplate });
      } catch (error) {
        fastify.log.error(error, 'Failed to create item template');
        return reply.status(500).send({ error: 'Failed to create item template' });
      }
    }
  );

  /**
   * PATCH /api/v1/campaigns/:campaignId/item-templates/:templateId - Update a custom template
   * Only GMs, campaign owners, and template creators can update templates
   */
  fastify.patch<{
    Params: { campaignId: string; templateId: string };
    Body: UpdateItemTemplateRequest;
  }>(
    '/campaigns/:campaignId/item-templates/:templateId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, templateId } = request.params;
      const updates = request.body;

      try {
        // Verify user has GM access
        const hasGMAccess = await checkGMAccess(campaignId, request.user.id);
        if (!hasGMAccess) {
          return reply.status(403).send({ error: 'Only GMs can update item templates' });
        }

        // Check if template exists
        const [existingTemplate] = await fastify.db
          .select()
          .from(itemTemplates)
          .where(
            and(
              eq(itemTemplates.campaignId, campaignId),
              eq(itemTemplates.templateId, templateId)
            )
          )
          .limit(1);

        if (!existingTemplate) {
          return reply.status(404).send({ error: 'Item template not found' });
        }

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Template name cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.category !== undefined) {
          updateData.category = updates.category;
        }
        if (updates.extends !== undefined) {
          updateData.extends = updates.extends;
        }
        if (updates.fields !== undefined) {
          updateData.fields = updates.fields;
        }
        if (updates.computedFields !== undefined) {
          updateData.computedFields = updates.computedFields;
        }
        if (updates.sections !== undefined) {
          updateData.sections = updates.sections;
        }
        if (updates.rolls !== undefined) {
          updateData.rolls = updates.rolls;
        }
        if (updates.actions !== undefined) {
          updateData.actions = updates.actions;
        }
        if (updates.physical !== undefined) {
          updateData.physical = updates.physical;
        }
        if (updates.equippable !== undefined) {
          updateData.equippable = updates.equippable;
        }
        if (updates.activation !== undefined) {
          updateData.activation = updates.activation;
        }
        if (updates.consumes !== undefined) {
          updateData.consumes = updates.consumes;
        }
        if (updates.effects !== undefined) {
          updateData.effects = updates.effects;
        }
        if (updates.container !== undefined) {
          updateData.container = updates.container;
        }
        if (updates.shared !== undefined) {
          updateData.shared = updates.shared;
        }

        // Update template in database
        const updatedTemplates = await fastify.db
          .update(itemTemplates)
          .set(updateData)
          .where(
            and(
              eq(itemTemplates.campaignId, campaignId),
              eq(itemTemplates.templateId, templateId)
            )
          )
          .returning();

        const updatedTemplate = updatedTemplates[0];

        // Format response
        const formattedTemplate: CustomItemTemplate = {
          dbId: updatedTemplate.id,
          campaignId: updatedTemplate.campaignId,
          createdBy: updatedTemplate.createdBy,
          shared: updatedTemplate.shared,
          createdAt: updatedTemplate.createdAt,
          updatedAt: updatedTemplate.updatedAt,
          entityType: 'item' as const,
          id: updatedTemplate.templateId,
          systemId: updatedTemplate.systemId,
          name: updatedTemplate.name,
          category: updatedTemplate.category as any,
          extends: updatedTemplate.extends || undefined,
          fields: (updatedTemplate.fields as any[]) || [],
          computedFields: (updatedTemplate.computedFields as any[]) || [],
          sections: (updatedTemplate.sections as any[]) || [],
          rolls: (updatedTemplate.rolls as any[]) || [],
          actions: (updatedTemplate.actions as any[]) || [],
          physical: (updatedTemplate.physical as any) || undefined,
          equippable: (updatedTemplate.equippable as any) || undefined,
          activation: (updatedTemplate.activation as any) || undefined,
          consumes: (updatedTemplate.consumes as any) || undefined,
          effects: (updatedTemplate.effects as any[]) || [],
          container: (updatedTemplate.container as any) || undefined,
        };

        return reply.status(200).send({ template: formattedTemplate });
      } catch (error) {
        fastify.log.error(error, 'Failed to update item template');
        return reply.status(500).send({ error: 'Failed to update item template' });
      }
    }
  );

  /**
   * DELETE /api/v1/campaigns/:campaignId/item-templates/:templateId - Delete a custom template
   * Only GMs, campaign owners, and template creators can delete templates
   */
  fastify.delete<{ Params: { campaignId: string; templateId: string } }>(
    '/campaigns/:campaignId/item-templates/:templateId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, templateId } = request.params;

      try {
        // Verify user has GM access
        const hasGMAccess = await checkGMAccess(campaignId, request.user.id);
        if (!hasGMAccess) {
          return reply.status(403).send({ error: 'Only GMs can delete item templates' });
        }

        // Check if template exists
        const [existingTemplate] = await fastify.db
          .select()
          .from(itemTemplates)
          .where(
            and(
              eq(itemTemplates.campaignId, campaignId),
              eq(itemTemplates.templateId, templateId)
            )
          )
          .limit(1);

        if (!existingTemplate) {
          return reply.status(404).send({ error: 'Item template not found' });
        }

        // Delete template from database
        await fastify.db
          .delete(itemTemplates)
          .where(
            and(
              eq(itemTemplates.campaignId, campaignId),
              eq(itemTemplates.templateId, templateId)
            )
          );

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete item template');
        return reply.status(500).send({ error: 'Failed to delete item template' });
      }
    }
  );
};

export default itemTemplatesRoute;
