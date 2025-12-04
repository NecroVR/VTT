import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { combats, combatants } from './combats';

describe('combats schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(combats);
      expect(tableName).toBe('combats');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(combats);
      expect(columns.id).toBeDefined();
      expect(columns.sceneId).toBeDefined();
      expect(columns.gameId).toBeDefined();
      expect(columns.active).toBeDefined();
      expect(columns.round).toBeDefined();
      expect(columns.turn).toBeDefined();
      expect(columns.sort).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(combats);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.sceneId.dataType).toBe('string');
      expect(columns.gameId.dataType).toBe('string');
      expect(columns.active.dataType).toBe('boolean');
      expect(columns.round.dataType).toBe('number');
      expect(columns.turn.dataType).toBe('number');
      expect(columns.sort.dataType).toBe('number');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(combats);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(combats);
      expect(columns.gameId.notNull).toBe(true);
      expect(columns.active.notNull).toBe(true);
      expect(columns.round.notNull).toBe(true);
      expect(columns.turn.notNull).toBe(true);
      expect(columns.sort.notNull).toBe(true);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(combats);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.active.hasDefault).toBe(true);
      expect(columns.round.hasDefault).toBe(true);
      expect(columns.turn.hasDefault).toBe(true);
      expect(columns.sort.hasDefault).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
      expect(columns.updatedAt.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(combats);
      expect(columns.id.name).toBe('id');
      expect(columns.sceneId.name).toBe('scene_id');
      expect(columns.gameId.name).toBe('game_id');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(combats);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });
  });
});

describe('combatants schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(combatants);
      expect(tableName).toBe('combatants');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(combatants);
      expect(columns.id).toBeDefined();
      expect(columns.combatId).toBeDefined();
      expect(columns.actorId).toBeDefined();
      expect(columns.tokenId).toBeDefined();
      expect(columns.initiative).toBeDefined();
      expect(columns.initiativeModifier).toBeDefined();
      expect(columns.hidden).toBeDefined();
      expect(columns.defeated).toBeDefined();
      expect(columns.createdAt).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(combatants);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.combatId.dataType).toBe('string');
      expect(columns.actorId.dataType).toBe('string');
      expect(columns.tokenId.dataType).toBe('string');
      expect(columns.initiative.dataType).toBe('number');
      expect(columns.initiativeModifier.dataType).toBe('number');
      expect(columns.hidden.dataType).toBe('boolean');
      expect(columns.defeated.dataType).toBe('boolean');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(combatants);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(combatants);
      expect(columns.combatId.notNull).toBe(true);
      expect(columns.initiativeModifier.notNull).toBe(true);
      expect(columns.hidden.notNull).toBe(true);
      expect(columns.defeated.notNull).toBe(true);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(combatants);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.initiativeModifier.hasDefault).toBe(true);
      expect(columns.hidden.hasDefault).toBe(true);
      expect(columns.defeated.hasDefault).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(combatants);
      expect(columns.id.name).toBe('id');
      expect(columns.combatId.name).toBe('combat_id');
      expect(columns.actorId.name).toBe('actor_id');
      expect(columns.tokenId.name).toBe('token_id');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(combatants);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });
  });
});
