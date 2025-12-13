/**
 * D&D 5e NPC/Monster Stat Block Form Definition
 *
 * A comprehensive form template for creating D&D 5e NPCs and monsters
 * following the official stat block format from the Monster Manual.
 *
 * This form supports all standard monster features including:
 * - Basic stats (AC, HP, Speed, Abilities)
 * - Skills, Saves, Senses, Languages
 * - Traits, Actions, Bonus Actions, Reactions
 * - Legendary Actions, Lair Actions, Regional Effects
 * - Spellcasting (both standard and innate)
 */

import type { FormDefinition, LayoutNode } from '../../../packages/shared/src/types/forms';
import type { DnD5eNPCData } from '../../../packages/shared/src/types/dnd5e';

/**
 * Helper function to create CR options including fractional values
 */
function createCROptions() {
  const options = [
    { value: '0', label: { literal: 'CR 0 (10 XP)' } },
    { value: '0.125', label: { literal: 'CR 1/8 (25 XP)' } },
    { value: '0.25', label: { literal: 'CR 1/4 (50 XP)' } },
    { value: '0.5', label: { literal: 'CR 1/2 (100 XP)' } },
  ];

  // CR 1-30
  for (let cr = 1; cr <= 30; cr++) {
    const xpMap: Record<number, number> = {
      1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
      6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
      11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
      16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
      21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
      26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000,
    };
    options.push({
      value: String(cr),
      label: { literal: `CR ${cr} (${xpMap[cr]?.toLocaleString() || 0} XP)` }
    });
  }

  return options;
}

/**
 * Main NPC/Monster stat block form definition
 */
export const dnd5eNPCForm: FormDefinition = {
  id: 'dnd5e-npc-stat-block',
  name: 'D&D 5e Monster/NPC Stat Block',
  description: 'Official D&D 5e stat block format for monsters and NPCs',
  gameSystemId: 'dnd5e',
  entityType: 'npc',
  version: 1,
  isDefault: true,
  isLocked: false,
  visibility: 'public',
  ownerId: 'system',

  layout: [
    // ========================================
    // HEADER SECTION
    // ========================================
    {
      type: 'section',
      id: 'npc-header',
      title: { literal: 'Basic Information' },
      collapsible: false,
      className: 'stat-block-header',
      children: [
        // Name and Image
        {
          type: 'grid',
          id: 'name-image-grid',
          columns: '2fr 1fr',
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'npc-name',
              fieldType: 'text',
              binding: 'name',
              label: { literal: 'Name' },
              required: true,
              options: {
                placeholder: { literal: 'Ancient Red Dragon' }
              }
            },
            {
              type: 'field',
              id: 'npc-image',
              fieldType: 'image',
              binding: 'img',
              label: { literal: 'Portrait' },
              options: {
                accept: 'image/*',
                maxSize: 5242880 // 5MB
              }
            }
          ]
        },

        // Size, Type, Subtype, Alignment
        {
          type: 'grid',
          id: 'type-grid',
          columns: 4,
          gap: '0.75rem',
          children: [
            {
              type: 'field',
              id: 'size',
              fieldType: 'select',
              binding: 'data.size',
              label: { literal: 'Size' },
              required: true,
              options: {
                options: [
                  { value: 'tiny', label: { literal: 'Tiny' } },
                  { value: 'small', label: { literal: 'Small' } },
                  { value: 'medium', label: { literal: 'Medium' } },
                  { value: 'large', label: { literal: 'Large' } },
                  { value: 'huge', label: { literal: 'Huge' } },
                  { value: 'gargantuan', label: { literal: 'Gargantuan' } }
                ]
              }
            },
            {
              type: 'field',
              id: 'creature-type',
              fieldType: 'select',
              binding: 'data.type',
              label: { literal: 'Type' },
              required: true,
              options: {
                options: [
                  { value: 'aberration', label: { literal: 'Aberration' } },
                  { value: 'beast', label: { literal: 'Beast' } },
                  { value: 'celestial', label: { literal: 'Celestial' } },
                  { value: 'construct', label: { literal: 'Construct' } },
                  { value: 'dragon', label: { literal: 'Dragon' } },
                  { value: 'elemental', label: { literal: 'Elemental' } },
                  { value: 'fey', label: { literal: 'Fey' } },
                  { value: 'fiend', label: { literal: 'Fiend' } },
                  { value: 'giant', label: { literal: 'Giant' } },
                  { value: 'humanoid', label: { literal: 'Humanoid' } },
                  { value: 'monstrosity', label: { literal: 'Monstrosity' } },
                  { value: 'ooze', label: { literal: 'Ooze' } },
                  { value: 'plant', label: { literal: 'Plant' } },
                  { value: 'undead', label: { literal: 'Undead' } }
                ]
              }
            },
            {
              type: 'field',
              id: 'subtype',
              fieldType: 'text',
              binding: 'data.subtype',
              label: { literal: 'Subtype' },
              options: {
                placeholder: { literal: 'goblinoid, shapechanger' }
              }
            },
            {
              type: 'field',
              id: 'alignment',
              fieldType: 'text',
              binding: 'data.alignment',
              label: { literal: 'Alignment' },
              required: true,
              options: {
                placeholder: { literal: 'chaotic evil' }
              }
            }
          ]
        },

        // Challenge Rating
        {
          type: 'grid',
          id: 'cr-grid',
          columns: 2,
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'challenge-rating',
              fieldType: 'select',
              binding: 'data.cr',
              label: { literal: 'Challenge Rating' },
              required: true,
              options: {
                options: createCROptions()
              }
            },
            {
              type: 'computed',
              id: 'xp-value',
              fieldId: 'xp-computed',
              label: { literal: 'XP Value' },
              format: '{value} XP'
            }
          ]
        },

        {
          type: 'divider',
          id: 'header-divider',
          orientation: 'horizontal'
        }
      ]
    },

    // ========================================
    // CORE STATS SECTION
    // ========================================
    {
      type: 'section',
      id: 'core-stats',
      title: { literal: 'Core Statistics' },
      collapsible: false,
      className: 'stat-block-stats',
      children: [
        // Armor Class, Hit Points, Speed
        {
          type: 'grid',
          id: 'ac-hp-speed-grid',
          columns: 3,
          gap: '1rem',
          children: [
            // Armor Class
            {
              type: 'group',
              id: 'ac-group',
              title: { literal: 'Armor Class' },
              border: true,
              children: [
                {
                  type: 'field',
                  id: 'ac-value',
                  fieldType: 'number',
                  binding: 'data.armorClass.value',
                  label: { literal: 'AC' },
                  required: true,
                  options: {
                    min: 1,
                    max: 30
                  }
                },
                {
                  type: 'field',
                  id: 'ac-formula',
                  fieldType: 'text',
                  binding: 'data.armorClass.formula',
                  label: { literal: 'Type/Formula' },
                  options: {
                    placeholder: { literal: 'natural armor, plate' }
                  }
                }
              ]
            },

            // Hit Points
            {
              type: 'group',
              id: 'hp-group',
              title: { literal: 'Hit Points' },
              border: true,
              children: [
                {
                  type: 'grid',
                  id: 'hp-current-max',
                  columns: 2,
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'hp-current',
                      fieldType: 'number',
                      binding: 'data.hitPoints.current',
                      label: { literal: 'Current' },
                      options: { min: 0 }
                    },
                    {
                      type: 'field',
                      id: 'hp-max',
                      fieldType: 'number',
                      binding: 'data.hitPoints.max',
                      label: { literal: 'Maximum' },
                      required: true,
                      options: { min: 1 }
                    }
                  ]
                },
                {
                  type: 'field',
                  id: 'hp-formula',
                  fieldType: 'text',
                  binding: 'data.hitPoints.formula',
                  label: { literal: 'Hit Dice Formula' },
                  required: true,
                  options: {
                    placeholder: { literal: '8d8+16' }
                  }
                },
                {
                  type: 'computed',
                  id: 'hp-average',
                  fieldId: 'hp-average-computed',
                  label: { literal: 'Average HP' }
                }
              ]
            },

            // Speed
            {
              type: 'group',
              id: 'speed-group',
              title: { literal: 'Speed' },
              border: true,
              children: [
                {
                  type: 'field',
                  id: 'speed-walk',
                  fieldType: 'number',
                  binding: 'data.speed.walk',
                  label: { literal: 'Walk' },
                  required: true,
                  options: {
                    min: 0,
                    step: 5
                  }
                },
                {
                  type: 'field',
                  id: 'speed-fly',
                  fieldType: 'number',
                  binding: 'data.speed.fly',
                  label: { literal: 'Fly' },
                  options: {
                    min: 0,
                    step: 5
                  }
                },
                {
                  type: 'field',
                  id: 'speed-swim',
                  fieldType: 'number',
                  binding: 'data.speed.swim',
                  label: { literal: 'Swim' },
                  options: {
                    min: 0,
                    step: 5
                  }
                },
                {
                  type: 'field',
                  id: 'speed-climb',
                  fieldType: 'number',
                  binding: 'data.speed.climb',
                  label: { literal: 'Climb' },
                  options: {
                    min: 0,
                    step: 5
                  }
                },
                {
                  type: 'field',
                  id: 'speed-burrow',
                  fieldType: 'number',
                  binding: 'data.speed.burrow',
                  label: { literal: 'Burrow' },
                  options: {
                    min: 0,
                    step: 5
                  }
                },
                {
                  type: 'field',
                  id: 'speed-hover',
                  fieldType: 'checkbox',
                  binding: 'data.speed.hover',
                  label: { literal: 'Hover' }
                }
              ]
            }
          ]
        },

        {
          type: 'divider',
          id: 'stats-divider',
          orientation: 'horizontal'
        }
      ]
    },

    // ========================================
    // ABILITY SCORES
    // ========================================
    {
      type: 'section',
      id: 'abilities',
      title: { literal: 'Ability Scores' },
      collapsible: false,
      className: 'stat-block-abilities',
      children: [
        {
          type: 'grid',
          id: 'abilities-grid',
          columns: 6,
          gap: '0.5rem',
          children: [
            // STR
            {
              type: 'group',
              id: 'str-group',
              title: { literal: 'STR' },
              border: true,
              className: 'ability-score',
              children: [
                {
                  type: 'field',
                  id: 'str-value',
                  fieldType: 'number',
                  binding: 'data.abilities.str.value',
                  label: { literal: 'Score' },
                  required: true,
                  options: {
                    min: 1,
                    max: 30
                  }
                },
                {
                  type: 'computed',
                  id: 'str-mod',
                  fieldId: 'str-mod-computed',
                  label: { literal: 'Modifier' },
                  format: '{value >= 0 ? "+" : ""}{value}'
                }
              ]
            },

            // DEX
            {
              type: 'group',
              id: 'dex-group',
              title: { literal: 'DEX' },
              border: true,
              className: 'ability-score',
              children: [
                {
                  type: 'field',
                  id: 'dex-value',
                  fieldType: 'number',
                  binding: 'data.abilities.dex.value',
                  label: { literal: 'Score' },
                  required: true,
                  options: {
                    min: 1,
                    max: 30
                  }
                },
                {
                  type: 'computed',
                  id: 'dex-mod',
                  fieldId: 'dex-mod-computed',
                  label: { literal: 'Modifier' },
                  format: '{value >= 0 ? "+" : ""}{value}'
                }
              ]
            },

            // CON
            {
              type: 'group',
              id: 'con-group',
              title: { literal: 'CON' },
              border: true,
              className: 'ability-score',
              children: [
                {
                  type: 'field',
                  id: 'con-value',
                  fieldType: 'number',
                  binding: 'data.abilities.con.value',
                  label: { literal: 'Score' },
                  required: true,
                  options: {
                    min: 1,
                    max: 30
                  }
                },
                {
                  type: 'computed',
                  id: 'con-mod',
                  fieldId: 'con-mod-computed',
                  label: { literal: 'Modifier' },
                  format: '{value >= 0 ? "+" : ""}{value}'
                }
              ]
            },

            // INT
            {
              type: 'group',
              id: 'int-group',
              title: { literal: 'INT' },
              border: true,
              className: 'ability-score',
              children: [
                {
                  type: 'field',
                  id: 'int-value',
                  fieldType: 'number',
                  binding: 'data.abilities.int.value',
                  label: { literal: 'Score' },
                  required: true,
                  options: {
                    min: 1,
                    max: 30
                  }
                },
                {
                  type: 'computed',
                  id: 'int-mod',
                  fieldId: 'int-mod-computed',
                  label: { literal: 'Modifier' },
                  format: '{value >= 0 ? "+" : ""}{value}'
                }
              ]
            },

            // WIS
            {
              type: 'group',
              id: 'wis-group',
              title: { literal: 'WIS' },
              border: true,
              className: 'ability-score',
              children: [
                {
                  type: 'field',
                  id: 'wis-value',
                  fieldType: 'number',
                  binding: 'data.abilities.wis.value',
                  label: { literal: 'Score' },
                  required: true,
                  options: {
                    min: 1,
                    max: 30
                  }
                },
                {
                  type: 'computed',
                  id: 'wis-mod',
                  fieldId: 'wis-mod-computed',
                  label: { literal: 'Modifier' },
                  format: '{value >= 0 ? "+" : ""}{value}'
                }
              ]
            },

            // CHA
            {
              type: 'group',
              id: 'cha-group',
              title: { literal: 'CHA' },
              border: true,
              className: 'ability-score',
              children: [
                {
                  type: 'field',
                  id: 'cha-value',
                  fieldType: 'number',
                  binding: 'data.abilities.cha.value',
                  label: { literal: 'Score' },
                  required: true,
                  options: {
                    min: 1,
                    max: 30
                  }
                },
                {
                  type: 'computed',
                  id: 'cha-mod',
                  fieldId: 'cha-mod-computed',
                  label: { literal: 'Modifier' },
                  format: '{value >= 0 ? "+" : ""}{value}'
                }
              ]
            }
          ]
        },

        {
          type: 'divider',
          id: 'abilities-divider',
          orientation: 'horizontal'
        }
      ]
    },

    // ========================================
    // DEFENSES SECTION
    // ========================================
    {
      type: 'section',
      id: 'defenses',
      title: { literal: 'Defenses' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        // Saving Throws
        {
          type: 'field',
          id: 'saving-throws',
          fieldType: 'tags',
          binding: 'data.savingThrows',
          label: { literal: 'Saving Throws' },
          helpText: { literal: 'Only list proficient saves (e.g., "Str +8", "Dex +6")' },
          options: {
            allowCustom: true,
            suggestions: ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha']
          }
        },

        // Skills
        {
          type: 'field',
          id: 'skills',
          fieldType: 'tags',
          binding: 'data.skills',
          label: { literal: 'Skills' },
          helpText: { literal: 'Only list trained skills (e.g., "Perception +6", "Stealth +8")' },
          options: {
            allowCustom: true,
            suggestions: [
              'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics',
              'Deception', 'History', 'Insight', 'Intimidation',
              'Investigation', 'Medicine', 'Nature', 'Perception',
              'Performance', 'Persuasion', 'Religion', 'Sleight of Hand',
              'Stealth', 'Survival'
            ]
          }
        },

        // Damage Vulnerabilities
        {
          type: 'field',
          id: 'vulnerabilities',
          fieldType: 'multiselect',
          binding: 'data.vulnerabilities',
          label: { literal: 'Damage Vulnerabilities' },
          options: {
            searchable: true,
            options: [
              { value: 'acid', label: { literal: 'Acid' } },
              { value: 'bludgeoning', label: { literal: 'Bludgeoning' } },
              { value: 'cold', label: { literal: 'Cold' } },
              { value: 'fire', label: { literal: 'Fire' } },
              { value: 'force', label: { literal: 'Force' } },
              { value: 'lightning', label: { literal: 'Lightning' } },
              { value: 'necrotic', label: { literal: 'Necrotic' } },
              { value: 'piercing', label: { literal: 'Piercing' } },
              { value: 'poison', label: { literal: 'Poison' } },
              { value: 'psychic', label: { literal: 'Psychic' } },
              { value: 'radiant', label: { literal: 'Radiant' } },
              { value: 'slashing', label: { literal: 'Slashing' } },
              { value: 'thunder', label: { literal: 'Thunder' } }
            ]
          }
        },

        // Damage Resistances
        {
          type: 'field',
          id: 'resistances',
          fieldType: 'multiselect',
          binding: 'data.resistances',
          label: { literal: 'Damage Resistances' },
          options: {
            searchable: true,
            options: [
              { value: 'acid', label: { literal: 'Acid' } },
              { value: 'bludgeoning', label: { literal: 'Bludgeoning' } },
              { value: 'cold', label: { literal: 'Cold' } },
              { value: 'fire', label: { literal: 'Fire' } },
              { value: 'force', label: { literal: 'Force' } },
              { value: 'lightning', label: { literal: 'Lightning' } },
              { value: 'necrotic', label: { literal: 'Necrotic' } },
              { value: 'piercing', label: { literal: 'Piercing' } },
              { value: 'poison', label: { literal: 'Poison' } },
              { value: 'psychic', label: { literal: 'Psychic' } },
              { value: 'radiant', label: { literal: 'Radiant' } },
              { value: 'slashing', label: { literal: 'Slashing' } },
              { value: 'thunder', label: { literal: 'Thunder' } }
            ]
          }
        },

        // Damage Immunities
        {
          type: 'field',
          id: 'immunities',
          fieldType: 'multiselect',
          binding: 'data.immunities',
          label: { literal: 'Damage Immunities' },
          options: {
            searchable: true,
            options: [
              { value: 'acid', label: { literal: 'Acid' } },
              { value: 'bludgeoning', label: { literal: 'Bludgeoning' } },
              { value: 'cold', label: { literal: 'Cold' } },
              { value: 'fire', label: { literal: 'Fire' } },
              { value: 'force', label: { literal: 'Force' } },
              { value: 'lightning', label: { literal: 'Lightning' } },
              { value: 'necrotic', label: { literal: 'Necrotic' } },
              { value: 'piercing', label: { literal: 'Piercing' } },
              { value: 'poison', label: { literal: 'Poison' } },
              { value: 'psychic', label: { literal: 'Psychic' } },
              { value: 'radiant', label: { literal: 'Radiant' } },
              { value: 'slashing', label: { literal: 'Slashing' } },
              { value: 'thunder', label: { literal: 'Thunder' } }
            ]
          }
        },

        // Condition Immunities
        {
          type: 'field',
          id: 'condition-immunities',
          fieldType: 'multiselect',
          binding: 'data.conditionImmunities',
          label: { literal: 'Condition Immunities' },
          options: {
            searchable: true,
            options: [
              { value: 'blinded', label: { literal: 'Blinded' } },
              { value: 'charmed', label: { literal: 'Charmed' } },
              { value: 'deafened', label: { literal: 'Deafened' } },
              { value: 'exhaustion', label: { literal: 'Exhaustion' } },
              { value: 'frightened', label: { literal: 'Frightened' } },
              { value: 'grappled', label: { literal: 'Grappled' } },
              { value: 'incapacitated', label: { literal: 'Incapacitated' } },
              { value: 'invisible', label: { literal: 'Invisible' } },
              { value: 'paralyzed', label: { literal: 'Paralyzed' } },
              { value: 'petrified', label: { literal: 'Petrified' } },
              { value: 'poisoned', label: { literal: 'Poisoned' } },
              { value: 'prone', label: { literal: 'Prone' } },
              { value: 'restrained', label: { literal: 'Restrained' } },
              { value: 'stunned', label: { literal: 'Stunned' } },
              { value: 'unconscious', label: { literal: 'Unconscious' } }
            ]
          }
        }
      ]
    },

    // ========================================
    // SENSES SECTION
    // ========================================
    {
      type: 'section',
      id: 'senses',
      title: { literal: 'Senses' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'grid',
          id: 'senses-grid',
          columns: 2,
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'darkvision',
              fieldType: 'number',
              binding: 'data.senses.darkvision',
              label: { literal: 'Darkvision (feet)' },
              options: {
                min: 0,
                step: 5,
                placeholder: { literal: '60' }
              }
            },
            {
              type: 'field',
              id: 'blindsight',
              fieldType: 'number',
              binding: 'data.senses.blindsight',
              label: { literal: 'Blindsight (feet)' },
              options: {
                min: 0,
                step: 5
              }
            },
            {
              type: 'field',
              id: 'tremorsense',
              fieldType: 'number',
              binding: 'data.senses.tremorsense',
              label: { literal: 'Tremorsense (feet)' },
              options: {
                min: 0,
                step: 5
              }
            },
            {
              type: 'field',
              id: 'truesight',
              fieldType: 'number',
              binding: 'data.senses.truesight',
              label: { literal: 'Truesight (feet)' },
              options: {
                min: 0,
                step: 5
              }
            },
            {
              type: 'computed',
              id: 'passive-perception',
              fieldId: 'passive-perception-computed',
              label: { literal: 'Passive Perception' },
              format: '{value}'
            },
            {
              type: 'computed',
              id: 'passive-investigation',
              fieldId: 'passive-investigation-computed',
              label: { literal: 'Passive Investigation' },
              format: '{value}'
            }
          ]
        }
      ]
    },

    // ========================================
    // LANGUAGES SECTION
    // ========================================
    {
      type: 'section',
      id: 'languages',
      title: { literal: 'Languages' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'field',
          id: 'languages-list',
          fieldType: 'tags',
          binding: 'data.languages',
          label: { literal: 'Languages Known' },
          options: {
            allowCustom: true,
            suggestions: [
              'Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish',
              'Goblin', 'Halfling', 'Orc', 'Abyssal', 'Celestial',
              'Draconic', 'Deep Speech', 'Infernal', 'Primordial',
              'Sylvan', 'Undercommon', 'Telepathy'
            ]
          }
        }
      ]
    },

    // ========================================
    // TRAITS SECTION (Passive Abilities)
    // ========================================
    {
      type: 'section',
      id: 'traits',
      title: { literal: 'Traits' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'repeater',
          id: 'traits-repeater',
          binding: 'data.traits',
          addLabel: { literal: '+ Add Trait' },
          emptyMessage: { literal: 'No traits defined. Traits are passive abilities like Magic Resistance, Keen Senses, etc.' },
          allowReorder: true,
          allowDelete: true,
          itemTemplate: [
            {
              type: 'field',
              id: 'trait-name',
              fieldType: 'text',
              binding: 'name',
              label: { literal: 'Trait Name' },
              required: true,
              options: {
                placeholder: { literal: 'Magic Resistance' }
              }
            },
            {
              type: 'field',
              id: 'trait-description',
              fieldType: 'richtext',
              binding: 'description',
              label: { literal: 'Description' },
              required: true,
              options: {
                placeholder: { literal: 'The creature has advantage on saving throws against spells and other magical effects.' }
              }
            }
          ]
        }
      ]
    },

    // ========================================
    // ACTIONS SECTION
    // ========================================
    {
      type: 'section',
      id: 'actions',
      title: { literal: 'Actions' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'repeater',
          id: 'actions-repeater',
          binding: 'data.actions',
          addLabel: { literal: '+ Add Action' },
          emptyMessage: { literal: 'No actions defined.' },
          allowReorder: true,
          allowDelete: true,
          itemTemplate: [
            {
              type: 'field',
              id: 'action-name',
              fieldType: 'text',
              binding: 'name',
              label: { literal: 'Action Name' },
              required: true,
              options: {
                placeholder: { literal: 'Multiattack, Bite, Claw' }
              }
            },
            {
              type: 'field',
              id: 'action-description',
              fieldType: 'richtext',
              binding: 'description',
              label: { literal: 'Description' },
              required: true
            },

            // Attack (conditional)
            {
              type: 'group',
              id: 'action-attack-group',
              title: { literal: 'Attack' },
              border: true,
              children: [
                {
                  type: 'field',
                  id: 'action-attack-type',
                  fieldType: 'select',
                  binding: 'attack.type',
                  label: { literal: 'Attack Type' },
                  options: {
                    options: [
                      { value: '', label: { literal: 'Not an attack' } },
                      { value: 'melee', label: { literal: 'Melee Weapon Attack' } },
                      { value: 'ranged', label: { literal: 'Ranged Weapon Attack' } },
                      { value: 'spell', label: { literal: 'Spell Attack' } }
                    ]
                  }
                },
                {
                  type: 'conditional',
                  id: 'attack-conditional',
                  condition: {
                    type: 'simple',
                    field: 'attack.type',
                    operator: 'isNotEmpty'
                  },
                  then: [
                    {
                      type: 'grid',
                      id: 'attack-stats-grid',
                      columns: 3,
                      gap: '0.5rem',
                      children: [
                        {
                          type: 'field',
                          id: 'attack-bonus',
                          fieldType: 'number',
                          binding: 'attack.bonus',
                          label: { literal: 'Attack Bonus' },
                          options: {
                            placeholder: { literal: '+6' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'attack-reach',
                          fieldType: 'number',
                          binding: 'attack.reach',
                          label: { literal: 'Reach (feet)' },
                          options: {
                            min: 0,
                            step: 5,
                            placeholder: { literal: '5' }
                          },
                          visibility: {
                            type: 'simple',
                            field: 'attack.type',
                            operator: 'equals',
                            value: 'melee'
                          }
                        },
                        {
                          type: 'field',
                          id: 'attack-range-normal',
                          fieldType: 'number',
                          binding: 'attack.range.normal',
                          label: { literal: 'Range (feet)' },
                          options: {
                            min: 0,
                            step: 5
                          },
                          visibility: {
                            type: 'simple',
                            field: 'attack.type',
                            operator: 'equals',
                            value: 'ranged'
                          }
                        },
                        {
                          type: 'field',
                          id: 'attack-range-long',
                          fieldType: 'number',
                          binding: 'attack.range.long',
                          label: { literal: 'Long Range (feet)' },
                          options: {
                            min: 0,
                            step: 5
                          },
                          visibility: {
                            type: 'simple',
                            field: 'attack.type',
                            operator: 'equals',
                            value: 'ranged'
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            // Damage (repeater for multiple damage types)
            {
              type: 'group',
              id: 'action-damage-group',
              title: { literal: 'Damage' },
              border: true,
              children: [
                {
                  type: 'repeater',
                  id: 'action-damage-repeater',
                  binding: 'damage',
                  addLabel: { literal: '+ Add Damage Type' },
                  emptyMessage: { literal: 'No damage defined' },
                  allowReorder: true,
                  allowDelete: true,
                  itemTemplate: [
                    {
                      type: 'grid',
                      id: 'damage-grid',
                      columns: 3,
                      gap: '0.5rem',
                      children: [
                        {
                          type: 'field',
                          id: 'damage-dice',
                          fieldType: 'text',
                          binding: 'dice',
                          label: { literal: 'Dice' },
                          required: true,
                          options: {
                            placeholder: { literal: '2d6+4' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'damage-type',
                          fieldType: 'select',
                          binding: 'type',
                          label: { literal: 'Type' },
                          required: true,
                          options: {
                            options: [
                              { value: 'acid', label: { literal: 'Acid' } },
                              { value: 'bludgeoning', label: { literal: 'Bludgeoning' } },
                              { value: 'cold', label: { literal: 'Cold' } },
                              { value: 'fire', label: { literal: 'Fire' } },
                              { value: 'force', label: { literal: 'Force' } },
                              { value: 'lightning', label: { literal: 'Lightning' } },
                              { value: 'necrotic', label: { literal: 'Necrotic' } },
                              { value: 'piercing', label: { literal: 'Piercing' } },
                              { value: 'poison', label: { literal: 'Poison' } },
                              { value: 'psychic', label: { literal: 'Psychic' } },
                              { value: 'radiant', label: { literal: 'Radiant' } },
                              { value: 'slashing', label: { literal: 'Slashing' } },
                              { value: 'thunder', label: { literal: 'Thunder' } }
                            ]
                          }
                        },
                        {
                          type: 'computed',
                          id: 'damage-average',
                          fieldId: 'damage-average-computed',
                          label: { literal: 'Average' }
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            // Saving Throw
            {
              type: 'group',
              id: 'action-save-group',
              title: { literal: 'Saving Throw' },
              border: true,
              children: [
                {
                  type: 'grid',
                  id: 'save-grid',
                  columns: 3,
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'save-dc',
                      fieldType: 'number',
                      binding: 'save.dc',
                      label: { literal: 'DC' },
                      options: {
                        min: 1,
                        max: 30
                      }
                    },
                    {
                      type: 'field',
                      id: 'save-ability',
                      fieldType: 'select',
                      binding: 'save.ability',
                      label: { literal: 'Ability' },
                      options: {
                        options: [
                          { value: 'str', label: { literal: 'Strength' } },
                          { value: 'dex', label: { literal: 'Dexterity' } },
                          { value: 'con', label: { literal: 'Constitution' } },
                          { value: 'int', label: { literal: 'Intelligence' } },
                          { value: 'wis', label: { literal: 'Wisdom' } },
                          { value: 'cha', label: { literal: 'Charisma' } }
                        ]
                      }
                    },
                    {
                      type: 'field',
                      id: 'save-effect',
                      fieldType: 'text',
                      binding: 'save.effect',
                      label: { literal: 'Effect' },
                      options: {
                        placeholder: { literal: 'half damage on success' }
                      }
                    }
                  ]
                }
              ]
            },

            // Recharge
            {
              type: 'group',
              id: 'action-recharge-group',
              title: { literal: 'Recharge' },
              border: true,
              children: [
                {
                  type: 'field',
                  id: 'recharge-on',
                  fieldType: 'select',
                  binding: 'recharge.on',
                  label: { literal: 'Recharge On' },
                  helpText: { literal: 'Leave empty if action doesn\'t recharge' },
                  options: {
                    options: [
                      { value: '', label: { literal: 'No recharge' } },
                      { value: '6', label: { literal: 'Recharge 6' } },
                      { value: '5', label: { literal: 'Recharge 5-6' } },
                      { value: '4', label: { literal: 'Recharge 4-6' } }
                    ]
                  }
                }
              ]
            },

            // Limited Uses
            {
              type: 'group',
              id: 'action-uses-group',
              title: { literal: 'Limited Uses' },
              border: true,
              children: [
                {
                  type: 'grid',
                  id: 'uses-grid',
                  columns: 3,
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'uses-count',
                      fieldType: 'number',
                      binding: 'uses.count',
                      label: { literal: 'Uses' },
                      options: {
                        min: 0
                      }
                    },
                    {
                      type: 'field',
                      id: 'uses-per',
                      fieldType: 'select',
                      binding: 'uses.per',
                      label: { literal: 'Per' },
                      options: {
                        options: [
                          { value: 'day', label: { literal: 'Day' } },
                          { value: 'short_rest', label: { literal: 'Short Rest' } },
                          { value: 'long_rest', label: { literal: 'Long Rest' } },
                          { value: 'turn', label: { literal: 'Turn' } },
                          { value: 'recharge', label: { literal: 'Recharge' } }
                        ]
                      }
                    },
                    {
                      type: 'field',
                      id: 'uses-current',
                      fieldType: 'number',
                      binding: 'uses.current',
                      label: { literal: 'Remaining' },
                      options: {
                        min: 0
                      }
                    }
                  ]
                }
              ]
            },

            {
              type: 'divider',
              id: 'action-divider',
              orientation: 'horizontal'
            }
          ]
        }
      ]
    },

    // ========================================
    // BONUS ACTIONS SECTION
    // ========================================
    {
      type: 'section',
      id: 'bonus-actions',
      title: { literal: 'Bonus Actions' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'repeater',
          id: 'bonus-actions-repeater',
          binding: 'data.bonusActions',
          addLabel: { literal: '+ Add Bonus Action' },
          emptyMessage: { literal: 'No bonus actions defined.' },
          allowReorder: true,
          allowDelete: true,
          itemTemplate: [
            {
              type: 'field',
              id: 'bonus-action-name',
              fieldType: 'text',
              binding: 'name',
              label: { literal: 'Bonus Action Name' },
              required: true
            },
            {
              type: 'field',
              id: 'bonus-action-description',
              fieldType: 'richtext',
              binding: 'description',
              label: { literal: 'Description' },
              required: true
            }
          ]
        }
      ]
    },

    // ========================================
    // REACTIONS SECTION
    // ========================================
    {
      type: 'section',
      id: 'reactions',
      title: { literal: 'Reactions' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'repeater',
          id: 'reactions-repeater',
          binding: 'data.reactions',
          addLabel: { literal: '+ Add Reaction' },
          emptyMessage: { literal: 'No reactions defined.' },
          allowReorder: true,
          allowDelete: true,
          itemTemplate: [
            {
              type: 'field',
              id: 'reaction-name',
              fieldType: 'text',
              binding: 'name',
              label: { literal: 'Reaction Name' },
              required: true
            },
            {
              type: 'field',
              id: 'reaction-description',
              fieldType: 'richtext',
              binding: 'description',
              label: { literal: 'Description' },
              required: true
            }
          ]
        }
      ]
    },

    // ========================================
    // LEGENDARY ACTIONS SECTION
    // ========================================
    {
      type: 'section',
      id: 'legendary-actions',
      title: { literal: 'Legendary Actions' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'field',
          id: 'legendary-count',
          fieldType: 'number',
          binding: 'data.legendaryActions.count',
          label: { literal: 'Actions Per Round' },
          helpText: { literal: 'How many legendary actions the creature can take per round (typically 3)' },
          options: {
            min: 0,
            max: 10,
            placeholder: { literal: '3' }
          }
        },
        {
          type: 'field',
          id: 'legendary-description',
          fieldType: 'textarea',
          binding: 'data.legendaryActions.description',
          label: { literal: 'Description' },
          options: {
            placeholder: { literal: 'The creature can take 3 legendary actions, choosing from the options below...' }
          }
        },
        {
          type: 'repeater',
          id: 'legendary-actions-repeater',
          binding: 'data.legendaryActions.actions',
          addLabel: { literal: '+ Add Legendary Action' },
          emptyMessage: { literal: 'No legendary actions defined.' },
          allowReorder: true,
          allowDelete: true,
          itemTemplate: [
            {
              type: 'grid',
              id: 'legendary-action-grid',
              columns: '3fr 1fr',
              gap: '0.5rem',
              children: [
                {
                  type: 'field',
                  id: 'legendary-action-name',
                  fieldType: 'text',
                  binding: 'name',
                  label: { literal: 'Action Name' },
                  required: true
                },
                {
                  type: 'field',
                  id: 'legendary-action-cost',
                  fieldType: 'select',
                  binding: 'legendaryCost',
                  label: { literal: 'Action Cost' },
                  options: {
                    options: [
                      { value: '1', label: { literal: '1 Action' } },
                      { value: '2', label: { literal: '2 Actions' } },
                      { value: '3', label: { literal: '3 Actions' } }
                    ]
                  }
                }
              ]
            },
            {
              type: 'field',
              id: 'legendary-action-description',
              fieldType: 'richtext',
              binding: 'description',
              label: { literal: 'Description' },
              required: true
            }
          ]
        }
      ]
    },

    // ========================================
    // LAIR ACTIONS SECTION
    // ========================================
    {
      type: 'section',
      id: 'lair-actions',
      title: { literal: 'Lair Actions' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'static',
          id: 'lair-actions-info',
          content: { literal: 'On initiative count 20 (losing initiative ties), the creature can take a lair action to cause one of the following effects:' },
          contentType: 'text',
          className: 'help-text'
        },
        {
          type: 'repeater',
          id: 'lair-actions-repeater',
          binding: 'data.lairActions',
          addLabel: { literal: '+ Add Lair Action' },
          emptyMessage: { literal: 'No lair actions defined.' },
          allowReorder: true,
          allowDelete: true,
          itemTemplate: [
            {
              type: 'field',
              id: 'lair-action-name',
              fieldType: 'text',
              binding: 'name',
              label: { literal: 'Action Name' },
              required: true
            },
            {
              type: 'field',
              id: 'lair-action-description',
              fieldType: 'richtext',
              binding: 'description',
              label: { literal: 'Description' },
              required: true
            }
          ]
        }
      ]
    },

    // ========================================
    // REGIONAL EFFECTS SECTION
    // ========================================
    {
      type: 'section',
      id: 'regional-effects',
      title: { literal: 'Regional Effects' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'static',
          id: 'regional-effects-info',
          content: { literal: 'The region containing the creature\'s lair is warped by its presence, which creates one or more of the following effects:' },
          contentType: 'text',
          className: 'help-text'
        },
        {
          type: 'repeater',
          id: 'regional-effects-repeater',
          binding: 'data.regionalEffects',
          addLabel: { literal: '+ Add Regional Effect' },
          emptyMessage: { literal: 'No regional effects defined.' },
          allowReorder: true,
          allowDelete: true,
          itemTemplate: [
            {
              type: 'field',
              id: 'regional-effect',
              fieldType: 'richtext',
              binding: 'description',
              label: { literal: 'Effect Description' },
              required: true
            }
          ]
        }
      ]
    },

    // ========================================
    // SPELLCASTING SECTION
    // ========================================
    {
      type: 'section',
      id: 'spellcasting',
      title: { literal: 'Spellcasting' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'grid',
          id: 'spellcasting-stats-grid',
          columns: 3,
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'spellcasting-ability',
              fieldType: 'select',
              binding: 'data.spellcasting.ability',
              label: { literal: 'Spellcasting Ability' },
              options: {
                options: [
                  { value: '', label: { literal: 'None' } },
                  { value: 'int', label: { literal: 'Intelligence' } },
                  { value: 'wis', label: { literal: 'Wisdom' } },
                  { value: 'cha', label: { literal: 'Charisma' } }
                ]
              }
            },
            {
              type: 'field',
              id: 'spell-save-dc',
              fieldType: 'number',
              binding: 'data.spellcasting.saveDC',
              label: { literal: 'Spell Save DC' },
              options: {
                min: 1,
                max: 30
              }
            },
            {
              type: 'field',
              id: 'spell-attack-bonus',
              fieldType: 'number',
              binding: 'data.spellcasting.attackBonus',
              label: { literal: 'Spell Attack Bonus' }
            }
          ]
        },
        {
          type: 'field',
          id: 'caster-level',
          fieldType: 'number',
          binding: 'data.spellcasting.level',
          label: { literal: 'Caster Level' },
          options: {
            min: 1,
            max: 20
          }
        },
        {
          type: 'field',
          id: 'spellcasting-note',
          fieldType: 'textarea',
          binding: 'data.spellcasting.note',
          label: { literal: 'Spellcasting Note' },
          helpText: { literal: 'Descriptive text like "The mage is a 9th-level spellcaster..."' },
          options: {
            placeholder: { literal: 'The archmage is an 18th-level spellcaster. Its spellcasting ability is Intelligence...' }
          }
        },

        // Spell Slots
        {
          type: 'group',
          id: 'spell-slots-group',
          title: { literal: 'Spell Slots' },
          border: true,
          children: [
            {
              type: 'grid',
              id: 'spell-slots-grid',
              columns: 3,
              gap: '0.5rem',
              children: [
                {
                  type: 'field',
                  id: 'spell-slots-1',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.1',
                  label: { literal: '1st Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-2',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.2',
                  label: { literal: '2nd Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-3',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.3',
                  label: { literal: '3rd Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-4',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.4',
                  label: { literal: '4th Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-5',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.5',
                  label: { literal: '5th Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-6',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.6',
                  label: { literal: '6th Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-7',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.7',
                  label: { literal: '7th Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-8',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.8',
                  label: { literal: '8th Level' },
                  options: { min: 0 }
                },
                {
                  type: 'field',
                  id: 'spell-slots-9',
                  fieldType: 'number',
                  binding: 'data.spellcasting.slots.9',
                  label: { literal: '9th Level' },
                  options: { min: 0 }
                }
              ]
            }
          ]
        },

        // Innate Spellcasting
        {
          type: 'group',
          id: 'innate-spellcasting-group',
          title: { literal: 'Innate Spellcasting' },
          border: true,
          children: [
            {
              type: 'static',
              id: 'innate-help',
              content: { literal: 'For creatures with innate spellcasting (uses per day instead of slots)' },
              contentType: 'text',
              className: 'help-text'
            },
            {
              type: 'repeater',
              id: 'innate-spells-repeater',
              binding: 'data.spellcasting.innate',
              addLabel: { literal: '+ Add Innate Spell' },
              emptyMessage: { literal: 'No innate spells defined.' },
              allowReorder: true,
              allowDelete: true,
              itemTemplate: [
                {
                  type: 'grid',
                  id: 'innate-spell-grid',
                  columns: 2,
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'innate-spell-name',
                      fieldType: 'text',
                      binding: 'spell',
                      label: { literal: 'Spell Name' },
                      required: true
                    },
                    {
                      type: 'field',
                      id: 'innate-spell-uses',
                      fieldType: 'text',
                      binding: 'uses',
                      label: { literal: 'Uses/Day' },
                      required: true,
                      options: {
                        placeholder: { literal: '3/day, 1/day, at will' }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },

    // ========================================
    // DESCRIPTION/NOTES SECTION
    // ========================================
    {
      type: 'section',
      id: 'description',
      title: { literal: 'Description & Notes' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'field',
          id: 'source',
          fieldType: 'text',
          binding: 'data.source',
          label: { literal: 'Source' },
          helpText: { literal: 'Book or module where this creature appears' },
          options: {
            placeholder: { literal: 'Monster Manual, Volo\'s Guide to Monsters' }
          }
        },
        {
          type: 'field',
          id: 'environment',
          fieldType: 'multiselect',
          binding: 'data.environment',
          label: { literal: 'Environment' },
          options: {
            searchable: true,
            options: [
              { value: 'arctic', label: { literal: 'Arctic' } },
              { value: 'coastal', label: { literal: 'Coastal' } },
              { value: 'desert', label: { literal: 'Desert' } },
              { value: 'forest', label: { literal: 'Forest' } },
              { value: 'grassland', label: { literal: 'Grassland' } },
              { value: 'hill', label: { literal: 'Hill' } },
              { value: 'mountain', label: { literal: 'Mountain' } },
              { value: 'swamp', label: { literal: 'Swamp' } },
              { value: 'underdark', label: { literal: 'Underdark' } },
              { value: 'underwater', label: { literal: 'Underwater' } },
              { value: 'urban', label: { literal: 'Urban' } }
            ]
          }
        },
        {
          type: 'field',
          id: 'lore',
          fieldType: 'richtext',
          binding: 'data.lore',
          label: { literal: 'Lore & Description' },
          helpText: { literal: 'Background information, tactics, role-playing notes' }
        }
      ]
    }
  ],

  // Reusable fragments (none defined for this form, but could be added)
  fragments: [],

  // Styling
  styles: {
    theme: 'parchment',
    variables: {
      '--stat-block-bg': '#f4e8d8',
      '--stat-block-border': '#8b4513',
      '--stat-block-header-bg': '#dcc9aa',
      '--ability-score-bg': '#fff',
      '--ability-score-border': '#999'
    }
  },

  // Computed fields
  computedFields: [
    {
      id: 'xp-computed',
      name: 'XP Value from CR',
      description: 'Automatically calculates XP based on Challenge Rating',
      formula: `
        const crXpMap = {
          0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
          1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
          6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
          11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
          16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
          21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
          26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000
        };
        return crXpMap[@data.cr] || 0;
      `,
      resultType: 'number',
      dependencies: ['data.cr']
    },
    {
      id: 'str-mod-computed',
      name: 'Strength Modifier',
      description: 'Calculates modifier from ability score',
      formula: 'Math.floor((@data.abilities.str.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.str.value']
    },
    {
      id: 'dex-mod-computed',
      name: 'Dexterity Modifier',
      formula: 'Math.floor((@data.abilities.dex.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value']
    },
    {
      id: 'con-mod-computed',
      name: 'Constitution Modifier',
      formula: 'Math.floor((@data.abilities.con.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.con.value']
    },
    {
      id: 'int-mod-computed',
      name: 'Intelligence Modifier',
      formula: 'Math.floor((@data.abilities.int.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.int.value']
    },
    {
      id: 'wis-mod-computed',
      name: 'Wisdom Modifier',
      formula: 'Math.floor((@data.abilities.wis.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value']
    },
    {
      id: 'cha-mod-computed',
      name: 'Charisma Modifier',
      formula: 'Math.floor((@data.abilities.cha.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value']
    },
    {
      id: 'passive-perception-computed',
      name: 'Passive Perception',
      description: 'Calculates passive Perception (10 + WIS modifier + proficiency if skilled)',
      formula: '10 + Math.floor((@data.abilities.wis.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value']
    },
    {
      id: 'passive-investigation-computed',
      name: 'Passive Investigation',
      description: 'Calculates passive Investigation (10 + INT modifier)',
      formula: '10 + Math.floor((@data.abilities.int.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.int.value']
    },
    {
      id: 'hp-average-computed',
      name: 'Average HP from Formula',
      description: 'Calculates average HP from hit dice formula',
      formula: `
        // Parse formula like "8d8+16"
        const formula = @data.hitPoints.formula || '';
        const match = formula.match(/(\\d+)d(\\d+)([+-]\\d+)?/);
        if (!match) return 0;
        const [, numDice, dieSize, modifier] = match;
        const avgPerDie = (parseInt(dieSize) + 1) / 2;
        const diceAvg = parseInt(numDice) * avgPerDie;
        const mod = parseInt(modifier || 0);
        return Math.floor(diceAvg + mod);
      `,
      resultType: 'number',
      dependencies: ['data.hitPoints.formula']
    },
    {
      id: 'damage-average-computed',
      name: 'Average Damage',
      description: 'Calculates average damage from dice formula',
      formula: `
        const dice = @damage?.dice || '';
        const match = dice.match(/(\\d+)d(\\d+)([+-]\\d+)?/);
        if (!match) return 0;
        const [, numDice, dieSize, modifier] = match;
        const avgPerDie = (parseInt(dieSize) + 1) / 2;
        const diceAvg = parseInt(numDice) * avgPerDie;
        const mod = parseInt(modifier || 0);
        return Math.floor(diceAvg + mod);
      `,
      resultType: 'number',
      dependencies: ['damage.dice']
    }
  ],

  createdAt: new Date(),
  updatedAt: new Date()
};

export default dnd5eNPCForm;
