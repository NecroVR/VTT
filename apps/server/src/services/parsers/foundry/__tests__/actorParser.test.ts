import { describe, it, expect, beforeEach } from 'vitest';
import { FoundryActorParser } from '../actorParser';
import type { RawImportItem, FoundryActor } from '@vtt/shared';
import foundryActorSample from './fixtures/foundryActorSample.json';

describe('FoundryActorParser', () => {
  let parser: FoundryActorParser;

  beforeEach(() => {
    parser = new FoundryActorParser();
  });

  describe('parse', () => {
    it('should parse a D&D 5e character actor', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result).toBeDefined();
      expect(result.entityType).toBe('character');
      expect(result.entityId).toBe('foundry-ABC123xyz');
      expect(result.name).toBe('Thorin Ironforge');
      expect(result.sourceId).toBe('ABC123xyz');
      expect(result.img).toBe('tokens/heroes/dwarf-fighter.webp');
    });

    it('should extract abilities correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.abilities).toBeDefined();
      expect(result.data.abilities.str).toEqual({
        score: 16,
        modifier: 3,
        saveProficient: 1
      });
      expect(result.data.abilities.dex).toEqual({
        score: 14,
        modifier: 2,
        saveProficient: 0
      });
    });

    it('should extract hit points correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.hitPoints).toEqual({
        current: 45,
        max: 45,
        temp: 0
      });
      expect(result.data.armorClass).toBe(18);
    });

    it('should extract character details correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.race).toBe('Mountain Dwarf');
      expect(result.data.background).toBe('Soldier');
      expect(result.data.alignment).toBe('Lawful Good');
      expect(result.data.level).toBe(5);
      expect(result.data.xp).toBe(6500);
    });

    it('should extract skills correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.skills).toBeDefined();
      expect(result.data.skills.athletics).toEqual({
        proficient: 2,
        modifier: 8
      });
      expect(result.data.skills.perception).toEqual({
        proficient: 1,
        modifier: 4
      });
    });

    it('should extract classes correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.classes).toBeDefined();
      expect(result.data.classes).toHaveLength(1);
      expect(result.data.classes[0]).toEqual({
        name: 'Fighter',
        level: 5,
        subclass: 'Battle Master'
      });
    });

    it('should extract equipment correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.equipment).toBeDefined();
      expect(result.data.equipment).toHaveLength(1);
      expect(result.data.equipment[0]).toMatchObject({
        name: 'Battleaxe',
        quantity: 1,
        equipped: true,
        type: 'weapon'
      });
    });

    it('should extract features correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.features).toBeDefined();
      expect(result.data.features).toHaveLength(1);
      expect(result.data.features[0]).toMatchObject({
        name: 'Great Weapon Master',
        source: "Player's Handbook"
      });
    });

    it('should extract currency correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.currency).toEqual({
        pp: 0,
        gp: 125,
        ep: 0,
        sp: 10,
        cp: 5
      });
    });

    it('should extract biography correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryActorSample._id,
        name: foundryActorSample.name,
        type: 'actor',
        data: foundryActorSample as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.description).toContain('Thorin Ironforge is a stalwart defender');
      expect(result.data.biography).toContain('Thorin Ironforge is a stalwart defender');
    });

    it('should map NPC type to monster', async () => {
      const npcActor = {
        ...foundryActorSample,
        type: 'npc'
      };

      const item: RawImportItem = {
        sourceId: npcActor._id,
        name: npcActor.name,
        type: 'actor',
        data: npcActor as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.entityType).toBe('monster');
    });

    it('should handle actors without items', async () => {
      const actorWithoutItems = {
        ...foundryActorSample,
        items: []
      };

      const item: RawImportItem = {
        sourceId: actorWithoutItems._id,
        name: actorWithoutItems.name,
        type: 'actor',
        data: actorWithoutItems as FoundryActor
      };

      const result = await parser.parse(item);

      expect(result.data.classes).toEqual([]);
      expect(result.data.equipment).toEqual([]);
      expect(result.data.features).toEqual([]);
    });
  });
});
