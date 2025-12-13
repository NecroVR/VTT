import { describe, it, expect, beforeEach } from 'vitest';
import { FoundryItemParser } from '../itemParser';
import type { RawImportItem, FoundryItem } from '@vtt/shared';
import foundryItemSample from './fixtures/foundryItemSample.json';

describe('FoundryItemParser', () => {
  let parser: FoundryItemParser;

  beforeEach(() => {
    parser = new FoundryItemParser();
  });

  describe('parse', () => {
    it('should parse a D&D 5e spell', async () => {
      const item: RawImportItem = {
        sourceId: foundryItemSample._id,
        name: foundryItemSample.name,
        type: 'spell',
        data: foundryItemSample as FoundryItem
      };

      const result = await parser.parse(item);

      expect(result).toBeDefined();
      expect(result.entityType).toBe('spell');
      expect(result.entityId).toBe('foundry-spell456');
      expect(result.name).toBe('Fireball');
      expect(result.sourceId).toBe('spell456');
      expect(result.img).toBe('icons/magic/fire/fireball.webp');
    });

    it('should extract spell properties correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryItemSample._id,
        name: foundryItemSample.name,
        type: 'spell',
        data: foundryItemSample as FoundryItem
      };

      const result = await parser.parse(item);

      expect(result.data.itemType).toBe('spell');
      expect(result.data.level).toBe(3);
      expect(result.data.school).toBe('evo');
      expect(result.data.concentration).toBe(false);
      expect(result.data.ritual).toBe(false);
    });

    it('should extract spell components correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryItemSample._id,
        name: foundryItemSample.name,
        type: 'spell',
        data: foundryItemSample as FoundryItem
      };

      const result = await parser.parse(item);

      expect(result.data.components).toBeDefined();
      expect(result.data.components.verbal).toBe(true);
      expect(result.data.components.somatic).toBe(true);
      expect(result.data.components.material).toBe(true);
    });

    it('should extract spell damage correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryItemSample._id,
        name: foundryItemSample.name,
        type: 'spell',
        data: foundryItemSample as FoundryItem
      };

      const result = await parser.parse(item);

      expect(result.data.damage).toBeDefined();
      expect(result.data.damage.parts).toEqual([['8d6', 'fire']]);
    });

    it('should extract spell description correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryItemSample._id,
        name: foundryItemSample.name,
        type: 'spell',
        data: foundryItemSample as FoundryItem
      };

      const result = await parser.parse(item);

      expect(result.description).toContain('A bright streak flashes');
      expect(result.data.description).toContain('A bright streak flashes');
    });

    it('should extract spell source correctly', async () => {
      const item: RawImportItem = {
        sourceId: foundryItemSample._id,
        name: foundryItemSample.name,
        type: 'spell',
        data: foundryItemSample as FoundryItem
      };

      const result = await parser.parse(item);

      expect(result.data.source).toBe("Player's Handbook");
    });

    it('should map weapon type correctly', async () => {
      const weapon: FoundryItem = {
        _id: 'weapon123',
        name: 'Longsword',
        type: 'weapon',
        img: 'icons/weapons/swords/sword-longsword.webp',
        system: {
          damage: { parts: [['1d8', 'slashing']], versatile: '1d10' },
          weaponType: 'martialM',
          properties: { ver: true },
          weight: 3,
          price: { value: 15, denomination: 'gp' },
          rarity: 'common',
          description: { value: 'A versatile blade' }
        }
      };

      const item: RawImportItem = {
        sourceId: weapon._id,
        name: weapon.name,
        type: 'item',
        data: weapon
      };

      const result = await parser.parse(item);

      expect(result.entityType).toBe('item');
      expect(result.data.itemType).toBe('weapon');
      expect(result.data.weaponType).toBe('martialM');
      expect(result.data.damage.versatile).toBe('1d10');
    });

    it('should map equipment type correctly', async () => {
      const armor: FoundryItem = {
        _id: 'armor123',
        name: 'Chain Mail',
        type: 'equipment',
        img: 'icons/armor/mail/chain.webp',
        system: {
          armor: { value: 16 },
          weight: 55,
          price: { value: 75, denomination: 'gp' },
          rarity: 'common',
          description: { value: 'Heavy armor' }
        }
      };

      const item: RawImportItem = {
        sourceId: armor._id,
        name: armor.name,
        type: 'item',
        data: armor
      };

      const result = await parser.parse(item);

      expect(result.entityType).toBe('item');
      expect(result.data.itemType).toBe('equipment');
      expect(result.data.armor).toBeDefined();
      expect(result.data.weight).toBe(55);
    });

    it('should map feat type correctly', async () => {
      const feat: FoundryItem = {
        _id: 'feat123',
        name: 'Alert',
        type: 'feat',
        img: 'icons/skills/alert.webp',
        system: {
          requirements: '',
          type: { value: 'feat' },
          description: { value: 'Always on the lookout for danger' }
        }
      };

      const item: RawImportItem = {
        sourceId: feat._id,
        name: feat.name,
        type: 'feat',
        data: feat
      };

      const result = await parser.parse(item);

      expect(result.entityType).toBe('feat');
      expect(result.data.itemType).toBe('feat');
      expect(result.data.type).toBe('feat');
    });

    it('should map class type correctly', async () => {
      const classItem: FoundryItem = {
        _id: 'class123',
        name: 'Wizard',
        type: 'class',
        img: 'icons/classes/wizard.webp',
        system: {
          hitDice: 'd6',
          levels: 1,
          spellcasting: { ability: 'int' },
          description: { value: 'A master of arcane magic' }
        }
      };

      const item: RawImportItem = {
        sourceId: classItem._id,
        name: classItem.name,
        type: 'class',
        data: classItem
      };

      const result = await parser.parse(item);

      expect(result.entityType).toBe('class');
      expect(result.data.itemType).toBe('class');
      expect(result.data.hitDice).toBe('d6');
      expect(result.data.spellcasting).toBeDefined();
    });

    it('should handle items without description', async () => {
      const simpleItem: FoundryItem = {
        _id: 'simple123',
        name: 'Simple Item',
        type: 'loot',
        system: {}
      };

      const item: RawImportItem = {
        sourceId: simpleItem._id,
        name: simpleItem.name,
        type: 'item',
        data: simpleItem
      };

      const result = await parser.parse(item);

      expect(result.description).toBe('');
      expect(result.data.description).toBe('');
    });
  });
});
