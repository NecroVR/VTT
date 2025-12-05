import type { FastifyPluginAsync } from 'fastify';
import { measurementTemplates, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { MeasurementTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Measurement Templates API routes
 * All routes require authentication
 * Handles CRUD operations for measurement templates
 */
const templatesRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/scenes/:sceneId/templates - List all templates for a scene
   * Returns templates for a specific scene
   */
  fastify.get<{ Params: { sceneId: string } }>(
    '/scenes/:sceneId/templates',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;

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

        // TODO: Check if user has access to this scene's game

        // Fetch all templates for the scene
        const sceneTemplates = await fastify.db
          .select()
          .from(measurementTemplates)
          .where(eq(measurementTemplates.sceneId, sceneId));

        // Convert to MeasurementTemplate interface
        const formattedTemplates: MeasurementTemplate[] = sceneTemplates.map(template => ({
          id: template.id,
          sceneId: template.sceneId,
          templateType: template.templateType as 'circle' | 'cone' | 'ray' | 'rectangle',
          x: template.x,
          y: template.y,
          distance: template.distance,
          direction: template.direction,
          angle: template.angle,
          width: template.width,
          color: template.color,
          fillAlpha: template.fillAlpha,
          borderColor: template.borderColor,
          hidden: template.hidden,
          ownerId: template.ownerId,
          data: template.data as Record<string, unknown>,
          createdAt: template.createdAt,
        }));

        return reply.status(200).send({ templates: formattedTemplates });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch templates');
        return reply.status(500).send({ error: 'Failed to fetch templates' });
      }
    }
  );

  /**
   * POST /api/v1/scenes/:sceneId/templates - Create a new template
   * Creates a measurement template for a specific scene
   */
  fastify.post<{ Params: { sceneId: string }; Body: CreateTemplateRequest }>(
    '/scenes/:sceneId/templates',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { sceneId } = request.params;
      const templateData = request.body;

      // Validate required fields
      if (!templateData.templateType) {
        return reply.status(400).send({ error: 'Template type is required' });
      }

      if (templateData.x === undefined || templateData.x === null) {
        return reply.status(400).send({ error: 'Template x position is required' });
      }

      if (templateData.y === undefined || templateData.y === null) {
        return reply.status(400).send({ error: 'Template y position is required' });
      }

      if (templateData.distance === undefined || templateData.distance === null) {
        return reply.status(400).send({ error: 'Template distance is required' });
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

        // TODO: Check if user has permission to create templates in this scene

        // Create template in database
        const newTemplates = await fastify.db
          .insert(measurementTemplates)
          .values({
            sceneId,
            templateType: templateData.templateType,
            x: templateData.x,
            y: templateData.y,
            distance: templateData.distance,
            direction: templateData.direction ?? null,
            angle: templateData.angle ?? null,
            width: templateData.width ?? null,
            color: templateData.color ?? '#ff0000',
            fillAlpha: templateData.fillAlpha ?? 0.3,
            borderColor: templateData.borderColor ?? null,
            hidden: templateData.hidden ?? false,
            ownerId: templateData.ownerId ?? request.user.id,
            data: templateData.data ?? {},
          })
          .returning();

        const newTemplate = newTemplates[0];

        // Convert to MeasurementTemplate interface
        const formattedTemplate: MeasurementTemplate = {
          id: newTemplate.id,
          sceneId: newTemplate.sceneId,
          templateType: newTemplate.templateType as 'circle' | 'cone' | 'ray' | 'rectangle',
          x: newTemplate.x,
          y: newTemplate.y,
          distance: newTemplate.distance,
          direction: newTemplate.direction,
          angle: newTemplate.angle,
          width: newTemplate.width,
          color: newTemplate.color,
          fillAlpha: newTemplate.fillAlpha,
          borderColor: newTemplate.borderColor,
          hidden: newTemplate.hidden,
          ownerId: newTemplate.ownerId,
          data: newTemplate.data as Record<string, unknown>,
          createdAt: newTemplate.createdAt,
        };

        return reply.status(201).send({ template: formattedTemplate });
      } catch (error) {
        fastify.log.error(error, 'Failed to create template');
        return reply.status(500).send({ error: 'Failed to create template' });
      }
    }
  );

  /**
   * PATCH /api/v1/templates/:templateId - Update a template
   * Updates a specific measurement template
   */
  fastify.patch<{ Params: { templateId: string }; Body: UpdateTemplateRequest }>(
    '/templates/:templateId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { templateId } = request.params;
      const updates = request.body;

      try {
        // Check if template exists
        const [existingTemplate] = await fastify.db
          .select()
          .from(measurementTemplates)
          .where(eq(measurementTemplates.id, templateId))
          .limit(1);

        if (!existingTemplate) {
          return reply.status(404).send({ error: 'Template not found' });
        }

        // TODO: Check if user has permission to update this template

        // Build update object
        const updateData: any = {};

        if (updates.x !== undefined) {
          updateData.x = updates.x;
        }
        if (updates.y !== undefined) {
          updateData.y = updates.y;
        }
        if (updates.distance !== undefined) {
          updateData.distance = updates.distance;
        }
        if (updates.direction !== undefined) {
          updateData.direction = updates.direction;
        }
        if (updates.angle !== undefined) {
          updateData.angle = updates.angle;
        }
        if (updates.width !== undefined) {
          updateData.width = updates.width;
        }
        if (updates.color !== undefined) {
          updateData.color = updates.color;
        }
        if (updates.fillAlpha !== undefined) {
          updateData.fillAlpha = updates.fillAlpha;
        }
        if (updates.borderColor !== undefined) {
          updateData.borderColor = updates.borderColor;
        }
        if (updates.hidden !== undefined) {
          updateData.hidden = updates.hidden;
        }
        if (updates.data !== undefined) {
          updateData.data = updates.data;
        }

        // Update template in database
        const updatedTemplates = await fastify.db
          .update(measurementTemplates)
          .set(updateData)
          .where(eq(measurementTemplates.id, templateId))
          .returning();

        const updatedTemplate = updatedTemplates[0];

        // Convert to MeasurementTemplate interface
        const formattedTemplate: MeasurementTemplate = {
          id: updatedTemplate.id,
          sceneId: updatedTemplate.sceneId,
          templateType: updatedTemplate.templateType as 'circle' | 'cone' | 'ray' | 'rectangle',
          x: updatedTemplate.x,
          y: updatedTemplate.y,
          distance: updatedTemplate.distance,
          direction: updatedTemplate.direction,
          angle: updatedTemplate.angle,
          width: updatedTemplate.width,
          color: updatedTemplate.color,
          fillAlpha: updatedTemplate.fillAlpha,
          borderColor: updatedTemplate.borderColor,
          hidden: updatedTemplate.hidden,
          ownerId: updatedTemplate.ownerId,
          data: updatedTemplate.data as Record<string, unknown>,
          createdAt: updatedTemplate.createdAt,
        };

        return reply.status(200).send({ template: formattedTemplate });
      } catch (error) {
        fastify.log.error(error, 'Failed to update template');
        return reply.status(500).send({ error: 'Failed to update template' });
      }
    }
  );

  /**
   * DELETE /api/v1/templates/:templateId - Delete a template
   * Deletes a specific measurement template
   */
  fastify.delete<{ Params: { templateId: string } }>(
    '/templates/:templateId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { templateId } = request.params;

      try {
        // Check if template exists
        const [existingTemplate] = await fastify.db
          .select()
          .from(measurementTemplates)
          .where(eq(measurementTemplates.id, templateId))
          .limit(1);

        if (!existingTemplate) {
          return reply.status(404).send({ error: 'Template not found' });
        }

        // TODO: Check if user has permission to delete this template

        // Delete template from database
        await fastify.db
          .delete(measurementTemplates)
          .where(eq(measurementTemplates.id, templateId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete template');
        return reply.status(500).send({ error: 'Failed to delete template' });
      }
    }
  );
};

export default templatesRoute;
