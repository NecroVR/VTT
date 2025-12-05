import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { scenes } from './scenes.js';

describe('scenes schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(scenes);
      expect(tableName).toBe('scenes');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(scenes);
      expect(columns.id).toBeDefined();
      expect(columns.campaignId).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.active).toBeDefined();
      expect(columns.backgroundImage).toBeDefined();
      expect(columns.backgroundWidth).toBeDefined();
      expect(columns.backgroundHeight).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have grid configuration columns', () => {
      const columns = getTableColumns(scenes);
      expect(columns.gridType).toBeDefined();
      expect(columns.gridSize).toBeDefined();
      expect(columns.gridColor).toBeDefined();
      expect(columns.gridAlpha).toBeDefined();
      expect(columns.gridDistance).toBeDefined();
      expect(columns.gridUnits).toBeDefined();
    });

    it('should have vision setting columns', () => {
      const columns = getTableColumns(scenes);
      expect(columns.tokenVision).toBeDefined();
      expect(columns.fogExploration).toBeDefined();
      expect(columns.globalLight).toBeDefined();
      expect(columns.darkness).toBeDefined();
    });

    it('should have view setting columns', () => {
      const columns = getTableColumns(scenes);
      expect(columns.initialX).toBeDefined();
      expect(columns.initialY).toBeDefined();
      expect(columns.initialScale).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(scenes);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.campaignId.dataType).toBe('string');
      expect(columns.name.dataType).toBe('string');
      expect(columns.active.dataType).toBe('boolean');
      expect(columns.gridSize.dataType).toBe('number');
      expect(columns.gridAlpha.dataType).toBe('number');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(scenes);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(scenes);
      expect(columns.campaignId.notNull).toBe(true);
      expect(columns.name.notNull).toBe(true);
      expect(columns.active.notNull).toBe(true);
      expect(columns.gridType.notNull).toBe(true);
      expect(columns.gridSize.notNull).toBe(true);
    });

    it('should have default values for grid settings', () => {
      const columns = getTableColumns(scenes);
      expect(columns.gridType.hasDefault).toBe(true);
      expect(columns.gridSize.hasDefault).toBe(true);
      expect(columns.gridColor.hasDefault).toBe(true);
      expect(columns.gridAlpha.hasDefault).toBe(true);
      expect(columns.gridDistance.hasDefault).toBe(true);
      expect(columns.gridUnits.hasDefault).toBe(true);
    });

    it('should have default values for vision settings', () => {
      const columns = getTableColumns(scenes);
      expect(columns.tokenVision.hasDefault).toBe(true);
      expect(columns.fogExploration.hasDefault).toBe(true);
      expect(columns.globalLight.hasDefault).toBe(true);
      expect(columns.darkness.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(scenes);
      expect(columns.id.name).toBe('id');
      expect(columns.campaignId.name).toBe('campaign_id');
      expect(columns.name.name).toBe('name');
      expect(columns.gridType.name).toBe('grid_type');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(scenes);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });

    it('should have metadata columns', () => {
      const columns = getTableColumns(scenes);
      expect(columns.navOrder).toBeDefined();
      expect(columns.navOrder.hasDefault).toBe(true);
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });
  });
});
