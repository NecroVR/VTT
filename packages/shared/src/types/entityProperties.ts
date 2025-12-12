/**
 * Entity Property Type Definitions
 *
 * Defines types for the EAV (Entity-Attribute-Value) property storage system.
 * Properties are stored as individual rows for maximum flexibility.
 *
 * @see docs/architecture/EAV_MODULE_SCHEMA.md
 */

// ============================================================================
// PROPERTY VALUE TYPES
// ============================================================================

/**
 * Types of values that can be stored in properties
 */
export type PropertyValueType =
  | 'string'      // Text values
  | 'number'      // Floating point numbers
  | 'integer'     // Whole numbers
  | 'boolean'     // True/false
  | 'json'        // Complex objects/arrays
  | 'reference';  // Reference to another entity

// ============================================================================
// ENTITY PROPERTY
// ============================================================================

/**
 * A single property value for an entity.
 * Uses EAV pattern where each property is a separate row.
 */
export interface EntityProperty {
  /**
   * UUID primary key
   */
  id: string;

  /**
   * Entity this property belongs to
   */
  entityId: string;

  /**
   * Property key (supports dot notation, e.g., "damage.dice")
   */
  propertyKey: string;

  /**
   * Property path as array (e.g., ["damage", "dice"])
   */
  propertyPath: string[];

  /**
   * Depth of property in hierarchy
   */
  propertyDepth: number;

  /**
   * Type of value stored
   */
  valueType: PropertyValueType;

  /**
   * String value (only populated if valueType is 'string')
   */
  valueString: string | null;

  /**
   * Number value (only populated if valueType is 'number')
   */
  valueNumber: number | null;

  /**
   * Integer value (only populated if valueType is 'integer')
   */
  valueInteger: number | null;

  /**
   * Boolean value (only populated if valueType is 'boolean')
   */
  valueBoolean: boolean | null;

  /**
   * JSON value (only populated if valueType is 'json')
   */
  valueJson: unknown | null;

  /**
   * Reference value (only populated if valueType is 'reference')
   */
  valueReference: string | null;

  /**
   * Array index if this property is an array element
   */
  arrayIndex: number | null;

  /**
   * Whether this property is part of an array
   */
  isArrayElement: boolean;

  /**
   * Sort order within same property key
   */
  sort: number;

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
// PROPERTY DEFINITION
// ============================================================================

/**
 * Definition of a property type for a game system.
 * Provides validation rules and UI hints for properties.
 */
export interface PropertyDefinition {
  /**
   * UUID primary key
   */
  id: string;

  /**
   * Game system this property belongs to
   */
  gameSystemId: string;

  /**
   * Entity type this property applies to
   */
  entityType: string;

  /**
   * Property key (e.g., "damage.dice")
   */
  propertyKey: string;

  /**
   * Property path as array
   */
  propertyPath: string[];

  /**
   * Display name
   */
  name: string;

  /**
   * Description of property purpose
   */
  description: string | null;

  /**
   * Expected value type
   */
  valueType: PropertyValueType;

  /**
   * Whether property is required
   */
  isRequired: boolean;

  /**
   * Whether property can be an array
   */
  isArray: boolean;

  /**
   * Validation rules (JSON schema-like)
   */
  validation: PropertyValidation;

  /**
   * Default value if not provided
   */
  defaultValue: unknown | null;

  /**
   * Allowed options for select/enum fields
   */
  options: PropertyOption[];

  /**
   * UI field type hint
   */
  fieldType: string | null;

  /**
   * Placeholder text for UI
   */
  placeholder: string | null;

  /**
   * Section/group for UI organization
   */
  section: string | null;

  /**
   * Sort order within section
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
 * Validation rules for a property
 */
export interface PropertyValidation {
  /**
   * Minimum value (for numbers)
   */
  min?: number;

  /**
   * Maximum value (for numbers)
   */
  max?: number;

  /**
   * Minimum length (for strings/arrays)
   */
  minLength?: number;

  /**
   * Maximum length (for strings/arrays)
   */
  maxLength?: number;

  /**
   * Regex pattern (for strings)
   */
  pattern?: string;

  /**
   * Custom validation function (stored as string)
   */
  customValidator?: string;

  /**
   * Additional validation rules
   */
  [key: string]: unknown;
}

/**
 * Option for select/enum fields
 */
export interface PropertyOption {
  /**
   * Option value
   */
  value: string | number;

  /**
   * Display label
   */
  label: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Optional icon
   */
  icon?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract the actual value from a property based on its type
 */
export type ExtractPropertyValue<T extends EntityProperty> =
  T['valueType'] extends 'string' ? string :
  T['valueType'] extends 'number' ? number :
  T['valueType'] extends 'integer' ? number :
  T['valueType'] extends 'boolean' ? boolean :
  T['valueType'] extends 'json' ? unknown :
  T['valueType'] extends 'reference' ? string :
  never;

/**
 * Property value union type
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | unknown
  | null;

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to set a property value
 */
export interface SetPropertyInput {
  propertyKey: string;
  valueType: PropertyValueType;
  value: PropertyValue;
  arrayIndex?: number;
}

/**
 * Request to set multiple properties at once
 */
export interface SetPropertiesInput {
  properties: SetPropertyInput[];
}

/**
 * Response with property data
 */
export interface PropertyResponse {
  property: EntityProperty;
}

/**
 * Response with multiple properties
 */
export interface PropertiesResponse {
  properties: EntityProperty[];
}

/**
 * Flattened property data for easy consumption
 */
export interface FlattenedProperties {
  [key: string]: PropertyValue | PropertyValue[];
}

/**
 * Request to get properties in flattened format
 */
export interface GetPropertiesParams {
  /**
   * Entity ID
   */
  entityId: string;

  /**
   * Whether to return flattened object (default: false)
   */
  flatten?: boolean;

  /**
   * Property key prefix filter (e.g., "damage" to get all damage.* properties)
   */
  keyPrefix?: string;
}
