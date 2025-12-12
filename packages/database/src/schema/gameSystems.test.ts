import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { gameSystems } from './gameSystems.js';

describe('gameSystems schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(gameSystems);
      expect(tableName).toBe('game_systems');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(gameSystems);
      expect(columns.id).toBeDefined();
      expect(columns.systemId).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.version).toBeDefined();
      expect(columns.publisher).toBeDefined();
      expect(columns.description).toBeDefined();
      expect(columns.type).toBeDefined();
      expect(columns.manifestPath).toBeDefined();
      expect(columns.isActive).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(gameSystems);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.systemId.dataType).toBe('string');
      expect(columns.name.dataType).toBe('string');
      expect(columns.version.dataType).toBe('string');
      expect(columns.publisher.dataType).toBe('string');
      expect(columns.description.dataType).toBe('string');
      expect(columns.type.dataType).toBe('string');
      expect(columns.manifestPath.dataType).toBe('string');
      expect(columns.isActive.dataType).toBe('boolean');
      expect(columns.createdAt.dataType).toBe('date');
      expect(columns.updatedAt.dataType).toBe('date');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(gameSystems);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(gameSystems);
      expect(columns.id.notNull).toBe(true);
      expect(columns.systemId.notNull).toBe(true);
      expect(columns.name.notNull).toBe(true);
      expect(columns.version.notNull).toBe(true);
      expect(columns.type.notNull).toBe(true);
      expect(columns.isActive.notNull).toBe(true);
      expect(columns.createdAt.notNull).toBe(true);
      expect(columns.updatedAt.notNull).toBe(true);
    });

    it('should allow null on optional fields', () => {
      const columns = getTableColumns(gameSystems);
      expect(columns.publisher.notNull).toBe(false);
      expect(columns.description.notNull).toBe(false);
      expect(columns.manifestPath.notNull).toBe(false);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(gameSystems);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.isActive.hasDefault).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
      expect(columns.updatedAt.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(gameSystems);
      expect(columns.id.name).toBe('id');
      expect(columns.systemId.name).toBe('system_id');
      expect(columns.name.name).toBe('name');
      expect(columns.version.name).toBe('version');
      expect(columns.publisher.name).toBe('publisher');
      expect(columns.description.name).toBe('description');
      expect(columns.type.name).toBe('type');
      expect(columns.manifestPath.name).toBe('manifest_path');
      expect(columns.isActive.name).toBe('is_active');
      expect(columns.createdAt.name).toBe('created_at');
      expect(columns.updatedAt.name).toBe('updated_at');
    });

    it('should have unique constraint on systemId', () => {
      const columns = getTableColumns(gameSystems);
      expect(columns.systemId.isUnique).toBe(true);
    });
  });
});
