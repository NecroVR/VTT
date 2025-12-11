import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { doors } from './doors.js';

describe('doors schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(doors);
      expect(tableName).toBe('doors');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(doors);
      expect(columns.id).toBeDefined();
      expect(columns.sceneId).toBeDefined();
      expect(columns.x1).toBeDefined();
      expect(columns.y1).toBeDefined();
      expect(columns.x2).toBeDefined();
      expect(columns.y2).toBeDefined();
      expect(columns.createdAt).toBeDefined();
    });

    it('should have door-specific property columns', () => {
      const columns = getTableColumns(doors);
      expect(columns.status).toBeDefined();
      expect(columns.isLocked).toBeDefined();
    });

    it('should have wall shape columns for curved doors', () => {
      const columns = getTableColumns(doors);
      expect(columns.wallShape).toBeDefined();
      expect(columns.controlPoints).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(doors);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.sceneId.dataType).toBe('string');
      expect(columns.x1.dataType).toBe('number');
      expect(columns.y1.dataType).toBe('number');
      expect(columns.x2.dataType).toBe('number');
      expect(columns.y2.dataType).toBe('number');
      expect(columns.status.dataType).toBe('string');
      expect(columns.isLocked.dataType).toBe('boolean');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(doors);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(doors);
      expect(columns.sceneId.notNull).toBe(true);
      expect(columns.x1.notNull).toBe(true);
      expect(columns.y1.notNull).toBe(true);
      expect(columns.x2.notNull).toBe(true);
      expect(columns.y2.notNull).toBe(true);
      expect(columns.status.notNull).toBe(true);
      expect(columns.isLocked.notNull).toBe(true);
    });

    it('should have default values for door properties', () => {
      const columns = getTableColumns(doors);
      expect(columns.status.hasDefault).toBe(true);
      expect(columns.isLocked.hasDefault).toBe(true);
      expect(columns.wallShape.hasDefault).toBe(true);
      expect(columns.controlPoints.hasDefault).toBe(true);
      expect(columns.snapToGrid.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(doors);
      expect(columns.id.name).toBe('id');
      expect(columns.sceneId.name).toBe('scene_id');
      expect(columns.wallShape.name).toBe('wall_shape');
      expect(columns.controlPoints.name).toBe('control_points');
      expect(columns.isLocked.name).toBe('is_locked');
      expect(columns.snapToGrid.name).toBe('snap_to_grid');
      expect(columns.createdAt.name).toBe('created_at');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(doors);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });

    it('should have controlPoints as JSONB column', () => {
      const columns = getTableColumns(doors);
      expect(columns.controlPoints).toBeDefined();
      expect(columns.controlPoints.dataType).toBe('json');
      expect(columns.controlPoints.hasDefault).toBe(true);
    });
  });
});
