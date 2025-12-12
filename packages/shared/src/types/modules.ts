/**
 * Module System Type Definitions
 *
 * Defines types for the EAV (Entity-Attribute-Value) module system.
 * Modules organize game content with validation, versioning, and dependencies.
 *
 * @see docs/architecture/EAV_MODULE_SCHEMA.md
 */

import type { ValidationSeverity } from './validation.js';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Type of module content
 */
export type ModuleType =
  | 'content'      // Game content (items, spells, monsters)
  | 'mechanics'    // Rules and systems
  | 'integration'; // Third-party integrations

/**
 * Module validation status
 */
export type ValidationStatus =
  | 'pending'   // Not yet validated
  | 'valid'     // Passed validation
  | 'invalid';  // Has validation errors

// ============================================================================
// MODULE
// ============================================================================

/**
 * A module containing game content entities.
 * Modules are collections of related content that can be loaded into campaigns.
 */
export interface Module {
  /**
   * UUID primary key
   */
  id: string;

  /**
   * Unique module identifier (e.g., "dnd5e-srd", "custom-homebrew")
   */
  moduleId: string;

  /**
   * Game system this module is for (must match campaign's game system)
   */
  gameSystemId: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Semantic version (e.g., "1.0.0")
   */
  version: string;

  /**
   * Module author name
   */
  author: string | null;

  /**
   * Reference to user who created this module
   */
  authorUserId: string | null;

  /**
   * Description of module contents
   */
  description: string | null;

  /**
   * Type of module content
   */
  moduleType: ModuleType;

  /**
   * File path for re-validation (if loaded from file)
   */
  sourcePath: string | null;

  /**
   * SHA256 hash of source file for change detection
   */
  sourceHash: string | null;

  /**
   * Module IDs that this module depends on
   */
  dependencies: string[];

  /**
   * Current validation status
   */
  validationStatus: ValidationStatus;

  /**
   * Validation errors (empty array if valid)
   */
  validationErrors: ModuleValidationError[];

  /**
   * Timestamp of last validation
   */
  validatedAt: Date | null;

  /**
   * Whether module is active and can be loaded
   */
  isActive: boolean;

  /**
   * Whether module is locked (cannot be edited)
   */
  isLocked: boolean;

  /**
   * Whether module is official content
   */
  isOfficial: boolean;

  /**
   * Additional metadata (flexible JSON storage)
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
 * Validation error within a module (simplified version for storage)
 */
export interface ModuleValidationError {
  /**
   * Type of error
   */
  errorType: string;

  /**
   * Error severity
   */
  severity: ValidationSeverity;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Entity ID that has the error (if applicable)
   */
  entityId?: string;

  /**
   * Property key that failed validation (if applicable)
   */
  propertyKey?: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
}

// ============================================================================
// MODULE MANIFEST
// ============================================================================

/**
 * Module manifest file format for JSON modules.
 * This is the structure of module.json files.
 */
export interface ModuleManifest {
  /**
   * Unique module identifier
   */
  moduleId: string;

  /**
   * Game system ID
   */
  gameSystemId: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Semantic version
   */
  version: string;

  /**
   * Author name
   */
  author?: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Module type
   */
  moduleType?: ModuleType;

  /**
   * Module dependencies
   */
  dependencies?: string[];

  /**
   * Whether module is official content
   */
  isOfficial?: boolean;

  /**
   * License information
   */
  license?: string;

  /**
   * Homepage URL
   */
  homepage?: string;

  /**
   * Entity file paths relative to module root
   */
  entities?: string[];

  /**
   * Additional metadata
   */
  data?: Record<string, unknown>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to create a new module
 */
export interface CreateModuleInput {
  moduleId: string;
  gameSystemId: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  moduleType?: ModuleType;
  dependencies?: string[];
  isOfficial?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Request to update an existing module
 */
export interface UpdateModuleInput {
  name?: string;
  version?: string;
  author?: string;
  description?: string;
  moduleType?: ModuleType;
  dependencies?: string[];
  isActive?: boolean;
  isLocked?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Single module response
 */
export interface ModuleResponse {
  module: Module;
}

/**
 * List of modules response
 */
export interface ModulesListResponse {
  modules: Module[];
  total: number;
}

/**
 * Module validation response
 */
export interface ModuleValidationResponse {
  moduleId: string;
  status: ValidationStatus;
  errors: ModuleValidationError[];
  validatedAt: Date;
}

// ============================================================================
// CAMPAIGN-MODULE JUNCTION
// ============================================================================

/**
 * Links a module to a campaign with load order and settings
 */
export interface CampaignModule {
  /**
   * UUID primary key
   */
  id: string;

  /**
   * Campaign ID
   */
  campaignId: string;

  /**
   * Module ID
   */
  moduleId: string;

  /**
   * Load order (lower loads first)
   */
  loadOrder: number;

  /**
   * Whether module is currently active for campaign
   */
  isActive: boolean;

  /**
   * Campaign-specific override settings
   */
  overrides: Record<string, unknown>;

  /**
   * Timestamp when module was added to campaign
   */
  addedAt: Date;

  /**
   * User who added the module
   */
  addedBy: string | null;

  /**
   * Additional metadata
   */
  data: Record<string, unknown>;
}

/**
 * Request to add a module to a campaign
 */
export interface AddModuleToCampaignInput {
  moduleId: string;
  loadOrder?: number;
  isActive?: boolean;
  overrides?: Record<string, unknown>;
}

/**
 * Request to update campaign-module settings
 */
export interface UpdateCampaignModuleInput {
  loadOrder?: number;
  isActive?: boolean;
  overrides?: Record<string, unknown>;
}
