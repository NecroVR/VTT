# Form Designer: Repeater Arrays

## Overview

Repeaters allow you to display and edit array data in your custom forms. They're perfect for managing lists of items like inventory, spell slots, features, abilities, or any other collection data.

## What is a Repeater?

A repeater is a layout component that:
- Binds to an array property in your entity data
- Renders a template for each item in the array
- Provides controls to add, remove, and reorder items
- Supports minimum and maximum item constraints

## Basic Configuration

### Required Properties

```typescript
{
  type: 'repeater',
  id: 'inventory-repeater',
  binding: 'inventory',           // Path to array property
  itemTemplate: [                 // Template for each item
    {
      type: 'field',
      fieldType: 'text',
      binding: 'inventory[{{index}}].name',
      label: 'Item Name'
    }
  ]
}
```

### Optional Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `addLabel` | `string` | Text for the "Add" button | `"Add Item"` |
| `emptyMessage` | `string` | Message shown when array is empty | None |
| `minItems` | `number` | Minimum number of items allowed | None |
| `maxItems` | `number` | Maximum number of items allowed | None |
| `allowReorder` | `boolean` | Enable up/down buttons to reorder items | `true` |
| `allowDelete` | `boolean` | Enable delete button for items | `true` |

## Item Template Binding

Within a repeater's `itemTemplate`, use the special `{{index}}` placeholder to reference the current item:

```typescript
{
  type: 'repeater',
  binding: 'spells',
  itemTemplate: [
    {
      type: 'field',
      fieldType: 'text',
      binding: 'spells[{{index}}].name',  // Binds to current spell's name
      label: 'Spell Name'
    },
    {
      type: 'field',
      fieldType: 'number',
      binding: 'spells[{{index}}].level', // Binds to current spell's level
      label: 'Level'
    }
  ]
}
```

## Controls

### Add Button

The Add button appears at the bottom of the repeater when in edit mode:
- Adds a new empty object to the array
- Disabled when `maxItems` is reached
- Can be customized with `addLabel`

### Remove Button (✕)

Each item has a remove button in edit mode:
- Removes that specific item from the array
- Disabled when `minItems` is reached
- Can be hidden by setting `allowDelete: false`

### Reorder Buttons (▲ ▼)

Each item has up/down buttons in edit mode:
- Move items up or down in the array
- Up button disabled on first item
- Down button disabled on last item
- Hidden when only one item exists
- Can be hidden by setting `allowReorder: false`

## Example Use Cases

### Inventory Management

```typescript
{
  type: 'repeater',
  binding: 'inventory',
  addLabel: 'Add Item',
  emptyMessage: 'No items in inventory',
  itemTemplate: [
    {
      type: 'grid',
      columns: 3,
      children: [
        {
          type: 'field',
          fieldType: 'text',
          binding: 'inventory[{{index}}].name',
          label: 'Item'
        },
        {
          type: 'field',
          fieldType: 'number',
          binding: 'inventory[{{index}}].quantity',
          label: 'Qty'
        },
        {
          type: 'field',
          fieldType: 'number',
          binding: 'inventory[{{index}}].weight',
          label: 'Weight'
        }
      ]
    }
  ]
}
```

### Spell List

```typescript
{
  type: 'repeater',
  binding: 'spells',
  addLabel: 'Add Spell',
  emptyMessage: 'No spells known',
  minItems: 0,
  maxItems: 10,
  itemTemplate: [
    {
      type: 'flex',
      direction: 'row',
      gap: '0.5rem',
      children: [
        {
          type: 'field',
          fieldType: 'text',
          binding: 'spells[{{index}}].name',
          label: 'Spell Name'
        },
        {
          type: 'field',
          fieldType: 'number',
          binding: 'spells[{{index}}].level',
          label: 'Level',
          options: { min: 0, max: 9 }
        },
        {
          type: 'field',
          fieldType: 'checkbox',
          binding: 'spells[{{index}}].prepared',
          label: 'Prepared'
        }
      ]
    }
  ]
}
```

### Features/Traits

```typescript
{
  type: 'repeater',
  binding: 'features',
  addLabel: 'Add Feature',
  allowReorder: true,
  itemTemplate: [
    {
      type: 'field',
      fieldType: 'text',
      binding: 'features[{{index}}].name',
      label: 'Feature Name'
    },
    {
      type: 'field',
      fieldType: 'textarea',
      binding: 'features[{{index}}].description',
      label: 'Description'
    }
  ]
}
```

### Resource Tracking (Limited Items)

```typescript
{
  type: 'repeater',
  binding: 'hitDice',
  addLabel: 'Add Hit Die',
  minItems: 1,    // Must have at least 1
  maxItems: 20,   // Cannot exceed 20
  allowReorder: false,
  allowDelete: false,
  itemTemplate: [
    {
      type: 'field',
      fieldType: 'select',
      binding: 'hitDice[{{index}}].die',
      label: 'Die Type',
      options: {
        options: [
          { value: 'd6', label: 'd6' },
          { value: 'd8', label: 'd8' },
          { value: 'd10', label: 'd10' },
          { value: 'd12', label: 'd12' }
        ]
      }
    },
    {
      type: 'field',
      fieldType: 'checkbox',
      binding: 'hitDice[{{index}}].used',
      label: 'Used'
    }
  ]
}
```

## Layout within Repeaters

You can use any layout components within the `itemTemplate`:

- **Grid**: Create columnar layouts for compact item display
- **Flex**: Create flexible horizontal or vertical layouts
- **Section**: Group related fields with collapsible sections
- **Tabs**: Organize complex items into tabbed interfaces
- **Group**: Add visual grouping with borders

Example with nested layouts:

```typescript
{
  type: 'repeater',
  binding: 'abilities',
  itemTemplate: [
    {
      type: 'section',
      title: 'Ability',
      collapsible: true,
      children: [
        {
          type: 'grid',
          columns: 2,
          children: [
            {
              type: 'field',
              fieldType: 'text',
              binding: 'abilities[{{index}}].name',
              label: 'Name'
            },
            {
              type: 'field',
              fieldType: 'select',
              binding: 'abilities[{{index}}].type',
              label: 'Type',
              options: {
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'passive', label: 'Passive' }
                ]
              }
            },
            {
              type: 'field',
              fieldType: 'textarea',
              binding: 'abilities[{{index}}].description',
              label: 'Description'
            }
          ]
        }
      ]
    }
  ]
}
```

## Data Structure

Repeaters work with array data in your entity. The data structure should match your binding path:

```typescript
// Entity data example
{
  inventory: [
    { name: 'Sword', quantity: 1, weight: 3 },
    { name: 'Potion', quantity: 5, weight: 0.5 }
  ],
  spells: [
    { name: 'Fireball', level: 3, prepared: true },
    { name: 'Magic Missile', level: 1, prepared: true }
  ]
}
```

When you add a new item, an empty object `{}` is added to the array. Your field bindings will create the properties as the user fills them in.

## Constraints

### Minimum Items (`minItems`)

- Prevents deletion below this count
- Remove button is disabled when at minimum
- Useful for ensuring required data exists

### Maximum Items (`maxItems`)

- Prevents addition beyond this count
- Add button is disabled when at maximum
- Useful for game rules (e.g., "maximum 5 attuned items")

## Best Practices

1. **Use Clear Labels**: Make it obvious what the repeater contains
   ```typescript
   addLabel: 'Add Spell'  // Better than 'Add Item'
   ```

2. **Provide Empty Messages**: Guide users when arrays are empty
   ```typescript
   emptyMessage: 'No spells learned yet. Click "Add Spell" to begin.'
   ```

3. **Consider Layout**: Use grids for compact item display
   ```typescript
   itemTemplate: [
     {
       type: 'grid',
       columns: 3,  // Creates 3-column layout for each item
       children: [...]
     }
   ]
   ```

4. **Set Constraints When Needed**: Prevent invalid game states
   ```typescript
   minItems: 1,   // Character must have at least one feature
   maxItems: 10   // Cannot have more than 10 features
   ```

5. **Group Related Fields**: Use sections or groups within complex items
   ```typescript
   itemTemplate: [
     {
       type: 'group',
       title: 'Item Details',
       border: true,
       children: [...]
     }
   ]
   ```

6. **Control Deletion Carefully**: Some data shouldn't be easily deleted
   ```typescript
   allowDelete: false  // For core data that must persist
   ```

## View Mode vs Edit Mode

Repeaters behave differently based on mode:

### View Mode
- Shows all items in the array
- No add/remove/reorder buttons
- Fields are read-only (controlled by field settings)

### Edit Mode
- Shows all items plus controls
- Add button at bottom
- Remove and reorder buttons on each item
- Fields are editable

## Troubleshooting

### Items not showing
- Check that your `binding` path matches your data structure
- Verify the array exists in your entity data
- Check visibility conditions on the repeater

### Controls not appearing
- Ensure you're in `edit` mode
- Check `allowDelete` and `allowReorder` settings
- Verify the repeater isn't inside a read-only container

### Fields not updating
- Ensure field bindings use `{{index}}` correctly
- Check that the `onChange` callback is wired up properly
- Verify field bindings match array structure

### Array index errors
- Make sure array bindings use the format: `arrayName[{{index}}].property`
- Don't forget the `{{index}}` placeholder in field bindings within repeaters

## Advanced: Nested Repeaters

You can nest repeaters for complex hierarchical data:

```typescript
{
  type: 'repeater',
  binding: 'classes',
  addLabel: 'Add Class',
  itemTemplate: [
    {
      type: 'field',
      fieldType: 'text',
      binding: 'classes[{{index}}].name',
      label: 'Class Name'
    },
    {
      type: 'repeater',
      binding: 'classes[{{index}}].features',  // Nested array
      addLabel: 'Add Feature',
      itemTemplate: [
        {
          type: 'field',
          fieldType: 'text',
          binding: 'classes[{{index}}].features[{{index}}].name',
          label: 'Feature'
        }
      ]
    }
  ]
}
```

**Note**: Nested repeaters are advanced and may require careful data structure management.

## Summary

Repeaters are powerful components for managing array data in your custom forms:
- Simple configuration with `binding` and `itemTemplate`
- Automatic add/remove/reorder controls in edit mode
- Support for constraints (`minItems`, `maxItems`)
- Full layout flexibility within item templates
- Perfect for inventory, spells, features, and any collection data
