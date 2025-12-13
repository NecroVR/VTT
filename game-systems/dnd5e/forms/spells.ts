/**
 * D&D 5e Spell Form Template
 *
 * Comprehensive spell form definition that covers all aspects of D&D 5e spells
 * including casting mechanics, components, targets, damage, healing, and effects.
 *
 * This form uses conditional visibility to show/hide sections based on spell properties,
 * ensuring a clean and focused interface for different spell types.
 */

import { FormDefinition } from '../../../packages/shared/src/types/forms';
import { DND5E_CONFIG } from '../../../packages/shared/src/types/dnd5e';

export const dnd5eSpellForm: FormDefinition = {
  id: 'dnd5e-spell-comprehensive',
  name: 'D&D 5e Spell (Comprehensive)',
  description: 'Complete spell form with all D&D 5e spell mechanics, components, targeting, damage, healing, and effects',
  gameSystemId: 'dnd5e-ogl',
  entityType: 'spell',
  version: 1,
  isDefault: true,
  isLocked: false,
  visibility: 'public',
  ownerId: 'system',

  layout: [
    // ========================================================================
    // HEADER SECTION - Basic spell information
    // ========================================================================
    {
      type: 'section',
      id: 'spell-header',
      title: { literal: 'Spell Information' },
      collapsible: false,
      children: [
        // Spell name and image
        {
          type: 'grid',
          id: 'name-image-grid',
          columns: 2,
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'spell-name',
              fieldType: 'text',
              binding: 'name',
              label: { literal: 'Spell Name' },
              required: true,
              options: {
                placeholder: { literal: 'Enter spell name' }
              }
            },
            {
              type: 'field',
              id: 'spell-image',
              fieldType: 'image',
              binding: 'image',
              label: { literal: 'Spell Icon' },
              options: {
                accept: 'image/*',
                preview: true
              }
            }
          ]
        },

        // Level, school, ritual, concentration
        {
          type: 'grid',
          id: 'basic-properties-grid',
          columns: 4,
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'spell-level',
              fieldType: 'select',
              binding: 'data.level',
              label: { literal: 'Spell Level' },
              required: true,
              options: {
                options: [
                  { value: '0', label: { literal: 'Cantrip' } },
                  { value: '1', label: { literal: '1st Level' } },
                  { value: '2', label: { literal: '2nd Level' } },
                  { value: '3', label: { literal: '3rd Level' } },
                  { value: '4', label: { literal: '4th Level' } },
                  { value: '5', label: { literal: '5th Level' } },
                  { value: '6', label: { literal: '6th Level' } },
                  { value: '7', label: { literal: '7th Level' } },
                  { value: '8', label: { literal: '8th Level' } },
                  { value: '9', label: { literal: '9th Level' } }
                ]
              }
            },
            {
              type: 'field',
              id: 'spell-school',
              fieldType: 'select',
              binding: 'data.school',
              label: { literal: 'School of Magic' },
              required: true,
              options: {
                options: [
                  { value: 'abjuration', label: { literal: 'Abjuration' } },
                  { value: 'conjuration', label: { literal: 'Conjuration' } },
                  { value: 'divination', label: { literal: 'Divination' } },
                  { value: 'enchantment', label: { literal: 'Enchantment' } },
                  { value: 'evocation', label: { literal: 'Evocation' } },
                  { value: 'illusion', label: { literal: 'Illusion' } },
                  { value: 'necromancy', label: { literal: 'Necromancy' } },
                  { value: 'transmutation', label: { literal: 'Transmutation' } }
                ]
              }
            },
            {
              type: 'field',
              id: 'spell-ritual',
              fieldType: 'checkbox',
              binding: 'data.ritual',
              label: { literal: 'Ritual' },
              helpText: { literal: 'Can be cast as a ritual (+10 minutes)' }
            },
            {
              type: 'field',
              id: 'spell-concentration',
              fieldType: 'checkbox',
              binding: 'data.concentration',
              label: { literal: 'Concentration' },
              helpText: { literal: 'Requires concentration to maintain' }
            }
          ]
        }
      ]
    },

    // ========================================================================
    // CASTING SECTION - Timing, range, duration
    // ========================================================================
    {
      type: 'section',
      id: 'casting-section',
      title: { literal: 'Casting' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'grid',
          id: 'casting-grid',
          columns: 3,
          gap: '1rem',
          children: [
            // Casting time
            {
              type: 'group',
              id: 'casting-time-group',
              title: { literal: 'Casting Time' },
              border: true,
              children: [
                {
                  type: 'flex',
                  id: 'casting-time-flex',
                  direction: 'row',
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'casting-time-value',
                      fieldType: 'number',
                      binding: 'data.castingTime.value',
                      label: { literal: 'Value' },
                      required: true,
                      options: {
                        min: 1,
                        step: 1
                      }
                    },
                    {
                      type: 'field',
                      id: 'casting-time-type',
                      fieldType: 'select',
                      binding: 'data.castingTime.type',
                      label: { literal: 'Type' },
                      required: true,
                      options: {
                        options: [
                          { value: 'action', label: { literal: 'Action' } },
                          { value: 'bonus', label: { literal: 'Bonus Action' } },
                          { value: 'reaction', label: { literal: 'Reaction' } },
                          { value: 'minute', label: { literal: 'Minute(s)' } },
                          { value: 'hour', label: { literal: 'Hour(s)' } },
                          { value: 'special', label: { literal: 'Special' } }
                        ]
                      }
                    }
                  ]
                }
              ]
            },

            // Range
            {
              type: 'group',
              id: 'range-group',
              title: { literal: 'Range' },
              border: true,
              children: [
                {
                  type: 'flex',
                  id: 'range-flex',
                  direction: 'row',
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'range-value',
                      fieldType: 'number',
                      binding: 'data.range.value',
                      label: { literal: 'Value' },
                      required: true,
                      options: {
                        min: 0,
                        step: 5
                      }
                    },
                    {
                      type: 'field',
                      id: 'range-unit',
                      fieldType: 'select',
                      binding: 'data.range.unit',
                      label: { literal: 'Unit' },
                      required: true,
                      options: {
                        options: [
                          { value: 'self', label: { literal: 'Self' } },
                          { value: 'touch', label: { literal: 'Touch' } },
                          { value: 'feet', label: { literal: 'Feet' } },
                          { value: 'miles', label: { literal: 'Miles' } },
                          { value: 'sight', label: { literal: 'Sight' } },
                          { value: 'unlimited', label: { literal: 'Unlimited' } },
                          { value: 'special', label: { literal: 'Special' } }
                        ]
                      }
                    }
                  ]
                }
              ]
            },

            // Duration
            {
              type: 'group',
              id: 'duration-group',
              title: { literal: 'Duration' },
              border: true,
              children: [
                {
                  type: 'flex',
                  id: 'duration-flex',
                  direction: 'row',
                  gap: '0.5rem',
                  children: [
                    {
                      type: 'field',
                      id: 'duration-value',
                      fieldType: 'number',
                      binding: 'data.duration.value',
                      label: { literal: 'Value' },
                      required: true,
                      options: {
                        min: 0,
                        step: 1
                      }
                    },
                    {
                      type: 'field',
                      id: 'duration-unit',
                      fieldType: 'select',
                      binding: 'data.duration.unit',
                      label: { literal: 'Unit' },
                      required: true,
                      options: {
                        options: [
                          { value: 'instant', label: { literal: 'Instantaneous' } },
                          { value: 'round', label: { literal: 'Round(s)' } },
                          { value: 'minute', label: { literal: 'Minute(s)' } },
                          { value: 'hour', label: { literal: 'Hour(s)' } },
                          { value: 'day', label: { literal: 'Day(s)' } },
                          { value: 'concentration', label: { literal: 'Concentration' } },
                          { value: 'until_dispelled', label: { literal: 'Until Dispelled' } },
                          { value: 'until_dispelled_or_triggered', label: { literal: 'Until Dispelled or Triggered' } },
                          { value: 'permanent', label: { literal: 'Permanent' } },
                          { value: 'special', label: { literal: 'Special' } }
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
    },

    // ========================================================================
    // COMPONENTS SECTION - V, S, M
    // ========================================================================
    {
      type: 'section',
      id: 'components-section',
      title: { literal: 'Components' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'flex',
          id: 'components-checkboxes',
          direction: 'row',
          gap: '2rem',
          children: [
            {
              type: 'field',
              id: 'component-verbal',
              fieldType: 'checkbox',
              binding: 'data.components.verbal',
              label: { literal: 'Verbal (V)' },
              helpText: { literal: 'Spoken words or incantation' }
            },
            {
              type: 'field',
              id: 'component-somatic',
              fieldType: 'checkbox',
              binding: 'data.components.somatic',
              label: { literal: 'Somatic (S)' },
              helpText: { literal: 'Gestures or hand movements' }
            },
            {
              type: 'field',
              id: 'component-material',
              fieldType: 'checkbox',
              binding: 'data.components.material',
              label: { literal: 'Material (M)' },
              helpText: { literal: 'Physical components required' }
            }
          ]
        },

        // Material component details (conditional on material=true)
        {
          type: 'conditional',
          id: 'material-details-conditional',
          condition: {
            type: 'simple',
            field: 'data.components.material',
            operator: 'equals',
            value: true
          },
          then: [
            {
              type: 'divider',
              id: 'material-divider',
              orientation: 'horizontal'
            },
            {
              type: 'group',
              id: 'material-details-group',
              title: { literal: 'Material Component Details' },
              border: false,
              children: [
                {
                  type: 'field',
                  id: 'material-description',
                  fieldType: 'textarea',
                  binding: 'data.components.materialCost',
                  label: { literal: 'Material Description' },
                  options: {
                    placeholder: { literal: 'Describe the material components needed (e.g., "a pinch of sulfur")' }
                  }
                },
                {
                  type: 'grid',
                  id: 'material-cost-grid',
                  columns: 2,
                  gap: '1rem',
                  children: [
                    {
                      type: 'field',
                      id: 'material-gp-cost',
                      fieldType: 'number',
                      binding: 'data.components.materialGP',
                      label: { literal: 'GP Cost' },
                      helpText: { literal: 'Gold piece cost for materials (if any)' },
                      options: {
                        min: 0,
                        step: 0.1
                      }
                    },
                    {
                      type: 'field',
                      id: 'material-consumed',
                      fieldType: 'checkbox',
                      binding: 'data.components.consumed',
                      label: { literal: 'Components Consumed' },
                      helpText: { literal: 'Materials are consumed by the spell' }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },

    // ========================================================================
    // TARGETING SECTION - Target type, area, number of targets
    // ========================================================================
    {
      type: 'section',
      id: 'targeting-section',
      title: { literal: 'Targeting' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'grid',
          id: 'target-grid',
          columns: 3,
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'target-type',
              fieldType: 'select',
              binding: 'data.target.type',
              label: { literal: 'Target Type' },
              options: {
                options: [
                  { value: 'self', label: { literal: 'Self' } },
                  { value: 'creature', label: { literal: 'Creature' } },
                  { value: 'ally', label: { literal: 'Ally' } },
                  { value: 'enemy', label: { literal: 'Enemy' } },
                  { value: 'object', label: { literal: 'Object' } },
                  { value: 'space', label: { literal: 'Point in Space' } },
                  { value: 'sphere', label: { literal: 'Sphere' } },
                  { value: 'cylinder', label: { literal: 'Cylinder' } },
                  { value: 'cone', label: { literal: 'Cone' } },
                  { value: 'cube', label: { literal: 'Cube' } },
                  { value: 'line', label: { literal: 'Line' } },
                  { value: 'wall', label: { literal: 'Wall' } }
                ]
              }
            },

            // Number of targets (conditional on creature/ally/enemy target types)
            {
              type: 'field',
              id: 'target-value',
              fieldType: 'number',
              binding: 'data.target.value',
              label: { literal: 'Number of Targets' },
              helpText: { literal: 'How many targets can be affected' },
              visibility: {
                type: 'compound',
                operator: 'or',
                conditions: [
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'creature'
                  },
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'ally'
                  },
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'enemy'
                  }
                ]
              },
              options: {
                min: 1,
                step: 1
              }
            },

            // Area size (conditional on area target types)
            {
              type: 'field',
              id: 'target-size',
              fieldType: 'number',
              binding: 'data.target.size',
              label: { literal: 'Area Size (feet)' },
              helpText: { literal: 'Radius, length, or width of area' },
              visibility: {
                type: 'compound',
                operator: 'or',
                conditions: [
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'sphere'
                  },
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'cylinder'
                  },
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'cone'
                  },
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'cube'
                  },
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'line'
                  },
                  {
                    type: 'simple',
                    field: 'data.target.type',
                    operator: 'equals',
                    value: 'wall'
                  }
                ]
              },
              options: {
                min: 5,
                step: 5
              }
            }
          ]
        }
      ]
    },

    // ========================================================================
    // EFFECTS SECTION - Tabs for Attack, Save, Damage, Healing
    // ========================================================================
    {
      type: 'section',
      id: 'effects-section',
      title: { literal: 'Effects' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'tabs',
          id: 'effects-tabs',
          position: 'top',
          defaultTab: 'attack-tab',
          tabs: [
            // ATTACK TAB
            {
              id: 'attack-tab',
              label: { literal: 'Attack Roll' },
              icon: 'sword',
              children: [
                {
                  type: 'field',
                  id: 'has-attack',
                  fieldType: 'checkbox',
                  binding: 'data.attack',
                  label: { literal: 'Spell Requires Attack Roll' },
                  helpText: { literal: 'Check if the spell requires an attack roll to hit' }
                },
                {
                  type: 'conditional',
                  id: 'attack-details-conditional',
                  condition: {
                    type: 'simple',
                    field: 'data.attack',
                    operator: 'isNotEmpty',
                    value: undefined
                  },
                  then: [
                    {
                      type: 'divider',
                      id: 'attack-divider',
                      orientation: 'horizontal'
                    },
                    {
                      type: 'grid',
                      id: 'attack-details-grid',
                      columns: 2,
                      gap: '1rem',
                      children: [
                        {
                          type: 'field',
                          id: 'attack-type',
                          fieldType: 'radio',
                          binding: 'data.attack.type',
                          label: { literal: 'Attack Type' },
                          required: true,
                          options: {
                            options: [
                              { value: 'melee', label: { literal: 'Melee Spell Attack' } },
                              { value: 'ranged', label: { literal: 'Ranged Spell Attack' } }
                            ],
                            layout: 'horizontal'
                          }
                        },
                        {
                          type: 'field',
                          id: 'attack-bonus-override',
                          fieldType: 'number',
                          binding: 'data.attack.bonusOverride',
                          label: { literal: 'Attack Bonus Override' },
                          helpText: { literal: 'Leave empty to use caster\'s spell attack bonus' },
                          options: {
                            step: 1
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            // SAVING THROW TAB
            {
              id: 'save-tab',
              label: { literal: 'Saving Throw' },
              icon: 'shield',
              children: [
                {
                  type: 'field',
                  id: 'has-save',
                  fieldType: 'checkbox',
                  binding: 'data.save',
                  label: { literal: 'Spell Requires Saving Throw' },
                  helpText: { literal: 'Check if targets must make a saving throw' }
                },
                {
                  type: 'conditional',
                  id: 'save-details-conditional',
                  condition: {
                    type: 'simple',
                    field: 'data.save',
                    operator: 'isNotEmpty',
                    value: undefined
                  },
                  then: [
                    {
                      type: 'divider',
                      id: 'save-divider',
                      orientation: 'horizontal'
                    },
                    {
                      type: 'grid',
                      id: 'save-details-grid',
                      columns: 3,
                      gap: '1rem',
                      children: [
                        {
                          type: 'field',
                          id: 'save-ability',
                          fieldType: 'select',
                          binding: 'data.save.ability',
                          label: { literal: 'Save Ability' },
                          required: true,
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
                          fieldType: 'select',
                          binding: 'data.save.effect',
                          label: { literal: 'Effect on Successful Save' },
                          required: true,
                          options: {
                            options: [
                              { value: 'none', label: { literal: 'No Effect' } },
                              { value: 'half', label: { literal: 'Half Damage' } },
                              { value: 'other', label: { literal: 'Other (see description)' } }
                            ]
                          }
                        },
                        {
                          type: 'field',
                          id: 'save-dc-override',
                          fieldType: 'number',
                          binding: 'data.save.dcOverride',
                          label: { literal: 'DC Override' },
                          helpText: { literal: 'Leave empty to use caster\'s spell save DC' },
                          options: {
                            min: 1,
                            max: 30,
                            step: 1
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },

            // DAMAGE TAB
            {
              id: 'damage-tab',
              label: { literal: 'Damage' },
              icon: 'fire',
              children: [
                {
                  type: 'field',
                  id: 'has-damage',
                  fieldType: 'checkbox',
                  binding: 'data.damage',
                  label: { literal: 'Spell Deals Damage' },
                  helpText: { literal: 'Check if the spell deals damage' }
                },
                {
                  type: 'conditional',
                  id: 'damage-details-conditional',
                  condition: {
                    type: 'simple',
                    field: 'data.damage',
                    operator: 'isNotEmpty',
                    value: undefined
                  },
                  then: [
                    {
                      type: 'divider',
                      id: 'damage-divider',
                      orientation: 'horizontal'
                    },
                    {
                      type: 'group',
                      id: 'damage-details-group',
                      title: { literal: 'Base Damage' },
                      border: true,
                      children: [
                        {
                          type: 'grid',
                          id: 'damage-base-grid',
                          columns: 2,
                          gap: '1rem',
                          children: [
                            {
                              type: 'field',
                              id: 'damage-dice',
                              fieldType: 'dice',
                              binding: 'data.damage.dice',
                              label: { literal: 'Damage Dice' },
                              required: true,
                              helpText: { literal: 'e.g., "3d6", "8d6", "1d10+5"' },
                              options: {
                                placeholder: { literal: '1d6' }
                              }
                            },
                            {
                              type: 'field',
                              id: 'damage-type',
                              fieldType: 'select',
                              binding: 'data.damage.type',
                              label: { literal: 'Damage Type' },
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
                            }
                          ]
                        }
                      ]
                    },
                    {
                      type: 'spacer',
                      id: 'damage-spacer',
                      size: '1rem'
                    },
                    {
                      type: 'group',
                      id: 'damage-upcast-group',
                      title: { literal: 'Upcasting' },
                      border: true,
                      children: [
                        {
                          type: 'static',
                          id: 'upcast-help',
                          content: { literal: 'Define how damage increases when cast at higher levels' },
                          contentType: 'text',
                          className: 'help-text'
                        },
                        {
                          type: 'grid',
                          id: 'damage-upcast-grid',
                          columns: 2,
                          gap: '1rem',
                          children: [
                            {
                              type: 'field',
                              id: 'upcast-dice',
                              fieldType: 'dice',
                              binding: 'data.upcast.dice',
                              label: { literal: 'Additional Dice' },
                              helpText: { literal: 'Additional dice per spell level (e.g., "1d6")' },
                              options: {
                                placeholder: { literal: '1d6' }
                              }
                            },
                            {
                              type: 'field',
                              id: 'upcast-per',
                              fieldType: 'number',
                              binding: 'data.upcast.per',
                              label: { literal: 'Per X Levels' },
                              helpText: { literal: 'Add dice every X spell levels above base' },
                              options: {
                                min: 1,
                                max: 9,
                                step: 1
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

            // HEALING TAB
            {
              id: 'healing-tab',
              label: { literal: 'Healing' },
              icon: 'heart',
              children: [
                {
                  type: 'field',
                  id: 'has-healing',
                  fieldType: 'checkbox',
                  binding: 'data.healing',
                  label: { literal: 'Spell Heals' },
                  helpText: { literal: 'Check if the spell restores hit points' }
                },
                {
                  type: 'conditional',
                  id: 'healing-details-conditional',
                  condition: {
                    type: 'simple',
                    field: 'data.healing',
                    operator: 'isNotEmpty',
                    value: undefined
                  },
                  then: [
                    {
                      type: 'divider',
                      id: 'healing-divider',
                      orientation: 'horizontal'
                    },
                    {
                      type: 'group',
                      id: 'healing-details-group',
                      title: { literal: 'Base Healing' },
                      border: true,
                      children: [
                        {
                          type: 'field',
                          id: 'healing-dice',
                          fieldType: 'dice',
                          binding: 'data.healing.dice',
                          label: { literal: 'Healing Dice' },
                          required: true,
                          helpText: { literal: 'e.g., "2d4+2", "4d8+4"' },
                          options: {
                            placeholder: { literal: '1d8' }
                          }
                        }
                      ]
                    },
                    {
                      type: 'spacer',
                      id: 'healing-spacer',
                      size: '1rem'
                    },
                    {
                      type: 'group',
                      id: 'healing-upcast-group',
                      title: { literal: 'Upcasting Healing' },
                      border: true,
                      children: [
                        {
                          type: 'static',
                          id: 'healing-upcast-help',
                          content: { literal: 'Define how healing increases when cast at higher levels' },
                          contentType: 'text',
                          className: 'help-text'
                        },
                        {
                          type: 'field',
                          id: 'healing-scaling',
                          fieldType: 'textarea',
                          binding: 'data.healing.scaling',
                          label: { literal: 'Scaling Formula' },
                          helpText: { literal: 'Describe healing at each level (e.g., "1st: 1d8, 2nd: 2d8, 3rd: 3d8")' },
                          options: {
                            placeholder: { literal: 'Optional: Describe scaling per level' }
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
    },

    // ========================================================================
    // DESCRIPTION SECTION - Main description and higher levels
    // ========================================================================
    {
      type: 'section',
      id: 'description-section',
      title: { literal: 'Description' },
      collapsible: true,
      defaultCollapsed: false,
      children: [
        {
          type: 'field',
          id: 'spell-description',
          fieldType: 'richtext',
          binding: 'data.description',
          label: { literal: 'Spell Description' },
          required: true,
          helpText: { literal: 'Describe what the spell does and its effects' },
          options: {
            showPreview: true
          }
        },
        {
          type: 'spacer',
          id: 'description-spacer',
          size: '1rem'
        },
        {
          type: 'field',
          id: 'at-higher-levels',
          fieldType: 'richtext',
          binding: 'data.atHigherLevels',
          label: { literal: 'At Higher Levels' },
          helpText: { literal: 'Describe effects when cast using a higher-level spell slot' },
          options: {
            showPreview: true,
            placeholder: { literal: 'Optional: Describe upcasting effects not covered by damage/healing scaling' }
          }
        }
      ]
    },

    // ========================================================================
    // SPELLCASTING SECTION - Prepared status and ability override
    // ========================================================================
    {
      type: 'section',
      id: 'spellcasting-section',
      title: { literal: 'Spellcasting' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'grid',
          id: 'spellcasting-grid',
          columns: 2,
          gap: '1rem',
          children: [
            {
              type: 'field',
              id: 'spell-prepared',
              fieldType: 'checkbox',
              binding: 'data.prepared',
              label: { literal: 'Prepared' },
              helpText: { literal: 'For prepared casters (Clerics, Druids, Paladins, Wizards)' }
            },
            {
              type: 'field',
              id: 'ability-override',
              fieldType: 'select',
              binding: 'data.abilityOverride',
              label: { literal: 'Spellcasting Ability Override' },
              helpText: { literal: 'Override the default spellcasting ability for this spell' },
              options: {
                options: [
                  { value: '', label: { literal: 'Use Class Default' } },
                  { value: 'str', label: { literal: 'Strength' } },
                  { value: 'dex', label: { literal: 'Dexterity' } },
                  { value: 'con', label: { literal: 'Constitution' } },
                  { value: 'int', label: { literal: 'Intelligence' } },
                  { value: 'wis', label: { literal: 'Wisdom' } },
                  { value: 'cha', label: { literal: 'Charisma' } }
                ]
              }
            }
          ]
        }
      ]
    },

    // ========================================================================
    // METADATA SECTION - Classes, source, tags
    // ========================================================================
    {
      type: 'section',
      id: 'metadata-section',
      title: { literal: 'Metadata' },
      collapsible: true,
      defaultCollapsed: true,
      children: [
        {
          type: 'field',
          id: 'spell-classes',
          fieldType: 'tags',
          binding: 'data.classes',
          label: { literal: 'Available to Classes' },
          helpText: { literal: 'Which classes can learn or prepare this spell' },
          options: {
            suggestions: [
              'Bard',
              'Cleric',
              'Druid',
              'Paladin',
              'Ranger',
              'Sorcerer',
              'Warlock',
              'Wizard',
              'Artificer'
            ],
            allowCustom: true,
            placeholder: { literal: 'Select or type class names' }
          }
        },
        {
          type: 'field',
          id: 'spell-source',
          fieldType: 'text',
          binding: 'data.source',
          label: { literal: 'Source Book' },
          helpText: { literal: 'Book or source where the spell is published' },
          options: {
            placeholder: { literal: 'e.g., Player\'s Handbook, Xanathar\'s Guide to Everything' }
          }
        }
      ]
    }
  ],

  fragments: [],

  styles: {
    theme: 'default',
    customCSS: `
      .help-text {
        font-size: 0.875rem;
        color: #666;
        font-style: italic;
        margin-bottom: 1rem;
      }

      .field-label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        display: block;
      }

      section[data-section="effects-section"] {
        background: rgba(0, 0, 0, 0.02);
        padding: 1rem;
        border-radius: 0.5rem;
      }
    `
  },

  computedFields: [],

  createdAt: new Date(),
  updatedAt: new Date()
};
