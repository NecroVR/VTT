/**
 * Validation Type Definitions
 *
 * Defines types for module and entity validation.
 * Validation tracks errors, warnings, and resolution status.
 *
 * @see docs/architecture/EAV_MODULE_SCHEMA.md
 */

// ============================================================================
// VALIDATION SEVERITY
// ============================================================================

/**
 * Severity levels for validation issues
 */
export type ValidationSeverity =
  | 'error'   // Blocks usage, must be fixed
  | 'warning' // Should be addressed but not blocking
  | 'info';   // Informational only

// ============================================================================
// VALIDATION ERROR
// ============================================================================

/**
 * A validation error tracked in the database
 */
export interface ValidationError {
  /**
   * UUID primary key
   */
  id: string;

  /**
   * Module this error belongs to
   */
  moduleId: string;

  /**
   * Entity this error belongs to (null for module-level errors)
   */
  entityId: string | null;

  /**
   * Type/category of error
   */
  errorType: string;

  /**
   * Error severity
   */
  severity: ValidationSeverity;

  /**
   * Property key that failed validation (if applicable)
   */
  propertyKey: string | null;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details
   */
  details: Record<string, unknown>;

  /**
   * Source file path
   */
  sourcePath: string | null;

  /**
   * Line number in source file
   */
  sourceLineNumber: number | null;

  /**
   * Column number in source file
   */
  sourceColumn: number | null;

  /**
   * Whether error has been resolved
   */
  isResolved: boolean;

  /**
   * Timestamp when resolved
   */
  resolvedAt: Date | null;

  /**
   * User who resolved the error
   */
  resolvedBy: string | null;

  /**
   * Note about how error was resolved
   */
  resolutionNote: string | null;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

/**
 * Result of validating a module or entity
 */
export interface ValidationResult {
  /**
   * Whether validation passed (no errors)
   */
  valid: boolean;

  /**
   * Validation errors found
   */
  errors: ValidationIssue[];

  /**
   * Validation warnings found
   */
  warnings: ValidationIssue[];

  /**
   * Informational messages
   */
  info: ValidationIssue[];

  /**
   * Timestamp of validation
   */
  validatedAt: Date;

  /**
   * Total number of entities validated
   */
  entityCount?: number;

  /**
   * Number of entities with errors
   */
  errorCount?: number;

  /**
   * Number of entities with warnings
   */
  warningCount?: number;
}

/**
 * A validation issue (error, warning, or info)
 */
export interface ValidationIssue {
  /**
   * Error type/code
   */
  type: string;

  /**
   * Severity level
   */
  severity: ValidationSeverity;

  /**
   * Human-readable message
   */
  message: string;

  /**
   * Entity ID (if applicable)
   */
  entityId?: string;

  /**
   * Entity name (if applicable)
   */
  entityName?: string;

  /**
   * Property key (if applicable)
   */
  propertyKey?: string;

  /**
   * Source location
   */
  source?: ValidationSource;

  /**
   * Additional details
   */
  details?: Record<string, unknown>;

  /**
   * Suggested fix (if available)
   */
  suggestion?: string;
}

/**
 * Source location for a validation issue
 */
export interface ValidationSource {
  /**
   * File path
   */
  file?: string;

  /**
   * Line number
   */
  line?: number;

  /**
   * Column number
   */
  column?: number;

  /**
   * Code snippet
   */
  snippet?: string;
}

// ============================================================================
// ENTITY VALIDATION STATUS
// ============================================================================

/**
 * Validation status summary for an entity
 */
export interface EntityValidationStatus {
  /**
   * Entity ID
   */
  entityId: string;

  /**
   * Entity name
   */
  entityName: string;

  /**
   * Entity type
   */
  entityType: string;

  /**
   * Overall validation status
   */
  status: 'valid' | 'invalid' | 'pending';

  /**
   * Number of errors
   */
  errorCount: number;

  /**
   * Number of warnings
   */
  warningCount: number;

  /**
   * Number of info messages
   */
  infoCount: number;

  /**
   * Validation issues
   */
  issues: ValidationIssue[];

  /**
   * Last validation timestamp
   */
  validatedAt: Date | null;
}

// ============================================================================
// MODULE VALIDATION STATUS
// ============================================================================

/**
 * Validation status summary for a module
 */
export interface ModuleValidationStatus {
  /**
   * Module ID
   */
  moduleId: string;

  /**
   * Module name
   */
  moduleName: string;

  /**
   * Overall validation status
   */
  status: 'valid' | 'invalid' | 'pending';

  /**
   * Total entities in module
   */
  totalEntities: number;

  /**
   * Number of valid entities
   */
  validEntities: number;

  /**
   * Number of invalid entities
   */
  invalidEntities: number;

  /**
   * Number of pending entities
   */
  pendingEntities: number;

  /**
   * Total error count
   */
  errorCount: number;

  /**
   * Total warning count
   */
  warningCount: number;

  /**
   * Total info count
   */
  infoCount: number;

  /**
   * Module-level issues
   */
  moduleIssues: ValidationIssue[];

  /**
   * Per-entity validation status
   */
  entityStatuses: EntityValidationStatus[];

  /**
   * Last validation timestamp
   */
  validatedAt: Date | null;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to validate a module
 */
export interface ValidateModuleRequest {
  /**
   * Module ID to validate
   */
  moduleId: string;

  /**
   * Whether to re-validate even if already validated
   */
  force?: boolean;

  /**
   * Whether to validate dependencies
   */
  validateDependencies?: boolean;
}

/**
 * Response from module validation
 */
export interface ValidateModuleResponse {
  /**
   * Validation result
   */
  result: ValidationResult;

  /**
   * Module validation status
   */
  status: ModuleValidationStatus;
}

/**
 * Request to resolve a validation error
 */
export interface ResolveValidationErrorRequest {
  /**
   * Error ID to resolve
   */
  errorId: string;

  /**
   * Resolution note
   */
  note?: string;
}

/**
 * Request to get validation errors
 */
export interface GetValidationErrorsParams {
  /**
   * Module ID
   */
  moduleId?: string;

  /**
   * Entity ID
   */
  entityId?: string;

  /**
   * Filter by severity
   */
  severity?: ValidationSeverity | ValidationSeverity[];

  /**
   * Include resolved errors
   */
  includeResolved?: boolean;

  /**
   * Page number
   */
  page?: number;

  /**
   * Items per page
   */
  pageSize?: number;
}

/**
 * Response with validation errors
 */
export interface ValidationErrorsResponse {
  errors: ValidationError[];
  total: number;
  page?: number;
  pageSize?: number;
}
