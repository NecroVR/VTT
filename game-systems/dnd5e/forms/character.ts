/**
 * D&D 5e Character Sheet Form Definition
 *
 * Comprehensive character sheet with tabbed interface following Foundry VTT style.
 * Includes all core character features, computed fields, and conditional rendering.
 */

import type { FormDefinition } from '../../../packages/shared/src/types/forms';

export const dnd5eCharacterForm: FormDefinition = {
  id: 'dnd5e-character-sheet',
  name: 'D&D 5e Character Sheet',
  description: 'Comprehensive D&D 5th Edition character sheet with tabbed interface',
  gameSystemId: 'dnd5e',
  entityType: 'actor',
  version: 1,
  isDefault: true,
  isLocked: false,
  visibility: 'public',
  ownerId: 'system',

  layout: [
    // ========================================================================
    // HEADER (Always Visible)
    // ========================================================================
    {
      type: 'section',
      id: 'header-section',
      collapsible: false,
      children: [
        {
          type: 'grid',
          id: 'header-grid',
          columns: '1fr 200px',
          gap: '1rem',
          children: [
            // Left side: Character info
            {
              type: 'grid',
              id: 'header-left',
              columns: 3,
              gap: '0.75rem',
              children: [
                {
                  type: 'field',
                  id: 'character-name',
                  fieldType: 'text',
                  binding: 'name',
                  label: { literal: 'Character Name' },
                  required: true,
                  options: {
                    placeholder: { literal: 'Enter character name' }
                  }
                },
                {
                  type: 'field',
                  id: 'race',
                  fieldType: 'text',
                  binding: 'data.race',
                  label: { literal: 'Race' },
                  options: {
                    placeholder: { literal: 'e.g., Human, Elf' }
                  }
                },
                {
                  type: 'field',
                  id: 'background',
                  fieldType: 'text',
                  binding: 'data.background',
                  label: { literal: 'Background' },
                  options: {
                    placeholder: { literal: 'e.g., Soldier, Acolyte' }
                  }
                },
                {
                  type: 'computed',
                  id: 'total-level',
                  fieldId: 'total-level-calc',
                  label: { literal: 'Level' },
                  format: '{value}'
                },
                {
                  type: 'field',
                  id: 'alignment',
                  fieldType: 'select',
                  binding: 'data.alignment',
                  label: { literal: 'Alignment' },
                  options: {
                    options: [
                      { value: 'lg', label: { literal: 'Lawful Good' } },
                      { value: 'ng', label: { literal: 'Neutral Good' } },
                      { value: 'cg', label: { literal: 'Chaotic Good' } },
                      { value: 'ln', label: { literal: 'Lawful Neutral' } },
                      { value: 'tn', label: { literal: 'True Neutral' } },
                      { value: 'cn', label: { literal: 'Chaotic Neutral' } },
                      { value: 'le', label: { literal: 'Lawful Evil' } },
                      { value: 'ne', label: { literal: 'Neutral Evil' } },
                      { value: 'ce', label: { literal: 'Chaotic Evil' } }
                    ]
                  }
                },
                {
                  type: 'field',
                  id: 'inspiration',
                  fieldType: 'checkbox',
                  binding: 'data.inspiration',
                  label: { literal: 'Inspiration' }
                }
              ]
            },
            // Right side: Character image
            {
              type: 'field',
              id: 'character-image',
              fieldType: 'image',
              binding: 'img',
              label: { literal: 'Character Portrait' },
              options: {
                accept: 'image/*',
                maxSize: 5242880 // 5MB
              }
            }
          ]
        }
      ]
    },

    // ========================================================================
    // MAIN TABS
    // ========================================================================
    {
      type: 'tabs',
      id: 'main-tabs',
      position: 'top',
      defaultTab: 'main-tab',
      tabs: [
        // ====================================================================
        // TAB 1: MAIN
        // ====================================================================
        {
          id: 'main-tab',
          label: { literal: 'Main' },
          icon: 'user',
          children: [
            {
              type: 'grid',
              id: 'main-layout',
              columns: '1fr 1fr',
              gap: '1rem',
              children: [
                // Left Column
                {
                  type: 'container',
                  id: 'main-left',
                  children: [
                    // Ability Scores Section
                    {
                      type: 'section',
                      id: 'abilities-section',
                      title: { literal: 'Ability Scores' },
                      collapsible: false,
                      children: [
                        {
                          type: 'grid',
                          id: 'abilities-grid',
                          columns: 3,
                          gap: '0.5rem',
                          children: [
                            // STR
                            {
                              type: 'group',
                              id: 'str-group',
                              title: { literal: 'STR' },
                              border: true,
                              children: [
                                {
                                  type: 'field',
                                  id: 'str-value',
                                  fieldType: 'number',
                                  binding: 'data.abilities.str.value',
                                  label: { literal: 'Score' },
                                  options: { min: 1, max: 30 }
                                },
                                {
                                  type: 'computed',
                                  id: 'str-mod',
                                  fieldId: 'str-mod-calc',
                                  label: { literal: 'Modifier' },
                                  format: '{value >= 0 ? "+" : ""}{value}'
                                },
                                {
                                  type: 'flex',
                                  id: 'str-save-row',
                                  direction: 'row',
                                  gap: '0.25rem',
                                  align: 'center',
                                  children: [
                                    {
                                      type: 'field',
                                      id: 'str-save-prof',
                                      fieldType: 'checkbox',
                                      binding: 'data.abilities.str.proficient',
                                      label: { literal: '' }
                                    },
                                    {
                                      type: 'computed',
                                      id: 'str-save',
                                      fieldId: 'str-save-calc',
                                      label: { literal: 'Save' },
                                      format: '{value >= 0 ? "+" : ""}{value}'
                                    }
                                  ]
                                }
                              ]
                            },
                            // DEX
                            {
                              type: 'group',
                              id: 'dex-group',
                              title: { literal: 'DEX' },
                              border: true,
                              children: [
                                {
                                  type: 'field',
                                  id: 'dex-value',
                                  fieldType: 'number',
                                  binding: 'data.abilities.dex.value',
                                  label: { literal: 'Score' },
                                  options: { min: 1, max: 30 }
                                },
                                {
                                  type: 'computed',
                                  id: 'dex-mod',
                                  fieldId: 'dex-mod-calc',
                                  label: { literal: 'Modifier' },
                                  format: '{value >= 0 ? "+" : ""}{value}'
                                },
                                {
                                  type: 'flex',
                                  id: 'dex-save-row',
                                  direction: 'row',
                                  gap: '0.25rem',
                                  align: 'center',
                                  children: [
                                    {
                                      type: 'field',
                                      id: 'dex-save-prof',
                                      fieldType: 'checkbox',
                                      binding: 'data.abilities.dex.proficient',
                                      label: { literal: '' }
                                    },
                                    {
                                      type: 'computed',
                                      id: 'dex-save',
                                      fieldId: 'dex-save-calc',
                                      label: { literal: 'Save' },
                                      format: '{value >= 0 ? "+" : ""}{value}'
                                    }
                                  ]
                                }
                              ]
                            },
                            // CON
                            {
                              type: 'group',
                              id: 'con-group',
                              title: { literal: 'CON' },
                              border: true,
                              children: [
                                {
                                  type: 'field',
                                  id: 'con-value',
                                  fieldType: 'number',
                                  binding: 'data.abilities.con.value',
                                  label: { literal: 'Score' },
                                  options: { min: 1, max: 30 }
                                },
                                {
                                  type: 'computed',
                                  id: 'con-mod',
                                  fieldId: 'con-mod-calc',
                                  label: { literal: 'Modifier' },
                                  format: '{value >= 0 ? "+" : ""}{value}'
                                },
                                {
                                  type: 'flex',
                                  id: 'con-save-row',
                                  direction: 'row',
                                  gap: '0.25rem',
                                  align: 'center',
                                  children: [
                                    {
                                      type: 'field',
                                      id: 'con-save-prof',
                                      fieldType: 'checkbox',
                                      binding: 'data.abilities.con.proficient',
                                      label: { literal: '' }
                                    },
                                    {
                                      type: 'computed',
                                      id: 'con-save',
                                      fieldId: 'con-save-calc',
                                      label: { literal: 'Save' },
                                      format: '{value >= 0 ? "+" : ""}{value}'
                                    }
                                  ]
                                }
                              ]
                            },
                            // INT
                            {
                              type: 'group',
                              id: 'int-group',
                              title: { literal: 'INT' },
                              border: true,
                              children: [
                                {
                                  type: 'field',
                                  id: 'int-value',
                                  fieldType: 'number',
                                  binding: 'data.abilities.int.value',
                                  label: { literal: 'Score' },
                                  options: { min: 1, max: 30 }
                                },
                                {
                                  type: 'computed',
                                  id: 'int-mod',
                                  fieldId: 'int-mod-calc',
                                  label: { literal: 'Modifier' },
                                  format: '{value >= 0 ? "+" : ""}{value}'
                                },
                                {
                                  type: 'flex',
                                  id: 'int-save-row',
                                  direction: 'row',
                                  gap: '0.25rem',
                                  align: 'center',
                                  children: [
                                    {
                                      type: 'field',
                                      id: 'int-save-prof',
                                      fieldType: 'checkbox',
                                      binding: 'data.abilities.int.proficient',
                                      label: { literal: '' }
                                    },
                                    {
                                      type: 'computed',
                                      id: 'int-save',
                                      fieldId: 'int-save-calc',
                                      label: { literal: 'Save' },
                                      format: '{value >= 0 ? "+" : ""}{value}'
                                    }
                                  ]
                                }
                              ]
                            },
                            // WIS
                            {
                              type: 'group',
                              id: 'wis-group',
                              title: { literal: 'WIS' },
                              border: true,
                              children: [
                                {
                                  type: 'field',
                                  id: 'wis-value',
                                  fieldType: 'number',
                                  binding: 'data.abilities.wis.value',
                                  label: { literal: 'Score' },
                                  options: { min: 1, max: 30 }
                                },
                                {
                                  type: 'computed',
                                  id: 'wis-mod',
                                  fieldId: 'wis-mod-calc',
                                  label: { literal: 'Modifier' },
                                  format: '{value >= 0 ? "+" : ""}{value}'
                                },
                                {
                                  type: 'flex',
                                  id: 'wis-save-row',
                                  direction: 'row',
                                  gap: '0.25rem',
                                  align: 'center',
                                  children: [
                                    {
                                      type: 'field',
                                      id: 'wis-save-prof',
                                      fieldType: 'checkbox',
                                      binding: 'data.abilities.wis.proficient',
                                      label: { literal: '' }
                                    },
                                    {
                                      type: 'computed',
                                      id: 'wis-save',
                                      fieldId: 'wis-save-calc',
                                      label: { literal: 'Save' },
                                      format: '{value >= 0 ? "+" : ""}{value}'
                                    }
                                  ]
                                }
                              ]
                            },
                            // CHA
                            {
                              type: 'group',
                              id: 'cha-group',
                              title: { literal: 'CHA' },
                              border: true,
                              children: [
                                {
                                  type: 'field',
                                  id: 'cha-value',
                                  fieldType: 'number',
                                  binding: 'data.abilities.cha.value',
                                  label: { literal: 'Score' },
                                  options: { min: 1, max: 30 }
                                },
                                {
                                  type: 'computed',
                                  id: 'cha-mod',
                                  fieldId: 'cha-mod-calc',
                                  label: { literal: 'Modifier' },
                                  format: '{value >= 0 ? "+" : ""}{value}'
                                },
                                {
                                  type: 'flex',
                                  id: 'cha-save-row',
                                  direction: 'row',
                                  gap: '0.25rem',
                                  align: 'center',
                                  children: [
                                    {
                                      type: 'field',
                                      id: 'cha-save-prof',
                                      fieldType: 'checkbox',
                                      binding: 'data.abilities.cha.proficient',
                                      label: { literal: '' }
                                    },
                                    {
                                      type: 'computed',
                                      id: 'cha-save',
                                      fieldId: 'cha-save-calc',
                                      label: { literal: 'Save' },
                                      format: '{value >= 0 ? "+" : ""}{value}'
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },

                    // Combat Section
                    {
                      type: 'section',
                      id: 'combat-section',
                      title: { literal: 'Combat' },
                      collapsible: false,
                      children: [
                        {
                          type: 'grid',
                          id: 'combat-grid',
                          columns: 3,
                          gap: '0.75rem',
                          children: [
                            {
                              type: 'field',
                              id: 'armor-class',
                              fieldType: 'number',
                              binding: 'data.armorClass.base',
                              label: { literal: 'Armor Class' },
                              options: { min: 0, max: 99 }
                            },
                            {
                              type: 'computed',
                              id: 'initiative',
                              fieldId: 'initiative-calc',
                              label: { literal: 'Initiative' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'proficiency-bonus',
                              fieldId: 'proficiency-bonus-calc',
                              label: { literal: 'Proficiency Bonus' },
                              format: '+{value}'
                            },
                            {
                              type: 'field',
                              id: 'speed-walk',
                              fieldType: 'number',
                              binding: 'data.speed.walk',
                              label: { literal: 'Speed (ft)' },
                              options: { min: 0, step: 5 }
                            },
                            {
                              type: 'field',
                              id: 'speed-fly',
                              fieldType: 'number',
                              binding: 'data.speed.fly',
                              label: { literal: 'Fly Speed' },
                              options: { min: 0, step: 5 }
                            },
                            {
                              type: 'field',
                              id: 'speed-swim',
                              fieldType: 'number',
                              binding: 'data.speed.swim',
                              label: { literal: 'Swim Speed' },
                              options: { min: 0, step: 5 }
                            }
                          ]
                        }
                      ]
                    },

                    // Hit Points Section
                    {
                      type: 'section',
                      id: 'hp-section',
                      title: { literal: 'Hit Points' },
                      collapsible: false,
                      children: [
                        {
                          type: 'field',
                          id: 'hp-resource',
                          fieldType: 'resource',
                          binding: 'data.hitPoints',
                          label: { literal: 'Current / Max HP' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#dc3545'
                          }
                        },
                        {
                          type: 'field',
                          id: 'temp-hp',
                          fieldType: 'number',
                          binding: 'data.hitPoints.temp',
                          label: { literal: 'Temporary HP' },
                          options: { min: 0 }
                        }
                      ]
                    },

                    // Hit Dice & Death Saves
                    {
                      type: 'grid',
                      id: 'dice-death-grid',
                      columns: 2,
                      gap: '1rem',
                      children: [
                        {
                          type: 'section',
                          id: 'hit-dice-section',
                          title: { literal: 'Hit Dice' },
                          collapsible: false,
                          children: [
                            {
                              type: 'grid',
                              id: 'hit-dice-grid',
                              columns: 2,
                              gap: '0.5rem',
                              children: [
                                {
                                  type: 'field',
                                  id: 'hit-dice-total',
                                  fieldType: 'number',
                                  binding: 'data.hitDice.0.total',
                                  label: { literal: 'Total' },
                                  options: { min: 0 }
                                },
                                {
                                  type: 'field',
                                  id: 'hit-dice-used',
                                  fieldType: 'number',
                                  binding: 'data.hitDice.0.used',
                                  label: { literal: 'Used' },
                                  options: { min: 0 }
                                }
                              ]
                            }
                          ]
                        },
                        {
                          type: 'section',
                          id: 'death-saves-section',
                          title: { literal: 'Death Saves' },
                          collapsible: false,
                          children: [
                            {
                              type: 'flex',
                              id: 'death-saves-successes',
                              direction: 'row',
                              gap: '0.5rem',
                              align: 'center',
                              children: [
                                {
                                  type: 'static',
                                  id: 'successes-label',
                                  content: { literal: 'Successes:' },
                                  contentType: 'text'
                                },
                                {
                                  type: 'field',
                                  id: 'death-success-1',
                                  fieldType: 'checkbox',
                                  binding: 'data.deathSaves.successes.0',
                                  label: { literal: '' }
                                },
                                {
                                  type: 'field',
                                  id: 'death-success-2',
                                  fieldType: 'checkbox',
                                  binding: 'data.deathSaves.successes.1',
                                  label: { literal: '' }
                                },
                                {
                                  type: 'field',
                                  id: 'death-success-3',
                                  fieldType: 'checkbox',
                                  binding: 'data.deathSaves.successes.2',
                                  label: { literal: '' }
                                }
                              ]
                            },
                            {
                              type: 'flex',
                              id: 'death-saves-failures',
                              direction: 'row',
                              gap: '0.5rem',
                              align: 'center',
                              children: [
                                {
                                  type: 'static',
                                  id: 'failures-label',
                                  content: { literal: 'Failures:' },
                                  contentType: 'text'
                                },
                                {
                                  type: 'field',
                                  id: 'death-failure-1',
                                  fieldType: 'checkbox',
                                  binding: 'data.deathSaves.failures.0',
                                  label: { literal: '' }
                                },
                                {
                                  type: 'field',
                                  id: 'death-failure-2',
                                  fieldType: 'checkbox',
                                  binding: 'data.deathSaves.failures.1',
                                  label: { literal: '' }
                                },
                                {
                                  type: 'field',
                                  id: 'death-failure-3',
                                  fieldType: 'checkbox',
                                  binding: 'data.deathSaves.failures.2',
                                  label: { literal: '' }
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },

                    // Exhaustion
                    {
                      type: 'section',
                      id: 'exhaustion-section',
                      title: { literal: 'Exhaustion' },
                      collapsible: true,
                      defaultCollapsed: true,
                      children: [
                        {
                          type: 'field',
                          id: 'exhaustion',
                          fieldType: 'slider',
                          binding: 'data.exhaustion',
                          label: { literal: 'Exhaustion Level' },
                          options: {
                            min: 0,
                            max: 6,
                            step: 1,
                            showValue: true,
                            showTicks: true
                          }
                        }
                      ]
                    }
                  ]
                },

                // Right Column - Space for additional content
                {
                  type: 'container',
                  id: 'main-right',
                  children: []
                }
              ]
            }
          ]
        },

        // ====================================================================
        // TAB 2: SKILLS
        // ====================================================================
        {
          id: 'skills-tab',
          label: { literal: 'Skills' },
          icon: 'list',
          children: [
            {
              type: 'section',
              id: 'skills-section',
              title: { literal: 'Skills' },
              collapsible: false,
              children: [
                // Skills grouped by ability
                {
                  type: 'container',
                  id: 'skills-container',
                  children: [
                    // STR Skills
                    {
                      type: 'group',
                      id: 'str-skills-group',
                      title: { literal: 'Strength' },
                      border: false,
                      children: [
                        {
                          type: 'flex',
                          id: 'athletics-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'athletics-prof',
                              fieldType: 'select',
                              binding: 'data.skills.athletics.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'athletics-bonus',
                              fieldId: 'athletics-calc',
                              label: { literal: 'Athletics' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'athletics-passive',
                              fieldId: 'athletics-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        }
                      ]
                    },

                    // DEX Skills
                    {
                      type: 'group',
                      id: 'dex-skills-group',
                      title: { literal: 'Dexterity' },
                      border: false,
                      children: [
                        {
                          type: 'flex',
                          id: 'acrobatics-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'acrobatics-prof',
                              fieldType: 'select',
                              binding: 'data.skills.acrobatics.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'acrobatics-bonus',
                              fieldId: 'acrobatics-calc',
                              label: { literal: 'Acrobatics' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'acrobatics-passive',
                              fieldId: 'acrobatics-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'sleight-of-hand-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'sleight-of-hand-prof',
                              fieldType: 'select',
                              binding: 'data.skills.sleightOfHand.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'sleight-of-hand-bonus',
                              fieldId: 'sleight-of-hand-calc',
                              label: { literal: 'Sleight of Hand' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'sleight-of-hand-passive',
                              fieldId: 'sleight-of-hand-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'stealth-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'stealth-prof',
                              fieldType: 'select',
                              binding: 'data.skills.stealth.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'stealth-bonus',
                              fieldId: 'stealth-calc',
                              label: { literal: 'Stealth' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'stealth-passive',
                              fieldId: 'stealth-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        }
                      ]
                    },

                    // INT Skills
                    {
                      type: 'group',
                      id: 'int-skills-group',
                      title: { literal: 'Intelligence' },
                      border: false,
                      children: [
                        {
                          type: 'flex',
                          id: 'arcana-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'arcana-prof',
                              fieldType: 'select',
                              binding: 'data.skills.arcana.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'arcana-bonus',
                              fieldId: 'arcana-calc',
                              label: { literal: 'Arcana' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'arcana-passive',
                              fieldId: 'arcana-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'history-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'history-prof',
                              fieldType: 'select',
                              binding: 'data.skills.history.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'history-bonus',
                              fieldId: 'history-calc',
                              label: { literal: 'History' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'history-passive',
                              fieldId: 'history-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'investigation-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'investigation-prof',
                              fieldType: 'select',
                              binding: 'data.skills.investigation.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'investigation-bonus',
                              fieldId: 'investigation-calc',
                              label: { literal: 'Investigation' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'investigation-passive',
                              fieldId: 'investigation-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'nature-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'nature-prof',
                              fieldType: 'select',
                              binding: 'data.skills.nature.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'nature-bonus',
                              fieldId: 'nature-calc',
                              label: { literal: 'Nature' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'nature-passive',
                              fieldId: 'nature-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'religion-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'religion-prof',
                              fieldType: 'select',
                              binding: 'data.skills.religion.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'religion-bonus',
                              fieldId: 'religion-calc',
                              label: { literal: 'Religion' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'religion-passive',
                              fieldId: 'religion-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        }
                      ]
                    },

                    // WIS Skills
                    {
                      type: 'group',
                      id: 'wis-skills-group',
                      title: { literal: 'Wisdom' },
                      border: false,
                      children: [
                        {
                          type: 'flex',
                          id: 'animal-handling-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'animal-handling-prof',
                              fieldType: 'select',
                              binding: 'data.skills.animalHandling.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'animal-handling-bonus',
                              fieldId: 'animal-handling-calc',
                              label: { literal: 'Animal Handling' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'animal-handling-passive',
                              fieldId: 'animal-handling-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'insight-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'insight-prof',
                              fieldType: 'select',
                              binding: 'data.skills.insight.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'insight-bonus',
                              fieldId: 'insight-calc',
                              label: { literal: 'Insight' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'insight-passive',
                              fieldId: 'insight-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'medicine-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'medicine-prof',
                              fieldType: 'select',
                              binding: 'data.skills.medicine.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'medicine-bonus',
                              fieldId: 'medicine-calc',
                              label: { literal: 'Medicine' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'medicine-passive',
                              fieldId: 'medicine-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'perception-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'perception-prof',
                              fieldType: 'select',
                              binding: 'data.skills.perception.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'perception-bonus',
                              fieldId: 'perception-calc',
                              label: { literal: 'Perception' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'perception-passive',
                              fieldId: 'perception-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'survival-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'survival-prof',
                              fieldType: 'select',
                              binding: 'data.skills.survival.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'survival-bonus',
                              fieldId: 'survival-calc',
                              label: { literal: 'Survival' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'survival-passive',
                              fieldId: 'survival-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        }
                      ]
                    },

                    // CHA Skills
                    {
                      type: 'group',
                      id: 'cha-skills-group',
                      title: { literal: 'Charisma' },
                      border: false,
                      children: [
                        {
                          type: 'flex',
                          id: 'deception-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'deception-prof',
                              fieldType: 'select',
                              binding: 'data.skills.deception.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'deception-bonus',
                              fieldId: 'deception-calc',
                              label: { literal: 'Deception' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'deception-passive',
                              fieldId: 'deception-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'intimidation-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'intimidation-prof',
                              fieldType: 'select',
                              binding: 'data.skills.intimidation.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'intimidation-bonus',
                              fieldId: 'intimidation-calc',
                              label: { literal: 'Intimidation' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'intimidation-passive',
                              fieldId: 'intimidation-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'performance-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'performance-prof',
                              fieldType: 'select',
                              binding: 'data.skills.performance.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'performance-bonus',
                              fieldId: 'performance-calc',
                              label: { literal: 'Performance' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'performance-passive',
                              fieldId: 'performance-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        },
                        {
                          type: 'flex',
                          id: 'persuasion-row',
                          direction: 'row',
                          gap: '0.5rem',
                          align: 'center',
                          children: [
                            {
                              type: 'field',
                              id: 'persuasion-prof',
                              fieldType: 'select',
                              binding: 'data.skills.persuasion.proficiency',
                              label: { literal: '' },
                              options: {
                                options: [
                                  { value: '0', label: { literal: '○' } },
                                  { value: '0.5', label: { literal: '◐' } },
                                  { value: '1', label: { literal: '●' } },
                                  { value: '2', label: { literal: '◆' } }
                                ]
                              }
                            },
                            {
                              type: 'computed',
                              id: 'persuasion-bonus',
                              fieldId: 'persuasion-calc',
                              label: { literal: 'Persuasion' },
                              format: '{value >= 0 ? "+" : ""}{value}'
                            },
                            {
                              type: 'computed',
                              id: 'persuasion-passive',
                              fieldId: 'persuasion-passive-calc',
                              label: { literal: 'Passive' },
                              format: '{value}'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },

        // ====================================================================
        // TAB 3: FEATURES & TRAITS
        // ====================================================================
        {
          id: 'features-tab',
          label: { literal: 'Features & Traits' },
          icon: 'star',
          children: [
            {
              type: 'section',
              id: 'class-features-section',
              title: { literal: 'Class Features' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'repeater',
                  id: 'class-features-repeater',
                  binding: 'data.features.class',
                  addLabel: { literal: 'Add Class Feature' },
                  emptyMessage: { literal: 'No class features added' },
                  allowReorder: true,
                  allowDelete: true,
                  itemTemplate: [
                    {
                      type: 'grid',
                      id: 'feature-grid',
                      columns: '2fr 1fr',
                      gap: '0.5rem',
                      children: [
                        {
                          type: 'field',
                          id: 'feature-name',
                          fieldType: 'text',
                          binding: 'name',
                          label: { literal: 'Feature Name' },
                          options: {
                            placeholder: { literal: 'e.g., Second Wind, Action Surge' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'feature-source',
                          fieldType: 'text',
                          binding: 'source',
                          label: { literal: 'Source' },
                          options: {
                            placeholder: { literal: 'e.g., Fighter 1' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'feature-description',
                          fieldType: 'textarea',
                          binding: 'description',
                          label: { literal: 'Description' },
                          options: {
                            multiline: true,
                            placeholder: { literal: 'Feature description...' }
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            {
              type: 'section',
              id: 'racial-traits-section',
              title: { literal: 'Racial Traits' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'repeater',
                  id: 'racial-traits-repeater',
                  binding: 'data.features.racial',
                  addLabel: { literal: 'Add Racial Trait' },
                  emptyMessage: { literal: 'No racial traits added' },
                  allowReorder: true,
                  allowDelete: true,
                  itemTemplate: [
                    {
                      type: 'grid',
                      id: 'trait-grid',
                      columns: 1,
                      gap: '0.5rem',
                      children: [
                        {
                          type: 'field',
                          id: 'trait-name',
                          fieldType: 'text',
                          binding: 'name',
                          label: { literal: 'Trait Name' },
                          options: {
                            placeholder: { literal: 'e.g., Darkvision, Fey Ancestry' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'trait-description',
                          fieldType: 'textarea',
                          binding: 'description',
                          label: { literal: 'Description' },
                          options: {
                            multiline: true,
                            placeholder: { literal: 'Trait description...' }
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            {
              type: 'section',
              id: 'feats-section',
              title: { literal: 'Feats' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'repeater',
                  id: 'feats-repeater',
                  binding: 'data.features.feats',
                  addLabel: { literal: 'Add Feat' },
                  emptyMessage: { literal: 'No feats selected' },
                  allowReorder: true,
                  allowDelete: true,
                  itemTemplate: [
                    {
                      type: 'grid',
                      id: 'feat-grid',
                      columns: 1,
                      gap: '0.5rem',
                      children: [
                        {
                          type: 'field',
                          id: 'feat-name',
                          fieldType: 'text',
                          binding: 'name',
                          label: { literal: 'Feat Name' },
                          options: {
                            placeholder: { literal: 'e.g., Great Weapon Master' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'feat-description',
                          fieldType: 'textarea',
                          binding: 'description',
                          label: { literal: 'Description' },
                          options: {
                            multiline: true,
                            placeholder: { literal: 'Feat description...' }
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            {
              type: 'section',
              id: 'proficiencies-section',
              title: { literal: 'Proficiencies' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'grid',
                  id: 'proficiencies-grid',
                  columns: 1,
                  gap: '0.75rem',
                  children: [
                    {
                      type: 'field',
                      id: 'languages',
                      fieldType: 'tags',
                      binding: 'data.languages',
                      label: { literal: 'Languages' },
                      options: {
                        allowCustom: true,
                        suggestions: [
                          'Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish',
                          'Goblin', 'Halfling', 'Orc', 'Abyssal', 'Celestial',
                          'Draconic', 'Deep Speech', 'Infernal', 'Primordial',
                          'Sylvan', 'Undercommon'
                        ]
                      }
                    },
                    {
                      type: 'field',
                      id: 'weapon-proficiencies',
                      fieldType: 'tags',
                      binding: 'data.weaponProficiencies',
                      label: { literal: 'Weapon Proficiencies' },
                      options: {
                        allowCustom: true,
                        suggestions: [
                          'Simple Weapons', 'Martial Weapons',
                          'Longsword', 'Shortsword', 'Rapier', 'Crossbow'
                        ]
                      }
                    },
                    {
                      type: 'field',
                      id: 'armor-proficiencies',
                      fieldType: 'tags',
                      binding: 'data.armorProficiencies',
                      label: { literal: 'Armor Proficiencies' },
                      options: {
                        allowCustom: true,
                        suggestions: [
                          'Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'
                        ]
                      }
                    },
                    {
                      type: 'field',
                      id: 'tool-proficiencies',
                      fieldType: 'tags',
                      binding: 'data.toolProficiencies',
                      label: { literal: 'Tool Proficiencies' },
                      options: {
                        allowCustom: true,
                        suggestions: [
                          'Thieves\' Tools', 'Smith\'s Tools', 'Herbalism Kit',
                          'Alchemist\'s Supplies', 'Disguise Kit'
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },

        // ====================================================================
        // TAB 4: SPELLCASTING
        // ====================================================================
        {
          id: 'spellcasting-tab',
          label: { literal: 'Spellcasting' },
          icon: 'wand-sparkles',
          children: [
            {
              type: 'conditional',
              id: 'has-spellcasting-conditional',
              condition: {
                type: 'simple',
                field: 'data.spellcasting',
                operator: 'isNotEmpty'
              },
              then: [
                {
                  type: 'section',
                  id: 'spellcasting-info-section',
                  title: { literal: 'Spellcasting' },
                  collapsible: false,
                  children: [
                    {
                      type: 'grid',
                      id: 'spellcasting-info-grid',
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
                              { value: 'int', label: { literal: 'Intelligence' } },
                              { value: 'wis', label: { literal: 'Wisdom' } },
                              { value: 'cha', label: { literal: 'Charisma' } }
                            ]
                          }
                        },
                        {
                          type: 'computed',
                          id: 'spell-save-dc',
                          fieldId: 'spell-save-dc-calc',
                          label: { literal: 'Spell Save DC' },
                          format: '{value}'
                        },
                        {
                          type: 'computed',
                          id: 'spell-attack-bonus',
                          fieldId: 'spell-attack-bonus-calc',
                          label: { literal: 'Spell Attack Bonus' },
                          format: '+{value}'
                        }
                      ]
                    }
                  ]
                },

                {
                  type: 'section',
                  id: 'spell-slots-section',
                  title: { literal: 'Spell Slots' },
                  collapsible: false,
                  children: [
                    {
                      type: 'grid',
                      id: 'spell-slots-grid',
                      columns: 3,
                      gap: '0.5rem',
                      children: [
                        {
                          type: 'field',
                          id: 'slots-1',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.1',
                          label: { literal: '1st Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-2',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.2',
                          label: { literal: '2nd Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-3',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.3',
                          label: { literal: '3rd Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-4',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.4',
                          label: { literal: '4th Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-5',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.5',
                          label: { literal: '5th Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-6',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.6',
                          label: { literal: '6th Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-7',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.7',
                          label: { literal: '7th Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-8',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.8',
                          label: { literal: '8th Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        },
                        {
                          type: 'field',
                          id: 'slots-9',
                          fieldType: 'resource',
                          binding: 'data.spellcasting.slots.9',
                          label: { literal: '9th Level' },
                          options: {
                            showMax: true,
                            showBar: true,
                            barColor: '#6c63ff'
                          }
                        }
                      ]
                    }
                  ]
                },

                {
                  type: 'conditional',
                  id: 'has-pact-magic-conditional',
                  condition: {
                    type: 'simple',
                    field: 'data.spellcasting.slots.pact',
                    operator: 'isNotEmpty'
                  },
                  then: [
                    {
                      type: 'section',
                      id: 'pact-magic-section',
                      title: { literal: 'Pact Magic' },
                      collapsible: false,
                      children: [
                        {
                          type: 'grid',
                          id: 'pact-magic-grid',
                          columns: 2,
                          gap: '1rem',
                          children: [
                            {
                              type: 'field',
                              id: 'pact-slots',
                              fieldType: 'resource',
                              binding: 'data.spellcasting.slots.pact',
                              label: { literal: 'Pact Slots' },
                              options: {
                                showMax: true,
                                showBar: true,
                                barColor: '#9333ea'
                              }
                            },
                            {
                              type: 'field',
                              id: 'pact-level',
                              fieldType: 'number',
                              binding: 'data.spellcasting.slots.pact.level',
                              label: { literal: 'Pact Slot Level' },
                              options: { min: 1, max: 5 }
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              else: [
                {
                  type: 'static',
                  id: 'no-spellcasting-message',
                  content: { literal: 'This character does not have spellcasting. Add classes with spellcasting to enable this tab.' },
                  contentType: 'text',
                  tag: 'p'
                }
              ]
            }
          ]
        },

        // ====================================================================
        // TAB 5: BIOGRAPHY
        // ====================================================================
        {
          id: 'biography-tab',
          label: { literal: 'Biography' },
          icon: 'book',
          children: [
            {
              type: 'section',
              id: 'personality-section',
              title: { literal: 'Personality' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'grid',
                  id: 'personality-grid',
                  columns: 1,
                  gap: '0.75rem',
                  children: [
                    {
                      type: 'field',
                      id: 'personality-traits',
                      fieldType: 'textarea',
                      binding: 'data.personality.traits',
                      label: { literal: 'Personality Traits' },
                      options: {
                        multiline: true,
                        placeholder: { literal: 'Describe your character\'s personality traits...' }
                      }
                    },
                    {
                      type: 'field',
                      id: 'ideals',
                      fieldType: 'textarea',
                      binding: 'data.personality.ideals',
                      label: { literal: 'Ideals' },
                      options: {
                        multiline: true,
                        placeholder: { literal: 'What does your character believe in?' }
                      }
                    },
                    {
                      type: 'field',
                      id: 'bonds',
                      fieldType: 'textarea',
                      binding: 'data.personality.bonds',
                      label: { literal: 'Bonds' },
                      options: {
                        multiline: true,
                        placeholder: { literal: 'What ties does your character have?' }
                      }
                    },
                    {
                      type: 'field',
                      id: 'flaws',
                      fieldType: 'textarea',
                      binding: 'data.personality.flaws',
                      label: { literal: 'Flaws' },
                      options: {
                        multiline: true,
                        placeholder: { literal: 'What are your character\'s weaknesses?' }
                      }
                    }
                  ]
                }
              ]
            },

            {
              type: 'section',
              id: 'appearance-section',
              title: { literal: 'Appearance' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'field',
                  id: 'appearance-description',
                  fieldType: 'richtext',
                  binding: 'data.appearance',
                  label: { literal: 'Physical Appearance' },
                  options: {
                    showPreview: true,
                    placeholder: { literal: 'Describe your character\'s physical appearance...' }
                  }
                }
              ]
            },

            {
              type: 'section',
              id: 'backstory-section',
              title: { literal: 'Backstory' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'field',
                  id: 'backstory',
                  fieldType: 'richtext',
                  binding: 'data.backstory',
                  label: { literal: 'Character Backstory' },
                  options: {
                    showPreview: true,
                    placeholder: { literal: 'Tell your character\'s story...' }
                  }
                }
              ]
            },

            {
              type: 'section',
              id: 'notes-section',
              title: { literal: 'Notes' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'field',
                  id: 'notes',
                  fieldType: 'richtext',
                  binding: 'data.notes',
                  label: { literal: 'Character Notes' },
                  options: {
                    showPreview: true,
                    placeholder: { literal: 'Session notes, quests, etc...' }
                  }
                }
              ]
            }
          ]
        },

        // ====================================================================
        // TAB 6: INVENTORY
        // ====================================================================
        {
          id: 'inventory-tab',
          label: { literal: 'Inventory' },
          icon: 'bag',
          children: [
            {
              type: 'section',
              id: 'currency-section',
              title: { literal: 'Currency' },
              collapsible: false,
              children: [
                {
                  type: 'grid',
                  id: 'currency-grid',
                  columns: 5,
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'copper',
                      fieldType: 'number',
                      binding: 'data.currency.cp',
                      label: { literal: 'Copper (cp)' },
                      options: { min: 0 }
                    },
                    {
                      type: 'field',
                      id: 'silver',
                      fieldType: 'number',
                      binding: 'data.currency.sp',
                      label: { literal: 'Silver (sp)' },
                      options: { min: 0 }
                    },
                    {
                      type: 'field',
                      id: 'electrum',
                      fieldType: 'number',
                      binding: 'data.currency.ep',
                      label: { literal: 'Electrum (ep)' },
                      options: { min: 0 }
                    },
                    {
                      type: 'field',
                      id: 'gold',
                      fieldType: 'number',
                      binding: 'data.currency.gp',
                      label: { literal: 'Gold (gp)' },
                      options: { min: 0 }
                    },
                    {
                      type: 'field',
                      id: 'platinum',
                      fieldType: 'number',
                      binding: 'data.currency.pp',
                      label: { literal: 'Platinum (pp)' },
                      options: { min: 0 }
                    }
                  ]
                }
              ]
            },

            {
              type: 'section',
              id: 'carrying-capacity-section',
              title: { literal: 'Carrying Capacity' },
              collapsible: true,
              defaultCollapsed: false,
              children: [
                {
                  type: 'grid',
                  id: 'carry-grid',
                  columns: 2,
                  gap: '1rem',
                  children: [
                    {
                      type: 'computed',
                      id: 'carrying-capacity',
                      fieldId: 'carrying-capacity-calc',
                      label: { literal: 'Max Capacity (lb)' },
                      format: '{value}'
                    },
                    {
                      type: 'computed',
                      id: 'current-weight',
                      fieldId: 'current-weight-calc',
                      label: { literal: 'Current Weight (lb)' },
                      format: '{value}'
                    }
                  ]
                }
              ]
            },

            {
              type: 'static',
              id: 'equipment-note',
              content: { literal: 'Equipment items are managed through the item system and will appear here automatically when equipped.' },
              contentType: 'text',
              tag: 'p',
              className: 'info-message'
            }
          ]
        },

        // ====================================================================
        // TAB 7: CLASSES
        // ====================================================================
        {
          id: 'classes-tab',
          label: { literal: 'Classes' },
          icon: 'scroll',
          children: [
            {
              type: 'section',
              id: 'classes-section',
              title: { literal: 'Character Classes' },
              collapsible: false,
              children: [
                {
                  type: 'repeater',
                  id: 'classes-repeater',
                  binding: 'data.classes',
                  addLabel: { literal: 'Add Class' },
                  emptyMessage: { literal: 'No classes added' },
                  allowReorder: true,
                  allowDelete: true,
                  itemTemplate: [
                    {
                      type: 'grid',
                      id: 'class-grid',
                      columns: '2fr 1fr 1fr 1fr',
                      gap: '0.5rem',
                      children: [
                        {
                          type: 'field',
                          id: 'class-name',
                          fieldType: 'text',
                          binding: 'className',
                          label: { literal: 'Class Name' },
                          options: {
                            placeholder: { literal: 'e.g., Fighter, Wizard' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'class-subclass',
                          fieldType: 'text',
                          binding: 'subclass',
                          label: { literal: 'Subclass' },
                          options: {
                            placeholder: { literal: 'e.g., Champion' }
                          }
                        },
                        {
                          type: 'field',
                          id: 'class-level',
                          fieldType: 'number',
                          binding: 'level',
                          label: { literal: 'Level' },
                          options: { min: 1, max: 20 }
                        },
                        {
                          type: 'field',
                          id: 'class-hitdie',
                          fieldType: 'select',
                          binding: 'hitDie',
                          label: { literal: 'Hit Die' },
                          options: {
                            options: [
                              { value: 'd4', label: { literal: 'd4' } },
                              { value: 'd6', label: { literal: 'd6' } },
                              { value: 'd8', label: { literal: 'd8' } },
                              { value: 'd10', label: { literal: 'd10' } },
                              { value: 'd12', label: { literal: 'd12' } }
                            ]
                          }
                        },
                        {
                          type: 'field',
                          id: 'class-spellcasting',
                          fieldType: 'select',
                          binding: 'spellcastingAbility',
                          label: { literal: 'Spellcasting Ability' },
                          options: {
                            options: [
                              { value: '', label: { literal: 'None' } },
                              { value: 'int', label: { literal: 'Intelligence' } },
                              { value: 'wis', label: { literal: 'Wisdom' } },
                              { value: 'cha', label: { literal: 'Charisma' } }
                            ]
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  // ==========================================================================
  // FRAGMENTS (Reusable components)
  // ==========================================================================
  fragments: [],

  // ==========================================================================
  // STYLES
  // ==========================================================================
  styles: {
    theme: 'default',
    customCSS: `
      .info-message {
        padding: 1rem;
        background: rgba(59, 130, 246, 0.1);
        border-left: 3px solid #3b82f6;
        border-radius: 0.25rem;
        margin: 1rem 0;
      }
    `
  },

  // ==========================================================================
  // COMPUTED FIELDS
  // ==========================================================================
  computedFields: [
    {
      id: 'total-level-calc',
      name: 'Total Character Level',
      description: 'Sum of all class levels',
      formula: '@classes.reduce((sum, c) => sum + c.level, 0)',
      resultType: 'number',
      dependencies: ['data.classes']
    },
    {
      id: 'proficiency-bonus-calc',
      name: 'Proficiency Bonus',
      description: 'Proficiency bonus based on total level',
      formula: 'Math.floor((@level - 1) / 4) + 2',
      resultType: 'number',
      dependencies: ['data.level']
    },

    // Ability Modifiers
    {
      id: 'str-mod-calc',
      name: 'STR Modifier',
      description: 'Strength modifier',
      formula: 'Math.floor((@abilities.str.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.str.value']
    },
    {
      id: 'dex-mod-calc',
      name: 'DEX Modifier',
      description: 'Dexterity modifier',
      formula: 'Math.floor((@abilities.dex.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value']
    },
    {
      id: 'con-mod-calc',
      name: 'CON Modifier',
      description: 'Constitution modifier',
      formula: 'Math.floor((@abilities.con.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.con.value']
    },
    {
      id: 'int-mod-calc',
      name: 'INT Modifier',
      description: 'Intelligence modifier',
      formula: 'Math.floor((@abilities.int.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.int.value']
    },
    {
      id: 'wis-mod-calc',
      name: 'WIS Modifier',
      description: 'Wisdom modifier',
      formula: 'Math.floor((@abilities.wis.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value']
    },
    {
      id: 'cha-mod-calc',
      name: 'CHA Modifier',
      description: 'Charisma modifier',
      formula: 'Math.floor((@abilities.cha.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value']
    },

    // Saving Throws
    {
      id: 'str-save-calc',
      name: 'STR Save',
      description: 'Strength saving throw',
      formula: 'Math.floor((@abilities.str.value - 10) / 2) + (@abilities.str.proficient ? Math.floor((@level - 1) / 4) + 2 : 0)',
      resultType: 'number',
      dependencies: ['data.abilities.str.value', 'data.abilities.str.proficient', 'data.level']
    },
    {
      id: 'dex-save-calc',
      name: 'DEX Save',
      description: 'Dexterity saving throw',
      formula: 'Math.floor((@abilities.dex.value - 10) / 2) + (@abilities.dex.proficient ? Math.floor((@level - 1) / 4) + 2 : 0)',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value', 'data.abilities.dex.proficient', 'data.level']
    },
    {
      id: 'con-save-calc',
      name: 'CON Save',
      description: 'Constitution saving throw',
      formula: 'Math.floor((@abilities.con.value - 10) / 2) + (@abilities.con.proficient ? Math.floor((@level - 1) / 4) + 2 : 0)',
      resultType: 'number',
      dependencies: ['data.abilities.con.value', 'data.abilities.con.proficient', 'data.level']
    },
    {
      id: 'int-save-calc',
      name: 'INT Save',
      description: 'Intelligence saving throw',
      formula: 'Math.floor((@abilities.int.value - 10) / 2) + (@abilities.int.proficient ? Math.floor((@level - 1) / 4) + 2 : 0)',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.abilities.int.proficient', 'data.level']
    },
    {
      id: 'wis-save-calc',
      name: 'WIS Save',
      description: 'Wisdom saving throw',
      formula: 'Math.floor((@abilities.wis.value - 10) / 2) + (@abilities.wis.proficient ? Math.floor((@level - 1) / 4) + 2 : 0)',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.abilities.wis.proficient', 'data.level']
    },
    {
      id: 'cha-save-calc',
      name: 'CHA Save',
      description: 'Charisma saving throw',
      formula: 'Math.floor((@abilities.cha.value - 10) / 2) + (@abilities.cha.proficient ? Math.floor((@level - 1) / 4) + 2 : 0)',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.abilities.cha.proficient', 'data.level']
    },

    // Initiative
    {
      id: 'initiative-calc',
      name: 'Initiative',
      description: 'Initiative bonus (DEX modifier)',
      formula: 'Math.floor((@abilities.dex.value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value']
    },

    // Skills (with proficiency support: 0 = none, 0.5 = half, 1 = proficient, 2 = expertise)
    {
      id: 'athletics-calc',
      name: 'Athletics',
      description: 'Athletics skill bonus',
      formula: 'Math.floor((@abilities.str.value - 10) / 2) + ((@skills.athletics.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.str.value', 'data.skills.athletics.proficiency', 'data.level']
    },
    {
      id: 'athletics-passive-calc',
      name: 'Passive Athletics',
      description: 'Passive Athletics (10 + bonus)',
      formula: '10 + Math.floor((@abilities.str.value - 10) / 2) + ((@skills.athletics.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.str.value', 'data.skills.athletics.proficiency', 'data.level']
    },
    {
      id: 'acrobatics-calc',
      name: 'Acrobatics',
      description: 'Acrobatics skill bonus',
      formula: 'Math.floor((@abilities.dex.value - 10) / 2) + ((@skills.acrobatics.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value', 'data.skills.acrobatics.proficiency', 'data.level']
    },
    {
      id: 'acrobatics-passive-calc',
      name: 'Passive Acrobatics',
      description: 'Passive Acrobatics (10 + bonus)',
      formula: '10 + Math.floor((@abilities.dex.value - 10) / 2) + ((@skills.acrobatics.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value', 'data.skills.acrobatics.proficiency', 'data.level']
    },
    {
      id: 'sleight-of-hand-calc',
      name: 'Sleight of Hand',
      description: 'Sleight of Hand skill bonus',
      formula: 'Math.floor((@abilities.dex.value - 10) / 2) + ((@skills.sleightOfHand.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value', 'data.skills.sleightOfHand.proficiency', 'data.level']
    },
    {
      id: 'sleight-of-hand-passive-calc',
      name: 'Passive Sleight of Hand',
      description: 'Passive Sleight of Hand (10 + bonus)',
      formula: '10 + Math.floor((@abilities.dex.value - 10) / 2) + ((@skills.sleightOfHand.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value', 'data.skills.sleightOfHand.proficiency', 'data.level']
    },
    {
      id: 'stealth-calc',
      name: 'Stealth',
      description: 'Stealth skill bonus',
      formula: 'Math.floor((@abilities.dex.value - 10) / 2) + ((@skills.stealth.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value', 'data.skills.stealth.proficiency', 'data.level']
    },
    {
      id: 'stealth-passive-calc',
      name: 'Passive Stealth',
      description: 'Passive Stealth (10 + bonus)',
      formula: '10 + Math.floor((@abilities.dex.value - 10) / 2) + ((@skills.stealth.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.dex.value', 'data.skills.stealth.proficiency', 'data.level']
    },
    {
      id: 'arcana-calc',
      name: 'Arcana',
      description: 'Arcana skill bonus',
      formula: 'Math.floor((@abilities.int.value - 10) / 2) + ((@skills.arcana.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.arcana.proficiency', 'data.level']
    },
    {
      id: 'arcana-passive-calc',
      name: 'Passive Arcana',
      description: 'Passive Arcana (10 + bonus)',
      formula: '10 + Math.floor((@abilities.int.value - 10) / 2) + ((@skills.arcana.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.arcana.proficiency', 'data.level']
    },
    {
      id: 'history-calc',
      name: 'History',
      description: 'History skill bonus',
      formula: 'Math.floor((@abilities.int.value - 10) / 2) + ((@skills.history.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.history.proficiency', 'data.level']
    },
    {
      id: 'history-passive-calc',
      name: 'Passive History',
      description: 'Passive History (10 + bonus)',
      formula: '10 + Math.floor((@abilities.int.value - 10) / 2) + ((@skills.history.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.history.proficiency', 'data.level']
    },
    {
      id: 'investigation-calc',
      name: 'Investigation',
      description: 'Investigation skill bonus',
      formula: 'Math.floor((@abilities.int.value - 10) / 2) + ((@skills.investigation.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.investigation.proficiency', 'data.level']
    },
    {
      id: 'investigation-passive-calc',
      name: 'Passive Investigation',
      description: 'Passive Investigation (10 + bonus)',
      formula: '10 + Math.floor((@abilities.int.value - 10) / 2) + ((@skills.investigation.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.investigation.proficiency', 'data.level']
    },
    {
      id: 'nature-calc',
      name: 'Nature',
      description: 'Nature skill bonus',
      formula: 'Math.floor((@abilities.int.value - 10) / 2) + ((@skills.nature.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.nature.proficiency', 'data.level']
    },
    {
      id: 'nature-passive-calc',
      name: 'Passive Nature',
      description: 'Passive Nature (10 + bonus)',
      formula: '10 + Math.floor((@abilities.int.value - 10) / 2) + ((@skills.nature.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.nature.proficiency', 'data.level']
    },
    {
      id: 'religion-calc',
      name: 'Religion',
      description: 'Religion skill bonus',
      formula: 'Math.floor((@abilities.int.value - 10) / 2) + ((@skills.religion.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.religion.proficiency', 'data.level']
    },
    {
      id: 'religion-passive-calc',
      name: 'Passive Religion',
      description: 'Passive Religion (10 + bonus)',
      formula: '10 + Math.floor((@abilities.int.value - 10) / 2) + ((@skills.religion.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.int.value', 'data.skills.religion.proficiency', 'data.level']
    },
    {
      id: 'animal-handling-calc',
      name: 'Animal Handling',
      description: 'Animal Handling skill bonus',
      formula: 'Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.animalHandling.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.animalHandling.proficiency', 'data.level']
    },
    {
      id: 'animal-handling-passive-calc',
      name: 'Passive Animal Handling',
      description: 'Passive Animal Handling (10 + bonus)',
      formula: '10 + Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.animalHandling.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.animalHandling.proficiency', 'data.level']
    },
    {
      id: 'insight-calc',
      name: 'Insight',
      description: 'Insight skill bonus',
      formula: 'Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.insight.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.insight.proficiency', 'data.level']
    },
    {
      id: 'insight-passive-calc',
      name: 'Passive Insight',
      description: 'Passive Insight (10 + bonus)',
      formula: '10 + Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.insight.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.insight.proficiency', 'data.level']
    },
    {
      id: 'medicine-calc',
      name: 'Medicine',
      description: 'Medicine skill bonus',
      formula: 'Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.medicine.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.medicine.proficiency', 'data.level']
    },
    {
      id: 'medicine-passive-calc',
      name: 'Passive Medicine',
      description: 'Passive Medicine (10 + bonus)',
      formula: '10 + Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.medicine.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.medicine.proficiency', 'data.level']
    },
    {
      id: 'perception-calc',
      name: 'Perception',
      description: 'Perception skill bonus',
      formula: 'Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.perception.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.perception.proficiency', 'data.level']
    },
    {
      id: 'perception-passive-calc',
      name: 'Passive Perception',
      description: 'Passive Perception (10 + bonus)',
      formula: '10 + Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.perception.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.perception.proficiency', 'data.level']
    },
    {
      id: 'survival-calc',
      name: 'Survival',
      description: 'Survival skill bonus',
      formula: 'Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.survival.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.survival.proficiency', 'data.level']
    },
    {
      id: 'survival-passive-calc',
      name: 'Passive Survival',
      description: 'Passive Survival (10 + bonus)',
      formula: '10 + Math.floor((@abilities.wis.value - 10) / 2) + ((@skills.survival.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.wis.value', 'data.skills.survival.proficiency', 'data.level']
    },
    {
      id: 'deception-calc',
      name: 'Deception',
      description: 'Deception skill bonus',
      formula: 'Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.deception.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.deception.proficiency', 'data.level']
    },
    {
      id: 'deception-passive-calc',
      name: 'Passive Deception',
      description: 'Passive Deception (10 + bonus)',
      formula: '10 + Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.deception.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.deception.proficiency', 'data.level']
    },
    {
      id: 'intimidation-calc',
      name: 'Intimidation',
      description: 'Intimidation skill bonus',
      formula: 'Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.intimidation.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.intimidation.proficiency', 'data.level']
    },
    {
      id: 'intimidation-passive-calc',
      name: 'Passive Intimidation',
      description: 'Passive Intimidation (10 + bonus)',
      formula: '10 + Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.intimidation.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.intimidation.proficiency', 'data.level']
    },
    {
      id: 'performance-calc',
      name: 'Performance',
      description: 'Performance skill bonus',
      formula: 'Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.performance.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.performance.proficiency', 'data.level']
    },
    {
      id: 'performance-passive-calc',
      name: 'Passive Performance',
      description: 'Passive Performance (10 + bonus)',
      formula: '10 + Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.performance.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.performance.proficiency', 'data.level']
    },
    {
      id: 'persuasion-calc',
      name: 'Persuasion',
      description: 'Persuasion skill bonus',
      formula: 'Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.persuasion.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.persuasion.proficiency', 'data.level']
    },
    {
      id: 'persuasion-passive-calc',
      name: 'Passive Persuasion',
      description: 'Passive Persuasion (10 + bonus)',
      formula: '10 + Math.floor((@abilities.cha.value - 10) / 2) + ((@skills.persuasion.proficiency || 0) * (Math.floor((@level - 1) / 4) + 2))',
      resultType: 'number',
      dependencies: ['data.abilities.cha.value', 'data.skills.persuasion.proficiency', 'data.level']
    },

    // Spellcasting
    {
      id: 'spell-save-dc-calc',
      name: 'Spell Save DC',
      description: 'Spell save DC based on spellcasting ability',
      formula: '8 + (Math.floor((@level - 1) / 4) + 2) + Math.floor((@abilities[@spellcasting.ability].value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.level', 'data.spellcasting.ability', 'data.abilities']
    },
    {
      id: 'spell-attack-bonus-calc',
      name: 'Spell Attack Bonus',
      description: 'Spell attack bonus',
      formula: '(Math.floor((@level - 1) / 4) + 2) + Math.floor((@abilities[@spellcasting.ability].value - 10) / 2)',
      resultType: 'number',
      dependencies: ['data.level', 'data.spellcasting.ability', 'data.abilities']
    },

    // Carrying Capacity
    {
      id: 'carrying-capacity-calc',
      name: 'Carrying Capacity',
      description: 'Maximum carrying capacity (STR × 15)',
      formula: '@abilities.str.value * 15',
      resultType: 'number',
      dependencies: ['data.abilities.str.value']
    },
    {
      id: 'current-weight-calc',
      name: 'Current Weight',
      description: 'Current weight of carried items',
      formula: '@inventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0)',
      resultType: 'number',
      dependencies: ['data.inventory']
    }
  ],

  createdAt: new Date(),
  updatedAt: new Date()
};
