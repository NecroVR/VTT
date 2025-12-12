# Form Designer Fragments Guide

## Overview

Fragments are reusable layout snippets in the Form Designer system that allow you to define a piece of UI once and use it multiple times with different parameters. This dramatically reduces duplication and makes forms easier to maintain.

## What Are Fragments?

A fragment is a named, parameterized template that can be inserted anywhere in your form layout. Think of fragments like functions in programming - you define them once with parameters, then call them multiple times with different arguments.

### Key Benefits

- **Reduce Duplication**: Define common patterns once, use them everywhere
- **Easier Maintenance**: Update a fragment in one place, changes apply everywhere it's used
- **Consistency**: Ensure the same UI pattern looks identical across your form
- **Parameterization**: Customize each instance with different data bindings

## Defining Fragments

Fragments are defined in the `fragments` array of your form definition. Each fragment has:

- **id**: Unique identifier for the fragment
- **name**: Human-readable name
- **description**: Optional description of what the fragment does
- **parameters**: Array of parameter definitions
- **content**: Array of layout nodes (the fragment's UI)

### Parameter Types

Parameters can be of two types:

- **binding**: A path to data in the entity (e.g., `"abilities.strength.value"`)
- **literal**: A literal value (e.g., `"STR"`, `"Strength"`)

### Example Fragment Definition

```json
{
  "id": "ability-score",
  "name": "Ability Score Block",
  "description": "Displays an ability score with its modifier",
  "parameters": [
    {
      "name": "abilityName",
      "type": "binding",
      "description": "Name of the ability (e.g., 'strength', 'dexterity')"
    },
    {
      "name": "abilityLabel",
      "type": "literal",
      "description": "Display label for the ability (e.g., 'STR', 'DEX')"
    }
  ],
  "content": [
    {
      "id": "ability-container",
      "type": "flex",
      "direction": "column",
      "align": "center",
      "gap": "0.25rem",
      "children": [
        {
          "id": "ability-label",
          "type": "static",
          "content": "{{abilityLabel}}",
          "contentType": "text",
          "style": {
            "font-weight": "bold",
            "text-transform": "uppercase"
          }
        },
        {
          "id": "ability-score",
          "type": "field",
          "fieldType": "number",
          "binding": "abilities.{{abilityName}}.score",
          "options": {
            "min": 1,
            "max": 30
          }
        },
        {
          "id": "ability-modifier",
          "type": "field",
          "fieldType": "text",
          "binding": "abilities.{{abilityName}}.modifier",
          "readonly": true
        }
      ]
    }
  ],
  "createdAt": "2025-12-12T00:00:00.000Z",
  "updatedAt": "2025-12-12T00:00:00.000Z"
}
```

## Using Fragments

To use a fragment, add a `fragmentRef` node to your layout:

```json
{
  "id": "str-fragment",
  "type": "fragmentRef",
  "fragmentId": "ability-score",
  "parameters": {
    "abilityName": "strength",
    "abilityLabel": "STR"
  }
}
```

### Parameter Substitution

When a fragment is rendered, all occurrences of `{{parameterName}}` in the fragment's content are replaced with the provided parameter values.

**In the fragment definition:**
```json
"binding": "abilities.{{abilityName}}.score"
"content": "{{abilityLabel}}"
```

**When used with parameters:**
```json
"parameters": {
  "abilityName": "strength",
  "abilityLabel": "STR"
}
```

**Results in:**
```json
"binding": "abilities.strength.score"
"content": "STR"
```

## Complete Example: D&D 5e Ability Scores

Here's a complete example showing how fragments make a D&D 5e character sheet more maintainable:

### Define the Fragment Once

```json
{
  "fragments": [
    {
      "id": "ability-score",
      "name": "Ability Score Block",
      "description": "Reusable ability score display",
      "parameters": [
        {
          "name": "abilityName",
          "type": "binding",
          "description": "Name of the ability"
        },
        {
          "name": "abilityLabel",
          "type": "literal",
          "description": "Display label"
        }
      ],
      "content": [
        {
          "id": "ability-container",
          "type": "flex",
          "direction": "column",
          "align": "center",
          "gap": "0.25rem",
          "children": [
            {
              "id": "ability-label",
              "type": "static",
              "content": "{{abilityLabel}}",
              "contentType": "text",
              "style": {
                "font-weight": "bold",
                "text-transform": "uppercase",
                "font-size": "0.875rem"
              }
            },
            {
              "id": "ability-score",
              "type": "field",
              "fieldType": "number",
              "binding": "abilities.{{abilityName}}.score",
              "label": "Score",
              "options": {
                "min": 1,
                "max": 30
              }
            },
            {
              "id": "ability-modifier",
              "type": "field",
              "fieldType": "text",
              "binding": "abilities.{{abilityName}}.modifier",
              "label": "Modifier",
              "readonly": true
            }
          ]
        }
      ],
      "createdAt": "2025-12-12T00:00:00.000Z",
      "updatedAt": "2025-12-12T00:00:00.000Z"
    }
  ]
}
```

### Use It Six Times

```json
{
  "layout": [
    {
      "id": "abilities-section",
      "type": "section",
      "title": "Ability Scores",
      "children": [
        {
          "id": "abilities-grid",
          "type": "grid",
          "columns": 3,
          "gap": "1rem",
          "children": [
            {
              "id": "str-fragment",
              "type": "fragmentRef",
              "fragmentId": "ability-score",
              "parameters": {
                "abilityName": "strength",
                "abilityLabel": "STR"
              }
            },
            {
              "id": "dex-fragment",
              "type": "fragmentRef",
              "fragmentId": "ability-score",
              "parameters": {
                "abilityName": "dexterity",
                "abilityLabel": "DEX"
              }
            },
            {
              "id": "con-fragment",
              "type": "fragmentRef",
              "fragmentId": "ability-score",
              "parameters": {
                "abilityName": "constitution",
                "abilityLabel": "CON"
              }
            },
            {
              "id": "int-fragment",
              "type": "fragmentRef",
              "fragmentId": "ability-score",
              "parameters": {
                "abilityName": "intelligence",
                "abilityLabel": "INT"
              }
            },
            {
              "id": "wis-fragment",
              "type": "fragmentRef",
              "fragmentId": "ability-score",
              "parameters": {
                "abilityName": "wisdom",
                "abilityLabel": "WIS"
              }
            },
            {
              "id": "cha-fragment",
              "type": "fragmentRef",
              "fragmentId": "ability-score",
              "parameters": {
                "abilityName": "charisma",
                "abilityLabel": "CHA"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Other Use Cases

### Skill Entries

Create a fragment for skill rows that show proficiency, ability modifier, and total bonus:

```json
{
  "id": "skill-entry",
  "parameters": [
    { "name": "skillName", "type": "binding" },
    { "name": "skillLabel", "type": "literal" },
    { "name": "abilityName", "type": "binding" }
  ],
  "content": [
    {
      "type": "flex",
      "direction": "row",
      "align": "center",
      "gap": "0.5rem",
      "children": [
        {
          "type": "field",
          "fieldType": "checkbox",
          "binding": "skills.{{skillName}}.proficient",
          "label": "{{skillLabel}}"
        },
        {
          "type": "field",
          "fieldType": "text",
          "binding": "skills.{{skillName}}.bonus",
          "readonly": true
        }
      ]
    }
  ]
}
```

### Inventory Item Rows

Create a fragment for item entries in equipment lists:

```json
{
  "id": "inventory-item",
  "parameters": [
    { "name": "itemIndex", "type": "binding" }
  ],
  "content": [
    {
      "type": "flex",
      "direction": "row",
      "gap": "0.5rem",
      "children": [
        {
          "type": "field",
          "fieldType": "text",
          "binding": "inventory[{{itemIndex}}].name",
          "label": "Item"
        },
        {
          "type": "field",
          "fieldType": "number",
          "binding": "inventory[{{itemIndex}}].quantity",
          "label": "Qty"
        },
        {
          "type": "field",
          "fieldType": "number",
          "binding": "inventory[{{itemIndex}}].weight",
          "label": "Weight"
        }
      ]
    }
  ]
}
```

### Spell Slots

Create a fragment for spell slot trackers:

```json
{
  "id": "spell-slot-level",
  "parameters": [
    { "name": "level", "type": "literal" }
  ],
  "content": [
    {
      "type": "flex",
      "direction": "row",
      "align": "center",
      "gap": "0.5rem",
      "children": [
        {
          "type": "static",
          "content": "Level {{level}}"
        },
        {
          "type": "field",
          "fieldType": "resource",
          "binding": "spellSlots.level{{level}}",
          "options": {
            "showMax": true
          }
        }
      ]
    }
  ]
}
```

## Advanced Features

### Nested Fragments

Fragments can reference other fragments! This allows you to build complex, composable UI patterns:

```json
{
  "id": "skill-category",
  "parameters": [
    { "name": "categoryName", "type": "literal" }
  ],
  "content": [
    {
      "type": "section",
      "title": "{{categoryName}} Skills",
      "children": [
        {
          "type": "fragmentRef",
          "fragmentId": "skill-entry",
          "parameters": {
            "skillName": "athletics",
            "skillLabel": "Athletics",
            "abilityName": "strength"
          }
        }
      ]
    }
  ]
}
```

### Combining with Visibility Conditions

Fragments can include visibility conditions, making them appear or hide based on data:

```json
{
  "type": "fragmentRef",
  "fragmentId": "spell-slot-level",
  "parameters": {
    "level": "1"
  },
  "visibility": {
    "type": "simple",
    "field": "class.spellcaster",
    "operator": "equals",
    "value": true
  }
}
```

## Error Handling

If a fragment reference points to a non-existent fragment ID, the Form Designer will display an error message:

```
Fragment not found: [fragmentId]
```

This helps you identify broken references during development.

## Best Practices

1. **Name Parameters Clearly**: Use descriptive parameter names like `abilityName` instead of `name`
2. **Document Parameters**: Always include descriptions for parameters
3. **Keep Fragments Focused**: Each fragment should represent one cohesive UI pattern
4. **Test Parameter Substitution**: Ensure all `{{parameter}}` references are substituted correctly
5. **Avoid Circular References**: Don't create fragments that reference each other in a loop
6. **Use Consistent IDs**: Fragment IDs should be descriptive and follow a naming convention

## Migration from Inline Layouts

If you have repeated layout patterns, consider converting them to fragments:

**Before (Inline):**
```json
{
  "children": [
    { "type": "field", "binding": "abilities.strength.score", ... },
    { "type": "field", "binding": "abilities.strength.modifier", ... }
  ]
},
{
  "children": [
    { "type": "field", "binding": "abilities.dexterity.score", ... },
    { "type": "field", "binding": "abilities.dexterity.modifier", ... }
  ]
}
```

**After (With Fragment):**
```json
{
  "type": "fragmentRef",
  "fragmentId": "ability-score",
  "parameters": { "abilityName": "strength", "abilityLabel": "STR" }
},
{
  "type": "fragmentRef",
  "fragmentId": "ability-score",
  "parameters": { "abilityName": "dexterity", "abilityLabel": "DEX" }
}
```

## Technical Details

- Fragments are defined at the form level in the `fragments` array
- Parameter substitution happens at render time using deep string replacement
- All string properties in fragment content can contain `{{parameter}}` placeholders
- Fragment content is cloned before parameter substitution (original is unchanged)
- Fragments support all layout node types including nested containers

## See Also

- [Form Designer Overview](./form-designer-overview.md)
- [Layout Node Types](./form-designer-layout-nodes.md)
- [Visibility Conditions](./form-designer-visibility.md)
- [Computed Fields](./form-designer-computed-fields.md)
