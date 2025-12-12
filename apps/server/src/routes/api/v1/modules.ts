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
import { eq, and, sql, ilike, inArray, isNull, desc, getTableColumns } from 'drizzle-orm';
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
  EntityGroup,
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
 * Helper function to generate spell level labels
 */
function getSpellLevelLabel(level: number): string {
  if (level === 0) return 'Cantrip';
  if (level === 1) return '1st Level';
  if (level === 2) return '2nd Level';
  if (level === 3) return '3rd Level';
  return `${level}th Level`;
}

/**
 * Helper function to get readable item type labels
 */
function getItemTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    // Weapon types
    'simple_melee': 'Simple Melee',
    'simple_ranged': 'Simple Ranged',
    'martial_melee': 'Martial Melee',
    'martial_ranged': 'Martial Ranged',
    // Armor types
    'light': 'Light Armor',
    'medium': 'Medium Armor',
    'heavy': 'Heavy Armor',
    'shield': 'Shields',
    // Tool types
    'artisan': 'Artisan Tools',
    'gaming': 'Gaming Sets',
    'musical': 'Musical Instruments',
    // Consumable types
    'potion': 'Potions',
    'scroll': 'Scrolls',
    'wand': 'Wands',
    'rod': 'Rods',
    'staff': 'Staves',
    'other': 'Other',
  };
  return labels[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Helper function to generate challenge rating labels
 */
function getCRLabel(cr: string): string {
  if (cr === '0') return 'CR 0';
  if (cr === '0.125' || cr === '1/8') return 'CR 1/8';
  if (cr === '0.25' || cr === '1/4') return 'CR 1/4';
  if (cr === '0.5' || cr === '1/2') return 'CR 1/2';
  return `CR ${cr}`;
}

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
  fastify.post<{
    Params: { moduleId: string };
    Body: { force?: boolean; async?: boolean };
  }>(
    '/modules/:moduleId/validate',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId } = request.params;
      const { force = false, async = false } = request.body || {};

      try {
        // Get module
        const [module] = await fastify.db
          .select()
          .from(modules)
          .where(eq(modules.id, moduleId))
          .limit(1);

        if (!module) {
          return reply.status(404).send({ error: 'Module not found' });
        }

        // Check if already validated recently
        if (!force && module.validatedAt) {
          const hoursSinceValidation =
            (Date.now() - new Date(module.validatedAt).getTime()) / (1000 * 60 * 60);

          if (hoursSinceValidation < 1) {
            // Return cached validation status
            const status = await moduleValidatorService.getValidationSummary(
              fastify.db,
              moduleId
            );

            return reply.status(200).send({
              moduleId: module.moduleId,
              status: status.status,
              errors: status.moduleIssues,
              validatedAt: module.validatedAt,
              cached: true,
            });
          }
        }

        // Run async validation if requested
        if (async) {
          try {
            const scheduler = getScheduler();
            const jobId = await scheduler.scheduleValidation(moduleId, true);

            return reply.status(202).send({
              message: 'Validation scheduled',
              jobId,
            });
          } catch (error) {
            // Scheduler not available, fall back to sync validation
            fastify.log.warn('Validation scheduler not available, running sync validation');
          }
        }

        // Run synchronous validation
        const result = await moduleValidatorService.revalidateModuleFromDb(
          fastify.db,
          moduleId
        );

        const response: ModuleValidationResponse = {
          moduleId: module.moduleId,
          status: result.valid ? 'valid' : 'invalid',
          errors: result.errors.map((err) => ({
            errorType: err.type,
            severity: err.severity,
            message: err.message,
            entityId: err.entityId,
            propertyKey: err.propertyKey,
            details: err.details,
          })),
          validatedAt: result.validatedAt,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to validate module');
        return reply.status(500).send({
          error: 'Failed to validate module',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * GET /api/v1/modules/:moduleId/validation-status - Get validation status
   * Returns detailed validation status and summary for a module
   */
  fastify.get<{ Params: { moduleId: string } }>(
    '/modules/:moduleId/validation-status',
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

        const status = await moduleValidatorService.getValidationSummary(
          fastify.db,
          moduleId
        );

        return reply.status(200).send(status);
      } catch (error) {
        fastify.log.error(error, 'Failed to get validation status');
        return reply.status(500).send({ error: 'Failed to get validation status' });
      }
    }
  );

  /**
   * GET /api/v1/modules/:moduleId/compatibility/:campaignId - Check campaign compatibility
   * Checks if a module is compatible with a specific campaign
   */
  fastify.get<{ Params: { moduleId: string; campaignId: string } }>(
    '/modules/:moduleId/compatibility/:campaignId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleId, campaignId } = request.params;

      try {
        const compatible = await moduleValidatorService.checkCampaignCompatibility(
          fastify.db,
          moduleId,
          campaignId
        );

        return reply.status(200).send({ compatible });
      } catch (error) {
        fastify.log.error(error, 'Failed to check compatibility');
        return reply.status(500).send({ error: 'Failed to check compatibility' });
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
        groupBy,
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

        // Get all available entity types for this module (regardless of current filter)
        const typesResult = await fastify.db
          .selectDistinct({ entityType: moduleEntities.entityType })
          .from(moduleEntities)
          .where(eq(moduleEntities.moduleId, moduleId))
          .orderBy(moduleEntities.entityType);

        const availableTypes = typesResult.map(r => r.entityType);

        // Handle grouping if requested
        if (groupBy && groupBy !== 'none') {
          // For items, we need to check multiple property keys since items use
          // weaponType, armorType, toolType, consumableType instead of a unified itemType
          const isItemGrouping = groupBy === 'itemType';

          let entitiesWithGroup: any[];
          let groupCounts: any[];

          if (isItemGrouping) {
            // Items use different type properties - use a subquery to find the first match
            // Get entities with item type from any of the type properties
            entitiesWithGroup = await fastify.db.execute(sql`
              SELECT me.*, COALESCE(
                (SELECT ep.value_string FROM entity_properties ep
                 WHERE ep.entity_id = me.id AND ep.property_key IN ('weaponType', 'armorType', 'toolType', 'consumableType')
                 LIMIT 1),
                'other'
              ) as group_key
              FROM module_entities me
              WHERE me.module_id = ${moduleId}
              ${entityType ? sql`AND me.entity_type = ${entityType}` : sql``}
              ${query ? sql`AND to_tsvector('english', me.search_text) @@ plainto_tsquery('english', ${query})` : sql``}
              ORDER BY group_key, me.name
              LIMIT ${pageSizeNum} OFFSET ${offset}
            `) as any[];

            // Get group counts for items
            groupCounts = await fastify.db.execute(sql`
              SELECT
                COALESCE(
                  (SELECT ep.value_string FROM entity_properties ep
                   WHERE ep.entity_id = me.id AND ep.property_key IN ('weaponType', 'armorType', 'toolType', 'consumableType')
                   LIMIT 1),
                  'other'
                ) as group_key,
                COUNT(*)::int as count
              FROM module_entities me
              WHERE me.module_id = ${moduleId}
              ${entityType ? sql`AND me.entity_type = ${entityType}` : sql``}
              ${query ? sql`AND to_tsvector('english', me.search_text) @@ plainto_tsquery('english', ${query})` : sql``}
              GROUP BY group_key
              ORDER BY group_key
            `) as any[];
          } else {
            // Level or CR grouping - use single property key
            let propertyKey: string;
            let groupKeyExpression: any;

            if (groupBy === 'level') {
              propertyKey = 'level';
              // For spell level: try value_integer first, then cast value_string to integer
              groupKeyExpression = sql<number>`COALESCE(
                ${entityProperties.valueInteger},
                CAST(${entityProperties.valueString} AS INTEGER),
                -1
              )`.as('group_key');
            } else {
              // CR grouping
              propertyKey = 'challenge_rating';
              // For CR: use value_string (CRs are stored as strings like "0", "1/8", "1/4", etc.)
              groupKeyExpression = sql<string>`COALESCE(${entityProperties.valueString}, 'unknown')`.as('group_key');
            }

            // Get entities with group keys
            entitiesWithGroup = await fastify.db
              .select({
                ...getTableColumns(moduleEntities),
                groupKey: groupKeyExpression,
              })
              .from(moduleEntities)
              .leftJoin(
                entityProperties,
                and(
                  eq(entityProperties.entityId, moduleEntities.id),
                  eq(entityProperties.propertyKey, propertyKey)
                )
              )
              .where(and(...whereConditions))
              .orderBy(sql`group_key`, moduleEntities.name)
              .limit(pageSizeNum)
              .offset(offset);

            // Get group counts
            let groupCountExpression = groupBy === 'level'
              ? sql<number>`COALESCE(${entityProperties.valueInteger}, CAST(${entityProperties.valueString} AS INTEGER), -1)`
              : sql<string>`COALESCE(${entityProperties.valueString}, 'unknown')`;

            groupCounts = await fastify.db
              .select({
                groupKey: groupCountExpression,
                count: sql<number>`count(*)::int`,
              })
              .from(moduleEntities)
              .leftJoin(
                entityProperties,
                and(
                  eq(entityProperties.entityId, moduleEntities.id),
                  eq(entityProperties.propertyKey, propertyKey)
                )
              )
              .where(and(...whereConditions))
              .groupBy(sql`1`)
              .orderBy(sql`1`);
          }

          // Build groups with labels
          // Handle both camelCase (drizzle ORM) and snake_case (raw SQL) column names
          const groupByStr = groupBy as string; // Avoid TypeScript narrowing issues
          const groups: EntityGroup[] = groupCounts.map(gc => {
            const key = gc.groupKey ?? gc.group_key;
            let label: string;

            if (groupByStr === 'level') {
              const levelNum = typeof key === 'number' ? key : -1;
              label = levelNum === -1 ? 'Other' : getSpellLevelLabel(levelNum);
            } else if (groupByStr === 'cr') {
              const crStr = typeof key === 'string' ? key : 'unknown';
              label = crStr === 'unknown' ? 'Unknown CR' : getCRLabel(crStr);
            } else {
              const typeStr = typeof key === 'string' ? key : 'other';
              label = typeStr === 'other' ? 'Other' : getItemTypeLabel(typeStr);
            }

            return {
              groupKey: key,
              groupLabel: label,
              count: gc.count,
            };
          });

          // Build entityGroupKeys map
          // Handle both camelCase (drizzle ORM) and snake_case (raw SQL) column names
          const entityGroupKeys: Record<string, string | number> = {};
          for (const entity of entitiesWithGroup) {
            entityGroupKeys[entity.id] = entity.groupKey ?? entity.group_key;
          }

          // Remove groupKey/group_key from entities (it's not part of ModuleEntity type)
          const entities = entitiesWithGroup.map(({ groupKey, group_key, ...entity }) => entity);

          const response: ModuleEntitiesListResponse = {
            entities: entities as ModuleEntity[],
            total,
            page: pageNum,
            pageSize: pageSizeNum,
            availableTypes,
            groups,
            entityGroupKeys,
          };

          return reply.status(200).send(response);
        }

        // No grouping - use original logic
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
          availableTypes,
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
        await moduleValidatorService.resolveError(
          fastify.db,
          errorId,
          request.user.id,
          note
        );

        // Fetch updated error
        const [updatedError] = await fastify.db
          .select()
          .from(validationErrors)
          .where(eq(validationErrors.id, errorId))
          .limit(1);

        return reply.status(200).send({
          error: updatedError as ValidationError,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to resolve validation error');
        return reply.status(500).send({ error: 'Failed to resolve validation error' });
      }
    }
  );

  // =====================================================
  // VALIDATION JOB ROUTES
  // =====================================================

  /**
   * GET /api/v1/validation/jobs/:jobId - Get validation job status
   * Returns the current status of a validation job
   */
  fastify.get<{ Params: { jobId: string } }>(
    '/validation/jobs/:jobId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { jobId } = request.params;

      try {
        const scheduler = getScheduler();
        const job = scheduler.getJobStatus(jobId);

        if (!job) {
          return reply.status(404).send({ error: 'Job not found' });
        }

        return reply.status(200).send({ job });
      } catch (error) {
        // Scheduler not initialized
        return reply.status(503).send({ error: 'Validation scheduler not available' });
      }
    }
  );

  /**
   * GET /api/v1/validation/jobs - Get all active validation jobs
   * Returns all currently running validation jobs
   */
  fastify.get(
    '/validation/jobs',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        const scheduler = getScheduler();
        const jobs = scheduler.getActiveJobs();

        return reply.status(200).send({ jobs });
      } catch (error) {
        // Scheduler not initialized
        return reply.status(503).send({ error: 'Validation scheduler not available' });
      }
    }
  );

  /**
   * POST /api/v1/validation/jobs/:jobId/cancel - Cancel a validation job
   * Cancels a pending or running validation job
   */
  fastify.post<{ Params: { jobId: string } }>(
    '/validation/jobs/:jobId/cancel',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { jobId } = request.params;

      try {
        const scheduler = getScheduler();
        const cancelled = scheduler.cancelValidation(jobId);

        if (!cancelled) {
          return reply.status(400).send({ error: 'Job cannot be cancelled' });
        }

        return reply.status(200).send({ message: 'Job cancelled successfully' });
      } catch (error) {
        // Scheduler not initialized
        return reply.status(503).send({ error: 'Validation scheduler not available' });
      }
    }
  );

  /**
   * POST /api/v1/validation/batch - Batch validate multiple modules
   * Schedules validation for multiple modules
   */
  fastify.post<{
    Body: { moduleIds: string[] };
  }>(
    '/validation/batch',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { moduleIds } = request.body;

      if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
        return reply.status(400).send({ error: 'Module IDs array is required' });
      }

      try {
        const scheduler = getScheduler();
        const jobIds = await scheduler.batchValidate(moduleIds);

        return reply.status(202).send({
          message: 'Batch validation scheduled',
          jobIds,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to schedule batch validation');
        return reply.status(500).send({ error: 'Failed to schedule batch validation' });
      }
    }
  );
};

export default modulesRoute;
