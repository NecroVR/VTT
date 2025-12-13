/**
 * Entity Schema Definition
 *
 * Defines the structure of entity properties for the binding picker.
 * Currently contains a D&D 5e character schema as a reference.
 */

export type PropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface PropertyDefinition {
  name: string;
  type: PropertyType;
  path: string;
  description?: string;
  children?: PropertyDefinition[];
  computed?: boolean;
}

/**
 * D&D 5e Character Schema
 *
 * This is a sample schema representing a typical D&D 5e character structure.
 * In the future, this will be dynamically loaded based on the game system.
 */
export const dnd5eCharacterSchema: PropertyDefinition = {
  name: 'Character',
  type: 'object',
  path: '',
  children: [
    {
      name: 'name',
      type: 'string',
      path: 'name',
      description: 'Character name'
    },
    {
      name: 'class',
      type: 'string',
      path: 'class',
      description: 'Character class (Fighter, Wizard, etc.)'
    },
    {
      name: 'race',
      type: 'string',
      path: 'race',
      description: 'Character race (Human, Elf, etc.)'
    },
    {
      name: 'level',
      type: 'number',
      path: 'level',
      description: 'Character level (1-20)'
    },
    {
      name: 'background',
      type: 'string',
      path: 'background',
      description: 'Character background'
    },
    {
      name: 'alignment',
      type: 'string',
      path: 'alignment',
      description: 'Character alignment (Lawful Good, etc.)'
    },
    {
      name: 'experiencePoints',
      type: 'number',
      path: 'experiencePoints',
      description: 'Current XP'
    },
    {
      name: 'abilities',
      type: 'object',
      path: 'abilities',
      description: 'Ability scores',
      children: [
        {
          name: 'strength',
          type: 'object',
          path: 'abilities.strength',
          children: [
            { name: 'value', type: 'number', path: 'abilities.strength.value' },
            { name: 'modifier', type: 'number', path: 'abilities.strength.modifier', computed: true },
            { name: 'save', type: 'number', path: 'abilities.strength.save', computed: true }
          ]
        },
        {
          name: 'dexterity',
          type: 'object',
          path: 'abilities.dexterity',
          children: [
            { name: 'value', type: 'number', path: 'abilities.dexterity.value' },
            { name: 'modifier', type: 'number', path: 'abilities.dexterity.modifier', computed: true },
            { name: 'save', type: 'number', path: 'abilities.dexterity.save', computed: true }
          ]
        },
        {
          name: 'constitution',
          type: 'object',
          path: 'abilities.constitution',
          children: [
            { name: 'value', type: 'number', path: 'abilities.constitution.value' },
            { name: 'modifier', type: 'number', path: 'abilities.constitution.modifier', computed: true },
            { name: 'save', type: 'number', path: 'abilities.constitution.save', computed: true }
          ]
        },
        {
          name: 'intelligence',
          type: 'object',
          path: 'abilities.intelligence',
          children: [
            { name: 'value', type: 'number', path: 'abilities.intelligence.value' },
            { name: 'modifier', type: 'number', path: 'abilities.intelligence.modifier', computed: true },
            { name: 'save', type: 'number', path: 'abilities.intelligence.save', computed: true }
          ]
        },
        {
          name: 'wisdom',
          type: 'object',
          path: 'abilities.wisdom',
          children: [
            { name: 'value', type: 'number', path: 'abilities.wisdom.value' },
            { name: 'modifier', type: 'number', path: 'abilities.wisdom.modifier', computed: true },
            { name: 'save', type: 'number', path: 'abilities.wisdom.save', computed: true }
          ]
        },
        {
          name: 'charisma',
          type: 'object',
          path: 'abilities.charisma',
          children: [
            { name: 'value', type: 'number', path: 'abilities.charisma.value' },
            { name: 'modifier', type: 'number', path: 'abilities.charisma.modifier', computed: true },
            { name: 'save', type: 'number', path: 'abilities.charisma.save', computed: true }
          ]
        }
      ]
    },
    {
      name: 'skills',
      type: 'object',
      path: 'skills',
      description: 'Character skills',
      children: [
        {
          name: 'acrobatics',
          type: 'object',
          path: 'skills.acrobatics',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.acrobatics.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.acrobatics.bonus', computed: true }
          ]
        },
        {
          name: 'animalHandling',
          type: 'object',
          path: 'skills.animalHandling',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.animalHandling.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.animalHandling.bonus', computed: true }
          ]
        },
        {
          name: 'arcana',
          type: 'object',
          path: 'skills.arcana',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.arcana.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.arcana.bonus', computed: true }
          ]
        },
        {
          name: 'athletics',
          type: 'object',
          path: 'skills.athletics',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.athletics.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.athletics.bonus', computed: true }
          ]
        },
        {
          name: 'deception',
          type: 'object',
          path: 'skills.deception',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.deception.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.deception.bonus', computed: true }
          ]
        },
        {
          name: 'history',
          type: 'object',
          path: 'skills.history',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.history.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.history.bonus', computed: true }
          ]
        },
        {
          name: 'insight',
          type: 'object',
          path: 'skills.insight',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.insight.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.insight.bonus', computed: true }
          ]
        },
        {
          name: 'intimidation',
          type: 'object',
          path: 'skills.intimidation',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.intimidation.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.intimidation.bonus', computed: true }
          ]
        },
        {
          name: 'investigation',
          type: 'object',
          path: 'skills.investigation',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.investigation.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.investigation.bonus', computed: true }
          ]
        },
        {
          name: 'medicine',
          type: 'object',
          path: 'skills.medicine',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.medicine.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.medicine.bonus', computed: true }
          ]
        },
        {
          name: 'nature',
          type: 'object',
          path: 'skills.nature',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.nature.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.nature.bonus', computed: true }
          ]
        },
        {
          name: 'perception',
          type: 'object',
          path: 'skills.perception',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.perception.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.perception.bonus', computed: true }
          ]
        },
        {
          name: 'performance',
          type: 'object',
          path: 'skills.performance',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.performance.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.performance.bonus', computed: true }
          ]
        },
        {
          name: 'persuasion',
          type: 'object',
          path: 'skills.persuasion',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.persuasion.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.persuasion.bonus', computed: true }
          ]
        },
        {
          name: 'religion',
          type: 'object',
          path: 'skills.religion',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.religion.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.religion.bonus', computed: true }
          ]
        },
        {
          name: 'sleightOfHand',
          type: 'object',
          path: 'skills.sleightOfHand',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.sleightOfHand.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.sleightOfHand.bonus', computed: true }
          ]
        },
        {
          name: 'stealth',
          type: 'object',
          path: 'skills.stealth',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.stealth.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.stealth.bonus', computed: true }
          ]
        },
        {
          name: 'survival',
          type: 'object',
          path: 'skills.survival',
          children: [
            { name: 'proficient', type: 'boolean', path: 'skills.survival.proficient' },
            { name: 'bonus', type: 'number', path: 'skills.survival.bonus', computed: true }
          ]
        }
      ]
    },
    {
      name: 'combat',
      type: 'object',
      path: 'combat',
      description: 'Combat statistics',
      children: [
        { name: 'armorClass', type: 'number', path: 'combat.armorClass' },
        { name: 'initiative', type: 'number', path: 'combat.initiative', computed: true },
        { name: 'speed', type: 'number', path: 'combat.speed' },
        {
          name: 'hitPoints',
          type: 'object',
          path: 'combat.hitPoints',
          children: [
            { name: 'current', type: 'number', path: 'combat.hitPoints.current' },
            { name: 'max', type: 'number', path: 'combat.hitPoints.max' },
            { name: 'temp', type: 'number', path: 'combat.hitPoints.temp' }
          ]
        },
        {
          name: 'hitDice',
          type: 'object',
          path: 'combat.hitDice',
          children: [
            { name: 'current', type: 'number', path: 'combat.hitDice.current' },
            { name: 'max', type: 'number', path: 'combat.hitDice.max' },
            { name: 'type', type: 'string', path: 'combat.hitDice.type' }
          ]
        },
        {
          name: 'deathSaves',
          type: 'object',
          path: 'combat.deathSaves',
          children: [
            { name: 'successes', type: 'number', path: 'combat.deathSaves.successes' },
            { name: 'failures', type: 'number', path: 'combat.deathSaves.failures' }
          ]
        }
      ]
    },
    {
      name: 'equipment',
      type: 'object',
      path: 'equipment',
      description: 'Character equipment',
      children: [
        {
          name: 'armor',
          type: 'array',
          path: 'equipment.armor',
          description: 'Equipped armor',
          children: [
            {
              name: 'item',
              type: 'object',
              path: 'equipment.armor[]',
              children: [
                { name: 'name', type: 'string', path: 'equipment.armor[].name' },
                { name: 'armorClass', type: 'number', path: 'equipment.armor[].armorClass' },
                { name: 'type', type: 'string', path: 'equipment.armor[].type' },
                { name: 'equipped', type: 'boolean', path: 'equipment.armor[].equipped' }
              ]
            }
          ]
        },
        {
          name: 'weapons',
          type: 'array',
          path: 'equipment.weapons',
          description: 'Equipped weapons',
          children: [
            {
              name: 'item',
              type: 'object',
              path: 'equipment.weapons[]',
              children: [
                { name: 'name', type: 'string', path: 'equipment.weapons[].name' },
                { name: 'damage', type: 'string', path: 'equipment.weapons[].damage' },
                { name: 'damageType', type: 'string', path: 'equipment.weapons[].damageType' },
                { name: 'range', type: 'string', path: 'equipment.weapons[].range' },
                { name: 'properties', type: 'string', path: 'equipment.weapons[].properties' }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'inventory',
      type: 'array',
      path: 'inventory',
      description: 'Character inventory',
      children: [
        {
          name: 'item',
          type: 'object',
          path: 'inventory[]',
          children: [
            { name: 'name', type: 'string', path: 'inventory[].name' },
            { name: 'quantity', type: 'number', path: 'inventory[].quantity' },
            { name: 'weight', type: 'number', path: 'inventory[].weight' },
            { name: 'description', type: 'string', path: 'inventory[].description' },
            { name: 'value', type: 'number', path: 'inventory[].value' }
          ]
        }
      ]
    },
    {
      name: 'currency',
      type: 'object',
      path: 'currency',
      description: 'Character currency',
      children: [
        { name: 'copper', type: 'number', path: 'currency.copper' },
        { name: 'silver', type: 'number', path: 'currency.silver' },
        { name: 'electrum', type: 'number', path: 'currency.electrum' },
        { name: 'gold', type: 'number', path: 'currency.gold' },
        { name: 'platinum', type: 'number', path: 'currency.platinum' }
      ]
    },
    {
      name: 'spellcasting',
      type: 'object',
      path: 'spellcasting',
      description: 'Spellcasting information',
      children: [
        { name: 'spellcastingAbility', type: 'string', path: 'spellcasting.spellcastingAbility' },
        { name: 'spellSaveDC', type: 'number', path: 'spellcasting.spellSaveDC', computed: true },
        { name: 'spellAttackBonus', type: 'number', path: 'spellcasting.spellAttackBonus', computed: true },
        {
          name: 'spellSlots',
          type: 'object',
          path: 'spellcasting.spellSlots',
          children: [
            {
              name: 'level1',
              type: 'object',
              path: 'spellcasting.spellSlots.level1',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level1.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level1.used' }
              ]
            },
            {
              name: 'level2',
              type: 'object',
              path: 'spellcasting.spellSlots.level2',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level2.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level2.used' }
              ]
            },
            {
              name: 'level3',
              type: 'object',
              path: 'spellcasting.spellSlots.level3',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level3.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level3.used' }
              ]
            },
            {
              name: 'level4',
              type: 'object',
              path: 'spellcasting.spellSlots.level4',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level4.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level4.used' }
              ]
            },
            {
              name: 'level5',
              type: 'object',
              path: 'spellcasting.spellSlots.level5',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level5.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level5.used' }
              ]
            },
            {
              name: 'level6',
              type: 'object',
              path: 'spellcasting.spellSlots.level6',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level6.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level6.used' }
              ]
            },
            {
              name: 'level7',
              type: 'object',
              path: 'spellcasting.spellSlots.level7',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level7.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level7.used' }
              ]
            },
            {
              name: 'level8',
              type: 'object',
              path: 'spellcasting.spellSlots.level8',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level8.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level8.used' }
              ]
            },
            {
              name: 'level9',
              type: 'object',
              path: 'spellcasting.spellSlots.level9',
              children: [
                { name: 'max', type: 'number', path: 'spellcasting.spellSlots.level9.max' },
                { name: 'used', type: 'number', path: 'spellcasting.spellSlots.level9.used' }
              ]
            }
          ]
        },
        {
          name: 'spells',
          type: 'array',
          path: 'spellcasting.spells',
          description: 'Known spells',
          children: [
            {
              name: 'spell',
              type: 'object',
              path: 'spellcasting.spells[]',
              children: [
                { name: 'name', type: 'string', path: 'spellcasting.spells[].name' },
                { name: 'level', type: 'number', path: 'spellcasting.spells[].level' },
                { name: 'school', type: 'string', path: 'spellcasting.spells[].school' },
                { name: 'castingTime', type: 'string', path: 'spellcasting.spells[].castingTime' },
                { name: 'range', type: 'string', path: 'spellcasting.spells[].range' },
                { name: 'duration', type: 'string', path: 'spellcasting.spells[].duration' },
                { name: 'description', type: 'string', path: 'spellcasting.spells[].description' },
                { name: 'prepared', type: 'boolean', path: 'spellcasting.spells[].prepared' }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'features',
      type: 'array',
      path: 'features',
      description: 'Class features and traits',
      children: [
        {
          name: 'feature',
          type: 'object',
          path: 'features[]',
          children: [
            { name: 'name', type: 'string', path: 'features[].name' },
            { name: 'description', type: 'string', path: 'features[].description' },
            { name: 'source', type: 'string', path: 'features[].source' }
          ]
        }
      ]
    },
    {
      name: 'proficiencies',
      type: 'object',
      path: 'proficiencies',
      description: 'Character proficiencies',
      children: [
        { name: 'armor', type: 'string', path: 'proficiencies.armor' },
        { name: 'weapons', type: 'string', path: 'proficiencies.weapons' },
        { name: 'tools', type: 'string', path: 'proficiencies.tools' },
        { name: 'languages', type: 'string', path: 'proficiencies.languages' }
      ]
    },
    {
      name: 'notes',
      type: 'object',
      path: 'notes',
      description: 'Character notes',
      children: [
        { name: 'personality', type: 'string', path: 'notes.personality' },
        { name: 'ideals', type: 'string', path: 'notes.ideals' },
        { name: 'bonds', type: 'string', path: 'notes.bonds' },
        { name: 'flaws', type: 'string', path: 'notes.flaws' },
        { name: 'backstory', type: 'string', path: 'notes.backstory' },
        { name: 'other', type: 'string', path: 'notes.other' }
      ]
    }
  ]
};

/**
 * Get the default entity schema
 * In the future, this will select the appropriate schema based on the game system
 */
export function getEntitySchema(): PropertyDefinition {
  return dnd5eCharacterSchema;
}

/**
 * Filter properties to only include array types
 * Used by the repeater component to only show array properties
 */
export function getArrayProperties(schema: PropertyDefinition): PropertyDefinition[] {
  const result: PropertyDefinition[] = [];

  function traverse(prop: PropertyDefinition) {
    if (prop.type === 'array') {
      result.push(prop);
    }
    if (prop.children) {
      prop.children.forEach(traverse);
    }
  }

  if (schema.children) {
    schema.children.forEach(traverse);
  }

  return result;
}

/**
 * Search properties by name or path
 */
export function searchProperties(
  schema: PropertyDefinition,
  searchTerm: string
): PropertyDefinition[] {
  const result: PropertyDefinition[] = [];
  const term = searchTerm.toLowerCase();

  function traverse(prop: PropertyDefinition) {
    const nameMatch = prop.name.toLowerCase().includes(term);
    const pathMatch = prop.path.toLowerCase().includes(term);

    if (nameMatch || pathMatch) {
      result.push(prop);
    }

    if (prop.children) {
      prop.children.forEach(traverse);
    }
  }

  if (schema.children) {
    schema.children.forEach(traverse);
  }

  return result;
}
