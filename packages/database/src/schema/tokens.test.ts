import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { tokens } from './tokens';

describe('tokens schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(tokens);
      expect(tableName).toBe('tokens');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(tokens);
      expect(columns.id).toBeDefined();
      expect(columns.sceneId).toBeDefined();
      expect(columns.actorId).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.imageUrl).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have position and orientation columns', () => {
      const columns = getTableColumns(tokens);
      expect(columns.x).toBeDefined();
      expect(columns.y).toBeDefined();
      expect(columns.width).toBeDefined();
      expect(columns.height).toBeDefined();
      expect(columns.elevation).toBeDefined();
      expect(columns.rotation).toBeDefined();
      expect(columns.locked).toBeDefined();
    });

    it('should have ownership and visibility columns', () => {
      const columns = getTableColumns(tokens);
      expect(columns.ownerId).toBeDefined();
      expect(columns.visible).toBeDefined();
    });

    it('should have vision configuration columns', () => {
      const columns = getTableColumns(tokens);
      expect(columns.vision).toBeDefined();
      expect(columns.visionRange).toBeDefined();
    });

    it('should have light emission columns', () => {
      const columns = getTableColumns(tokens);
      expect(columns.lightBright).toBeDefined();
      expect(columns.lightDim).toBeDefined();
      expect(columns.lightColor).toBeDefined();
      expect(columns.lightAngle).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(tokens);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.sceneId.dataType).toBe('string');
      expect(columns.actorId.dataType).toBe('string');
      expect(columns.name.dataType).toBe('string');
      expect(columns.x.dataType).toBe('number');
      expect(columns.y.dataType).toBe('number');
      expect(columns.visible.dataType).toBe('boolean');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(tokens);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(tokens);
      expect(columns.sceneId.notNull).toBe(true);
      expect(columns.name.notNull).toBe(true);
      expect(columns.x.notNull).toBe(true);
      expect(columns.y.notNull).toBe(true);
      expect(columns.width.notNull).toBe(true);
      expect(columns.height.notNull).toBe(true);
    });

    it('should have default values for position properties', () => {
      const columns = getTableColumns(tokens);
      expect(columns.x.hasDefault).toBe(true);
      expect(columns.y.hasDefault).toBe(true);
      expect(columns.width.hasDefault).toBe(true);
      expect(columns.height.hasDefault).toBe(true);
      expect(columns.elevation.hasDefault).toBe(true);
      expect(columns.rotation.hasDefault).toBe(true);
      expect(columns.locked.hasDefault).toBe(true);
    });

    it('should have default values for visibility', () => {
      const columns = getTableColumns(tokens);
      expect(columns.visible.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(tokens);
      expect(columns.id.name).toBe('id');
      expect(columns.sceneId.name).toBe('scene_id');
      expect(columns.actorId.name).toBe('actor_id');
      expect(columns.imageUrl.name).toBe('image_url');
    });

    it('should have bars as JSONB column', () => {
      const columns = getTableColumns(tokens);
      expect(columns.bars).toBeDefined();
      expect(columns.bars.dataType).toBe('json');
      expect(columns.bars.hasDefault).toBe(true);
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(tokens);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });
  });
});
