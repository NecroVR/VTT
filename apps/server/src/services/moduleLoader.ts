import type {
  Module,
  ModuleManifest,
  ModuleEntity,
  EntityProperty,
  PropertyValueType,
  ModuleValidationError,
  ValidationStatus,
} from '@vtt/shared';
import type { Database } from '@vtt/database';
import { modules, moduleEntities, entityProperties } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Module Loader Service
 *
 * Handles loading module files into the database using EAV normalization.
 * Flattens nested objects and arrays into individual property rows.
 *
 * @see docs/architecture/EAV_MODULE_SCHEMA.md
 */

export interface LoadOptions {
  /**
   * Whether to validate module before loading
   */
  validate?: boolean;

  /**
   * Whether to skip entities that fail validation
   */
  skipInvalid?: boolean;

  /**
   * User ID to associate as author
   */
  authorUserId?: string;
}

export interface ModuleStatus {
  moduleId: string;
  status: ValidationStatus;
  entityCount: number;
  propertyCount: number;
  errors: ModuleValidationError[];
}

export interface EntityFile {
  entityId: string;
  entityType: string;
  name: string;
  description?: string;
  img?: string;
  templateId?: string;
  tags?: string[];
  data: Record<string, any>;
  sourcePath?: string;
}

class ModuleLoaderService {
  /**
   * Load a module from file system into database
   */
  async loadModule(db: Database, modulePath: string, options: LoadOptions = {}): Promise<Module> {
    try {
      // Read module manifest
      const manifest = await this.readManifest(modulePath);

      // Calculate source hash for change detection
      const sourceHash = await this.calculateDirectoryHash(modulePath);

      // Load all entity files
      const entityFiles = await this.loadEntityFiles(modulePath, manifest);

      // Validate if requested
      if (options.validate) {
        await this.validateModule(manifest, entityFiles);
      }

      // Begin database transaction
      const loadedModule = await db.transaction(async (tx) => {
        // Insert module record
        const [moduleRecord] = await tx
          .insert(modules)
          .values({
            moduleId: manifest.moduleId,
            gameSystemId: manifest.gameSystemId,
            name: manifest.name,
            version: manifest.version,
            author: manifest.author || null,
            authorUserId: options.authorUserId || null,
            description: manifest.description || null,
            moduleType: manifest.moduleType || 'content',
            sourcePath: modulePath,
            sourceHash,
            dependencies: manifest.dependencies || [],
            validationStatus: 'pending',
            validationErrors: [],
            isOfficial: manifest.isOfficial || false,
            data: manifest.data || {},
          })
          .returning();

        // Insert entities and their properties
        let successCount = 0;
        let errorCount = 0;

        for (const entityFile of entityFiles) {
          try {
            await this.insertEntity(tx, moduleRecord.id, entityFile);
            successCount++;
          } catch (error) {
            errorCount++;
            if (!options.skipInvalid) {
              throw error;
            }
            console.error(
              `Failed to insert entity ${entityFile.entityId}:`,
              error instanceof Error ? error.message : String(error)
            );
          }
        }

        console.log(
          `Module ${manifest.moduleId}: loaded ${successCount} entities, ${errorCount} errors`
        );

        // Update validation status
        await tx
          .update(modules)
          .set({
            validationStatus: errorCount > 0 ? 'invalid' : 'valid',
            validatedAt: new Date(),
          })
          .where(eq(modules.id, moduleRecord.id));

        return moduleRecord;
      });

      return loadedModule as Module;
    } catch (error) {
      throw new Error(
        `Failed to load module from ${modulePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Reload a module (update existing records)
   * @param force - If true, bypasses the hash check and forces reload
   */
  async reloadModule(db: Database, moduleId: string, modulePath: string, force: boolean = false): Promise<Module> {
    try {
      // Find existing module
      const [existingModule] = await db
        .select()
        .from(modules)
        .where(eq(modules.moduleId, moduleId))
        .limit(1);

      if (!existingModule) {
        throw new Error(`Module ${moduleId} not found in database`);
      }

      // Check if source has changed (unless force is true)
      const sourceHash = await this.calculateDirectoryHash(modulePath);
      if (!force && existingModule.sourceHash === sourceHash) {
        console.log(`Module ${moduleId} unchanged, skipping reload`);
        return existingModule as Module;
      }

      // Delete existing entities (cascade will delete properties)
      await db.delete(moduleEntities).where(eq(moduleEntities.moduleId, existingModule.id));

      // Read manifest and entity files
      const manifest = await this.readManifest(modulePath);
      const entityFiles = await this.loadEntityFiles(modulePath, manifest);

      // Reload in transaction
      const reloadedModule = await db.transaction(async (tx) => {
        // Update module record
        await tx
          .update(modules)
          .set({
            name: manifest.name,
            version: manifest.version,
            author: manifest.author || null,
            description: manifest.description || null,
            moduleType: manifest.moduleType || 'content',
            sourcePath: modulePath,
            sourceHash,
            dependencies: manifest.dependencies || [],
            validationStatus: 'pending',
            data: manifest.data || {},
            updatedAt: new Date(),
          })
          .where(eq(modules.id, existingModule.id));

        // Insert entities and properties
        for (const entityFile of entityFiles) {
          await this.insertEntity(tx, existingModule.id, entityFile);
        }

        // Update validation status
        await tx
          .update(modules)
          .set({
            validationStatus: 'valid',
            validatedAt: new Date(),
          })
          .where(eq(modules.id, existingModule.id));

        // Fetch updated module
        const [updated] = await tx
          .select()
          .from(modules)
          .where(eq(modules.id, existingModule.id))
          .limit(1);

        return updated;
      });

      return reloadedModule as Module;
    } catch (error) {
      throw new Error(
        `Failed to reload module ${moduleId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Unload a module (remove from database)
   */
  async unloadModule(db: Database, moduleId: string): Promise<void> {
    const [existingModule] = await db
      .select()
      .from(modules)
      .where(eq(modules.moduleId, moduleId))
      .limit(1);

    if (!existingModule) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Delete module (cascade will delete entities and properties)
    await db.delete(modules).where(eq(modules.id, existingModule.id));

    console.log(`Module ${moduleId} unloaded successfully`);
  }

  /**
   * Get module status
   */
  async getModuleStatus(db: Database, moduleId: string): Promise<ModuleStatus> {
    const [module] = await db
      .select()
      .from(modules)
      .where(eq(modules.moduleId, moduleId))
      .limit(1);

    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    // Count entities
    const entities = await db
      .select()
      .from(moduleEntities)
      .where(eq(moduleEntities.moduleId, module.id));

    // Count properties
    let propertyCount = 0;
    for (const entity of entities) {
      const props = await db
        .select()
        .from(entityProperties)
        .where(eq(entityProperties.entityId, entity.id));
      propertyCount += props.length;
    }

    return {
      moduleId: module.moduleId,
      status: module.validationStatus as ValidationStatus,
      entityCount: entities.length,
      propertyCount,
      errors: (module.validationErrors || []) as ModuleValidationError[],
    };
  }

  /**
   * Flatten object to EAV properties
   */
  flattenToProperties(data: Record<string, any>, entityId: string): EntityProperty[] {
    const properties: EntityProperty[] = [];

    const flatten = (obj: any, prefix: string = '', depth: number = 0) => {
      for (const [key, value] of Object.entries(obj)) {
        const propertyKey = prefix ? `${prefix}.${key}` : key;
        const propertyPath = propertyKey.split('.');

        if (Array.isArray(value)) {
          // Handle arrays - create property for each element
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
              // Nested object in array - flatten it
              flatten(item, `${propertyKey}.${index}`, depth + 1);
            } else {
              // Primitive array element
              const { valueType, valueColumn, columnValue } = this.detectValueType(item);
              properties.push({
                id: crypto.randomUUID(),
                entityId,
                propertyKey: `${propertyKey}.${index}`,
                propertyPath: [...propertyPath, String(index)],
                propertyDepth: depth + 1,
                valueType,
                valueString: valueType === 'string' ? columnValue : null,
                valueNumber: valueType === 'number' ? columnValue : null,
                valueInteger: valueType === 'integer' ? columnValue : null,
                valueBoolean: valueType === 'boolean' ? columnValue : null,
                valueJson: valueType === 'json' ? columnValue : null,
                valueReference: valueType === 'reference' ? columnValue : null,
                arrayIndex: index,
                isArrayElement: true,
                sort: index,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as EntityProperty);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects - recurse
          flatten(value, propertyKey, depth + 1);
        } else {
          // Handle primitive values
          const { valueType, valueColumn, columnValue } = this.detectValueType(value);
          properties.push({
            id: crypto.randomUUID(),
            entityId,
            propertyKey,
            propertyPath,
            propertyDepth: depth,
            valueType,
            valueString: valueType === 'string' ? columnValue : null,
            valueNumber: valueType === 'number' ? columnValue : null,
            valueInteger: valueType === 'integer' ? columnValue : null,
            valueBoolean: valueType === 'boolean' ? columnValue : null,
            valueJson: valueType === 'json' ? columnValue : null,
            valueReference: valueType === 'reference' ? columnValue : null,
            arrayIndex: null,
            isArrayElement: false,
            sort: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as EntityProperty);
        }
      }
    };

    flatten(data);
    return properties;
  }

  /**
   * Reconstruct object from EAV properties
   */
  reconstructFromProperties(properties: EntityProperty[]): Record<string, any> {
    const result: Record<string, any> = {};

    for (const prop of properties) {
      const value = this.extractValue(prop);
      this.setNestedValue(result, prop.propertyPath, value, prop.isArrayElement, prop.arrayIndex);
    }

    return result;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Read module manifest from directory
   */
  private async readManifest(modulePath: string): Promise<ModuleManifest> {
    const manifestPath = path.join(modulePath, 'module.json');

    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content) as ModuleManifest;

      // Validate required fields
      if (!manifest.moduleId || !manifest.gameSystemId || !manifest.name || !manifest.version) {
        throw new Error('Missing required fields in module.json');
      }

      return manifest;
    } catch (error) {
      throw new Error(
        `Failed to read manifest from ${manifestPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Load all entity files from module directory
   */
  private async loadEntityFiles(
    modulePath: string,
    manifest: ModuleManifest
  ): Promise<EntityFile[]> {
    const entityFiles: EntityFile[] = [];

    // Get entity paths from manifest or scan default directories
    const entityPaths = manifest.entities || [];

    if (entityPaths.length === 0) {
      // Scan default entity directories with proper singular entity type names
      const defaultDirs: Array<{ dir: string; type: string }> = [
        { dir: 'items', type: 'item' },
        { dir: 'spells', type: 'spell' },
        { dir: 'monsters', type: 'monster' },
        { dir: 'races', type: 'race' },
        { dir: 'classes', type: 'class' },
        { dir: 'backgrounds', type: 'background' },
        { dir: 'features', type: 'feature' },
        { dir: 'conditions', type: 'condition' },
        { dir: 'rules', type: 'rule' },
      ];

      // Check both root level and compendium subdirectory
      const basePaths = [modulePath, path.join(modulePath, 'compendium')];

      for (const basePath of basePaths) {
        for (const { dir, type } of defaultDirs) {
          const dirPath = path.join(basePath, dir);
          try {
            const files = await this.scanEntityDirectory(dirPath, type);
            entityFiles.push(...files);
          } catch (error) {
            // Directory doesn't exist, skip
            continue;
          }
        }
      }
    } else {
      // Load from specified paths, inferring type from directory name
      const dirTypeMap: Record<string, string> = {
        items: 'item',
        spells: 'spell',
        monsters: 'monster',
        races: 'race',
        classes: 'class',
        backgrounds: 'background',
        features: 'feature',
        conditions: 'condition',
        rules: 'rule',
      };

      for (const entityPath of entityPaths) {
        const fullPath = path.join(modulePath, entityPath);
        // Infer type from parent directory (e.g., "compendium/spells/cantrips.json" -> "spell")
        const pathParts = entityPath.split('/');
        const parentDir = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : '';
        const inferredType = dirTypeMap[parentDir] || 'item';
        const files = await this.loadEntityFile(fullPath, inferredType);
        entityFiles.push(...files);
      }
    }

    return entityFiles;
  }

  /**
   * Scan a directory for entity JSON files
   */
  private async scanEntityDirectory(dirPath: string, entityType: string): Promise<EntityFile[]> {
    const files: EntityFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const filePath = path.join(dirPath, entry.name);
          const loadedFiles = await this.loadEntityFile(filePath, entityType);
          files.push(...loadedFiles);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
      return [];
    }

    return files;
  }

  /**
   * Load entity file (may contain single entity, array, or compendium batch format)
   */
  private async loadEntityFile(filePath: string, defaultType?: string): Promise<EntityFile[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      // Handle compendium batch format: {compendiumId, name, entries: [...]}
      if (parsed.entries && Array.isArray(parsed.entries)) {
        const compendiumMetadata = {
          compendiumId: parsed.compendiumId,
          compendiumName: parsed.name,
          templateId: parsed.templateId,
          source: parsed.source,
        };

        return parsed.entries.map((entity: any) => ({
          entityId: entity.id || entity.entityId,
          entityType: entity.type || entity.entityType || defaultType || 'item',
          name: entity.name,
          description: entity.description,
          img: entity.img,
          templateId: entity.templateId || compendiumMetadata.templateId,
          tags: entity.tags || [compendiumMetadata.compendiumId],
          data: entity.data || entity,
          sourcePath: filePath,
        }));
      }

      // Handle array format: [{...}, {...}]
      const entities = Array.isArray(parsed) ? parsed : [parsed];

      return entities.map((entity) => ({
        entityId: entity.id || entity.entityId,
        entityType: entity.type || entity.entityType || defaultType || 'custom',
        name: entity.name,
        description: entity.description,
        img: entity.img,
        templateId: entity.templateId,
        tags: entity.tags,
        data: entity.data || entity,
        sourcePath: filePath,
      }));
    } catch (error) {
      throw new Error(
        `Failed to load entity file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Calculate hash of directory contents for change detection
   */
  private async calculateDirectoryHash(dirPath: string): Promise<string> {
    const hash = crypto.createHash('sha256');

    // Simple implementation - hash the manifest file
    // Could be enhanced to hash all entity files
    const manifestPath = path.join(dirPath, 'module.json');
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      hash.update(content);
      return hash.digest('hex');
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Validate module structure and contents
   */
  private async validateModule(
    manifest: ModuleManifest,
    entities: EntityFile[]
  ): Promise<void> {
    // Basic validation - can be enhanced with proper schema validation
    if (!manifest.moduleId.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid module ID - must be lowercase alphanumeric with hyphens');
    }

    for (const entity of entities) {
      if (!entity.entityId || !entity.name) {
        throw new Error(`Entity missing required fields: ${JSON.stringify(entity)}`);
      }
    }
  }

  /**
   * Insert entity and its properties into database
   */
  private async insertEntity(tx: any, moduleId: string, entityFile: EntityFile): Promise<void> {
    // Insert entity record
    const [entity] = await tx
      .insert(moduleEntities)
      .values({
        moduleId,
        entityId: entityFile.entityId,
        entityType: entityFile.entityType,
        name: entityFile.name,
        description: entityFile.description || null,
        img: entityFile.img || null,
        templateId: entityFile.templateId || null,
        sourcePath: entityFile.sourcePath || null,
        tags: entityFile.tags || null,
        searchText: `${entityFile.name} ${entityFile.description || ''}`,
        validationStatus: 'pending',
        data: {},
      })
      .returning();

    // Flatten entity data to properties
    const properties = this.flattenToProperties(entityFile.data, entity.id);

    // Batch insert properties
    if (properties.length > 0) {
      await tx.insert(entityProperties).values(properties);
    }
  }

  /**
   * Detect value type and determine which column to use
   */
  private detectValueType(value: any): {
    valueType: PropertyValueType;
    valueColumn: string;
    columnValue: any;
  } {
    if (value === null || value === undefined) {
      return { valueType: 'string', valueColumn: 'valueString', columnValue: null };
    }

    if (typeof value === 'boolean') {
      return { valueType: 'boolean', valueColumn: 'valueBoolean', columnValue: value };
    }

    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return { valueType: 'integer', valueColumn: 'valueInteger', columnValue: value };
      }
      return { valueType: 'number', valueColumn: 'valueNumber', columnValue: value };
    }

    if (typeof value === 'string') {
      // Check if it's a reference (UUID format or entity reference)
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return { valueType: 'reference', valueColumn: 'valueReference', columnValue: value };
      }
      return { valueType: 'string', valueColumn: 'valueString', columnValue: value };
    }

    if (typeof value === 'object') {
      return { valueType: 'json', valueColumn: 'valueJson', columnValue: value };
    }

    // Default to string
    return { valueType: 'string', valueColumn: 'valueString', columnValue: String(value) };
  }

  /**
   * Extract value from property based on type
   */
  private extractValue(prop: EntityProperty): any {
    switch (prop.valueType) {
      case 'string':
        return prop.valueString;
      case 'number':
        return prop.valueNumber;
      case 'integer':
        return prop.valueInteger;
      case 'boolean':
        return prop.valueBoolean;
      case 'json':
        return prop.valueJson;
      case 'reference':
        return prop.valueReference;
      default:
        return null;
    }
  }

  /**
   * Set nested value in object using property path
   */
  private setNestedValue(
    obj: Record<string, any>,
    path: string[],
    value: any,
    isArrayElement: boolean,
    arrayIndex: number | null
  ): void {
    let current: any = obj;

    // Navigate to the parent of the target
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      const nextKey = path[i + 1];

      // Check if next key is a number (array index)
      const isNextArray = !isNaN(Number(nextKey));

      if (!(key in current)) {
        current[key] = isNextArray ? [] : {};
      }

      current = current[key];
    }

    const lastKey = path[path.length - 1];

    // Check if lastKey is a numeric string (array index)
    const lastKeyIsNumber = !isNaN(Number(lastKey));

    if (lastKeyIsNumber && isArrayElement && arrayIndex !== null) {
      // We're setting an array element
      if (!Array.isArray(current)) {
        // This shouldn't happen if flattening was correct, but handle it
        console.warn(`Expected array but got ${typeof current} at path ${path.join('.')}`);
        return;
      }
      current[arrayIndex] = value;
    } else {
      current[lastKey] = value;
    }
  }
}

// Export class
export { ModuleLoaderService };
