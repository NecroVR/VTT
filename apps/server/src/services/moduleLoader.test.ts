import { describe, it, expect, beforeEach } from 'vitest';
import { ModuleLoaderService } from './moduleLoader.js';
import type { EntityProperty } from '@vtt/shared';

describe('ModuleLoaderService', () => {
  let service: ModuleLoaderService;

  beforeEach(() => {
    service = new ModuleLoaderService();
  });

  describe('flattenToProperties', () => {
    it('should flatten simple object properties', () => {
      const data = {
        name: 'Longsword',
        weight: 3,
        cost: 15,
        magical: false,
      };

      const properties = service.flattenToProperties(data, 'test-entity-id');

      expect(properties).toHaveLength(4);
      expect(properties.find(p => p.propertyKey === 'name')?.valueString).toBe('Longsword');
      expect(properties.find(p => p.propertyKey === 'weight')?.valueInteger).toBe(3);
      expect(properties.find(p => p.propertyKey === 'cost')?.valueInteger).toBe(15);
      expect(properties.find(p => p.propertyKey === 'magical')?.valueBoolean).toBe(false);
    });

    it('should flatten nested object properties with dot notation', () => {
      const data = {
        name: 'Longsword',
        damage: {
          dice: '1d8',
          type: 'slashing',
        },
      };

      const properties = service.flattenToProperties(data, 'test-entity-id');

      expect(properties).toHaveLength(3);
      expect(properties.find(p => p.propertyKey === 'damage.dice')?.valueString).toBe('1d8');
      expect(properties.find(p => p.propertyKey === 'damage.type')?.valueString).toBe('slashing');
    });

    it('should flatten array properties with array indices', () => {
      const data = {
        name: 'Longsword',
        properties: ['versatile', 'martial'],
      };

      const properties = service.flattenToProperties(data, 'test-entity-id');

      expect(properties).toHaveLength(3);

      const prop0 = properties.find(p => p.propertyKey === 'properties.0');
      expect(prop0?.valueString).toBe('versatile');
      expect(prop0?.isArrayElement).toBe(true);
      expect(prop0?.arrayIndex).toBe(0);

      const prop1 = properties.find(p => p.propertyKey === 'properties.1');
      expect(prop1?.valueString).toBe('martial');
      expect(prop1?.isArrayElement).toBe(true);
      expect(prop1?.arrayIndex).toBe(1);
    });

    it('should detect correct value types', () => {
      const data = {
        stringVal: 'hello',
        intVal: 42,
        floatVal: 3.14,
        boolVal: true,
      };

      const properties = service.flattenToProperties(data, 'test-entity-id');

      expect(properties.find(p => p.propertyKey === 'stringVal')?.valueType).toBe('string');
      expect(properties.find(p => p.propertyKey === 'intVal')?.valueType).toBe('integer');
      expect(properties.find(p => p.propertyKey === 'floatVal')?.valueType).toBe('number');
      expect(properties.find(p => p.propertyKey === 'boolVal')?.valueType).toBe('boolean');
    });

    it('should handle complex nested structures', () => {
      const data = {
        name: 'Fireball',
        damage: {
          dice: '8d6',
          type: 'fire',
          save: {
            ability: 'dexterity',
            dc: 15,
          },
        },
        components: ['verbal', 'somatic', 'material'],
      };

      const properties = service.flattenToProperties(data, 'test-entity-id');

      expect(properties.find(p => p.propertyKey === 'damage.dice')?.valueString).toBe('8d6');
      expect(properties.find(p => p.propertyKey === 'damage.type')?.valueString).toBe('fire');
      expect(properties.find(p => p.propertyKey === 'damage.save.ability')?.valueString).toBe('dexterity');
      expect(properties.find(p => p.propertyKey === 'damage.save.dc')?.valueInteger).toBe(15);
      expect(properties.find(p => p.propertyKey === 'components.0')?.valueString).toBe('verbal');
      expect(properties.find(p => p.propertyKey === 'components.1')?.valueString).toBe('somatic');
      expect(properties.find(p => p.propertyKey === 'components.2')?.valueString).toBe('material');
    });
  });

  describe('reconstructFromProperties', () => {
    it('should reconstruct simple object from properties', () => {
      const properties: EntityProperty[] = [
        {
          id: '1',
          entityId: 'test',
          propertyKey: 'name',
          propertyPath: ['name'],
          propertyDepth: 0,
          valueType: 'string',
          valueString: 'Longsword',
          valueNumber: null,
          valueInteger: null,
          valueBoolean: null,
          valueJson: null,
          valueReference: null,
          arrayIndex: null,
          isArrayElement: false,
          sort: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          entityId: 'test',
          propertyKey: 'weight',
          propertyPath: ['weight'],
          propertyDepth: 0,
          valueType: 'integer',
          valueString: null,
          valueNumber: null,
          valueInteger: 3,
          valueBoolean: null,
          valueJson: null,
          valueReference: null,
          arrayIndex: null,
          isArrayElement: false,
          sort: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = service.reconstructFromProperties(properties);

      expect(result).toEqual({
        name: 'Longsword',
        weight: 3,
      });
    });

    it('should reconstruct nested objects', () => {
      const properties: EntityProperty[] = [
        {
          id: '1',
          entityId: 'test',
          propertyKey: 'damage.dice',
          propertyPath: ['damage', 'dice'],
          propertyDepth: 1,
          valueType: 'string',
          valueString: '1d8',
          valueNumber: null,
          valueInteger: null,
          valueBoolean: null,
          valueJson: null,
          valueReference: null,
          arrayIndex: null,
          isArrayElement: false,
          sort: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          entityId: 'test',
          propertyKey: 'damage.type',
          propertyPath: ['damage', 'type'],
          propertyDepth: 1,
          valueType: 'string',
          valueString: 'slashing',
          valueNumber: null,
          valueInteger: null,
          valueBoolean: null,
          valueJson: null,
          valueReference: null,
          arrayIndex: null,
          isArrayElement: false,
          sort: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = service.reconstructFromProperties(properties);

      expect(result).toEqual({
        damage: {
          dice: '1d8',
          type: 'slashing',
        },
      });
    });

    it('should be reversible (flatten -> reconstruct)', () => {
      const original = {
        name: 'Longsword',
        damage: {
          dice: '1d8',
          type: 'slashing',
        },
        properties: ['versatile', 'martial'],
        weight: 3,
        magical: false,
      };

      const flattened = service.flattenToProperties(original, 'test-entity-id');
      const reconstructed = service.reconstructFromProperties(flattened);

      expect(reconstructed).toEqual(original);
    });
  });
});
