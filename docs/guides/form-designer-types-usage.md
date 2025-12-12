# Form Designer Types Usage Guide

This guide demonstrates how to use the Form Designer type definitions in the VTT project.

## Importing Types

All form types are available from the `@vtt/shared` package:

```typescript
import {
  FormDefinition,
  FormFieldType,
  LayoutNode,
  FieldNode,
  GridNode,
  FormFragment,
  FormComputedField,
  CreateFormRequest,
  UpdateFormRequest,
  FormResponse,
  // ... etc
} from '@vtt/shared';
```

## Basic Form Definition Example

```typescript
const characterSheetForm: FormDefinition = {
  id: 'char-sheet-basic',
  name: 'Basic Character Sheet',
  description: 'Simple D&D 5e character sheet',
  gameSystemId: 'dnd5e',
  entityType: 'actor',
  version: 1,
  isDefault: true,
  isLocked: false,
  visibility: 'public',
  ownerId: 'user-123',

  // Layout structure
  layout: [
    {
      type: 'grid',
      id: 'main-grid',
      columns: 2,
      gap: '1rem',
      children: [
        // Character name field
        {
          type: 'field',
          id: 'name-field',
          fieldType: 'text',
          binding: 'name',
          label: 'Character Name',
          required: true
        },
        // Level field
        {
          type: 'field',
          id: 'level-field',
          fieldType: 'number',
          binding: 'level',
          label: 'Level',
          options: {
            min: 1,
            max: 20
          }
        }
      ]
    }
  ],

  fragments: [],
  computedFields: [],
  styles: {
    theme: 'default'
  },

  createdAt: new Date(),
  updatedAt: new Date()
};
```

## Field Types

### Text Input
```typescript
const textField: FieldNode = {
  type: 'field',
  id: 'description',
  fieldType: 'text',
  binding: 'description',
  label: 'Description',
  options: {
    placeholder: 'Enter character background...',
    multiline: true
  }
};
```

### Number Input with Constraints
```typescript
const strengthField: FieldNode = {
  type: 'field',
  id: 'strength',
  fieldType: 'number',
  binding: 'attributes.strength.value',
  label: 'Strength',
  options: {
    min: 1,
    max: 20,
    step: 1
  }
};
```

### Select Dropdown
```typescript
const classField: FieldNode = {
  type: 'field',
  id: 'class',
  fieldType: 'select',
  binding: 'class',
  label: 'Class',
  options: {
    options: [
      { value: 'fighter', label: 'Fighter' },
      { value: 'wizard', label: 'Wizard' },
      { value: 'rogue', label: 'Rogue' }
    ]
  }
};
```

### Resource Bar (HP, MP, etc.)
```typescript
const hpField: FieldNode = {
  type: 'field',
  id: 'hp',
  fieldType: 'resource',
  binding: 'hp',
  label: 'Hit Points',
  options: {
    showMax: true
  }
};
```

## Layout Containers

### Grid Layout
```typescript
const attributesGrid: GridNode = {
  type: 'grid',
  id: 'attributes-grid',
  columns: 3,
  gap: '0.5rem',
  children: [
    // Strength, Dexterity, Constitution...
  ]
};
```

### Tabbed Interface
```typescript
const characterTabs: TabsNode = {
  type: 'tabs',
  id: 'char-tabs',
  position: 'top',
  defaultTab: 'stats',
  tabs: [
    {
      id: 'stats',
      label: 'Stats',
      icon: 'user',
      children: [/* stat fields */]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'backpack',
      children: [/* inventory repeater */]
    },
    {
      id: 'spells',
      label: 'Spells',
      icon: 'magic',
      children: [/* spell list */]
    }
  ]
};
```

### Collapsible Section
```typescript
const skillsSection: SectionNode = {
  type: 'section',
  id: 'skills',
  title: 'Skills',
  collapsible: true,
  defaultCollapsed: false,
  children: [/* skill fields */]
};
```

## Conditional Rendering

### Simple Condition
```typescript
const rageField: FieldNode = {
  type: 'field',
  id: 'rage',
  fieldType: 'resource',
  binding: 'resources.rage',
  label: 'Rage Uses',
  // Only show if class is Barbarian
  visibility: {
    type: 'simple',
    field: 'class',
    operator: 'equals',
    value: 'barbarian'
  }
};
```

### Compound Condition (AND/OR)
```typescript
const sneakAttackField: FieldNode = {
  type: 'field',
  id: 'sneak-attack',
  fieldType: 'dice',
  binding: 'abilities.sneakAttack',
  label: 'Sneak Attack',
  // Show if (class is Rogue) AND (level >= 3)
  visibility: {
    type: 'compound',
    operator: 'and',
    conditions: [
      {
        type: 'simple',
        field: 'class',
        operator: 'equals',
        value: 'rogue'
      },
      {
        type: 'simple',
        field: 'level',
        operator: 'greaterThanOrEqual',
        value: 3
      }
    ]
  }
};
```

## Repeater for Arrays (Inventory, Spells)

```typescript
const inventoryRepeater: RepeaterNode = {
  type: 'repeater',
  id: 'inventory',
  binding: 'inventory',
  addLabel: 'Add Item',
  emptyMessage: 'No items in inventory',
  allowReorder: true,
  allowDelete: true,
  itemTemplate: [
    {
      type: 'grid',
      id: 'item-grid',
      columns: 3,
      children: [
        {
          type: 'field',
          id: 'item-name',
          fieldType: 'text',
          binding: 'name',
          label: 'Item'
        },
        {
          type: 'field',
          id: 'item-quantity',
          fieldType: 'number',
          binding: 'quantity',
          label: 'Qty',
          options: { min: 0 }
        },
        {
          type: 'field',
          id: 'item-weight',
          fieldType: 'number',
          binding: 'weight',
          label: 'Weight'
        }
      ]
    }
  ]
};
```

## Reusable Fragments

### Define a Fragment
```typescript
const abilityScoreFragment: FormFragment = {
  id: 'ability-score',
  name: 'Ability Score Display',
  description: 'Shows ability score with modifier',
  parameters: [
    {
      name: 'attributePath',
      type: 'binding',
      description: 'Path to attribute (e.g., attributes.strength)'
    },
    {
      name: 'label',
      type: 'literal',
      description: 'Display label'
    }
  ],
  content: [
    {
      type: 'grid',
      id: 'ability-grid',
      columns: 2,
      children: [
        {
          type: 'field',
          id: 'score',
          fieldType: 'number',
          binding: '{{attributePath}}.value',
          label: '{{label}}'
        },
        {
          type: 'computed',
          id: 'modifier',
          fieldId: 'ability-modifier',
          label: 'Mod',
          format: '+{value}'
        }
      ]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Use a Fragment
```typescript
const strengthDisplay: FragmentRefNode = {
  type: 'fragmentRef',
  id: 'str-display',
  fragmentId: 'ability-score',
  parameters: {
    attributePath: 'attributes.strength',
    label: 'Strength'
  }
};
```

## Computed Fields

```typescript
const proficiencyBonus: FormComputedField = {
  id: 'proficiency-bonus',
  name: 'Proficiency Bonus',
  description: 'Calculated from character level',
  formula: 'Math.floor((@level - 1) / 4) + 2',
  resultType: 'number',
  dependencies: ['level']
};

const abilityModifier: FormComputedField = {
  id: 'ability-modifier',
  name: 'Ability Modifier',
  description: 'D&D 5e ability modifier formula',
  formula: 'Math.floor((@value - 10) / 2)',
  resultType: 'number',
  dependencies: ['value']
};
```

## API Usage

### Create a Form
```typescript
const createRequest: CreateFormRequest = {
  name: 'My Custom Sheet',
  description: 'Custom character sheet for my campaign',
  gameSystemId: 'dnd5e',
  entityType: 'actor',
  layout: [/* layout nodes */],
  visibility: 'private'
};

// POST /api/forms
const response = await fetch('/api/forms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createRequest)
});

const result: FormResponse = await response.json();
```

### Update a Form
```typescript
const updateRequest: UpdateFormRequest = {
  layout: [/* updated layout */],
  visibility: 'public'
};

// PATCH /api/forms/:id
const response = await fetch(`/api/forms/${formId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateRequest)
});
```

### Assign Form to Campaign
```typescript
const assignRequest: AssignFormToCampaignRequest = {
  formId: 'form-123',
  entityType: 'actor',
  priority: 100
};

// POST /api/campaigns/:id/forms
const response = await fetch(`/api/campaigns/${campaignId}/forms`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(assignRequest)
});
```

## Complete Example: D&D 5e Character Sheet

```typescript
const dnd5eCharacterSheet: FormDefinition = {
  id: 'dnd5e-character-sheet',
  name: 'D&D 5e Character Sheet',
  description: 'Standard D&D 5th Edition character sheet',
  gameSystemId: 'dnd5e',
  entityType: 'actor',
  version: 1,
  isDefault: true,
  isLocked: false,
  visibility: 'public',
  ownerId: 'system',

  layout: [
    {
      type: 'tabs',
      id: 'main-tabs',
      position: 'top',
      tabs: [
        {
          id: 'character',
          label: 'Character',
          children: [
            // Header section
            {
              type: 'section',
              id: 'header',
              title: 'Character Info',
              children: [
                {
                  type: 'grid',
                  id: 'basic-info',
                  columns: 3,
                  children: [
                    {
                      type: 'field',
                      id: 'name',
                      fieldType: 'text',
                      binding: 'name',
                      label: 'Character Name',
                      required: true
                    },
                    {
                      type: 'field',
                      id: 'class',
                      fieldType: 'text',
                      binding: 'class',
                      label: 'Class'
                    },
                    {
                      type: 'field',
                      id: 'level',
                      fieldType: 'number',
                      binding: 'level',
                      label: 'Level',
                      options: { min: 1, max: 20 }
                    }
                  ]
                }
              ]
            },

            // Abilities section
            {
              type: 'section',
              id: 'abilities',
              title: 'Ability Scores',
              children: [
                {
                  type: 'grid',
                  id: 'abilities-grid',
                  columns: 3,
                  gap: '1rem',
                  children: [
                    // Use fragment refs for each ability
                    {
                      type: 'fragmentRef',
                      id: 'str',
                      fragmentId: 'ability-score',
                      parameters: {
                        attributePath: 'attributes.strength',
                        label: 'STR'
                      }
                    },
                    // ... DEX, CON, INT, WIS, CHA
                  ]
                }
              ]
            },

            // Resources section
            {
              type: 'section',
              id: 'resources',
              title: 'Resources',
              children: [
                {
                  type: 'field',
                  id: 'hp',
                  fieldType: 'resource',
                  binding: 'hp',
                  label: 'Hit Points',
                  options: { showMax: true }
                },
                {
                  type: 'field',
                  id: 'temp-hp',
                  fieldType: 'number',
                  binding: 'tempHp',
                  label: 'Temporary HP',
                  options: { min: 0 }
                }
              ]
            }
          ]
        },

        {
          id: 'inventory',
          label: 'Inventory',
          children: [
            {
              type: 'repeater',
              id: 'items',
              binding: 'inventory',
              addLabel: 'Add Item',
              allowReorder: true,
              itemTemplate: [/* item fields */]
            }
          ]
        },

        {
          id: 'spells',
          label: 'Spells',
          // Only show if character has spellcasting
          visibility: {
            type: 'simple',
            field: 'spellcasting.enabled',
            operator: 'equals',
            value: true
          },
          children: [/* spell slots and list */]
        }
      ]
    }
  ],

  fragments: [/* reusable fragments */],

  computedFields: [
    {
      id: 'proficiency-bonus',
      name: 'Proficiency Bonus',
      formula: 'Math.floor((@level - 1) / 4) + 2',
      resultType: 'number',
      dependencies: ['level']
    }
  ],

  styles: {
    theme: 'parchment',
    variables: {
      '--primary-color': '#8b0000',
      '--font-family': 'Georgia, serif'
    }
  },

  createdAt: new Date(),
  updatedAt: new Date()
};
```

## Type Safety Benefits

The TypeScript types provide:

1. **Compile-time validation**: Catch errors before runtime
2. **IntelliSense support**: Auto-completion in IDEs
3. **Refactoring safety**: Rename/restructure with confidence
4. **Documentation**: Types serve as inline documentation
5. **Consistency**: Enforce consistent data structures across frontend/backend

## Next Steps

- Implement database schema for forms
- Build REST API endpoints
- Create form renderer component
- Build visual form designer
- Implement computed field evaluator
