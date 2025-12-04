import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { ambientLights } from './ambientLights';

describe('ambientLights schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(ambientLights);
      expect(tableName).toBe('ambient_lights');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.id).toBeDefined();
      expect(columns.sceneId).toBeDefined();
      expect(columns.x).toBeDefined();
      expect(columns.y).toBeDefined();
      expect(columns.rotation).toBeDefined();
      expect(columns.createdAt).toBeDefined();
    });

    it('should have light configuration columns', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.bright).toBeDefined();
      expect(columns.dim).toBeDefined();
      expect(columns.angle).toBeDefined();
      expect(columns.color).toBeDefined();
      expect(columns.alpha).toBeDefined();
    });

    it('should have animation columns', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.animationType).toBeDefined();
      expect(columns.animationSpeed).toBeDefined();
      expect(columns.animationIntensity).toBeDefined();
    });

    it('should have settings columns', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.walls).toBeDefined();
      expect(columns.vision).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(ambientLights);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.sceneId.dataType).toBe('string');
      expect(columns.x.dataType).toBe('number');
      expect(columns.y.dataType).toBe('number');
      expect(columns.rotation.dataType).toBe('number');
      expect(columns.bright.dataType).toBe('number');
      expect(columns.dim.dataType).toBe('number');
      expect(columns.angle.dataType).toBe('number');
      expect(columns.color.dataType).toBe('string');
      expect(columns.alpha.dataType).toBe('number');
      expect(columns.animationSpeed.dataType).toBe('number');
      expect(columns.animationIntensity.dataType).toBe('number');
      expect(columns.walls.dataType).toBe('boolean');
      expect(columns.vision.dataType).toBe('boolean');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.sceneId.notNull).toBe(true);
      expect(columns.x.notNull).toBe(true);
      expect(columns.y.notNull).toBe(true);
      expect(columns.rotation.notNull).toBe(true);
      expect(columns.bright.notNull).toBe(true);
      expect(columns.dim.notNull).toBe(true);
      expect(columns.angle.notNull).toBe(true);
      expect(columns.color.notNull).toBe(true);
      expect(columns.alpha.notNull).toBe(true);
    });

    it('should have default values for position', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.rotation.hasDefault).toBe(true);
    });

    it('should have default values for light configuration', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.bright.hasDefault).toBe(true);
      expect(columns.dim.hasDefault).toBe(true);
      expect(columns.angle.hasDefault).toBe(true);
      expect(columns.color.hasDefault).toBe(true);
      expect(columns.alpha.hasDefault).toBe(true);
    });

    it('should have default values for animation', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.animationSpeed.hasDefault).toBe(true);
      expect(columns.animationIntensity.hasDefault).toBe(true);
    });

    it('should have default values for settings', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.walls.hasDefault).toBe(true);
      expect(columns.vision.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.id.name).toBe('id');
      expect(columns.sceneId.name).toBe('scene_id');
      expect(columns.animationType.name).toBe('animation_type');
      expect(columns.animationSpeed.name).toBe('animation_speed');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(ambientLights);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });
  });
});
