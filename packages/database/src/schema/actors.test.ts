import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { actors } from './actors.js';

describe('actors schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(actors);
      expect(tableName).toBe('actors');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(actors);
      expect(columns.id).toBeDefined();
      expect(columns.gameId).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.actorType).toBeDefined();
      expect(columns.img).toBeDefined();
      expect(columns.ownerId).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have attribute columns', () => {
      const columns = getTableColumns(actors);
      expect(columns.attributes).toBeDefined();
      expect(columns.abilities).toBeDefined();
    });

    it('should have organization columns', () => {
      const columns = getTableColumns(actors);
      expect(columns.folderId).toBeDefined();
      expect(columns.sort).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(actors);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.gameId.dataType).toBe('string');
      expect(columns.name.dataType).toBe('string');
      expect(columns.actorType.dataType).toBe('string');
      expect(columns.attributes.dataType).toBe('json');
      expect(columns.abilities.dataType).toBe('json');
      expect(columns.sort.dataType).toBe('number');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(actors);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(actors);
      expect(columns.gameId.notNull).toBe(true);
      expect(columns.name.notNull).toBe(true);
      expect(columns.actorType.notNull).toBe(true);
      expect(columns.attributes.notNull).toBe(true);
      expect(columns.abilities.notNull).toBe(true);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(actors);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.attributes.hasDefault).toBe(true);
      expect(columns.abilities.hasDefault).toBe(true);
      expect(columns.sort.hasDefault).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
      expect(columns.updatedAt.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(actors);
      expect(columns.id.name).toBe('id');
      expect(columns.gameId.name).toBe('game_id');
      expect(columns.actorType.name).toBe('actor_type');
      expect(columns.ownerId.name).toBe('owner_id');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(actors);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });
  });
});
