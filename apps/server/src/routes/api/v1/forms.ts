import type { FastifyPluginAsync } from 'fastify';
import { forms, formVersions, formLicenses, campaignForms, campaigns, gameSystems } from '@vtt/database';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import type {
  CreateFormRequest,
  UpdateFormRequest,
  DuplicateFormRequest,
  AssignFormToCampaignRequest,
  UpdateCampaignFormRequest,
  FormDefinition,
  CampaignForm,
  FormVersion,
  FormVersionSummary,
  RevertFormVersionRequest,
  FormExport,
  ImportFormRequest,
  FormImportValidation,
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

// Configuration
const MAX_VERSION_HISTORY = 50; // Maximum number of versions to keep per form

/**
 * Form API routes
 * All routes require authentication
 * Handles CRUD operations for forms and campaign form assignments
 */
const formsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/game-systems/:systemId/forms - List all forms for a game system
   * Returns all forms for a game system (public forms + user's private forms)
   * Optional filter by entityType query parameter
   */
  fastify.get<{
    Params: { systemId: string };
    Querystring: { entityType?: string };
  }>(
    '/game-systems/:systemId/forms',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { systemId } = request.params;
      const { entityType } = request.query;

      try {
        // Build query conditions
        const conditions = [eq(forms.gameSystemId, systemId)];

        // Filter by entityType if provided
        if (entityType) {
          conditions.push(eq(forms.entityType, entityType));
        }

        // Add visibility filter: public forms OR user's own forms
        conditions.push(
          or(
            eq(forms.visibility, 'public'),
            eq(forms.ownerId, request.user.id)
          )!
        );

        // Fetch forms
        const systemForms = await fastify.db
          .select()
          .from(forms)
          .where(and(...conditions));

        // Format response
        const formattedForms: FormDefinition[] = systemForms.map((form) => ({
          id: form.id,
          name: form.name,
          description: form.description ?? undefined,
          gameSystemId: form.gameSystemId,
          entityType: form.entityType,
          version: parseInt(form.version, 10),
          isDefault: form.isDefault,
          isLocked: form.isLocked,
          visibility: form.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
          licenseType: (form.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
          price: form.price ? parseFloat(form.price) : undefined,
          ownerId: form.ownerId,
          layout: form.layout as any,
          fragments: form.fragments as any,
          styles: form.styles as any,
          computedFields: form.computedFields as any,
          scripts: form.scripts ? (form.scripts as any) : undefined,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        }));

        return reply.status(200).send({ forms: formattedForms });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch forms');
        return reply.status(500).send({ error: 'Failed to fetch forms' });
      }
    }
  );

  /**
   * GET /api/v1/forms/:formId - Get a single form
   * Returns form by ID if user has access (public OR owner OR GM of campaign with assignment)
   */
  fastify.get<{ Params: { formId: string } }>(
    '/forms/:formId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId } = request.params;

      try {
        // Fetch form
        const [form] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!form) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check access: public form OR user owns it OR user is GM of campaign that has it assigned
        const isPublic = form.visibility === 'public' || form.visibility === 'marketplace';
        const isOwner = form.ownerId === request.user.id;

        if (!isPublic && !isOwner) {
          // Check if user is GM of any campaign that has this form assigned
          const campaignAssignments = await fastify.db
            .select({ campaignId: campaignForms.campaignId })
            .from(campaignForms)
            .where(eq(campaignForms.formId, formId));

          if (campaignAssignments.length > 0) {
            const campaignIds = campaignAssignments.map((a) => a.campaignId);
            const userCampaigns = await fastify.db
              .select()
              .from(campaigns)
              .where(
                and(
                  sql`${campaigns.id} = ANY(${campaignIds})`,
                  or(
                    eq(campaigns.ownerId, request.user.id),
                    sql`${request.user.id} = ANY(${campaigns.gmUserIds})`
                  )!
                )
              );

            if (userCampaigns.length === 0) {
              return reply.status(403).send({ error: 'Access denied' });
            }
          } else {
            return reply.status(403).send({ error: 'Access denied' });
          }
        }

        // Format response
        const formattedForm: FormDefinition = {
          id: form.id,
          name: form.name,
          description: form.description ?? undefined,
          gameSystemId: form.gameSystemId,
          entityType: form.entityType,
          version: parseInt(form.version, 10),
          isDefault: form.isDefault,
          isLocked: form.isLocked,
          visibility: form.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
          licenseType: (form.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
          price: form.price ? parseFloat(form.price) : undefined,
          ownerId: form.ownerId,
          layout: form.layout as any,
          fragments: form.fragments as any,
          styles: form.styles as any,
          computedFields: form.computedFields as any,
          scripts: form.scripts ? (form.scripts as any) : undefined,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
        };

        return reply.status(200).send({ form: formattedForm });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch form');
        return reply.status(500).send({ error: 'Failed to fetch form' });
      }
    }
  );

  /**
   * POST /api/v1/game-systems/:systemId/forms - Create a new form
   * Creates a form for a game system, owned by the authenticated user
   */
  fastify.post<{
    Params: { systemId: string };
    Body: CreateFormRequest;
  }>(
    '/game-systems/:systemId/forms',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { systemId } = request.params;
      const formData = request.body;

      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        return reply.status(400).send({ error: 'Form name is required' });
      }

      if (!formData.entityType || formData.entityType.trim() === '') {
        return reply.status(400).send({ error: 'Entity type is required' });
      }

      try {
        // Verify game system exists
        const [gameSystem] = await fastify.db
          .select()
          .from(gameSystems)
          .where(eq(gameSystems.id, systemId))
          .limit(1);

        if (!gameSystem) {
          return reply.status(404).send({ error: 'Game system not found' });
        }

        // Create form
        const [newForm] = await fastify.db
          .insert(forms)
          .values({
            name: formData.name.trim(),
            description: formData.description ?? null,
            gameSystemId: systemId,
            entityType: formData.entityType.trim(),
            version: '1',
            isDefault: false,
            isLocked: false,
            visibility: formData.visibility ?? 'private',
            licenseType: 'free',
            price: '0.00',
            ownerId: request.user.id,
            layout: formData.layout ?? [],
            fragments: formData.fragments ?? [],
            styles: formData.styles ?? {},
            computedFields: formData.computedFields ?? [],
            scripts: [],
          })
          .returning();

        // Format response
        const formattedForm: FormDefinition = {
          id: newForm.id,
          name: newForm.name,
          description: newForm.description ?? undefined,
          gameSystemId: newForm.gameSystemId,
          entityType: newForm.entityType,
          version: parseInt(newForm.version, 10),
          isDefault: newForm.isDefault,
          isLocked: newForm.isLocked,
          visibility: newForm.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
          licenseType: (newForm.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
          price: newForm.price ? parseFloat(newForm.price) : undefined,
          ownerId: newForm.ownerId,
          layout: newForm.layout as any,
          fragments: newForm.fragments as any,
          styles: newForm.styles as any,
          computedFields: newForm.computedFields as any,
          scripts: newForm.scripts ? (newForm.scripts as any) : undefined,
          createdAt: newForm.createdAt,
          updatedAt: newForm.updatedAt,
        };

        return reply.status(201).send({ form: formattedForm });
      } catch (error) {
        fastify.log.error(error, 'Failed to create form');
        return reply.status(500).send({ error: 'Failed to create form' });
      }
    }
  );

  /**
   * PATCH /api/v1/forms/:formId - Update a form
   * Only owner can update. Prevents updates to locked forms.
   * Increments version on layout/fragments/styles/computedFields changes.
   */
  fastify.patch<{
    Params: { formId: string };
    Body: UpdateFormRequest;
  }>(
    '/forms/:formId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId } = request.params;
      const updates = request.body;

      try {
        // Check if form exists
        const [existingForm] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!existingForm) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check ownership
        if (existingForm.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can update this form' });
        }

        // Prevent updates to locked forms
        if (existingForm.isLocked) {
          return reply.status(403).send({ error: 'Cannot update locked form' });
        }

        // Validate name if provided
        if (updates.name !== undefined && updates.name.trim() === '') {
          return reply.status(400).send({ error: 'Form name cannot be empty' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        // Determine if version should be incremented
        let shouldIncrementVersion = false;

        if (updates.name !== undefined) {
          updateData.name = updates.name.trim();
        }
        if (updates.description !== undefined) {
          updateData.description = updates.description;
        }
        if (updates.layout !== undefined) {
          updateData.layout = updates.layout;
          shouldIncrementVersion = true;
        }
        if (updates.fragments !== undefined) {
          updateData.fragments = updates.fragments;
          shouldIncrementVersion = true;
        }
        if (updates.styles !== undefined) {
          updateData.styles = updates.styles;
          shouldIncrementVersion = true;
        }
        if (updates.computedFields !== undefined) {
          updateData.computedFields = updates.computedFields;
          shouldIncrementVersion = true;
        }
        if (updates.visibility !== undefined) {
          updateData.visibility = updates.visibility;
        }
        if (updates.licenseType !== undefined) {
          updateData.licenseType = updates.licenseType;
        }
        if (updates.price !== undefined) {
          updateData.price = updates.price.toString();
        }

        // Increment version and save history if structural changes were made
        if (shouldIncrementVersion) {
          const currentVersion = parseInt(existingForm.version, 10);
          updateData.version = (currentVersion + 1).toString();

          // Save current version to history
          await fastify.db.insert(formVersions).values({
            formId: existingForm.id,
            version: currentVersion,
            layout: existingForm.layout,
            fragments: existingForm.fragments,
            computedFields: existingForm.computedFields,
            styles: existingForm.styles,
            scripts: existingForm.scripts,
            changeNotes: updates.changeNotes ?? null,
            createdBy: request.user.id,
          });

          // Cleanup old versions if exceeding limit
          const versionCount = await fastify.db
            .select({ id: formVersions.id })
            .from(formVersions)
            .where(eq(formVersions.formId, formId));

          if (versionCount.length >= MAX_VERSION_HISTORY) {
            // Get oldest versions to delete
            const versionsToDelete = await fastify.db
              .select({ id: formVersions.id })
              .from(formVersions)
              .where(eq(formVersions.formId, formId))
              .orderBy(formVersions.createdAt)
              .limit(versionCount.length - MAX_VERSION_HISTORY + 1);

            if (versionsToDelete.length > 0) {
              const idsToDelete = versionsToDelete.map(v => v.id);
              await fastify.db
                .delete(formVersions)
                .where(sql`${formVersions.id} = ANY(${idsToDelete})`);
            }
          }
        }

        // Update form
        const [updatedForm] = await fastify.db
          .update(forms)
          .set(updateData)
          .where(eq(forms.id, formId))
          .returning();

        // Format response
        const formattedForm: FormDefinition = {
          id: updatedForm.id,
          name: updatedForm.name,
          description: updatedForm.description ?? undefined,
          gameSystemId: updatedForm.gameSystemId,
          entityType: updatedForm.entityType,
          version: parseInt(updatedForm.version, 10),
          isDefault: updatedForm.isDefault,
          isLocked: updatedForm.isLocked,
          visibility: updatedForm.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
          licenseType: (updatedForm.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
          price: updatedForm.price ? parseFloat(updatedForm.price) : undefined,
          ownerId: updatedForm.ownerId,
          layout: updatedForm.layout as any,
          fragments: updatedForm.fragments as any,
          styles: updatedForm.styles as any,
          computedFields: updatedForm.computedFields as any,
          scripts: updatedForm.scripts ? (updatedForm.scripts as any) : undefined,
          createdAt: updatedForm.createdAt,
          updatedAt: updatedForm.updatedAt,
        };

        return reply.status(200).send({ form: formattedForm });
      } catch (error) {
        fastify.log.error(error, 'Failed to update form');
        return reply.status(500).send({ error: 'Failed to update form' });
      }
    }
  );

  /**
   * DELETE /api/v1/forms/:formId - Delete a form
   * Only owner can delete. Prevents deletion of default forms.
   */
  fastify.delete<{ Params: { formId: string } }>(
    '/forms/:formId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId } = request.params;

      try {
        // Check if form exists
        const [existingForm] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!existingForm) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check ownership
        if (existingForm.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can delete this form' });
        }

        // Prevent deletion of default forms
        if (existingForm.isDefault) {
          return reply.status(403).send({ error: 'Cannot delete default form' });
        }

        // Delete form (cascade handled by DB)
        await fastify.db.delete(forms).where(eq(forms.id, formId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete form');
        return reply.status(500).send({ error: 'Failed to delete form' });
      }
    }
  );

  /**
   * POST /api/v1/forms/:formId/duplicate - Duplicate a form
   * Copies all form content to a new form with a new owner
   */
  fastify.post<{
    Params: { formId: string };
    Body: DuplicateFormRequest;
  }>(
    '/forms/:formId/duplicate',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId } = request.params;
      const { name, description } = request.body;

      // Validate name
      if (!name || name.trim() === '') {
        return reply.status(400).send({ error: 'Form name is required for duplication' });
      }

      try {
        // Fetch original form
        const [originalForm] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!originalForm) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check if user has access to the original form
        const isPublic = originalForm.visibility === 'public' || originalForm.visibility === 'marketplace';
        const isOwner = originalForm.ownerId === request.user.id;

        if (!isPublic && !isOwner) {
          return reply.status(403).send({ error: 'Access denied to duplicate this form' });
        }

        // Create duplicate form
        const [duplicatedForm] = await fastify.db
          .insert(forms)
          .values({
            name: name.trim(),
            description: description ?? originalForm.description,
            gameSystemId: originalForm.gameSystemId,
            entityType: originalForm.entityType,
            version: '1', // Reset version to 1
            isDefault: false, // Clear default flag
            isLocked: false, // Clear locked flag
            visibility: 'private', // Always private for duplicates
            licenseType: 'free',
            price: '0.00',
            ownerId: request.user.id, // Set new owner
            layout: originalForm.layout,
            fragments: originalForm.fragments,
            styles: originalForm.styles,
            computedFields: originalForm.computedFields,
            scripts: originalForm.scripts,
          })
          .returning();

        // Format response
        const formattedForm: FormDefinition = {
          id: duplicatedForm.id,
          name: duplicatedForm.name,
          description: duplicatedForm.description ?? undefined,
          gameSystemId: duplicatedForm.gameSystemId,
          entityType: duplicatedForm.entityType,
          version: parseInt(duplicatedForm.version, 10),
          isDefault: duplicatedForm.isDefault,
          isLocked: duplicatedForm.isLocked,
          visibility: duplicatedForm.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
          licenseType: (duplicatedForm.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
          price: duplicatedForm.price ? parseFloat(duplicatedForm.price) : undefined,
          ownerId: duplicatedForm.ownerId,
          layout: duplicatedForm.layout as any,
          fragments: duplicatedForm.fragments as any,
          styles: duplicatedForm.styles as any,
          computedFields: duplicatedForm.computedFields as any,
          scripts: duplicatedForm.scripts ? (duplicatedForm.scripts as any) : undefined,
          createdAt: duplicatedForm.createdAt,
          updatedAt: duplicatedForm.updatedAt,
        };

        return reply.status(201).send({ form: formattedForm });
      } catch (error) {
        fastify.log.error(error, 'Failed to duplicate form');
        return reply.status(500).send({ error: 'Failed to duplicate form' });
      }
    }
  );

  // ============================================================================
  // Campaign Form Assignment Endpoints
  // ============================================================================

  /**
   * GET /api/v1/campaigns/:campaignId/forms - Get forms assigned to a campaign
   * List all form assignments for a campaign with form data
   */
  fastify.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/forms',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;

      try {
        // Verify campaign exists and user has access
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
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

        // Fetch campaign form assignments with form details
        const assignments = await fastify.db
          .select({
            id: campaignForms.id,
            campaignId: campaignForms.campaignId,
            formId: campaignForms.formId,
            entityType: campaignForms.entityType,
            priority: campaignForms.priority,
            createdAt: campaignForms.createdAt,
            form: forms,
          })
          .from(campaignForms)
          .leftJoin(forms, eq(campaignForms.formId, forms.id))
          .where(eq(campaignForms.campaignId, campaignId))
          .orderBy(desc(campaignForms.priority));

        // Format response
        const formattedAssignments = assignments.map((assignment) => ({
          id: assignment.id,
          campaignId: assignment.campaignId,
          formId: assignment.formId,
          entityType: assignment.entityType,
          priority: assignment.priority,
          createdAt: assignment.createdAt,
          form: assignment.form
            ? {
                id: assignment.form.id,
                name: assignment.form.name,
                description: assignment.form.description ?? undefined,
                gameSystemId: assignment.form.gameSystemId,
                entityType: assignment.form.entityType,
                version: parseInt(assignment.form.version, 10),
                isDefault: assignment.form.isDefault,
                isLocked: assignment.form.isLocked,
                visibility: assignment.form.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
                licenseType: (assignment.form.licenseType || undefined) as
                  | 'free'
                  | 'paid'
                  | 'subscription'
                  | undefined,
                price: assignment.form.price ? parseFloat(assignment.form.price) : undefined,
                ownerId: assignment.form.ownerId,
                layout: assignment.form.layout as any,
                fragments: assignment.form.fragments as any,
                styles: assignment.form.styles as any,
                computedFields: assignment.form.computedFields as any,
                scripts: assignment.form.scripts ? (assignment.form.scripts as any) : undefined,
                createdAt: assignment.form.createdAt,
                updatedAt: assignment.form.updatedAt,
              }
            : undefined,
        }));

        return reply.status(200).send({ campaignForms: formattedAssignments });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch campaign forms');
        return reply.status(500).send({ error: 'Failed to fetch campaign forms' });
      }
    }
  );

  /**
   * POST /api/v1/campaigns/:campaignId/forms - Assign a form to a campaign
   * Only GM can assign forms. Verifies form exists and user has access.
   */
  fastify.post<{
    Params: { campaignId: string };
    Body: AssignFormToCampaignRequest;
  }>(
    '/campaigns/:campaignId/forms',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;
      const { formId, entityType, priority } = request.body;

      // Validate required fields
      if (!formId) {
        return reply.status(400).send({ error: 'Form ID is required' });
      }

      if (!entityType || entityType.trim() === '') {
        return reply.status(400).send({ error: 'Entity type is required' });
      }

      try {
        // Verify campaign exists and user is GM
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        const gmUserIds = campaign.gmUserIds || [];
        const isOwner = campaign.ownerId === request.user.id;
        const isGM = gmUserIds.includes(request.user.id);

        if (!isOwner && !isGM) {
          return reply.status(403).send({ error: 'Only GMs can assign forms to campaigns' });
        }

        // Verify form exists and user has access
        const [form] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!form) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check if user has access to the form (owns it OR it's public)
        const isPublic = form.visibility === 'public' || form.visibility === 'marketplace';
        const isFormOwner = form.ownerId === request.user.id;

        if (!isPublic && !isFormOwner) {
          return reply.status(403).send({ error: 'Access denied to this form' });
        }

        // Check for existing assignment (unique constraint: campaign + form)
        const [existingAssignment] = await fastify.db
          .select()
          .from(campaignForms)
          .where(and(eq(campaignForms.campaignId, campaignId), eq(campaignForms.formId, formId)))
          .limit(1);

        if (existingAssignment) {
          return reply.status(400).send({ error: 'Form is already assigned to this campaign' });
        }

        // Create assignment
        const [assignment] = await fastify.db
          .insert(campaignForms)
          .values({
            campaignId,
            formId,
            entityType: entityType.trim(),
            priority: priority ?? 0,
          })
          .returning();

        // Format response
        const formattedAssignment: CampaignForm = {
          id: assignment.id,
          campaignId: assignment.campaignId,
          formId: assignment.formId,
          entityType: assignment.entityType,
          priority: assignment.priority,
          createdAt: assignment.createdAt,
          updatedAt: assignment.createdAt, // No updatedAt in schema, using createdAt
        };

        return reply.status(201).send({ campaignForm: formattedAssignment });
      } catch (error) {
        fastify.log.error(error, 'Failed to assign form to campaign');
        return reply.status(500).send({ error: 'Failed to assign form to campaign' });
      }
    }
  );

  /**
   * PATCH /api/v1/campaigns/:campaignId/forms/:assignmentId - Update campaign form assignment
   * Only GM can update. Currently only supports updating priority.
   */
  fastify.patch<{
    Params: { campaignId: string; assignmentId: string };
    Body: UpdateCampaignFormRequest;
  }>(
    '/campaigns/:campaignId/forms/:assignmentId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, assignmentId } = request.params;
      const { priority } = request.body;

      try {
        // Verify campaign exists and user is GM
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        const gmUserIds = campaign.gmUserIds || [];
        const isOwner = campaign.ownerId === request.user.id;
        const isGM = gmUserIds.includes(request.user.id);

        if (!isOwner && !isGM) {
          return reply.status(403).send({ error: 'Only GMs can update campaign forms' });
        }

        // Verify assignment exists
        const [existingAssignment] = await fastify.db
          .select()
          .from(campaignForms)
          .where(and(eq(campaignForms.id, assignmentId), eq(campaignForms.campaignId, campaignId)))
          .limit(1);

        if (!existingAssignment) {
          return reply.status(404).send({ error: 'Form assignment not found' });
        }

        // Build update object
        const updateData: any = {};

        if (priority !== undefined) {
          updateData.priority = priority;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length === 0) {
          return reply.status(400).send({ error: 'No fields to update' });
        }

        // Update assignment
        const [updatedAssignment] = await fastify.db
          .update(campaignForms)
          .set(updateData)
          .where(eq(campaignForms.id, assignmentId))
          .returning();

        // Format response
        const formattedAssignment: CampaignForm = {
          id: updatedAssignment.id,
          campaignId: updatedAssignment.campaignId,
          formId: updatedAssignment.formId,
          entityType: updatedAssignment.entityType,
          priority: updatedAssignment.priority,
          createdAt: updatedAssignment.createdAt,
          updatedAt: updatedAssignment.createdAt, // No updatedAt in schema
        };

        return reply.status(200).send({ campaignForm: formattedAssignment });
      } catch (error) {
        fastify.log.error(error, 'Failed to update campaign form assignment');
        return reply.status(500).send({ error: 'Failed to update campaign form assignment' });
      }
    }
  );

  /**
   * DELETE /api/v1/campaigns/:campaignId/forms/:assignmentId - Remove form from campaign
   * Only GM can remove form assignments
   */
  fastify.delete<{
    Params: { campaignId: string; assignmentId: string };
  }>(
    '/campaigns/:campaignId/forms/:assignmentId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, assignmentId } = request.params;

      try {
        // Verify campaign exists and user is GM
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        const gmUserIds = campaign.gmUserIds || [];
        const isOwner = campaign.ownerId === request.user.id;
        const isGM = gmUserIds.includes(request.user.id);

        if (!isOwner && !isGM) {
          return reply.status(403).send({ error: 'Only GMs can remove campaign forms' });
        }

        // Verify assignment exists
        const [existingAssignment] = await fastify.db
          .select()
          .from(campaignForms)
          .where(and(eq(campaignForms.id, assignmentId), eq(campaignForms.campaignId, campaignId)))
          .limit(1);

        if (!existingAssignment) {
          return reply.status(404).send({ error: 'Form assignment not found' });
        }

        // Delete assignment
        await fastify.db.delete(campaignForms).where(eq(campaignForms.id, assignmentId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to remove form from campaign');
        return reply.status(500).send({ error: 'Failed to remove form from campaign' });
      }
    }
  );

  /**
   * GET /api/v1/campaigns/:campaignId/forms/active/:entityType - Get active form for entity type
   * Returns highest priority form for this entity type, considering licenses
   * Falls back to default form if none assigned
   */
  fastify.get<{
    Params: { campaignId: string; entityType: string };
  }>(
    '/campaigns/:campaignId/forms/active/:entityType',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, entityType } = request.params;

      try {
        // Verify campaign exists and user has access
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // Get all form assignments for this entity type, ordered by priority
        const assignments = await fastify.db
          .select({
            form: forms,
          })
          .from(campaignForms)
          .leftJoin(forms, eq(campaignForms.formId, forms.id))
          .where(and(eq(campaignForms.campaignId, campaignId), eq(campaignForms.entityType, entityType)))
          .orderBy(desc(campaignForms.priority));

        // Check each form for license access (if premium)
        for (const assignment of assignments) {
          if (!assignment.form) continue;

          const form = assignment.form;

          // If form is free or user owns it, use it
          if (form.licenseType === 'free' || form.ownerId === request.user.id) {
            const formattedForm: FormDefinition = {
              id: form.id,
              name: form.name,
              description: form.description ?? undefined,
              gameSystemId: form.gameSystemId,
              entityType: form.entityType,
              version: parseInt(form.version, 10),
              isDefault: form.isDefault,
              isLocked: form.isLocked,
              visibility: form.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
              licenseType: (form.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
              price: form.price ? parseFloat(form.price) : undefined,
              ownerId: form.ownerId,
              layout: form.layout as any,
              fragments: form.fragments as any,
              styles: form.styles as any,
              computedFields: form.computedFields as any,
              scripts: form.scripts ? (form.scripts as any) : undefined,
              createdAt: form.createdAt,
              updatedAt: form.updatedAt,
            };

            return reply.status(200).send({ form: formattedForm });
          }

          // Check for valid license
          const [license] = await fastify.db
            .select()
            .from(formLicenses)
            .where(and(eq(formLicenses.formId, form.id), eq(formLicenses.userId, request.user.id)))
            .limit(1);

          if (license) {
            // Check if license is still valid (not expired)
            if (!license.expiresAt || new Date(license.expiresAt) > new Date()) {
              const formattedForm: FormDefinition = {
                id: form.id,
                name: form.name,
                description: form.description ?? undefined,
                gameSystemId: form.gameSystemId,
                entityType: form.entityType,
                version: parseInt(form.version, 10),
                isDefault: form.isDefault,
                isLocked: form.isLocked,
                visibility: form.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
                licenseType: (form.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
                price: form.price ? parseFloat(form.price) : undefined,
                ownerId: form.ownerId,
                layout: form.layout as any,
                fragments: form.fragments as any,
                styles: form.styles as any,
                computedFields: form.computedFields as any,
                scripts: form.scripts ? (form.scripts as any) : undefined,
                createdAt: form.createdAt,
                updatedAt: form.updatedAt,
              };

              return reply.status(200).send({ form: formattedForm });
            }
          }
        }

        // No valid forms found, fallback to default form for this entity type
        const [defaultForm] = await fastify.db
          .select()
          .from(forms)
          .where(
            and(
              eq(forms.gameSystemId, campaign.gameSystemId || ''),
              eq(forms.entityType, entityType),
              eq(forms.isDefault, true)
            )
          )
          .limit(1);

        if (defaultForm) {
          const formattedForm: FormDefinition = {
            id: defaultForm.id,
            name: defaultForm.name,
            description: defaultForm.description ?? undefined,
            gameSystemId: defaultForm.gameSystemId,
            entityType: defaultForm.entityType,
            version: parseInt(defaultForm.version, 10),
            isDefault: defaultForm.isDefault,
            isLocked: defaultForm.isLocked,
            visibility: defaultForm.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
            licenseType: (defaultForm.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
            price: defaultForm.price ? parseFloat(defaultForm.price) : undefined,
            ownerId: defaultForm.ownerId,
            layout: defaultForm.layout as any,
            fragments: defaultForm.fragments as any,
            styles: defaultForm.styles as any,
            computedFields: defaultForm.computedFields as any,
            scripts: defaultForm.scripts ? (defaultForm.scripts as any) : undefined,
            createdAt: defaultForm.createdAt,
            updatedAt: defaultForm.updatedAt,
          };

          return reply.status(200).send({ form: formattedForm });
        }

        // No form found
        return reply.status(404).send({ error: 'No form found for this entity type' });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch active form');
        return reply.status(500).send({ error: 'Failed to fetch active form' });
      }
    }
  );

  // ============================================================================
  // Form Version History Endpoints
  // ============================================================================

  /**
   * GET /api/v1/forms/:formId/versions - Get version history for a form
   * Returns summary list of all versions (without full layout data)
   */
  fastify.get<{ Params: { formId: string } }>(
    '/forms/:formId/versions',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId } = request.params;

      try {
        // Verify form exists and user has access
        const [form] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!form) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check access: owner or public form
        const isPublic = form.visibility === 'public' || form.visibility === 'marketplace';
        const isOwner = form.ownerId === request.user.id;

        if (!isPublic && !isOwner) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Fetch version history (newest first)
        const versions = await fastify.db
          .select({
            id: formVersions.id,
            formId: formVersions.formId,
            version: formVersions.version,
            changeNotes: formVersions.changeNotes,
            createdBy: formVersions.createdBy,
            createdAt: formVersions.createdAt,
          })
          .from(formVersions)
          .where(eq(formVersions.formId, formId))
          .orderBy(desc(formVersions.version));

        const formattedVersions: FormVersionSummary[] = versions.map((v) => ({
          id: v.id,
          formId: v.formId,
          version: v.version,
          changeNotes: v.changeNotes ?? undefined,
          createdBy: v.createdBy ?? undefined,
          createdAt: v.createdAt,
        }));

        return reply.status(200).send({ versions: formattedVersions });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch form version history');
        return reply.status(500).send({ error: 'Failed to fetch form version history' });
      }
    }
  );

  /**
   * GET /api/v1/forms/:formId/versions/:version - Get specific form version
   * Returns full version data including layout
   */
  fastify.get<{ Params: { formId: string; version: string } }>(
    '/forms/:formId/versions/:version',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId, version } = request.params;
      const versionNumber = parseInt(version, 10);

      if (isNaN(versionNumber)) {
        return reply.status(400).send({ error: 'Invalid version number' });
      }

      try {
        // Verify form exists and user has access
        const [form] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!form) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check access
        const isPublic = form.visibility === 'public' || form.visibility === 'marketplace';
        const isOwner = form.ownerId === request.user.id;

        if (!isPublic && !isOwner) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Fetch specific version
        const [formVersion] = await fastify.db
          .select()
          .from(formVersions)
          .where(
            and(
              eq(formVersions.formId, formId),
              eq(formVersions.version, versionNumber)
            )
          )
          .limit(1);

        if (!formVersion) {
          return reply.status(404).send({ error: 'Version not found' });
        }

        const formattedVersion: FormVersion = {
          id: formVersion.id,
          formId: formVersion.formId,
          version: formVersion.version,
          layout: formVersion.layout as any,
          fragments: (formVersion.fragments || []) as any,
          computedFields: (formVersion.computedFields || []) as any,
          styles: (formVersion.styles || {}) as any,
          scripts: formVersion.scripts ? (formVersion.scripts as any) : undefined,
          changeNotes: formVersion.changeNotes ?? undefined,
          createdBy: formVersion.createdBy ?? undefined,
          createdAt: formVersion.createdAt,
        };

        return reply.status(200).send({ version: formattedVersion });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch form version');
        return reply.status(500).send({ error: 'Failed to fetch form version' });
      }
    }
  );

  /**
   * POST /api/v1/forms/:formId/versions/:version/revert - Revert form to specific version
   * Creates a new version with the content from the specified version
   */
  fastify.post<{
    Params: { formId: string; version: string };
    Body: RevertFormVersionRequest;
  }>(
    '/forms/:formId/versions/:version/revert',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId, version } = request.params;
      const { changeNotes } = request.body;
      const versionNumber = parseInt(version, 10);

      if (isNaN(versionNumber)) {
        return reply.status(400).send({ error: 'Invalid version number' });
      }

      try {
        // Verify form exists and user is owner
        const [form] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!form) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Only owner can revert
        if (form.ownerId !== request.user.id) {
          return reply.status(403).send({ error: 'Only the owner can revert this form' });
        }

        // Prevent reverting locked forms
        if (form.isLocked) {
          return reply.status(403).send({ error: 'Cannot revert locked form' });
        }

        // Fetch the version to revert to
        const [targetVersion] = await fastify.db
          .select()
          .from(formVersions)
          .where(
            and(
              eq(formVersions.formId, formId),
              eq(formVersions.version, versionNumber)
            )
          )
          .limit(1);

        if (!targetVersion) {
          return reply.status(404).send({ error: 'Version not found' });
        }

        // Save current version to history
        const currentVersion = parseInt(form.version, 10);
        await fastify.db.insert(formVersions).values({
          formId: form.id,
          version: currentVersion,
          layout: form.layout,
          fragments: form.fragments,
          computedFields: form.computedFields,
          styles: form.styles,
          scripts: form.scripts,
          changeNotes: `Pre-revert snapshot (before reverting to v${versionNumber})`,
          createdBy: request.user.id,
        });

        // Update form with reverted content
        const newVersion = currentVersion + 1;
        const revertNote = changeNotes || `Reverted to version ${versionNumber}`;

        const [updatedForm] = await fastify.db
          .update(forms)
          .set({
            version: newVersion.toString(),
            layout: targetVersion.layout,
            fragments: targetVersion.fragments,
            computedFields: targetVersion.computedFields,
            styles: targetVersion.styles,
            scripts: targetVersion.scripts,
            updatedAt: new Date(),
          })
          .where(eq(forms.id, formId))
          .returning();

        // Record the revert in history
        await fastify.db.insert(formVersions).values({
          formId: form.id,
          version: newVersion,
          layout: targetVersion.layout,
          fragments: targetVersion.fragments,
          computedFields: targetVersion.computedFields,
          styles: targetVersion.styles,
          scripts: targetVersion.scripts,
          changeNotes: revertNote,
          createdBy: request.user.id,
        });

        // Cleanup old versions if exceeding limit
        const versionCount = await fastify.db
          .select({ id: formVersions.id })
          .from(formVersions)
          .where(eq(formVersions.formId, formId));

        if (versionCount.length > MAX_VERSION_HISTORY) {
          const versionsToDelete = await fastify.db
            .select({ id: formVersions.id })
            .from(formVersions)
            .where(eq(formVersions.formId, formId))
            .orderBy(formVersions.createdAt)
            .limit(versionCount.length - MAX_VERSION_HISTORY);

          if (versionsToDelete.length > 0) {
            const idsToDelete = versionsToDelete.map(v => v.id);
            await fastify.db
              .delete(formVersions)
              .where(sql`${formVersions.id} = ANY(${idsToDelete})`);
          }
        }

        // Format response
        const formattedForm: FormDefinition = {
          id: updatedForm.id,
          name: updatedForm.name,
          description: updatedForm.description ?? undefined,
          gameSystemId: updatedForm.gameSystemId,
          entityType: updatedForm.entityType,
          version: parseInt(updatedForm.version, 10),
          isDefault: updatedForm.isDefault,
          isLocked: updatedForm.isLocked,
          visibility: updatedForm.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
          licenseType: (updatedForm.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
          price: updatedForm.price ? parseFloat(updatedForm.price) : undefined,
          ownerId: updatedForm.ownerId,
          layout: updatedForm.layout as any,
          fragments: updatedForm.fragments as any,
          styles: updatedForm.styles as any,
          computedFields: updatedForm.computedFields as any,
          scripts: updatedForm.scripts ? (updatedForm.scripts as any) : undefined,
          createdAt: updatedForm.createdAt,
          updatedAt: updatedForm.updatedAt,
        };

        return reply.status(200).send({ form: formattedForm });
      } catch (error) {
        fastify.log.error(error, 'Failed to revert form version');
        return reply.status(500).send({ error: 'Failed to revert form version' });
      }
    }
  );

  // ============================================================================
  // Form Import/Export Endpoints
  // ============================================================================

  /**
   * GET /api/v1/forms/:formId/export - Export a form as JSON
   * Returns complete form definition with metadata for standalone use
   */
  fastify.get<{ Params: { formId: string } }>(
    '/forms/:formId/export',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { formId } = request.params;

      try {
        // Fetch form
        const [form] = await fastify.db
          .select()
          .from(forms)
          .where(eq(forms.id, formId))
          .limit(1);

        if (!form) {
          return reply.status(404).send({ error: 'Form not found' });
        }

        // Check access: public form OR user owns it
        const isPublic = form.visibility === 'public' || form.visibility === 'marketplace';
        const isOwner = form.ownerId === request.user.id;

        if (!isPublic && !isOwner) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Build export object
        const exportData: FormExport = {
          exportVersion: '1.0',
          exportedAt: new Date().toISOString(),
          form: {
            name: form.name,
            description: form.description ?? undefined,
            entityType: form.entityType,
            gameSystemId: form.gameSystemId,
            version: parseInt(form.version, 10),
            layout: form.layout as any,
            fragments: form.fragments as any,
            computedFields: form.computedFields as any,
            styles: form.styles as any,
            scripts: form.scripts ? (form.scripts as any) : undefined,
          },
          metadata: {
            exportedBy: request.user.username || request.user.email,
            sourceUrl: `${process.env.BASE_URL || 'http://localhost'}/forms/${formId}`,
            license: form.licenseType || 'free',
            notes: `Exported from VTT Platform on ${new Date().toLocaleDateString()}`,
          },
        };

        return reply.status(200).send({ export: exportData });
      } catch (error) {
        fastify.log.error(error, 'Failed to export form');
        return reply.status(500).send({ error: 'Failed to export form' });
      }
    }
  );

  /**
   * POST /api/v1/game-systems/:systemId/forms/import - Import a form from JSON
   * Validates and imports form with conflict resolution
   */
  fastify.post<{
    Params: { systemId: string };
    Body: ImportFormRequest;
  }>(
    '/game-systems/:systemId/forms/import',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { systemId } = request.params;
      const { formData, conflictResolution } = request.body;

      try {
        // Validate export version
        if (formData.exportVersion !== '1.0') {
          return reply.status(400).send({
            error: `Unsupported export version: ${formData.exportVersion}`,
          });
        }

        // Validate required fields
        if (!formData.form.name || !formData.form.entityType) {
          return reply.status(400).send({
            error: 'Invalid form data: name and entityType are required',
          });
        }

        // Check for game system compatibility
        const warnings: string[] = [];
        const errors: string[] = [];
        const conflicts: FormImportValidation['conflicts'] = {};

        if (formData.form.gameSystemId && formData.form.gameSystemId !== systemId) {
          conflicts.gameSystemMismatch = true;
          conflicts.gameSystemId = formData.form.gameSystemId;
          warnings.push(
            `Form was created for game system ${formData.form.gameSystemId} but importing to ${systemId}`
          );
        }

        // Check for name conflicts
        const [existingForm] = await fastify.db
          .select()
          .from(forms)
          .where(
            and(
              eq(forms.gameSystemId, systemId),
              eq(forms.name, formData.form.name),
              eq(forms.ownerId, request.user.id)
            )
          )
          .limit(1);

        let finalName = formData.form.name;
        if (existingForm) {
          conflicts.nameConflict = true;
          if (conflictResolution?.nameConflict === 'rename') {
            finalName = `${formData.form.name} (Imported)`;
          } else if (conflictResolution?.nameConflict !== 'replace') {
            errors.push(`Form with name "${formData.form.name}" already exists`);
          }
        }

        // Check for fragment ID conflicts (regenerate if needed)
        let finalLayout = formData.form.layout;
        let finalFragments = formData.form.fragments;

        if (conflictResolution?.fragmentConflict === 'regenerate') {
          // Regenerate all fragment IDs
          const oldToNewIds = new Map<string, string>();

          finalFragments = formData.form.fragments.map((fragment) => {
            const newId = `fragment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            oldToNewIds.set(fragment.id, newId);
            return { ...fragment, id: newId };
          });

          // Update fragment references in layout
          const updateFragmentRefs = (nodes: any[]): any[] => {
            return nodes.map((node) => {
              if (node.type === 'fragmentRef' && oldToNewIds.has(node.fragmentId)) {
                return { ...node, fragmentId: oldToNewIds.get(node.fragmentId) };
              }
              if (node.children) {
                return { ...node, children: updateFragmentRefs(node.children) };
              }
              if (node.tabs) {
                return {
                  ...node,
                  tabs: node.tabs.map((tab: any) => ({
                    ...tab,
                    children: updateFragmentRefs(tab.children),
                  })),
                };
              }
              if (node.then) {
                node = { ...node, then: updateFragmentRefs(node.then) };
              }
              if (node.else) {
                node = { ...node, else: updateFragmentRefs(node.else) };
              }
              if (node.itemTemplate) {
                node = { ...node, itemTemplate: updateFragmentRefs(node.itemTemplate) };
              }
              return node;
            });
          };

          finalLayout = updateFragmentRefs(formData.form.layout);
        }

        // If there are errors, return validation result
        if (errors.length > 0) {
          return reply.status(400).send({
            validation: {
              valid: false,
              warnings,
              errors,
              conflicts,
            },
          });
        }

        // If replacing, delete the existing form
        if (existingForm && conflictResolution?.nameConflict === 'replace') {
          await fastify.db.delete(forms).where(eq(forms.id, existingForm.id));
        }

        // Create the imported form
        const [newForm] = await fastify.db
          .insert(forms)
          .values({
            name: finalName.trim(),
            description: formData.form.description ?? null,
            gameSystemId: systemId,
            entityType: formData.form.entityType.trim(),
            version: '1',
            isDefault: false,
            isLocked: false,
            visibility: 'private',
            licenseType: 'free',
            price: '0.00',
            ownerId: request.user.id,
            layout: finalLayout,
            fragments: finalFragments,
            styles: formData.form.styles ?? {},
            computedFields: formData.form.computedFields ?? [],
            scripts: formData.form.scripts ?? [],
          })
          .returning();

        // Format response
        const formattedForm: FormDefinition = {
          id: newForm.id,
          name: newForm.name,
          description: newForm.description ?? undefined,
          gameSystemId: newForm.gameSystemId,
          entityType: newForm.entityType,
          version: parseInt(newForm.version, 10),
          isDefault: newForm.isDefault,
          isLocked: newForm.isLocked,
          visibility: newForm.visibility as 'private' | 'campaign' | 'public' | 'marketplace',
          licenseType: (newForm.licenseType || undefined) as 'free' | 'paid' | 'subscription' | undefined,
          price: newForm.price ? parseFloat(newForm.price) : undefined,
          ownerId: newForm.ownerId,
          layout: newForm.layout as any,
          fragments: newForm.fragments as any,
          styles: newForm.styles as any,
          computedFields: newForm.computedFields as any,
          scripts: newForm.scripts ? (newForm.scripts as any) : undefined,
          createdAt: newForm.createdAt,
          updatedAt: newForm.updatedAt,
        };

        return reply.status(201).send({
          form: formattedForm,
          validation: {
            valid: true,
            warnings,
            errors: [],
            conflicts,
          },
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to import form');
        return reply.status(500).send({ error: 'Failed to import form' });
      }
    }
  );
};

export default formsRoute;
