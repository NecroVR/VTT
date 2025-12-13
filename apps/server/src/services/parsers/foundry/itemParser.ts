import type { ContentParser, ParsedEntity } from '../../importService';
import type { RawImportItem, FoundryItem } from '@vtt/shared';

/**
 * Foundry Item Parser
 * Transforms Foundry VTT item exports into VTT format
 */
export class FoundryItemParser implements ContentParser {

  async parse(item: RawImportItem): Promise<ParsedEntity> {
    const foundry = item.data as FoundryItem;
    const system = foundry.system || {};

    const entityType = this.mapItemType(foundry.type);
    const data = this.transformItemData(foundry, system);

    return {
      entityType,
      entityId: `foundry-${foundry._id}`,
      name: foundry.name,
      description: system.description?.value || '',
      img: foundry.img,
      data,
      sourceId: foundry._id
    };
  }

  private mapItemType(foundryType: string): string {
    const typeMap: Record<string, string> = {
      'weapon': 'item',
      'equipment': 'item',
      'consumable': 'item',
      'tool': 'item',
      'loot': 'item',
      'spell': 'spell',
      'feat': 'feat',
      'class': 'class',
      'subclass': 'subclass',
      'race': 'race',
      'background': 'background'
    };
    return typeMap[foundryType] || 'item';
  }

  private transformItemData(foundry: FoundryItem, system: Record<string, any>): Record<string, unknown> {
    const baseData = {
      name: foundry.name,
      foundryType: foundry.type,
      description: system.description?.value || '',
      source: system.source?.custom || system.source?.book || ''
    };

    // Add type-specific data
    switch (foundry.type) {
      case 'weapon':
        return { ...baseData, ...this.transformWeapon(system) };
      case 'equipment':
        return { ...baseData, ...this.transformEquipment(system) };
      case 'spell':
        return { ...baseData, ...this.transformSpell(system) };
      case 'feat':
        return { ...baseData, ...this.transformFeat(system) };
      case 'class':
        return { ...baseData, ...this.transformClass(system) };
      case 'race':
        return { ...baseData, ...this.transformRace(system) };
      case 'background':
        return { ...baseData, ...this.transformBackground(system) };
      default:
        return { ...baseData, system };
    }
  }

  private transformWeapon(system: any): Record<string, unknown> {
    return {
      itemType: 'weapon',
      weaponType: system.weaponType || 'simpleM',
      damage: {
        parts: system.damage?.parts || [],
        versatile: system.damage?.versatile || ''
      },
      range: system.range || { value: 5, units: 'ft' },
      properties: system.properties || {},
      proficient: system.proficient,
      weight: system.weight || 0,
      price: system.price || { value: 0, denomination: 'gp' },
      rarity: system.rarity || 'common',
      attunement: system.attunement || 0
    };
  }

  private transformEquipment(system: any): Record<string, unknown> {
    return {
      itemType: 'equipment',
      armor: system.armor || {},
      weight: system.weight || 0,
      price: system.price || { value: 0, denomination: 'gp' },
      rarity: system.rarity || 'common',
      attunement: system.attunement || 0
    };
  }

  private transformSpell(system: any): Record<string, unknown> {
    return {
      itemType: 'spell',
      level: system.level || 0,
      school: system.school || '',
      castingTime: system.activation || {},
      range: system.range || {},
      components: system.components || {},
      duration: system.duration || {},
      concentration: system.components?.concentration || false,
      ritual: system.components?.ritual || false,
      damage: system.damage || {},
      save: system.save || {},
      materials: system.materials || {}
    };
  }

  private transformFeat(system: any): Record<string, unknown> {
    return {
      itemType: 'feat',
      requirements: system.requirements || '',
      type: system.type?.value || 'feat'
    };
  }

  private transformClass(system: any): Record<string, unknown> {
    return {
      itemType: 'class',
      hitDice: system.hitDice || 'd8',
      levels: system.levels || 1,
      spellcasting: system.spellcasting || {}
    };
  }

  private transformRace(system: any): Record<string, unknown> {
    return {
      itemType: 'race',
      size: system.size || 'med',
      speed: system.movement || { walk: 30 },
      abilities: system.advancement || []
    };
  }

  private transformBackground(system: any): Record<string, unknown> {
    return {
      itemType: 'background',
      skills: system.skills || [],
      tools: system.tools || [],
      languages: system.languages || []
    };
  }
}
