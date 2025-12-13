import type { ContentParser, ParsedEntity } from '../../importService.js';
import type { RawImportItem, FoundryActor } from '@vtt/shared';

/**
 * Foundry Actor Parser
 * Transforms Foundry VTT actor exports into VTT format
 */
export class FoundryActorParser implements ContentParser {

  async parse(item: RawImportItem): Promise<ParsedEntity> {
    const foundry = item.data as FoundryActor;
    const system = foundry.system || {};

    // Map Foundry actor type to our entity type
    const entityType = this.mapActorType(foundry.type);

    // Transform to our schema
    const data = this.transformActorData(foundry, system);

    return {
      entityType,
      entityId: `foundry-${foundry._id}`,
      name: foundry.name,
      description: this.extractDescription(system),
      img: foundry.img,
      data,
      sourceId: foundry._id
    };
  }

  private mapActorType(foundryType: string): string {
    const typeMap: Record<string, string> = {
      'character': 'character',
      'npc': 'monster',
      'vehicle': 'vehicle'
    };
    return typeMap[foundryType] || 'character';
  }

  private transformActorData(foundry: FoundryActor, system: Record<string, any>): Record<string, unknown> {
    // Handle D&D 5e system data
    if (this.isDnd5e(system)) {
      return this.transformDnd5eActor(foundry, system);
    }

    // Generic fallback
    return {
      name: foundry.name,
      type: foundry.type,
      system: system,
      items: foundry.items?.map(i => ({
        name: i.name,
        type: i.type,
        data: i.system
      }))
    };
  }

  private isDnd5e(system: any): boolean {
    return system.abilities !== undefined || system.attributes !== undefined;
  }

  private transformDnd5eActor(foundry: FoundryActor, system: Record<string, any>): Record<string, unknown> {
    return {
      name: foundry.name,

      // Abilities
      abilities: this.transformAbilities(system.abilities),

      // Attributes
      armorClass: system.attributes?.ac?.value || 10,
      hitPoints: {
        current: system.attributes?.hp?.value || 0,
        max: system.attributes?.hp?.max || 0,
        temp: system.attributes?.hp?.temp || 0
      },
      speed: this.transformSpeed(system.attributes?.movement),

      // Details
      race: system.details?.race || '',
      background: system.details?.background || '',
      alignment: system.details?.alignment || '',
      level: system.details?.level || 1,
      xp: system.details?.xp?.value || 0,

      // Classes (for characters)
      classes: this.extractClasses(foundry.items),

      // Skills
      skills: this.transformSkills(system.skills),

      // Saving throws
      savingThrows: this.extractSavingThrows(system.abilities),

      // Proficiencies
      proficiencyBonus: system.attributes?.prof || 2,

      // Spellcasting
      spellcasting: this.transformSpellcasting(system.attributes?.spellcasting, system.spells),

      // Features and items
      features: this.extractFeatures(foundry.items),
      equipment: this.extractEquipment(foundry.items),

      // Currency
      currency: system.currency || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },

      // Biography
      biography: system.details?.biography?.value || ''
    };
  }

  private transformAbilities(abilities: any): Record<string, any> {
    if (!abilities) return {};

    const result: Record<string, any> = {};
    const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

    for (const name of abilityNames) {
      const ability = abilities[name];
      if (ability) {
        result[name] = {
          score: ability.value || 10,
          modifier: ability.mod || 0,
          saveProficient: ability.proficient || 0
        };
      }
    }

    return result;
  }

  private transformSpeed(movement: any): Record<string, number> {
    if (!movement) return { walk: 30 };

    return {
      walk: movement.walk || 0,
      fly: movement.fly || 0,
      swim: movement.swim || 0,
      climb: movement.climb || 0,
      burrow: movement.burrow || 0
    };
  }

  private transformSkills(skills: any): Record<string, any> {
    if (!skills) return {};

    const result: Record<string, any> = {};
    for (const [name, skill] of Object.entries(skills as Record<string, any>)) {
      result[name] = {
        proficient: skill.value || 0, // 0 = none, 1 = proficient, 2 = expertise
        modifier: skill.total || 0
      };
    }
    return result;
  }

  private extractSavingThrows(abilities: any): Record<string, any> {
    if (!abilities) return {};

    const result: Record<string, any> = {};
    for (const [name, ability] of Object.entries(abilities as Record<string, any>)) {
      result[name] = {
        proficient: ability.proficient || 0,
        modifier: ability.save || ability.mod || 0
      };
    }
    return result;
  }

  private extractClasses(items?: any[]): Array<{name: string; level: number; subclass?: string}> {
    if (!items) return [];

    return items
      .filter(i => i.type === 'class')
      .map(i => ({
        name: i.name,
        level: i.system?.levels || 1,
        subclass: i.system?.subclass || undefined
      }));
  }

  private extractFeatures(items?: any[]): Array<{name: string; description: string; source: string}> {
    if (!items) return [];

    return items
      .filter(i => i.type === 'feat' || i.type === 'feature')
      .map(i => ({
        name: i.name,
        description: i.system?.description?.value || '',
        source: i.system?.source?.custom || i.system?.source?.book || ''
      }));
  }

  private extractEquipment(items?: any[]): Array<{name: string; quantity: number; equipped: boolean; type: string}> {
    if (!items) return [];

    const equipmentTypes = ['weapon', 'equipment', 'consumable', 'tool', 'loot', 'container'];

    return items
      .filter(i => equipmentTypes.includes(i.type))
      .map(i => ({
        name: i.name,
        quantity: i.system?.quantity || 1,
        equipped: i.system?.equipped || false,
        type: i.type
      }));
  }

  private transformSpellcasting(spellcasting: any, spells: any): any {
    if (!spellcasting && !spells) return undefined;

    return {
      ability: spellcasting?.ability || 'int',
      dc: spellcasting?.dc || 10,
      slots: spells || {}
    };
  }

  private extractDescription(system: any): string {
    return system.details?.biography?.value ||
           system.details?.description?.value ||
           '';
  }
}
