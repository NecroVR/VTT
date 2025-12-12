/**
 * Item Template Validator Service
 *
 * Validates item data against ItemTemplate definitions, ensuring data integrity
 * and consistency with the template schema.
 */

import type {
  ItemTemplate,
  FieldDefinition,
  ItemValidationResult,
  ItemValidationError,
  ItemValidationWarning,
} from '@vtt/shared';

/**
 * Service for validating item data against templates
 */
export class ItemTemplateValidator {
  /**
   * Validate item data against its template
   */
  validateItem(
    itemData: Record<string, unknown>,
    template: ItemTemplate
  ): ItemValidationResult {
    const errors: ItemValidationError[] = [];
    const warnings: ItemValidationWarning[] = [];

    // Validate each field in the template
    for (const field of template.fields) {
      const value = itemData[field.id];

      // Check required fields
      if (field.required && (value === undefined || value === null)) {
        errors.push({
          field: field.id,
          message: `Field '${field.name}' is required`,
          code: 'REQUIRED_FIELD_MISSING',
        });
        continue;
      }

      // Skip validation if field is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Validate field type
      const typeError = this.validateFieldType(field, value);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Validate field constraints
      const validationErrors = this.validateFieldConstraints(field, value);
      errors.push(...validationErrors);
    }

    // Check for unknown fields (warn only, don't error)
    const templateFieldIds = new Set(template.fields.map((f) => f.id));
    for (const key of Object.keys(itemData)) {
      if (!templateFieldIds.has(key)) {
        warnings.push({
          field: key,
          message: `Field '${key}' is not defined in template`,
          code: 'UNKNOWN_FIELD',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate field type matches expected type
   */
  private validateFieldType(
    field: FieldDefinition,
    value: unknown
  ): ItemValidationError | null {
    switch (field.fieldType) {
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          return {
            field: field.id,
            message: `Field '${field.name}' must be a string`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be a valid number`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: field.id,
            message: `Field '${field.name}' must be a boolean`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'select':
        if (typeof value !== 'string') {
          return {
            field: field.id,
            message: `Field '${field.name}' must be a string`,
            code: 'INVALID_TYPE',
          };
        }
        // Validate value is in options
        if (field.options && !field.options.some((opt) => opt.value === value)) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be one of: ${field.options.map((o) => o.value).join(', ')}`,
            code: 'INVALID_OPTION',
          };
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an array`,
            code: 'INVALID_TYPE',
          };
        }
        // Validate all values are strings
        if (!value.every((v) => typeof v === 'string')) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an array of strings`,
            code: 'INVALID_TYPE',
          };
        }
        // Validate all values are in options
        if (field.options) {
          const validValues = new Set(field.options.map((o) => o.value));
          const invalidValues = value.filter((v) => !validValues.has(v as string));
          if (invalidValues.length > 0) {
            return {
              field: field.id,
              message: `Field '${field.name}' contains invalid values: ${invalidValues.join(', ')}`,
              code: 'INVALID_OPTION',
            };
          }
        }
        break;

      case 'dice':
        if (typeof value !== 'string') {
          return {
            field: field.id,
            message: `Field '${field.name}' must be a string`,
            code: 'INVALID_TYPE',
          };
        }
        // Validate dice notation
        if (!this.isValidDiceNotation(value)) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be valid dice notation (e.g., "1d6", "2d8+3")`,
            code: 'INVALID_DICE_NOTATION',
          };
        }
        break;

      case 'resource':
        if (typeof value !== 'object' || value === null) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an object with 'current' and 'max' properties`,
            code: 'INVALID_TYPE',
          };
        }
        const resourceValue = value as Record<string, unknown>;
        if (
          typeof resourceValue.current !== 'number' ||
          typeof resourceValue.max !== 'number'
        ) {
          return {
            field: field.id,
            message: `Field '${field.name}' must have numeric 'current' and 'max' properties`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'reference':
        if (typeof value !== 'string') {
          return {
            field: field.id,
            message: `Field '${field.name}' must be a string (entity ID)`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'reference_list':
        if (!Array.isArray(value)) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an array of entity IDs`,
            code: 'INVALID_TYPE',
          };
        }
        if (!value.every((v) => typeof v === 'string')) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an array of strings (entity IDs)`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'slots':
        if (!Array.isArray(value)) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an array of booleans`,
            code: 'INVALID_TYPE',
          };
        }
        if (!value.every((v) => typeof v === 'boolean')) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an array of booleans`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'clock':
        if (typeof value !== 'object' || value === null) {
          return {
            field: field.id,
            message: `Field '${field.name}' must be an object with 'filled' and 'segments' properties`,
            code: 'INVALID_TYPE',
          };
        }
        const clockValue = value as Record<string, unknown>;
        if (
          typeof clockValue.filled !== 'number' ||
          typeof clockValue.segments !== 'number'
        ) {
          return {
            field: field.id,
            message: `Field '${field.name}' must have numeric 'filled' and 'segments' properties`,
            code: 'INVALID_TYPE',
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate field constraints (min, max, pattern, custom validators)
   */
  private validateFieldConstraints(
    field: FieldDefinition,
    value: unknown
  ): ItemValidationError[] {
    const errors: ItemValidationError[] = [];

    if (!field.validation) {
      return errors;
    }

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'min':
          if (typeof value === 'number' && value < rule.value) {
            errors.push({
              field: field.id,
              message: rule.message || `Field '${field.name}' must be at least ${rule.value}`,
              code: 'MIN_VALUE_VIOLATION',
            });
          }
          break;

        case 'max':
          if (typeof value === 'number' && value > rule.value) {
            errors.push({
              field: field.id,
              message: rule.message || `Field '${field.name}' must be at most ${rule.value}`,
              code: 'MAX_VALUE_VIOLATION',
            });
          }
          break;

        case 'pattern':
          if (typeof value === 'string') {
            const regex = new RegExp(rule.value);
            if (!regex.test(value)) {
              errors.push({
                field: field.id,
                message: rule.message || `Field '${field.name}' does not match required pattern`,
                code: 'PATTERN_VIOLATION',
              });
            }
          }
          break;

        case 'custom':
          if (rule.customValidator && !rule.customValidator(value)) {
            errors.push({
              field: field.id,
              message: rule.message || `Field '${field.name}' failed custom validation`,
              code: 'CUSTOM_VALIDATION_FAILED',
            });
          }
          break;
      }
    }

    return errors;
  }

  /**
   * Validate dice notation format
   * Accepts formats like: "1d6", "2d8+3", "1d20-2", "3d6+1d4"
   */
  private isValidDiceNotation(notation: string): boolean {
    // Basic dice notation pattern: XdY[+/-Z] where X, Y, Z are numbers
    // More complex: multiple dice groups (e.g., "1d6+2d4+3")
    const dicePattern = /^(\d+d\d+([+-]\d+)?(\s*[+-]\s*\d+d\d+([+-]\d+)?)*|[+-]?\d+)$/i;
    return dicePattern.test(notation.trim());
  }

  /**
   * Apply template defaults to item data
   * Returns a new object with defaults applied for missing fields
   */
  applyDefaults(
    itemData: Record<string, unknown>,
    template: ItemTemplate
  ): Record<string, unknown> {
    const result = { ...itemData };

    for (const field of template.fields) {
      // Apply default value if field is not set and has a default
      if (
        (result[field.id] === undefined || result[field.id] === null) &&
        field.defaultValue !== undefined
      ) {
        result[field.id] = field.defaultValue;
      }
    }

    return result;
  }

  /**
   * Compute derived field values from formulas
   * Returns object with computed field values
   */
  computeFields(
    itemData: Record<string, unknown>,
    template: ItemTemplate
  ): Record<string, unknown> {
    const computed: Record<string, unknown> = {};

    if (!template.computedFields) {
      return computed;
    }

    for (const computedField of template.computedFields) {
      try {
        // Evaluate the formula with item data as context
        const value = this.evaluateFormula(computedField.formula, itemData);
        computed[computedField.id] = value;
      } catch (error) {
        // If formula evaluation fails, log warning and skip
        console.warn(
          `Failed to compute field '${computedField.id}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return computed;
  }

  /**
   * Evaluate a formula string with data context
   * Simple implementation - supports basic math operations and property access
   */
  private evaluateFormula(formula: string, data: Record<string, unknown>): unknown {
    // Replace field references like @fieldId with actual values
    let processedFormula = formula;

    // Find all @references in the formula
    const referencePattern = /@(\w+)/g;
    const matches = Array.from(formula.matchAll(referencePattern));

    for (const match of matches) {
      const fieldId = match[1];
      const value = data[fieldId];

      if (value === undefined || value === null) {
        throw new Error(`Referenced field '${fieldId}' not found in data`);
      }

      // Replace @fieldId with the actual value
      processedFormula = processedFormula.replace(
        new RegExp(`@${fieldId}`, 'g'),
        String(value)
      );
    }

    // Evaluate mathematical expressions
    // WARNING: Using Function constructor for formula evaluation
    // In production, consider using a safer expression evaluator library
    try {
      // Only allow basic math operations for safety
      if (/[^0-9+\-*/().\s]/.test(processedFormula)) {
        throw new Error('Formula contains invalid characters');
      }

      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${processedFormula}`)();
      return result;
    } catch (error) {
      throw new Error(
        `Failed to evaluate formula '${formula}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Singleton instance of the validator
 */
export const itemValidator = new ItemTemplateValidator();
