import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { walls } from './walls';

describe('walls schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(walls);
      expect(tableName).toBe('walls');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(walls);
      expect(columns.id).toBeDefined();
      expect(columns.sceneId).toBeDefined();
      expect(columns.x1).toBeDefined();
      expect(columns.y1).toBeDefined();
      expect(columns.x2).toBeDefined();
      expect(columns.y2).toBeDefined();
      expect(columns.createdAt).toBeDefined();
    });

    it('should have wall property columns', () => {
      const columns = getTableColumns(walls);
      expect(columns.wallType).toBeDefined();
      expect(columns.move).toBeDefined();
      expect(columns.sense).toBeDefined();
      expect(columns.sound).toBeDefined();
    });

    it('should have door property columns', () => {
      const columns = getTableColumns(walls);
      expect(columns.door).toBeDefined();
      expect(columns.doorState).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(walls);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.sceneId.dataType).toBe('string');
      expect(columns.x1.dataType).toBe('number');
      expect(columns.y1.dataType).toBe('number');
      expect(columns.x2.dataType).toBe('number');
      expect(columns.y2.dataType).toBe('number');
      expect(columns.wallType.dataType).toBe('string');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(walls);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(walls);
      expect(columns.sceneId.notNull).toBe(true);
      expect(columns.x1.notNull).toBe(true);
      expect(columns.y1.notNull).toBe(true);
      expect(columns.x2.notNull).toBe(true);
      expect(columns.y2.notNull).toBe(true);
      expect(columns.wallType.notNull).toBe(true);
    });

    it('should have default values for wall properties', () => {
      const columns = getTableColumns(walls);
      expect(columns.wallType.hasDefault).toBe(true);
      expect(columns.move.hasDefault).toBe(true);
      expect(columns.sense.hasDefault).toBe(true);
      expect(columns.sound.hasDefault).toBe(true);
    });

    it('should have default values for door properties', () => {
      const columns = getTableColumns(walls);
      expect(columns.door.hasDefault).toBe(true);
      expect(columns.doorState.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(walls);
      expect(columns.id.name).toBe('id');
      expect(columns.sceneId.name).toBe('scene_id');
      expect(columns.wallType.name).toBe('wall_type');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(walls);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });
  });
});
