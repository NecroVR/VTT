/**
 * Module Entity Type Definitions
 *
 * Defines types for entities within modules.
 * Entities are game content items like spells, monsters, items, etc.
 *
 * @see docs/architecture/EAV_MODULE_SCHEMA.md
 */

import type { ValidationStatus } from './modules.js';
import type { ValidationSeverity } from './validation.js';

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Types of entities that can be stored in modules
 */
export type ModuleEntityType =
  | 'item'        // Items, equipment, loot
  | 'spell'       // Spells and magical abilities
  | 'monster'     // Creatures, NPCs, enemies
  | 'race'        // Character races/ancestries
  | 'class'       // Character classes
  | 'background'  // Character backgrounds
  | 'feature'     // Class features, racial traits
  | 'feat'        // Feats and abilities
  | 'condition'   // Status conditions
  | 'skill'       // Skills and proficiencies
  | 'vehicle'     // Vehicles and mounts
  | 'hazard'      // Traps and hazards
  | 'custom';     // User-defined types

// ============================================================================
// MODULE ENTITY
// ============================================================================

/**
 * An entity within a module.
 * Represents a single piece of game content (e.g., one spell, one monster).
 */
export interface ModuleEntity {
  /**
   * UUID primary key
   */
  id: string;

  /**
   * Module this entity belongs to
   */
  moduleId: string;

  /**
   * Unique entity ID within module (e.g., "fireball", "goblin")
   */
  entityId: string;

  /**
   * Type of entity
   */
  entityType: ModuleEntityType;

  /**
   * Display name
   */
  name: string;

  /**
   * Description/flavor text
   */
  description: string | null;

  /**
   * Image path
   */
  img: string | null;

  /**
   * Item template ID (if entity uses a template)
   */
  templateId: string | null;

  /**
   * Source file path (for debugging)
   */
  sourcePath: string | null;

  /**
   * Line number in source file
   */
  sourceLineNumber: number | null;

  /**
   * Validation status for this entity
   */
  validationStatus: ValidationStatus;

  /**
   * Validation errors specific to this entity
   */
  validationErrors: EntityValidationError[];

  /**
   * Full-text search index
   */
  searchText: string | null;

  /**
   * Tags for filtering and organization
   */
  tags: string[] | null;

  /**
   * Folder ID for organization
   */
  folderId: string | null;

  /**
   * Sort order within folder
   */
  sort: number;

  /**
   * Additional metadata
   */
  data: Record<string, unknown>;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

/**
 * Validation error for a specific entity
 */
export interface EntityValidationError {
  /**
   * Error type
   */
  errorType: string;

  /**
   * Error severity
   */
  severity: ValidationSeverity;

  /**
   * Property key that failed validation (if applicable)
   */
  propertyKey?: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to create a new entity
 */
export interface CreateEntityInput {
  moduleId: string;
  entityId: string;
  entityType: ModuleEntityType;
  name: string;
  description?: string;
  img?: string;
  templateId?: string;
  tags?: string[];
  folderId?: string;
  sort?: number;
  data?: Record<string, unknown>;
}

/**
 * Request to update an existing entity
 */
export interface UpdateEntityInput {
  entityId?: string;
  entityType?: ModuleEntityType;
  name?: string;
  description?: string;
  img?: string;
  templateId?: string;
  tags?: string[];
  folderId?: string;
  sort?: number;
  data?: Record<string, unknown>;
}

/**
 * Single entity response
 */
export interface ModuleEntityResponse {
  entity: ModuleEntity;
}

/**
 * Group information for grouped entity results
 */
export interface EntityGroup {
  /** The group value (e.g., 0-9 for spell levels, "weapon" for item types) */
  groupKey: string | number;
  /** Human-readable label (e.g., "Cantrip", "1st Level", "Weapon") */
  groupLabel: string;
  /** Total entities in this group */
  count: number;
}

/**
 * List of entities response
 */
export interface ModuleEntitiesListResponse {
  entities: ModuleEntity[];
  total: number;
  page?: number;
  pageSize?: number;
  /** All available entity types for this module (for filter dropdown) */
  availableTypes?: string[];
  /** Group information when groupBy is specified */
  groups?: EntityGroup[];
  /** Map of entity ID to group key */
  entityGroupKeys?: Record<string, string | number>;
}

/**
 * Entity search parameters
 */
export interface EntitySearchParams {
  /**
   * Text search query
   */
  query?: string;

  /**
   * Filter by entity type
   */
  entityType?: ModuleEntityType | ModuleEntityType[];

  /**
   * Filter by tags
   */
  tags?: string[];

  /**
   * Filter by folder
   */
  folderId?: string;

  /**
   * Filter by validation status
   */
  validationStatus?: ValidationStatus;

  /**
   * Page number (1-indexed)
   */
  page?: number;

  /**
   * Items per page
   */
  pageSize?: number;

  /**
   * Sort field
   */
  sortBy?: 'name' | 'entityType' | 'createdAt' | 'updatedAt';

  /**
   * Sort direction
   */
  sortOrder?: 'asc' | 'desc';

  /**
   * Group results by a property key
   * 'level' for spells (groups by 0-9)
   * 'itemType' for items (groups by category)
   */
  groupBy?: 'level' | 'itemType' | 'none';
}

// ============================================================================
// ENTITY WITH PROPERTIES
// ============================================================================

/**
 * Full entity data including all properties.
 * This is used when returning complete entity information.
 */
export interface ModuleEntityWithProperties extends ModuleEntity {
  /**
   * Map of property keys to values
   */
  properties: Record<string, unknown>;
}

/**
 * Response with full entity data
 */
export interface ModuleEntityFullResponse {
  entity: ModuleEntityWithProperties;
}
