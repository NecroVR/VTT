import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { items } from './items';

describe('items schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(items);
      expect(tableName).toBe('items');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(items);
      expect(columns.id).toBeDefined();
      expect(columns.gameId).toBeDefined();
      expect(columns.actorId).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.itemType).toBeDefined();
      expect(columns.img).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have core property columns', () => {
      const columns = getTableColumns(items);
      expect(columns.description).toBeDefined();
      expect(columns.quantity).toBeDefined();
      expect(columns.weight).toBeDefined();
      expect(columns.price).toBeDefined();
      expect(columns.equipped).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(items);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.gameId.dataType).toBe('string');
      expect(columns.actorId.dataType).toBe('string');
      expect(columns.name.dataType).toBe('string');
      expect(columns.itemType.dataType).toBe('string');
      expect(columns.quantity.dataType).toBe('number');
      expect(columns.weight.dataType).toBe('number');
      expect(columns.price.dataType).toBe('number');
      expect(columns.equipped.dataType).toBe('boolean');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(items);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(items);
      expect(columns.gameId.notNull).toBe(true);
      expect(columns.name.notNull).toBe(true);
      expect(columns.itemType.notNull).toBe(true);
      expect(columns.quantity.notNull).toBe(true);
      expect(columns.weight.notNull).toBe(true);
      expect(columns.price.notNull).toBe(true);
      expect(columns.equipped.notNull).toBe(true);
    });

    it('should have default values for properties', () => {
      const columns = getTableColumns(items);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.quantity.hasDefault).toBe(true);
      expect(columns.weight.hasDefault).toBe(true);
      expect(columns.price.hasDefault).toBe(true);
      expect(columns.equipped.hasDefault).toBe(true);
      expect(columns.sort.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(items);
      expect(columns.id.name).toBe('id');
      expect(columns.gameId.name).toBe('game_id');
      expect(columns.actorId.name).toBe('actor_id');
      expect(columns.itemType.name).toBe('item_type');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(items);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });

    it('should have sort column for organization', () => {
      const columns = getTableColumns(items);
      expect(columns.sort).toBeDefined();
      expect(columns.sort.dataType).toBe('number');
    });
  });
});
