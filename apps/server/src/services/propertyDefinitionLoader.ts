import type { Database } from '@vtt/database';
import { propertyDefinitions } from '@vtt/database';
import { eq, and } from 'drizzle-orm';
import fs from 'fs/promises';

/**
 * Property Definition Loader Service
 *
 * Loads property definitions from JSON files into the database.
 * Property definitions define the schema and validation rules for entity properties.
 */

export interface PropertyDefinitionFile {
  version: string;
  gameSystemId: string;
  description?: string;
  definitions: PropertyDefinition[];
}

export interface PropertyDefinition {
  entityType: string;
  propertyKey: string;
  propertyPath: string[];
  name: string;
  description?: string;
  valueType: string;
  isRequired: boolean;
  isArray: boolean;
  validation?: Record<string, any>;
  defaultValue?: any;
  options?: Array<{ value: any; label: string; description?: string }>;
  fieldType?: string;
  placeholder?: string;
  section?: string;
  sort?: number;
}

export class PropertyDefinitionLoaderService {
  /**
   * Load property definitions from a file
   */
  async loadFromFile(db: Database, filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed: PropertyDefinitionFile = JSON.parse(content);

      return await this.loadDefinitions(db, parsed.gameSystemId, parsed.definitions);
    } catch (error) {
      throw new Error(
        `Failed to load property definitions from ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Load property definitions into database
   */
  async loadDefinitions(
    db: Database,
    gameSystemId: string,
    definitions: PropertyDefinition[]
  ): Promise<number> {
    let loadedCount = 0;

    for (const def of definitions) {
      try {
        await this.upsertDefinition(db, gameSystemId, def);
        loadedCount++;
      } catch (error) {
        console.error(
          `Failed to load property definition ${def.propertyKey}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log(`Loaded ${loadedCount} property definitions for ${gameSystemId}`);
    return loadedCount;
  }

  /**
   * Upsert a single property definition (insert or update on conflict)
   */
  private async upsertDefinition(
    db: Database,
    gameSystemId: string,
    def: PropertyDefinition
  ): Promise<void> {
    // Check if definition already exists
    const existing = await db
      .select()
      .from(propertyDefinitions)
      .where(
        and(
          eq(propertyDefinitions.gameSystemId, gameSystemId),
          eq(propertyDefinitions.entityType, def.entityType),
          eq(propertyDefinitions.propertyKey, def.propertyKey)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing definition
      await db
        .update(propertyDefinitions)
        .set({
          propertyPath: def.propertyPath,
          name: def.name,
          description: def.description || null,
          valueType: def.valueType,
          isRequired: def.isRequired,
          isArray: def.isArray,
          validation: def.validation || {},
          defaultValue: def.defaultValue || null,
          options: def.options || [],
          fieldType: def.fieldType || null,
          placeholder: def.placeholder || null,
          section: def.section || null,
          sort: def.sort || 0,
          updatedAt: new Date(),
        })
        .where(eq(propertyDefinitions.id, existing[0].id));
    } else {
      // Insert new definition
      await db.insert(propertyDefinitions).values({
        gameSystemId,
        entityType: def.entityType,
        propertyKey: def.propertyKey,
        propertyPath: def.propertyPath,
        name: def.name,
        description: def.description || null,
        valueType: def.valueType,
        isRequired: def.isRequired,
        isArray: def.isArray,
        validation: def.validation || {},
        defaultValue: def.defaultValue || null,
        options: def.options || [],
        fieldType: def.fieldType || null,
        placeholder: def.placeholder || null,
        section: def.section || null,
        sort: def.sort || 0,
      });
    }
  }

  /**
   * Delete all property definitions for a game system
   */
  async clearGameSystemDefinitions(db: Database, gameSystemId: string): Promise<void> {
    await db
      .delete(propertyDefinitions)
      .where(eq(propertyDefinitions.gameSystemId, gameSystemId));

    console.log(`Cleared property definitions for ${gameSystemId}`);
  }

  /**
   * Get count of property definitions for a game system
   */
  async getDefinitionCount(db: Database, gameSystemId: string): Promise<number> {
    const defs = await db
      .select()
      .from(propertyDefinitions)
      .where(eq(propertyDefinitions.gameSystemId, gameSystemId));

    return defs.length;
  }
}
