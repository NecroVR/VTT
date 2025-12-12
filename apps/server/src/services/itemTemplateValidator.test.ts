/**
 * Unit tests for ItemTemplateValidator
 */

import { describe, it, expect } from 'vitest';
import { ItemTemplateValidator, itemValidator } from './itemTemplateValidator.js';
import type { ItemTemplate, FieldDefinition } from '@vtt/shared';

describe('ItemTemplateValidator', () => {
  // Helper to create a basic template
  const createTemplate = (fields: FieldDefinition[]): ItemTemplate => ({
    id: 'test-template',
    systemId: 'test-system',
    entityType: 'item',
    name: 'Test Template',
    category: 'weapon',
    fields,
    computedFields: [],
    sections: [],
    rolls: [],
  });

  describe('validateItem', () => {
    describe('required fields', () => {
      it('should error when required field is missing', () => {
        const template = createTemplate([
          {
            id: 'name',
            name: 'Name',
            fieldType: 'text',
            required: true,
          },
        ]);

        const result = itemValidator.validateItem({}, template);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toEqual({
          field: 'name',
          message: "Field 'Name' is required",
          code: 'REQUIRED_FIELD_MISSING',
        });
      });

      it('should pass when required field is present', () => {
        const template = createTemplate([
          {
            id: 'name',
            name: 'Name',
            fieldType: 'text',
            required: true,
          },
        ]);

        const result = itemValidator.validateItem({ name: 'Sword' }, template);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should error when required field is null', () => {
        const template = createTemplate([
          {
            id: 'name',
            name: 'Name',
            fieldType: 'text',
            required: true,
          },
        ]);

        const result = itemValidator.validateItem({ name: null }, template);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
      });
    });

    describe('text field validation', () => {
      it('should accept valid text', () => {
        const template = createTemplate([
          {
            id: 'description',
            name: 'Description',
            fieldType: 'text',
          },
        ]);

        const result = itemValidator.validateItem({ description: 'A fine sword' }, template);

        expect(result.valid).toBe(true);
      });

      it('should reject non-string values', () => {
        const template = createTemplate([
          {
            id: 'description',
            name: 'Description',
            fieldType: 'text',
          },
        ]);

        const result = itemValidator.validateItem({ description: 123 }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });
    });

    describe('number field validation', () => {
      it('should accept valid numbers', () => {
        const template = createTemplate([
          {
            id: 'damage',
            name: 'Damage',
            fieldType: 'number',
          },
        ]);

        const result = itemValidator.validateItem({ damage: 10 }, template);

        expect(result.valid).toBe(true);
      });

      it('should reject non-numeric values', () => {
        const template = createTemplate([
          {
            id: 'damage',
            name: 'Damage',
            fieldType: 'number',
          },
        ]);

        const result = itemValidator.validateItem({ damage: 'ten' }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });

      it('should reject NaN', () => {
        const template = createTemplate([
          {
            id: 'damage',
            name: 'Damage',
            fieldType: 'number',
          },
        ]);

        const result = itemValidator.validateItem({ damage: NaN }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });
    });

    describe('boolean field validation', () => {
      it('should accept true', () => {
        const template = createTemplate([
          {
            id: 'magical',
            name: 'Magical',
            fieldType: 'boolean',
          },
        ]);

        const result = itemValidator.validateItem({ magical: true }, template);

        expect(result.valid).toBe(true);
      });

      it('should accept false', () => {
        const template = createTemplate([
          {
            id: 'magical',
            name: 'Magical',
            fieldType: 'boolean',
          },
        ]);

        const result = itemValidator.validateItem({ magical: false }, template);

        expect(result.valid).toBe(true);
      });

      it('should reject non-boolean values', () => {
        const template = createTemplate([
          {
            id: 'magical',
            name: 'Magical',
            fieldType: 'boolean',
          },
        ]);

        const result = itemValidator.validateItem({ magical: 'yes' }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });
    });

    describe('select field validation', () => {
      it('should accept valid option', () => {
        const template = createTemplate([
          {
            id: 'weaponType',
            name: 'Weapon Type',
            fieldType: 'select',
            options: [
              { value: 'sword', label: 'Sword' },
              { value: 'axe', label: 'Axe' },
            ],
          },
        ]);

        const result = itemValidator.validateItem({ weaponType: 'sword' }, template);

        expect(result.valid).toBe(true);
      });

      it('should reject invalid option', () => {
        const template = createTemplate([
          {
            id: 'weaponType',
            name: 'Weapon Type',
            fieldType: 'select',
            options: [
              { value: 'sword', label: 'Sword' },
              { value: 'axe', label: 'Axe' },
            ],
          },
        ]);

        const result = itemValidator.validateItem({ weaponType: 'hammer' }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_OPTION');
      });

      it('should reject non-string values', () => {
        const template = createTemplate([
          {
            id: 'weaponType',
            name: 'Weapon Type',
            fieldType: 'select',
            options: [
              { value: 'sword', label: 'Sword' },
            ],
          },
        ]);

        const result = itemValidator.validateItem({ weaponType: 123 }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });
    });

    describe('multiselect field validation', () => {
      it('should accept valid options array', () => {
        const template = createTemplate([
          {
            id: 'properties',
            name: 'Properties',
            fieldType: 'multiselect',
            options: [
              { value: 'finesse', label: 'Finesse' },
              { value: 'versatile', label: 'Versatile' },
              { value: 'thrown', label: 'Thrown' },
            ],
          },
        ]);

        const result = itemValidator.validateItem(
          { properties: ['finesse', 'thrown'] },
          template
        );

        expect(result.valid).toBe(true);
      });

      it('should reject invalid options', () => {
        const template = createTemplate([
          {
            id: 'properties',
            name: 'Properties',
            fieldType: 'multiselect',
            options: [
              { value: 'finesse', label: 'Finesse' },
              { value: 'versatile', label: 'Versatile' },
            ],
          },
        ]);

        const result = itemValidator.validateItem(
          { properties: ['finesse', 'invalid'] },
          template
        );

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_OPTION');
      });

      it('should reject non-array values', () => {
        const template = createTemplate([
          {
            id: 'properties',
            name: 'Properties',
            fieldType: 'multiselect',
          },
        ]);

        const result = itemValidator.validateItem({ properties: 'finesse' }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });
    });

    describe('dice field validation', () => {
      it('should accept valid dice notation', () => {
        const template = createTemplate([
          {
            id: 'damage',
            name: 'Damage',
            fieldType: 'dice',
          },
        ]);

        const validNotations = ['1d6', '2d8+3', '1d20-2', '3d6+1d4', '1d10+5'];

        for (const notation of validNotations) {
          const result = itemValidator.validateItem({ damage: notation }, template);
          expect(result.valid).toBe(true);
        }
      });

      it('should reject invalid dice notation', () => {
        const template = createTemplate([
          {
            id: 'damage',
            name: 'Damage',
            fieldType: 'dice',
          },
        ]);

        const invalidNotations = ['abc', '1d', 'd6', '1d6d8', 'sword'];

        for (const notation of invalidNotations) {
          const result = itemValidator.validateItem({ damage: notation }, template);
          expect(result.valid).toBe(false);
          expect(result.errors[0].code).toBe('INVALID_DICE_NOTATION');
        }
      });

      it('should reject non-string values', () => {
        const template = createTemplate([
          {
            id: 'damage',
            name: 'Damage',
            fieldType: 'dice',
          },
        ]);

        const result = itemValidator.validateItem({ damage: 123 }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });
    });

    describe('resource field validation', () => {
      it('should accept valid resource object', () => {
        const template = createTemplate([
          {
            id: 'charges',
            name: 'Charges',
            fieldType: 'resource',
          },
        ]);

        const result = itemValidator.validateItem(
          { charges: { current: 3, max: 5 } },
          template
        );

        expect(result.valid).toBe(true);
      });

      it('should reject non-object values', () => {
        const template = createTemplate([
          {
            id: 'charges',
            name: 'Charges',
            fieldType: 'resource',
          },
        ]);

        const result = itemValidator.validateItem({ charges: 5 }, template);

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });

      it('should reject objects without current/max', () => {
        const template = createTemplate([
          {
            id: 'charges',
            name: 'Charges',
            fieldType: 'resource',
          },
        ]);

        const result = itemValidator.validateItem(
          { charges: { value: 5 } },
          template
        );

        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
      });
    });

    describe('validation rules', () => {
      it('should validate min constraint', () => {
        const template = createTemplate([
          {
            id: 'level',
            name: 'Level',
            fieldType: 'number',
            validation: [
              {
                type: 'min',
                value: 1,
                message: 'Level must be at least 1',
              },
            ],
          },
        ]);

        const resultValid = itemValidator.validateItem({ level: 5 }, template);
        expect(resultValid.valid).toBe(true);

        const resultInvalid = itemValidator.validateItem({ level: 0 }, template);
        expect(resultInvalid.valid).toBe(false);
        expect(resultInvalid.errors[0].code).toBe('MIN_VALUE_VIOLATION');
      });

      it('should validate max constraint', () => {
        const template = createTemplate([
          {
            id: 'level',
            name: 'Level',
            fieldType: 'number',
            validation: [
              {
                type: 'max',
                value: 20,
                message: 'Level must be at most 20',
              },
            ],
          },
        ]);

        const resultValid = itemValidator.validateItem({ level: 15 }, template);
        expect(resultValid.valid).toBe(true);

        const resultInvalid = itemValidator.validateItem({ level: 25 }, template);
        expect(resultInvalid.valid).toBe(false);
        expect(resultInvalid.errors[0].code).toBe('MAX_VALUE_VIOLATION');
      });

      it('should validate pattern constraint', () => {
        const template = createTemplate([
          {
            id: 'code',
            name: 'Code',
            fieldType: 'text',
            validation: [
              {
                type: 'pattern',
                value: '^[A-Z]{3}\\d{3}$',
                message: 'Code must be 3 letters followed by 3 digits',
              },
            ],
          },
        ]);

        const resultValid = itemValidator.validateItem({ code: 'ABC123' }, template);
        expect(resultValid.valid).toBe(true);

        const resultInvalid = itemValidator.validateItem({ code: 'ABC12' }, template);
        expect(resultInvalid.valid).toBe(false);
        expect(resultInvalid.errors[0].code).toBe('PATTERN_VIOLATION');
      });

      it('should validate custom constraint', () => {
        const template = createTemplate([
          {
            id: 'value',
            name: 'Value',
            fieldType: 'number',
            validation: [
              {
                type: 'custom',
                message: 'Value must be even',
                customValidator: (value: any) => value % 2 === 0,
              },
            ],
          },
        ]);

        const resultValid = itemValidator.validateItem({ value: 10 }, template);
        expect(resultValid.valid).toBe(true);

        const resultInvalid = itemValidator.validateItem({ value: 11 }, template);
        expect(resultInvalid.valid).toBe(false);
        expect(resultInvalid.errors[0].code).toBe('CUSTOM_VALIDATION_FAILED');
      });
    });

    describe('unknown fields', () => {
      it('should warn about unknown fields', () => {
        const template = createTemplate([
          {
            id: 'name',
            name: 'Name',
            fieldType: 'text',
          },
        ]);

        const result = itemValidator.validateItem(
          { name: 'Sword', extraField: 'value' },
          template
        );

        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].code).toBe('UNKNOWN_FIELD');
      });
    });
  });

  describe('applyDefaults', () => {
    it('should apply default values for missing fields', () => {
      const template = createTemplate([
        {
          id: 'name',
          name: 'Name',
          fieldType: 'text',
          defaultValue: 'Unnamed Item',
        },
        {
          id: 'quantity',
          name: 'Quantity',
          fieldType: 'number',
          defaultValue: 1,
        },
      ]);

      const result = itemValidator.applyDefaults({}, template);

      expect(result).toEqual({
        name: 'Unnamed Item',
        quantity: 1,
      });
    });

    it('should not override existing values', () => {
      const template = createTemplate([
        {
          id: 'name',
          name: 'Name',
          fieldType: 'text',
          defaultValue: 'Unnamed Item',
        },
        {
          id: 'quantity',
          name: 'Quantity',
          fieldType: 'number',
          defaultValue: 1,
        },
      ]);

      const result = itemValidator.applyDefaults({ name: 'Sword' }, template);

      expect(result).toEqual({
        name: 'Sword',
        quantity: 1,
      });
    });

    it('should preserve existing data', () => {
      const template = createTemplate([
        {
          id: 'quantity',
          name: 'Quantity',
          fieldType: 'number',
          defaultValue: 1,
        },
      ]);

      const result = itemValidator.applyDefaults(
        { name: 'Sword', damage: '1d8' },
        template
      );

      expect(result).toEqual({
        name: 'Sword',
        damage: '1d8',
        quantity: 1,
      });
    });
  });

  describe('computeFields', () => {
    it('should compute fields from formulas', () => {
      const template: ItemTemplate = {
        id: 'test-template',
        systemId: 'test-system',
        entityType: 'item',
        name: 'Test Template',
        category: 'weapon',
        fields: [],
        computedFields: [
          {
            id: 'totalDamage',
            name: 'Total Damage',
            formula: '@baseDamage + @bonus',
            dependencies: ['baseDamage', 'bonus'],
          },
        ],
        sections: [],
        rolls: [],
      };

      const result = itemValidator.computeFields(
        { baseDamage: 10, bonus: 3 },
        template
      );

      expect(result).toEqual({
        totalDamage: 13,
      });
    });

    it('should handle multiple computed fields', () => {
      const template: ItemTemplate = {
        id: 'test-template',
        systemId: 'test-system',
        entityType: 'item',
        name: 'Test Template',
        category: 'weapon',
        fields: [],
        computedFields: [
          {
            id: 'sum',
            name: 'Sum',
            formula: '@a + @b',
            dependencies: ['a', 'b'],
          },
          {
            id: 'product',
            name: 'Product',
            formula: '@a * @b',
            dependencies: ['a', 'b'],
          },
        ],
        sections: [],
        rolls: [],
      };

      const result = itemValidator.computeFields({ a: 5, b: 3 }, template);

      expect(result).toEqual({
        sum: 8,
        product: 15,
      });
    });

    it('should handle complex formulas', () => {
      const template: ItemTemplate = {
        id: 'test-template',
        systemId: 'test-system',
        entityType: 'item',
        name: 'Test Template',
        category: 'weapon',
        fields: [],
        computedFields: [
          {
            id: 'result',
            name: 'Result',
            formula: '(@a + @b) * @c - @d',
            dependencies: ['a', 'b', 'c', 'd'],
          },
        ],
        sections: [],
        rolls: [],
      };

      const result = itemValidator.computeFields(
        { a: 2, b: 3, c: 4, d: 5 },
        template
      );

      expect(result).toEqual({
        result: 15, // (2 + 3) * 4 - 5 = 15
      });
    });

    it('should skip fields with missing dependencies', () => {
      const template: ItemTemplate = {
        id: 'test-template',
        systemId: 'test-system',
        entityType: 'item',
        name: 'Test Template',
        category: 'weapon',
        fields: [],
        computedFields: [
          {
            id: 'result',
            name: 'Result',
            formula: '@a + @b',
            dependencies: ['a', 'b'],
          },
        ],
        sections: [],
        rolls: [],
      };

      const result = itemValidator.computeFields({ a: 5 }, template);

      // Should not include result since @b is missing
      expect(result).toEqual({});
    });

    it('should return empty object if no computed fields', () => {
      const template = createTemplate([]);

      const result = itemValidator.computeFields({ a: 5 }, template);

      expect(result).toEqual({});
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(itemValidator).toBeInstanceOf(ItemTemplateValidator);
    });
  });
});
