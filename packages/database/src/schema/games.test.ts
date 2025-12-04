import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { games } from './games';

describe('games schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(games);
      expect(tableName).toBe('games');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(games);
      expect(columns.id).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.ownerId).toBeDefined();
      expect(columns.settings).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(games);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.name.dataType).toBe('string');
      expect(columns.ownerId.dataType).toBe('string');
      expect(columns.settings.dataType).toBe('json');
      expect(columns.createdAt.dataType).toBe('date');
      expect(columns.updatedAt.dataType).toBe('date');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(games);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(games);
      expect(columns.name.notNull).toBe(true);
      expect(columns.ownerId.notNull).toBe(true);
      expect(columns.settings.notNull).toBe(true);
      expect(columns.createdAt.notNull).toBe(true);
      expect(columns.updatedAt.notNull).toBe(true);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(games);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.settings.hasDefault).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
      expect(columns.updatedAt.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(games);
      expect(columns.id.name).toBe('id');
      expect(columns.name.name).toBe('name');
      expect(columns.ownerId.name).toBe('owner_id');
      expect(columns.settings.name).toBe('settings');
    });

    it('should have settings as JSONB column', () => {
      const columns = getTableColumns(games);
      expect(columns.settings.dataType).toBe('json');
    });
  });
});
