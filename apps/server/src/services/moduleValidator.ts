import type {
  Module,
  ModuleEntity,
  EntityProperty,
  PropertyDefinition,
  PropertyValueType,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  ModuleValidationStatus,
  EntityValidationStatus,
} from '@vtt/shared';
import type { Database } from '@vtt/database';
import {
  modules,
  moduleEntities,
  entityProperties,
  propertyDefinitions,
  validationErrors,
  campaignModules,
} from '@vtt/database';
import { eq, and, inArray, sql } from 'drizzle-orm';

/**
 * Module Validator Service
 *
 * Comprehensive validation system for database-loaded modules.
 * Validates entities and properties against property definitions,
 * detects broken references, and persists validation errors.
 *
 * @see docs/architecture/EAV_MODULE_SCHEMA.md
 * @see packages/shared/src/types/validation.ts
 */

/**
 * Validation error types
 */
export enum ValidationErrorType {
  // Schema errors
  SCHEMA_INVALID = 'schema_invalid',
  SCHEMA_MISSING_REQUIRED = 'schema_missing_required',
  SCHEMA_UNKNOWN_PROPERTY = 'schema_unknown_property',

  // Type errors
  TYPE_MISMATCH = 'type_mismatch',
  TYPE_INVALID_VALUE = 'type_invalid_value',

  // Reference errors
  REFERENCE_BROKEN = 'reference_broken',
  REFERENCE_INVALID_FORMAT = 'reference_invalid_format',
  REFERENCE_CIRCULAR = 'reference_circular',

  // Validation rule errors
  VALIDATION_MIN = 'validation_min',
  VALIDATION_MAX = 'validation_max',
  VALIDATION_LENGTH = 'validation_length',
  VALIDATION_PATTERN = 'validation_pattern',
  VALIDATION_OPTIONS = 'validation_options',

  // Module errors
  MODULE_DEPENDENCY_MISSING = 'module_dependency_missing',
  MODULE_GAME_SYSTEM_MISMATCH = 'module_game_system_mismatch',
  MODULE_VERSION_INCOMPATIBLE = 'module_version_incompatible',
}

/**
 * Validation context for tracking validation state
 */
interface ValidationContext {
  moduleId: string;
  gameSystemId: string;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  processedEntities: Set<string>;
  propertyDefCache: Map<string, PropertyDefinition[]>;
  referencedEntities: Set<string>;
  availableEntities: Map<string, ModuleEntity>;
}

export class ModuleValidatorService {
  /**
   * Revalidate a module from database records
   * Reads entities and properties from DB and validates against current property definitions
   */
  async revalidateModuleFromDb(db: Database, moduleId: string): Promise<ValidationResult> {
    try {
      // Fetch module record
      const [module] = await db.select().from(modules).where(eq(modules.id, moduleId)).limit(1);

      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      console.log(`[Validator] Starting validation for module: ${module.name} (${module.moduleId})`);

      // Initialize validation context
      const context: ValidationContext = {
        moduleId: module.id,
        gameSystemId: module.gameSystemId,
        errors: [],
        warnings: [],
        info: [],
        processedEntities: new Set(),
        propertyDefCache: new Map(),
        referencedEntities: new Set(),
        availableEntities: new Map(),
      };

      // Clear old validation errors for this module
      await db.delete(validationErrors).where(eq(validationErrors.moduleId, module.id));

      // Validate module-level constraints
      await this.validateModuleConstraints(db, module, context);

      // Fetch all entities for this module
      const entities = await db
        .select()
        .from(moduleEntities)
        .where(eq(moduleEntities.moduleId, module.id));

      console.log(`[Validator] Found ${entities.length} entities to validate`);

      // Build entity map for reference checking
      for (const entity of entities) {
        context.availableEntities.set(entity.entityId, entity as ModuleEntity);
      }

      // Validate each entity
      for (const entity of entities) {
        await this.validateEntity(db, entity as ModuleEntity, context);
      }

      // Check for broken references across module
      await this.checkBrokenReferences(db, module, context);

      // Persist validation errors to database
      await this.persistValidationErrors(db, module, context);

      // Update entity validation statuses
      await this.updateEntityStatuses(db, entities, context);

      // Update module validation status
      await this.updateModuleStatus(db, module, context);

      console.log(
        `[Validator] Validation complete: ${context.errors.length} errors, ${context.warnings.length} warnings`
      );

      // Build validation result
      const result: ValidationResult = {
        valid: context.errors.length === 0,
        errors: context.errors,
        warnings: context.warnings,
        info: context.info,
        validatedAt: new Date(),
        entityCount: entities.length,
        errorCount: context.errors.length,
        warningCount: context.warnings.length,
      };

      return result;
    } catch (error) {
      console.error(`[Validator] Failed to revalidate module ${moduleId}:`, error);
      throw new Error(
        `Module validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if module is compatible with a campaign
   */
  async checkCampaignCompatibility(
    db: Database,
    moduleId: string,
    campaignId: string
  ): Promise<boolean> {
    try {
      // Get module
      const [module] = await db
        .select()
        .from(modules)
        .where(eq(modules.id, moduleId))
        .limit(1);

      if (!module) {
        return false;
      }

      // Get campaign with game system
      const [campaign] = await db.query.campaigns.findMany({
        where: (campaigns, { eq }) => eq(campaigns.id, campaignId),
        limit: 1,
      });

      if (!campaign) {
        return false;
      }

      // Check game system compatibility
      if (module.gameSystemId !== campaign.gameSystemId) {
        return false;
      }

      // Check if module is valid
      if (module.validationStatus === 'invalid') {
        return false;
      }

      // Check dependencies are loaded in campaign
      if (module.dependencies && module.dependencies.length > 0) {
        const loadedModules = await db
          .select({ moduleId: modules.moduleId })
          .from(campaignModules)
          .innerJoin(modules, eq(modules.id, campaignModules.moduleId))
          .where(
            and(
              eq(campaignModules.campaignId, campaignId),
              eq(campaignModules.isActive, true)
            )
          );

        const loadedModuleIds = new Set(loadedModules.map((m) => m.moduleId));
        const missingDeps = module.dependencies.filter((dep) => !loadedModuleIds.has(dep));

        if (missingDeps.length > 0) {
          console.warn(
            `[Validator] Module ${module.moduleId} has missing dependencies:`,
            missingDeps
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(
        `[Validator] Error checking campaign compatibility for module ${moduleId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get validation summary for a module
   */
  async getValidationSummary(db: Database, moduleId: string): Promise<ModuleValidationStatus> {
    try {
      // Fetch module
      const [module] = await db.select().from(modules).where(eq(modules.id, moduleId)).limit(1);

      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Fetch entities
      const entities = await db
        .select()
        .from(moduleEntities)
        .where(eq(moduleEntities.moduleId, module.id));

      // Fetch validation errors
      const errors = await db
        .select()
        .from(validationErrors)
        .where(
          and(eq(validationErrors.moduleId, module.id), eq(validationErrors.isResolved, false))
        );

      // Build entity statuses
      const entityStatuses: EntityValidationStatus[] = [];
      for (const entity of entities) {
        const entityErrors = errors.filter((e) => e.entityId === entity.id);

        const issues: ValidationIssue[] = entityErrors.map((err) => ({
          type: err.errorType,
          severity: err.severity as ValidationSeverity,
          message: err.message,
          entityId: entity.entityId,
          entityName: entity.name,
          propertyKey: err.propertyKey || undefined,
          source: err.sourcePath
            ? {
                file: err.sourcePath,
                line: err.sourceLineNumber || undefined,
                column: err.sourceColumn || undefined,
              }
            : undefined,
          details: (err.details as Record<string, unknown>) || undefined,
        }));

        const errorCount = issues.filter((i) => i.severity === 'error').length;
        const warningCount = issues.filter((i) => i.severity === 'warning').length;
        const infoCount = issues.filter((i) => i.severity === 'info').length;

        entityStatuses.push({
          entityId: entity.entityId,
          entityName: entity.name,
          entityType: entity.entityType,
          status: entity.validationStatus as 'valid' | 'invalid' | 'pending',
          errorCount,
          warningCount,
          infoCount,
          issues,
          validatedAt: module.validatedAt,
        });
      }

      // Module-level issues (errors without entity ID)
      const moduleIssues: ValidationIssue[] = errors
        .filter((e) => !e.entityId)
        .map((err) => ({
          type: err.errorType,
          severity: err.severity as ValidationSeverity,
          message: err.message,
          propertyKey: err.propertyKey || undefined,
          source: err.sourcePath
            ? {
                file: err.sourcePath,
                line: err.sourceLineNumber || undefined,
                column: err.sourceColumn || undefined,
              }
            : undefined,
          details: (err.details as Record<string, unknown>) || undefined,
        }));

      // Count entities by status
      const validEntities = entities.filter((e) => e.validationStatus === 'valid').length;
      const invalidEntities = entities.filter((e) => e.validationStatus === 'invalid').length;
      const pendingEntities = entities.filter((e) => e.validationStatus === 'pending').length;

      // Total error/warning counts
      const totalErrors = errors.filter((e) => e.severity === 'error').length;
      const totalWarnings = errors.filter((e) => e.severity === 'warning').length;
      const totalInfo = errors.filter((e) => e.severity === 'info').length;

      return {
        moduleId: module.moduleId,
        moduleName: module.name,
        status: module.validationStatus as 'valid' | 'invalid' | 'pending',
        totalEntities: entities.length,
        validEntities,
        invalidEntities,
        pendingEntities,
        errorCount: totalErrors,
        warningCount: totalWarnings,
        infoCount: totalInfo,
        moduleIssues,
        entityStatuses,
        validatedAt: module.validatedAt,
      };
    } catch (error) {
      console.error(`[Validator] Error getting validation summary for module ${moduleId}:`, error);
      throw new Error(
        `Failed to get validation summary: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Resolve a validation error
   */
  async resolveError(
    db: Database,
    errorId: string,
    userId: string,
    note?: string
  ): Promise<void> {
    try {
      await db
        .update(validationErrors)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: userId,
          resolutionNote: note || null,
          updatedAt: new Date(),
        })
        .where(eq(validationErrors.id, errorId));

      console.log(`[Validator] Resolved validation error ${errorId}`);
    } catch (error) {
      console.error(`[Validator] Error resolving validation error ${errorId}:`, error);
      throw new Error(
        `Failed to resolve error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ============================================================================
  // PRIVATE VALIDATION METHODS
  // ============================================================================

  /**
   * Validate module-level constraints
   */
  private async validateModuleConstraints(
    db: Database,
    module: typeof modules.$inferSelect,
    context: ValidationContext
  ): Promise<void> {
    // Check dependencies
    if (module.dependencies && module.dependencies.length > 0) {
      const deps = await db
        .select()
        .from(modules)
        .where(inArray(modules.moduleId, module.dependencies));

      const foundDeps = new Set(deps.map((d) => d.moduleId));
      const missingDeps = module.dependencies.filter((dep) => !foundDeps.has(dep));

      for (const missingDep of missingDeps) {
        context.errors.push({
          type: ValidationErrorType.MODULE_DEPENDENCY_MISSING,
          severity: 'error',
          message: `Missing dependency: ${missingDep}`,
          details: { dependency: missingDep },
        });
      }

      // Check for game system mismatches
      for (const dep of deps) {
        if (dep.gameSystemId !== module.gameSystemId) {
          context.errors.push({
            type: ValidationErrorType.MODULE_GAME_SYSTEM_MISMATCH,
            severity: 'error',
            message: `Dependency ${dep.moduleId} has different game system: ${dep.gameSystemId}`,
            details: {
              dependency: dep.moduleId,
              expectedGameSystem: module.gameSystemId,
              actualGameSystem: dep.gameSystemId,
            },
          });
        }
      }
    }
  }

  /**
   * Validate a single entity
   */
  private async validateEntity(
    db: Database,
    entity: ModuleEntity,
    context: ValidationContext
  ): Promise<void> {
    if (context.processedEntities.has(entity.id)) {
      return; // Already processed
    }

    context.processedEntities.add(entity.id);

    // Fetch property definitions for this entity type
    const propDefs = await this.getPropertyDefinitions(
      db,
      context.gameSystemId,
      entity.entityType,
      context
    );

    // Fetch entity properties
    const properties = await db
      .select()
      .from(entityProperties)
      .where(eq(entityProperties.entityId, entity.id));

    // Build property map for quick lookup
    const propertyMap = new Map<string, (typeof entityProperties.$inferSelect)[]>();
    for (const prop of properties) {
      const existing = propertyMap.get(prop.propertyKey) || [];
      existing.push(prop);
      propertyMap.set(prop.propertyKey, existing);
    }

    // Check required properties
    for (const propDef of propDefs.filter((pd) => pd.isRequired)) {
      if (!propertyMap.has(propDef.propertyKey)) {
        context.errors.push({
          type: ValidationErrorType.SCHEMA_MISSING_REQUIRED,
          severity: 'error',
          message: `Missing required property: ${propDef.name} (${propDef.propertyKey})`,
          entityId: entity.entityId,
          entityName: entity.name,
          propertyKey: propDef.propertyKey,
          source: entity.sourcePath
            ? {
                file: entity.sourcePath,
                line: entity.sourceLineNumber || undefined,
              }
            : undefined,
        });
      }
    }

    // Validate each property against its definition
    for (const [propertyKey, props] of propertyMap.entries()) {
      const propDef = propDefs.find((pd) => pd.propertyKey === propertyKey);

      if (!propDef) {
        // Unknown property - warning
        context.warnings.push({
          type: ValidationErrorType.SCHEMA_UNKNOWN_PROPERTY,
          severity: 'warning',
          message: `Unknown property: ${propertyKey}`,
          entityId: entity.entityId,
          entityName: entity.name,
          propertyKey,
          source: entity.sourcePath
            ? {
                file: entity.sourcePath,
                line: entity.sourceLineNumber || undefined,
              }
            : undefined,
        });
        continue;
      }

      // Check if property is array
      if (propDef.isArray && props.length > 1) {
        // Multiple values - validate as array
        for (const prop of props) {
          this.validatePropertyValue(prop, propDef, entity, context);
        }
      } else if (!propDef.isArray && props.length > 1) {
        // Multiple values but not an array - error
        context.errors.push({
          type: ValidationErrorType.SCHEMA_INVALID,
          severity: 'error',
          message: `Property ${propertyKey} should not be an array`,
          entityId: entity.entityId,
          entityName: entity.name,
          propertyKey,
        });
      } else {
        // Single value
        this.validatePropertyValue(props[0], propDef, entity, context);
      }
    }
  }

  /**
   * Validate a single property value
   */
  private validatePropertyValue(
    property: typeof entityProperties.$inferSelect,
    definition: PropertyDefinition,
    entity: ModuleEntity,
    context: ValidationContext
  ): void {
    // Check type match
    if (property.valueType !== definition.valueType) {
      context.errors.push({
        type: ValidationErrorType.TYPE_MISMATCH,
        severity: 'error',
        message: `Property ${property.propertyKey} has wrong type: expected ${definition.valueType}, got ${property.valueType}`,
        entityId: entity.entityId,
        entityName: entity.name,
        propertyKey: property.propertyKey,
        details: {
          expected: definition.valueType,
          actual: property.valueType,
        },
      });
      return;
    }

    // Extract value based on type
    const value = this.extractPropertyValue(property);

    // Validate based on type
    switch (property.valueType) {
      case 'string':
        this.validateStringValue(value as string, property, definition, entity, context);
        break;
      case 'number':
      case 'integer':
        this.validateNumberValue(value as number, property, definition, entity, context);
        break;
      case 'reference':
        this.validateReferenceValue(value as string, property, entity, context);
        break;
    }
  }

  /**
   * Validate string value
   */
  private validateStringValue(
    value: string | null,
    property: typeof entityProperties.$inferSelect,
    definition: PropertyDefinition,
    entity: ModuleEntity,
    context: ValidationContext
  ): void {
    if (value === null) return;

    const validation = definition.validation as {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };

    // Check length constraints
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      context.errors.push({
        type: ValidationErrorType.VALIDATION_LENGTH,
        severity: 'error',
        message: `Property ${property.propertyKey} is too short (min: ${validation.minLength})`,
        entityId: entity.entityId,
        entityName: entity.name,
        propertyKey: property.propertyKey,
        details: { minLength: validation.minLength, actualLength: value.length },
      });
    }

    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      context.errors.push({
        type: ValidationErrorType.VALIDATION_LENGTH,
        severity: 'error',
        message: `Property ${property.propertyKey} is too long (max: ${validation.maxLength})`,
        entityId: entity.entityId,
        entityName: entity.name,
        propertyKey: property.propertyKey,
        details: { maxLength: validation.maxLength, actualLength: value.length },
      });
    }

    // Check pattern
    if (validation.pattern) {
      try {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          context.errors.push({
            type: ValidationErrorType.VALIDATION_PATTERN,
            severity: 'error',
            message: `Property ${property.propertyKey} does not match pattern: ${validation.pattern}`,
            entityId: entity.entityId,
            entityName: entity.name,
            propertyKey: property.propertyKey,
            details: { pattern: validation.pattern, value },
          });
        }
      } catch (error) {
        console.warn(`[Validator] Invalid regex pattern: ${validation.pattern}`);
      }
    }

    // Check options
    if (definition.options && definition.options.length > 0) {
      const validValues = definition.options.map((opt) => String(opt.value));
      if (!validValues.includes(value)) {
        context.errors.push({
          type: ValidationErrorType.VALIDATION_OPTIONS,
          severity: 'error',
          message: `Property ${property.propertyKey} has invalid value: ${value}`,
          entityId: entity.entityId,
          entityName: entity.name,
          propertyKey: property.propertyKey,
          details: { validOptions: validValues, actualValue: value },
        });
      }
    }
  }

  /**
   * Validate number value
   */
  private validateNumberValue(
    value: number | null,
    property: typeof entityProperties.$inferSelect,
    definition: PropertyDefinition,
    entity: ModuleEntity,
    context: ValidationContext
  ): void {
    if (value === null) return;

    const validation = definition.validation as {
      min?: number;
      max?: number;
    };

    // Check min/max constraints
    if (validation.min !== undefined && value < validation.min) {
      context.errors.push({
        type: ValidationErrorType.VALIDATION_MIN,
        severity: 'error',
        message: `Property ${property.propertyKey} is too small (min: ${validation.min})`,
        entityId: entity.entityId,
        entityName: entity.name,
        propertyKey: property.propertyKey,
        details: { min: validation.min, actualValue: value },
      });
    }

    if (validation.max !== undefined && value > validation.max) {
      context.errors.push({
        type: ValidationErrorType.VALIDATION_MAX,
        severity: 'error',
        message: `Property ${property.propertyKey} is too large (max: ${validation.max})`,
        entityId: entity.entityId,
        entityName: entity.name,
        propertyKey: property.propertyKey,
        details: { max: validation.max, actualValue: value },
      });
    }
  }

  /**
   * Validate reference value
   */
  private validateReferenceValue(
    value: string | null,
    property: typeof entityProperties.$inferSelect,
    entity: ModuleEntity,
    context: ValidationContext
  ): void {
    if (value === null) return;

    // Track referenced entity
    context.referencedEntities.add(value);

    // Check format (UUID or entity ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const isEntityId = /^[a-z0-9-_]+$/i.test(value);

    if (!isUuid && !isEntityId) {
      context.errors.push({
        type: ValidationErrorType.REFERENCE_INVALID_FORMAT,
        severity: 'error',
        message: `Property ${property.propertyKey} has invalid reference format: ${value}`,
        entityId: entity.entityId,
        entityName: entity.name,
        propertyKey: property.propertyKey,
        details: { reference: value },
      });
    }
  }

  /**
   * Check for broken references across the module
   */
  private async checkBrokenReferences(
    db: Database,
    module: typeof modules.$inferSelect,
    context: ValidationContext
  ): Promise<void> {
    // Get all referenced entities
    const references = Array.from(context.referencedEntities);
    if (references.length === 0) return;

    // Check which references exist
    const existingEntities = await db
      .select({ entityId: moduleEntities.entityId })
      .from(moduleEntities)
      .innerJoin(modules, eq(modules.id, moduleEntities.moduleId))
      .where(
        and(
          eq(modules.gameSystemId, module.gameSystemId),
          inArray(moduleEntities.entityId, references)
        )
      );

    const existingIds = new Set(existingEntities.map((e) => e.entityId));
    const brokenRefs = references.filter((ref) => !existingIds.has(ref));

    // Report broken references
    for (const brokenRef of brokenRefs) {
      // Find entities that reference this broken entity
      const referencingProps = await db
        .select({
          entityId: moduleEntities.entityId,
          entityName: moduleEntities.name,
          propertyKey: entityProperties.propertyKey,
        })
        .from(entityProperties)
        .innerJoin(moduleEntities, eq(moduleEntities.id, entityProperties.entityId))
        .where(
          and(
            eq(moduleEntities.moduleId, module.id),
            eq(entityProperties.valueType, 'reference'),
            eq(entityProperties.valueReference, brokenRef)
          )
        );

      for (const ref of referencingProps) {
        context.errors.push({
          type: ValidationErrorType.REFERENCE_BROKEN,
          severity: 'error',
          message: `Broken reference: ${brokenRef} (referenced by ${ref.entityName})`,
          entityId: ref.entityId,
          entityName: ref.entityName,
          propertyKey: ref.propertyKey,
          details: { reference: brokenRef },
        });
      }
    }
  }

  /**
   * Persist validation errors to database
   */
  private async persistValidationErrors(
    db: Database,
    module: typeof modules.$inferSelect,
    context: ValidationContext
  ): Promise<void> {
    const allIssues = [...context.errors, ...context.warnings, ...context.info];

    if (allIssues.length === 0) {
      return;
    }

    // Build validation error records
    const errorRecords = allIssues.map((issue) => {
      // Find entity UUID if entity ID provided
      const entityUuid = issue.entityId
        ? context.availableEntities.get(issue.entityId)?.id || null
        : null;

      return {
        moduleId: module.id,
        entityId: entityUuid,
        errorType: issue.type,
        severity: issue.severity,
        propertyKey: issue.propertyKey || null,
        message: issue.message,
        details: issue.details || {},
        sourcePath: issue.source?.file || null,
        sourceLineNumber: issue.source?.line || null,
        sourceColumn: issue.source?.column || null,
        isResolved: false,
      };
    });

    // Batch insert
    await db.insert(validationErrors).values(errorRecords);

    console.log(`[Validator] Persisted ${errorRecords.length} validation errors`);
  }

  /**
   * Update entity validation statuses
   */
  private async updateEntityStatuses(
    db: Database,
    entities: (typeof moduleEntities.$inferSelect)[],
    context: ValidationContext
  ): Promise<void> {
    for (const entity of entities) {
      const entityErrors = context.errors.filter((e) => e.entityId === entity.entityId);
      const entityWarnings = context.warnings.filter((e) => e.entityId === entity.entityId);

      let status: 'valid' | 'invalid' | 'warning' = 'valid';
      if (entityErrors.length > 0) {
        status = 'invalid';
      } else if (entityWarnings.length > 0) {
        status = 'warning';
      }

      const validationErrorsSummary = [
        ...entityErrors.map((e) => ({
          type: e.type,
          severity: e.severity,
          message: e.message,
        })),
        ...entityWarnings.map((w) => ({
          type: w.type,
          severity: w.severity,
          message: w.message,
        })),
      ];

      await db
        .update(moduleEntities)
        .set({
          validationStatus: status,
          validationErrors: validationErrorsSummary,
          updatedAt: new Date(),
        })
        .where(eq(moduleEntities.id, entity.id));
    }
  }

  /**
   * Update module validation status
   */
  private async updateModuleStatus(
    db: Database,
    module: typeof modules.$inferSelect,
    context: ValidationContext
  ): Promise<void> {
    let status: 'valid' | 'invalid' | 'warning' = 'valid';
    if (context.errors.length > 0) {
      status = 'invalid';
    } else if (context.warnings.length > 0) {
      status = 'warning';
    }

    const validationErrorsSummary = [
      ...context.errors.slice(0, 10).map((e) => ({
        type: e.type,
        severity: e.severity,
        message: e.message,
      })),
      ...context.warnings.slice(0, 10).map((w) => ({
        type: w.type,
        severity: w.severity,
        message: w.message,
      })),
    ];

    await db
      .update(modules)
      .set({
        validationStatus: status,
        validationErrors: validationErrorsSummary,
        validatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(modules.id, module.id));
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get property definitions for entity type (with caching)
   */
  private async getPropertyDefinitions(
    db: Database,
    gameSystemId: string,
    entityType: string,
    context: ValidationContext
  ): Promise<PropertyDefinition[]> {
    const cacheKey = `${gameSystemId}:${entityType}`;

    if (context.propertyDefCache.has(cacheKey)) {
      return context.propertyDefCache.get(cacheKey)!;
    }

    const defs = await db
      .select()
      .from(propertyDefinitions)
      .where(
        and(
          eq(propertyDefinitions.gameSystemId, gameSystemId),
          eq(propertyDefinitions.entityType, entityType)
        )
      );

    const propertyDefs = defs as PropertyDefinition[];
    context.propertyDefCache.set(cacheKey, propertyDefs);

    return propertyDefs;
  }

  /**
   * Extract value from property based on type
   */
  private extractPropertyValue(
    property: typeof entityProperties.$inferSelect
  ): string | number | boolean | unknown | null {
    switch (property.valueType) {
      case 'string':
        return property.valueString;
      case 'number':
        return property.valueNumber;
      case 'integer':
        return property.valueInteger;
      case 'boolean':
        return property.valueBoolean;
      case 'json':
        return property.valueJson;
      case 'reference':
        return property.valueReference;
      default:
        return null;
    }
  }
}

// Export singleton instance
export const moduleValidatorService = new ModuleValidatorService();
