import type { FastifyPluginAsync } from 'fastify';
import {
  modules,
  moduleEntities,
  entityProperties,
  propertyDefinitions,
  validationErrors,
  campaignModules,
  campaigns,
} from '@vtt/database';
import { eq, and, sql, ilike, inArray, isNull, desc } from 'drizzle-orm';
import type {
  Module,
  ModuleResponse,
  ModulesListResponse,
  ModuleValidationResponse,
  ModuleEntity,
  ModuleEntityResponse,
  ModuleEntitiesListResponse,
  ModuleEntityWithProperties,
  ModuleEntityFullResponse,
  EntitySearchParams,
  CampaignModule,
  AddModuleToCampaignInput,
  UpdateCampaignModuleInput,
  PropertyDefinition,
  ValidationError,
  ValidationErrorsResponse,
  GetValidationErrorsParams,
} from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';
import { ModuleLoaderService } from '../../../services/moduleLoader.js';
import { moduleValidatorService } from '../../../services/moduleValidator.js';
import { getScheduler } from '../../../services/validationScheduler.js';

/**
 * Module API routes
 * Handles module management, entity browsing, and campaign-module relationships
 */
const modulesRoute: FastifyPluginAsync = async (fastify) => {
  const moduleLoader = new ModuleLoaderService();

  // =====================================================
  // MODULE MANAGEMENT ROUTES
  // =====================================================

  /**
   * GET /api/v1/modules - List all modules (with filtering)
   * Returns modules with optional filtering by game system, validation status, etc.
   */
  fastify.get<{
    Querystring: {
      gameSystemId?: string;
      validationStatus?: string;
      isActive?: string;
      page?: string;
      pageSize?: string;
    };
  }>('/modules', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    try {
      const {
        gameSystemId,
        validationStatus,
        isActive,
        page = '1',
        pageSize = '50',
      } = request.query;

      const pageNum = parseInt(page, 10);
      const pageSizeNum = parseInt(pageSize, 10);
      const offset = (pageNum - 1) * pageSizeNum;

      // Build where conditions
      const whereConditions = [];
      if (gameSystemId) {
        whereConditions.push(eq(modules.gameSystemId, gameSystemId));
      }
      if (validationStatus) {
        whereConditions.push(eq(modules.validationStatus, validationStatus));
      }
      if (isActive !== undefined) {
        whereConditions.push(eq(modules.isActive, isActive === 'true'));
      }

      // Get total count
      const countQuery = whereConditions.length > 0
        ? fastify.db.select({ count: sql<number>`count(*)::int` }).from(modules).where(and(...whereConditions))
        : fastify.db.select({ count: sql<number>`count(*)::int` }).from(modules);

      const [countResult] = await countQuery;
      const total = countResult?.count || 0;

      // Get modules
      const modulesQuery = whereConditions.length > 0
        ? fastify.db.select().from(modules).where(and(...whereConditions))
        : fastify.db.select().from(modules);

      const moduleList = await modulesQuery
        .orderBy(modules.name)
        .limit(pageSizeNum)
        .offset(offset);

      const response: ModulesListResponse = {
        modules: moduleList as Module[],
        total,
      };

      return reply.status(200).send(response);
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch modules');
      return reply.status(500).send({ error: 'Failed to fetch modules' });
    }
  });

  /**
   * GET /api/v1/modules/:moduleId - Get module details
   * Returns detailed information about a specific module
   */
  fastify.get<{ Params: { moduleId: string } }>(
    '/modules/:moduleId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;

      try {
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        const response: ModuleResponse = {
          module: module as Module,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch module');
        return reply.status(500).send({ error: 'Failed to fetch module' });
      }
    }
  );

  /**
   * POST /api/v1/modules/load - Load module from file path
   * Loads a module from the file system into the database
   */
  fastify.post<{
    Body: {
      modulePath: string;
      validate?: boolean;
      skipInvalid?: boolean;
    };
  }>('/modules/load', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const { modulePath, validate = true, skipInvalid = false } = request.body;

    if (!modulePath) {
      return reply.status(400).send({ error: 'Module path is required' });
    }

    try {
      const loadedModule = await moduleLoader.loadModule(
        fastify.db,
        modulePath,
        {
          validate,
          skipInvalid,
          authorUserId: request.user.id,
        }
      );

      const response: ModuleResponse = {
        module: loadedModule,
      };

      return reply.status(201).send(response);
    } catch (error) {
      fastify.log.error(error, 'Failed to load module');
      return reply.status(500).send({
        error: 'Failed to load module',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/v1/modules/:moduleId/reload - Reload module from source
   * Reloads a module from its source file, updating entities and properties
   */
  fastify.post<{ Params: { moduleId: string } }>(
    '/modules/:moduleId/reload',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;

      try {
        // Find module
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        if (!module.sourcePath) {
          return reply.status(400).send({
            error: 'Module has no source path and cannot be reloaded',
          });
        }

        const reloadedModule = await moduleLoader.reloadModule(
          fastify.db,
          module.moduleId,
          module.sourcePath
        );

        const response: ModuleResponse = {
          module: reloadedModule,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to reload module');
        return reply.status(500).send({
          error: 'Failed to reload module',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * DELETE /api/v1/modules/:moduleId - Unload module
   * Removes a module and all its entities from the database
   */
  fastify.delete<{ Params: { moduleId: string } }>(
    '/modules/:moduleId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;

      try {
        // Find module
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        // Check if module is locked
        if (module.isLocked) {
          return reply.status(403).send({
            error: 'Module is locked and cannot be deleted',
          });
        }

        // Check if module is in use by any campaigns
        const campaignUsage = await fastify.db
          .select()
          .from(campaignModules)
          .where(eq(campaignModules.moduleId, moduleId))
          .limit(1);

        if (campaignUsage.length > 0) {
          return reply.status(409).send({
            error: 'Module is in use by one or more campaigns and cannot be deleted',
          });
        }

        await moduleLoader.unloadModule(fastify.db, module.moduleId);

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to unload module');
        return reply.status(500).send({ error: 'Failed to unload module' });
      }
    }
  );

  /**
   * POST /api/v1/modules/:moduleId/validate - Validate module
   * Runs validation on a module and returns results
   */
  fastify.post<{ Params: { moduleId: string } }>(
    '/modules/:moduleId/validate',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;

      try {
        // Get module status (includes validation info)
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        // Get validation status
        const status = await moduleLoader.getModuleStatus(fastify.db, module.moduleId);

        const response: ModuleValidationResponse = {
          moduleId: module.moduleId,
          status: status.status,
          errors: status.errors,
          validatedAt: module.validatedAt || new Date(),
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to validate module');
        return reply.status(500).send({ error: 'Failed to validate module' });
      }
    }
  );

  // =====================================================
  // MODULE-ENTITY ROUTES
  // =====================================================

  /**
   * GET /api/v1/modules/:moduleId/entities - List entities in module
   * Returns paginated list of entities for a module
   */
  fastify.get<{
    Params: { moduleId: string };
    Querystring: {
      entityType?: string;
      page?: string;
      pageSize?: string;
    };
  }>(
    '/modules/:moduleId/entities',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;
      const { entityType, page = '1', pageSize = '50' } = request.query;

      try {
        // Verify module exists
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        const pageNum = parseInt(page, 10);
        const pageSizeNum = parseInt(pageSize, 10);
        const offset = (pageNum - 1) * pageSizeNum;

        // Build where conditions
        const whereConditions = [eq(moduleEntities.moduleId, moduleId)];
        if (entityType) {
          whereConditions.push(eq(moduleEntities.entityType, entityType));
        }

        // Get total count
        const [countResult] = await fastify.db
          .select({ count: sql<number>`count(*)::int` })
          .from(moduleEntities)
          .where(and(...whereConditions));

        const total = countResult?.count || 0;

        // Get entities
        const entities = await fastify.db
          .select()
          .from(moduleEntities)
          .where(and(...whereConditions))
          .orderBy(moduleEntities.name)
          .limit(pageSizeNum)
          .offset(offset);

        const response: ModuleEntitiesListResponse = {
          entities: entities as ModuleEntity[],
          total,
          page: pageNum,
          pageSize: pageSizeNum,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch entities');
        return reply.status(500).send({ error: 'Failed to fetch entities' });
      }
    }
  );

  /**
   * GET /api/v1/modules/:moduleId/entities/:entityId - Get entity with properties
   * Returns a complete entity with all its properties reconstructed
   */
  fastify.get<{ Params: { moduleId: string; entityId: string } }>(
    '/modules/:moduleId/entities/:entityId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId, entityId } = request.params;

      try {
        // Get entity
        const [entity] = await fastify.db
          .select()
          .from(moduleEntities)
          .where(
            and(
              eq(moduleEntities.moduleId, moduleId),
              eq(moduleEntities.id, entityId)
            )
          )
          .limit(1);

        if (!entity) {
          return reply.status(404).send({ error: 'Entity not found' });
        }

        // Get properties
        const properties = await fastify.db
          .select()
          .from(entityProperties)
          .where(eq(entityProperties.entityId, entityId))
          .orderBy(entityProperties.propertyKey, entityProperties.arrayIndex);

        // Reconstruct properties object
        const reconstructedProperties = moduleLoader.reconstructFromProperties(
          properties as any[]
        );

        const entityWithProperties: ModuleEntityWithProperties = {
          ...(entity as ModuleEntity),
          properties: reconstructedProperties,
        };

        const response: ModuleEntityFullResponse = {
          entity: entityWithProperties,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch entity');
        return reply.status(500).send({ error: 'Failed to fetch entity' });
      }
    }
  );

  /**
   * GET /api/v1/modules/:moduleId/entities/search - Search entities
   * Full-text search across module entities
   */
  fastify.get<{
    Params: { moduleId: string };
    Querystring: EntitySearchParams;
  }>(
    '/modules/:moduleId/entities/search',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;
      const {
        query,
        entityType,
        tags,
        validationStatus,
        page = 1,
        pageSize = 50,
        sortBy = 'name',
        sortOrder = 'asc',
      } = request.query;

      try {
        // Verify module exists
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
        const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
        const offset = (pageNum - 1) * pageSizeNum;

        // Build where conditions
        const whereConditions = [eq(moduleEntities.moduleId, moduleId)];

        if (query) {
          whereConditions.push(
            sql`to_tsvector('english', ${moduleEntities.searchText}) @@ plainto_tsquery('english', ${query})`
          );
        }

        if (entityType) {
          if (Array.isArray(entityType)) {
            whereConditions.push(inArray(moduleEntities.entityType, entityType));
          } else {
            whereConditions.push(eq(moduleEntities.entityType, entityType));
          }
        }

        if (tags && tags.length > 0) {
          whereConditions.push(sql`${moduleEntities.tags} && ${tags}`);
        }

        if (validationStatus) {
          whereConditions.push(eq(moduleEntities.validationStatus, validationStatus));
        }

        // Get total count
        const [countResult] = await fastify.db
          .select({ count: sql<number>`count(*)::int` })
          .from(moduleEntities)
          .where(and(...whereConditions));

        const total = countResult?.count || 0;

        // Build order by clause
        let orderByClause;
        if (query) {
          // Sort by relevance if searching
          orderByClause = sql`ts_rank(to_tsvector('english', ${moduleEntities.searchText}), plainto_tsquery('english', ${query})) DESC`;
        } else {
          // Sort by specified field
          const orderField =
            sortBy === 'name' ? moduleEntities.name :
            sortBy === 'entityType' ? moduleEntities.entityType :
            sortBy === 'createdAt' ? moduleEntities.createdAt :
            sortBy === 'updatedAt' ? moduleEntities.updatedAt :
            moduleEntities.name;

          orderByClause = sortOrder === 'desc' ? desc(orderField) : orderField;
        }

        // Get entities
        const entities = await fastify.db
          .select()
          .from(moduleEntities)
          .where(and(...whereConditions))
          .orderBy(orderByClause)
          .limit(pageSizeNum)
          .offset(offset);

        const response: ModuleEntitiesListResponse = {
          entities: entities as ModuleEntity[],
          total,
          page: pageNum,
          pageSize: pageSizeNum,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to search entities');
        return reply.status(500).send({ error: 'Failed to search entities' });
      }
    }
  );

  // =====================================================
  // CAMPAIGN-MODULE ROUTES
  // =====================================================

  /**
   * GET /api/v1/campaigns/:campaignId/modules - Get modules for campaign
   * Returns all modules loaded for a campaign
   */
  fastify.get<{ Params: { campaignId: string } }>(
    '/campaigns/:campaignId/modules',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;

      try {
        // Verify campaign exists
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // TODO: Check if user has access to this campaign

        // Get campaign modules with module details
        const campaignModulesList = await fastify.db
          .select({
            id: campaignModules.id,
            campaignId: campaignModules.campaignId,
            moduleId: campaignModules.moduleId,
            loadOrder: campaignModules.loadOrder,
            isActive: campaignModules.isActive,
            overrides: campaignModules.overrides,
            addedAt: campaignModules.addedAt,
            addedBy: campaignModules.addedBy,
            data: campaignModules.data,
            module: modules,
          })
          .from(campaignModules)
          .innerJoin(modules, eq(campaignModules.moduleId, modules.id))
          .where(eq(campaignModules.campaignId, campaignId))
          .orderBy(campaignModules.loadOrder);

        return reply.status(200).send({
          campaignModules: campaignModulesList,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch campaign modules');
        return reply.status(500).send({ error: 'Failed to fetch campaign modules' });
      }
    }
  );

  /**
   * POST /api/v1/campaigns/:campaignId/modules - Add module to campaign
   * Links a module to a campaign with load order and settings
   */
  fastify.post<{
    Params: { campaignId: string };
    Body: AddModuleToCampaignInput;
  }>(
    '/campaigns/:campaignId/modules',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId } = request.params;
      const { moduleId, loadOrder = 0, isActive = true, overrides = {} } = request.body;

      if (!moduleId) {
        return reply.status(400).send({ error: 'Module ID is required' });
      }

      try {
        // Verify campaign exists
        const [campaign] = await fastify.db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, campaignId))
          .limit(1);

        if (!campaign) {
          return reply.status(404).send({ error: 'Campaign not found' });
        }

        // Verify module exists
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        // Check game system compatibility
        if (module.gameSystemId !== campaign.gameSystemId) {
          return reply.status(400).send({
            error: `Module game system (${module.gameSystemId}) does not match campaign game system (${campaign.gameSystemId})`,
          });
        }

        // Check if module is already added
        const [existing] = await fastify.db
          .select()
          .from(campaignModules)
          .where(
            and(
              eq(campaignModules.campaignId, campaignId),
              eq(campaignModules.moduleId, moduleId)
            )
          )
          .limit(1);

        if (existing) {
          return reply.status(409).send({
            error: 'Module is already added to this campaign',
          });
        }

        // TODO: Check if user has permission to modify this campaign

        // Add module to campaign
        const [newCampaignModule] = await fastify.db
          .insert(campaignModules)
          .values({
            campaignId,
            moduleId,
            loadOrder,
            isActive,
            overrides,
            addedBy: request.user.id,
          })
          .returning();

        return reply.status(201).send({
          campaignModule: newCampaignModule as CampaignModule,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to add module to campaign');
        return reply.status(500).send({ error: 'Failed to add module to campaign' });
      }
    }
  );

  /**
   * DELETE /api/v1/campaigns/:campaignId/modules/:moduleId - Remove module from campaign
   * Removes a module from a campaign
   */
  fastify.delete<{ Params: { campaignId: string; moduleId: string } }>(
    '/campaigns/:campaignId/modules/:moduleId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, moduleId } = request.params;

      try {
        // Verify campaign module exists
        const [campaignModule] = await fastify.db
          .select()
          .from(campaignModules)
          .where(
            and(
              eq(campaignModules.campaignId, campaignId),
              eq(campaignModules.moduleId, moduleId)
            )
          )
          .limit(1);

        if (!campaignModule) {
          return reply.status(404).send({ error: 'Campaign module not found' });
        }

        // TODO: Check if user has permission to modify this campaign

        // Remove module from campaign
        await fastify.db
          .delete(campaignModules)
          .where(eq(campaignModules.id, campaignModule.id));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to remove module from campaign');
        return reply.status(500).send({ error: 'Failed to remove module from campaign' });
      }
    }
  );

  /**
   * PATCH /api/v1/campaigns/:campaignId/modules/:moduleId - Update load order/settings
   * Updates campaign-module settings like load order and overrides
   */
  fastify.patch<{
    Params: { campaignId: string; moduleId: string };
    Body: UpdateCampaignModuleInput;
  }>(
    '/campaigns/:campaignId/modules/:moduleId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { campaignId, moduleId } = request.params;
      const updates = request.body;

      try {
        // Verify campaign module exists
        const [campaignModule] = await fastify.db
          .select()
          .from(campaignModules)
          .where(
            and(
              eq(campaignModules.campaignId, campaignId),
              eq(campaignModules.moduleId, moduleId)
            )
          )
          .limit(1);

        if (!campaignModule) {
          return reply.status(404).send({ error: 'Campaign module not found' });
        }

        // TODO: Check if user has permission to modify this campaign

        // Build update object
        const updateData: any = {};

        if (updates.loadOrder !== undefined) {
          updateData.loadOrder = updates.loadOrder;
        }
        if (updates.isActive !== undefined) {
          updateData.isActive = updates.isActive;
        }
        if (updates.overrides !== undefined) {
          updateData.overrides = updates.overrides;
        }

        // Update campaign module
        const [updatedCampaignModule] = await fastify.db
          .update(campaignModules)
          .set(updateData)
          .where(eq(campaignModules.id, campaignModule.id))
          .returning();

        return reply.status(200).send({
          campaignModule: updatedCampaignModule as CampaignModule,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to update campaign module');
        return reply.status(500).send({ error: 'Failed to update campaign module' });
      }
    }
  );

  // =====================================================
  // PROPERTY DEFINITIONS ROUTES
  // =====================================================

  /**
   * GET /api/v1/game-systems/:systemId/property-definitions - All definitions
   * Returns all property definitions for a game system
   */
  fastify.get<{
    Params: { systemId: string };
    Querystring: { entityType?: string };
  }>(
    '/game-systems/:systemId/property-definitions',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { systemId } = request.params;
      const { entityType } = request.query;

      try {
        const whereConditions = [eq(propertyDefinitions.gameSystemId, systemId)];

        if (entityType) {
          whereConditions.push(eq(propertyDefinitions.entityType, entityType));
        }

        const definitions = await fastify.db
          .select()
          .from(propertyDefinitions)
          .where(and(...whereConditions))
          .orderBy(propertyDefinitions.entityType, propertyDefinitions.sort, propertyDefinitions.name);

        return reply.status(200).send({
          propertyDefinitions: definitions as PropertyDefinition[],
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch property definitions');
        return reply.status(500).send({ error: 'Failed to fetch property definitions' });
      }
    }
  );

  /**
   * GET /api/v1/game-systems/:systemId/property-definitions/:entityType - By entity type
   * Returns property definitions for a specific entity type
   */
  fastify.get<{ Params: { systemId: string; entityType: string } }>(
    '/game-systems/:systemId/property-definitions/:entityType',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { systemId, entityType } = request.params;

      try {
        const definitions = await fastify.db
          .select()
          .from(propertyDefinitions)
          .where(
            and(
              eq(propertyDefinitions.gameSystemId, systemId),
              eq(propertyDefinitions.entityType, entityType)
            )
          )
          .orderBy(propertyDefinitions.sort, propertyDefinitions.name);

        return reply.status(200).send({
          propertyDefinitions: definitions as PropertyDefinition[],
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch property definitions');
        return reply.status(500).send({ error: 'Failed to fetch property definitions' });
      }
    }
  );

  // =====================================================
  // VALIDATION ERRORS ROUTES
  // =====================================================

  /**
   * GET /api/v1/modules/:moduleId/validation-errors - Get all errors for module
   * Returns validation errors for a module with optional filtering
   */
  fastify.get<{
    Params: { moduleId: string };
    Querystring: GetValidationErrorsParams;
  }>(
    '/modules/:moduleId/validation-errors',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;
      const {
        entityId,
        severity,
        includeResolved = false,
        page = 1,
        pageSize = 50,
      } = request.query;

      try {
        // Verify module exists
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
        const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
        const offset = (pageNum - 1) * pageSizeNum;

        // Build where conditions
        const whereConditions = [eq(validationErrors.moduleId, moduleId)];

        if (!includeResolved) {
          whereConditions.push(eq(validationErrors.isResolved, false));
        }

        if (entityId) {
          whereConditions.push(eq(validationErrors.entityId, entityId));
        }

        if (severity) {
          if (Array.isArray(severity)) {
            whereConditions.push(inArray(validationErrors.severity, severity));
          } else {
            whereConditions.push(eq(validationErrors.severity, severity));
          }
        }

        // Get total count
        const [countResult] = await fastify.db
          .select({ count: sql<number>`count(*)::int` })
          .from(validationErrors)
          .where(and(...whereConditions));

        const total = countResult?.count || 0;

        // Get errors
        const errors = await fastify.db
          .select()
          .from(validationErrors)
          .where(and(...whereConditions))
          .orderBy(desc(validationErrors.severity), validationErrors.createdAt)
          .limit(pageSizeNum)
          .offset(offset);

        const response: ValidationErrorsResponse = {
          errors: errors as ValidationError[],
          total,
          page: pageNum,
          pageSize: pageSizeNum,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch validation errors');
        return reply.status(500).send({ error: 'Failed to fetch validation errors' });
      }
    }
  );

  /**
   * PATCH /api/v1/validation-errors/:errorId/resolve - Mark error as resolved
   * Marks a validation error as resolved with an optional note
   */
  fastify.patch<{
    Params: { errorId: string };
    Body: { note?: string };
  }>(
    '/validation-errors/:errorId/resolve',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { errorId } = request.params;
      const { note } = request.body;

      try {
        // Verify error exists
        const [error] = await fastify.db
          .select()
          .from(validationErrors)
          .where(eq(validationErrors.id, errorId))
          .limit(1);

        if (!error) {
          return reply.status(404).send({ error: 'Validation error not found' });
        }

        // Update error
        const [updatedError] = await fastify.db
          .update(validationErrors)
          .set({
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: request.user.id,
            resolutionNote: note || null,
            updatedAt: new Date(),
          })
          .where(eq(validationErrors.id, errorId))
          .returning();

        return reply.status(200).send({
          error: updatedError as ValidationError,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to resolve validation error');
        return reply.status(500).send({ error: 'Failed to resolve validation error' });
      }
    }
  );
};

export default modulesRoute;
