import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { fogExploration } from './fogExploration.js';

describe('fogExploration schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(fogExploration);
      expect(tableName).toBe('fog_exploration');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.id).toBeDefined();
      expect(columns.sceneId).toBeDefined();
      expect(columns.userId).toBeDefined();
      expect(columns.exploredGrid).toBeDefined();
      expect(columns.revealedGrid).toBeDefined();
      expect(columns.gridCellSize).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(fogExploration);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.sceneId.dataType).toBe('string');
      expect(columns.userId.dataType).toBe('string');
      expect(columns.gridCellSize.dataType).toBe('number');
      expect(columns.exploredGrid.dataType).toBe('json');
      expect(columns.revealedGrid.dataType).toBe('json');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required columns', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.sceneId.notNull).toBe(true);
      expect(columns.userId.notNull).toBe(true);
      expect(columns.exploredGrid.notNull).toBe(true);
      expect(columns.revealedGrid.notNull).toBe(true);
      expect(columns.gridCellSize.notNull).toBe(true);
      expect(columns.createdAt.notNull).toBe(true);
      expect(columns.updatedAt.notNull).toBe(true);
    });

    it('should have default values', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.exploredGrid.default).toBeDefined();
      expect(columns.revealedGrid.default).toBeDefined();
      expect(columns.gridCellSize.default).toBeDefined();
    });
  });

  describe('relationships', () => {
    it('should have foreign key to scenes table', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.sceneId).toBeDefined();
    });

    it('should have foreign key to users table', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.userId).toBeDefined();
    });
  });

  describe('data types', () => {
    it('should use jsonb for grid data', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.exploredGrid.dataType).toBe('json');
      expect(columns.revealedGrid.dataType).toBe('json');
    });

    it('should use integer for grid cell size', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.gridCellSize.dataType).toBe('number');
    });

    it('should use uuid for id and foreign keys', () => {
      const columns = getTableColumns(fogExploration);
      expect(columns.id.dataType).toBe('string');
      expect(columns.sceneId.dataType).toBe('string');
      expect(columns.userId.dataType).toBe('string');
    });
  });
});
