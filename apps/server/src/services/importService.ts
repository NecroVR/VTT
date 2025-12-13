import type { Database } from '@vtt/database';
import { importSources, importJobs, moduleEntities, entityProperties, modules } from '@vtt/database';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import type {
  ImportRequest,
  ImportJob,
  ImportSource,
  ImportSourceType,
  ContentType,
  ImportStatus,
  RawImportItem,
  ImportError,
  PropertyValueType,
} from '@vtt/shared';

/**
 * Content Parser Interface
 * Parsers transform source-specific data into VTT format
 */
export interface ContentParser {
  parse(item: RawImportItem): Promise<ParsedEntity>;
}

/**
 * Parsed Entity
 * Result of parsing a raw import item
 */
export interface ParsedEntity {
  entityType: string;
  entityId: string;
  name: string;
  description?: string;
  img?: string;
  data: Record<string, unknown>;
  sourceId: string;
}

/**
 * Import Service
 * Handles content import from multiple sources (Foundry VTT, D&D Beyond, etc.)
 */
export class ImportService {
  private parsers: Map<string, ContentParser> = new Map();

  /**
   * Register a parser for a specific source type and content type
   */
  registerParser(sourceType: ImportSourceType, contentType: ContentType, parser: ContentParser): void {
    const key = `${sourceType}:${contentType}`;
    this.parsers.set(key, parser);
  }

  /**
   * Get a registered parser
   */
  getParser(sourceType: ImportSourceType, contentType: ContentType): ContentParser | undefined {
    const key = `${sourceType}:${contentType}`;
    return this.parsers.get(key);
  }

  /**
   * Create a new import job
   */
  async createImportJob(
    db: Database,
    userId: string,
    request: ImportRequest
  ): Promise<ImportJob> {
    const [job] = await db.insert(importJobs).values({
      userId,
      sourceType: request.sourceType,
      status: 'pending',
      contentType: request.contentType,
      totalItems: request.items.length,
      processedItems: 0,
      failedItems: 0,
      errors: [],
      rawData: request as unknown as Record<string, unknown>,
    }).returning();

    // Start processing asynchronously
    this.processImportJob(db, job.id, userId, request).catch(err => {
      console.error(`Import job ${job.id} failed:`, err);
    });

    return this.mapJobToDTO(job);
  }

  /**
   * Process import job (runs asynchronously)
   */
  private async processImportJob(
    db: Database,
    jobId: string,
    userId: string,
    request: ImportRequest
  ): Promise<void> {
    try {
      // Update status to processing
      await db.update(importJobs)
        .set({ status: 'processing' })
        .where(eq(importJobs.id, jobId));

      const parser = this.getParser(request.sourceType, request.contentType);
      if (!parser) {
        await this.failJob(db, jobId, `No parser for ${request.sourceType}:${request.contentType}`);
        return;
      }

      let processedCount = 0;
      let failedCount = 0;
      const errors: ImportError[] = [];

      // Create or find import source
      const source = await this.getOrCreateSource(db, userId, request);

      for (const item of request.items) {
        try {
          // Parse source data into VTT format
          const parsed = await parser.parse(item);

          // Create module entity
          await this.createModuleEntity(db, userId, source.id, request.sourceType, parsed);

          processedCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            itemName: item.name,
            itemId: item.sourceId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Update progress
        await db.update(importJobs)
          .set({
            processedItems: processedCount,
            failedItems: failedCount,
            errors: errors as Array<{itemName: string; error: string}>
          })
          .where(eq(importJobs.id, jobId));

        // Emit WebSocket progress event
        this.emitProgress(jobId, processedCount, request.items.length);
      }

      // Update source item count
      await db.update(importSources)
        .set({
          itemCount: processedCount,
          lastSyncAt: new Date()
        })
        .where(eq(importSources.id, source.id));

      // Mark job as completed
      const finalStatus: ImportStatus = failedCount === 0
        ? 'completed'
        : failedCount === request.items.length
          ? 'failed'
          : 'partial';

      await db.update(importJobs)
        .set({
          status: finalStatus,
          completedAt: new Date()
        })
        .where(eq(importJobs.id, jobId));

    } catch (error) {
      await this.failJob(db, jobId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get or create import source record
   */
  private async getOrCreateSource(
    db: Database,
    userId: string,
    request: ImportRequest
  ): Promise<ImportSource> {
    // Check if source already exists
    const existing = await db.query.importSources.findFirst({
      where: and(
        eq(importSources.userId, userId),
        eq(importSources.sourceType, request.sourceType),
        eq(importSources.sourceName, request.sourceName)
      )
    });

    if (existing) {
      // Update content types if new type added
      const types = new Set([...(existing.contentTypes as string[]), request.contentType]);
      await db.update(importSources)
        .set({
          contentTypes: Array.from(types),
          lastSyncAt: new Date()
        })
        .where(eq(importSources.id, existing.id));
      return existing as ImportSource;
    }

    // Create new source
    const [source] = await db.insert(importSources).values({
      userId,
      sourceType: request.sourceType,
      sourceName: request.sourceName,
      sourceVersion: request.sourceVersion,
      contentTypes: [request.contentType]
    }).returning();

    return source as ImportSource;
  }

  /**
   * Create module entity from parsed data
   */
  private async createModuleEntity(
    db: Database,
    userId: string,
    sourceId: string,
    sourceType: ImportSourceType,
    parsed: ParsedEntity
  ): Promise<void> {
    // Get or create user's import module for this source type
    const moduleId = await this.getOrCreateUserImportModule(db, userId, sourceType);

    // Check for existing entity (for updates)
    const existing = await db.query.moduleEntities.findFirst({
      where: and(
        eq(moduleEntities.moduleId, moduleId),
        eq(moduleEntities.sourceType, sourceType),
        eq(moduleEntities.sourceId, parsed.sourceId)
      )
    });

    if (existing) {
      // Update existing entity
      await db.update(moduleEntities)
        .set({
          name: parsed.name,
          description: parsed.description,
          img: parsed.img,
          data: {},
          updatedAt: new Date()
        })
        .where(eq(moduleEntities.id, existing.id));

      // Update properties
      await this.updateEntityProperties(db, existing.id, parsed.data);
    } else {
      // Create new entity
      const [entity] = await db.insert(moduleEntities).values({
        moduleId,
        entityId: parsed.entityId,
        entityType: parsed.entityType,
        name: parsed.name,
        description: parsed.description,
        img: parsed.img,
        data: {},
        sourceType,
        sourceId: parsed.sourceId,
        searchText: `${parsed.name} ${parsed.description ?? ''}`.toLowerCase()
      }).returning();

      // Create properties
      await this.createEntityProperties(db, entity.id, parsed.data);
    }
  }

  /**
   * Get or create user's import module for source type
   */
  private async getOrCreateUserImportModule(
    db: Database,
    userId: string,
    sourceType: ImportSourceType
  ): Promise<string> {
    const moduleId = `import-${sourceType}-${userId}`;

    // Check if module exists
    const existing = await db.query.modules.findFirst({
      where: eq(modules.moduleId, moduleId)
    });

    if (existing) {
      return existing.id;
    }

    // Create new import module
    const [module] = await db.insert(modules).values({
      moduleId,
      gameSystemId: 'dnd5e', // Default to D&D 5e for now
      name: `${sourceType} Imports`,
      version: '1.0.0',
      authorUserId: userId,
      description: `Imported content from ${sourceType}`,
      moduleType: 'content',
      sourcePath: null,
      sourceHash: null,
      dependencies: [],
      validationStatus: 'pending',
      isOfficial: false,
      data: {}
    }).returning();

    return module.id;
  }

  /**
   * Create entity properties from data using EAV pattern
   */
  private async createEntityProperties(
    db: Database,
    entityId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const properties = this.flattenToProperties(data, entityId);

    if (properties.length > 0) {
      await db.insert(entityProperties).values(properties);
    }
  }

  /**
   * Update entity properties (delete old, insert new)
   */
  private async updateEntityProperties(
    db: Database,
    entityId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await db.delete(entityProperties).where(eq(entityProperties.entityId, entityId));
    await this.createEntityProperties(db, entityId, data);
  }

  /**
   * Flatten nested object to EAV properties
   * Based on moduleLoader.ts pattern
   */
  private flattenToProperties(data: Record<string, any>, entityId: string): any[] {
    const properties: any[] = [];

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
              const { valueType, columnValue } = this.detectValueType(item);
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
              });
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects - recurse
          flatten(value, propertyKey, depth + 1);
        } else {
          // Handle primitive values
          const { valueType, columnValue } = this.detectValueType(value);
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
          });
        }
      }
    };

    flatten(data);
    return properties;
  }

  /**
   * Detect value type for EAV storage
   */
  private detectValueType(value: any): {
    valueType: PropertyValueType;
    columnValue: any;
  } {
    if (value === null || value === undefined) {
      return { valueType: 'string', columnValue: null };
    }

    if (typeof value === 'boolean') {
      return { valueType: 'boolean', columnValue: value };
    }

    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return { valueType: 'integer', columnValue: value };
      }
      return { valueType: 'number', columnValue: value };
    }

    if (typeof value === 'string') {
      return { valueType: 'string', columnValue: value };
    }

    // Complex objects stored as JSON
    return { valueType: 'json', columnValue: value };
  }

  /**
   * Get import job status
   */
  async getJobStatus(db: Database, jobId: string, userId: string): Promise<ImportJob | null> {
    const job = await db.query.importJobs.findFirst({
      where: and(eq(importJobs.id, jobId), eq(importJobs.userId, userId))
    });
    return job ? this.mapJobToDTO(job) : null;
  }

  /**
   * List import jobs for user
   */
  async listJobs(db: Database, userId: string, sourceType?: ImportSourceType, limit = 20): Promise<ImportJob[]> {
    const conditions = [eq(importJobs.userId, userId)];
    if (sourceType) {
      conditions.push(eq(importJobs.sourceType, sourceType));
    }

    const jobs = await db.query.importJobs.findMany({
      where: and(...conditions),
      orderBy: [desc(importJobs.startedAt)],
      limit
    });
    return jobs.map(job => this.mapJobToDTO(job));
  }

  /**
   * List import sources for user
   */
  async listSources(db: Database, userId: string, sourceType?: ImportSourceType): Promise<ImportSource[]> {
    const conditions = [eq(importSources.userId, userId)];
    if (sourceType) {
      conditions.push(eq(importSources.sourceType, sourceType));
    }

    const sources = await db.query.importSources.findMany({
      where: and(...conditions),
      orderBy: [desc(importSources.importedAt)]
    });
    return sources as ImportSource[];
  }

  /**
   * Delete import source and associated entities
   */
  async deleteSource(db: Database, sourceId: string, userId: string): Promise<void> {
    // Verify ownership
    const source = await db.query.importSources.findFirst({
      where: and(eq(importSources.id, sourceId), eq(importSources.userId, userId))
    });

    if (!source) {
      throw new Error('Import source not found or access denied');
    }

    // Delete source (cascade will delete entities)
    await db.delete(importSources).where(eq(importSources.id, sourceId));
  }

  /**
   * Map database job to DTO
   */
  private mapJobToDTO(job: any): ImportJob {
    return {
      id: job.id,
      userId: job.userId,
      sourceId: job.sourceId,
      sourceType: job.sourceType,
      status: job.status,
      contentType: job.contentType,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      failedItems: job.failedItems,
      errors: job.errors || [],
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      rawData: job.rawData
    };
  }

  /**
   * Mark job as failed
   */
  private async failJob(db: Database, jobId: string, error: string): Promise<void> {
    await db.update(importJobs)
      .set({
        status: 'failed',
        errors: [{ itemName: 'Job', error }],
        completedAt: new Date()
      })
      .where(eq(importJobs.id, jobId));
  }

  /**
   * Emit WebSocket progress event (stub for now)
   */
  private emitProgress(jobId: string, processed: number, total: number): void {
    console.log(`Import progress [${jobId}]: ${processed}/${total}`);
    // TODO: Implement WebSocket event emission
  }
}

// Export singleton instance
export const importService = new ImportService();
