# FieldGroup Node Usage Examples

The `FieldGroupNode` standardizes the label+input+help pattern across forms, similar to FoundryVTT's `formGroup` helper.

## Basic Structure

```typescript
interface FieldGroupNode extends BaseLayoutNode {
  type: 'fieldGroup';
  layout?: 'stacked' | 'inline' | 'slim';  // default: 'stacked'
  label?: LocalizedString;
  helpText?: LocalizedString;
  required?: boolean;
  labelWidth?: string;  // for inline layout, e.g., '120px' or '30%'
  children: LayoutNode[];  // Should contain field nodes
}
```

## Example 1: Basic Stacked Layout

```typescript
{
  id: 'char-name-group',
  type: 'fieldGroup',
  layout: 'stacked',  // or omit, as stacked is default
  label: { literal: 'Character Name' },
  helpText: { literal: 'Enter your character\'s full name' },
  required: true,
  children: [
    {
      id: 'char-name-field',
      type: 'field',
      fieldType: 'text',
      binding: 'name'
    }
  ]
}
```

**Result:**
```
[Label] Character Name *
[Input] _________________
[Help]  Enter your character's full name
```

## Example 2: Inline Layout

```typescript
{
  id: 'strength-group',
  type: 'fieldGroup',
  layout: 'inline',
  label: { literal: 'Strength' },
  labelWidth: '100px',
  required: false,
  children: [
    {
      id: 'strength-field',
      type: 'field',
      fieldType: 'number',
      binding: 'attributes.strength.value',
      options: {
        min: 1,
        max: 20
      }
    }
  ]
}
```

**Result:**
```
[Label: 100px width] Strength  [Input] [__]
```

## Example 3: Slim Layout (Compact)

```typescript
{
  id: 'hp-group',
  type: 'fieldGroup',
  layout: 'slim',
  label: { literal: 'Hit Points' },
  children: [
    {
      id: 'hp-field',
      type: 'field',
      fieldType: 'resource',
      binding: 'hp',
      options: {
        showMax: true,
        showBar: true,
        barColor: '#4CAF50'
      }
    }
  ]
}
```

**Result:** (compact spacing)
```
[Label] Hit Points
[Input] [10] / [20]
[Bar]   ███████░░░
```

## Example 4: Multiple Fields in Group

```typescript
{
  id: 'armor-group',
  type: 'fieldGroup',
  label: { literal: 'Armor' },
  helpText: { literal: 'Select armor type and enter AC bonus' },
  children: [
    {
      id: 'armor-type',
      type: 'field',
      fieldType: 'select',
      binding: 'armor.type',
      options: {
        options: [
          { value: 'light', label: { literal: 'Light' } },
          { value: 'medium', label: { literal: 'Medium' } },
          { value: 'heavy', label: { literal: 'Heavy' } }
        ]
      }
    },
    {
      id: 'armor-ac',
      type: 'field',
      fieldType: 'number',
      binding: 'armor.ac',
      label: { literal: 'AC Bonus' }
    }
  ]
}
```

## Example 5: Localized Labels

```typescript
{
  id: 'background-group',
  type: 'fieldGroup',
  label: {
    localeKey: 'character.background.label',
    literal: 'Background'  // Fallback
  },
  helpText: {
    localeKey: 'character.background.help',
    literal: 'Choose your character\'s background'
  },
  children: [
    {
      id: 'background-field',
      type: 'field',
      fieldType: 'select',
      binding: 'background'
    }
  ]
}
```

## Example 6: Conditional Field Group

```typescript
{
  id: 'spellcaster-group',
  type: 'fieldGroup',
  label: { literal: 'Spellcasting' },
  visibility: {
    type: 'simple',
    field: 'class',
    operator: 'equals',
    value: 'wizard'
  },
  children: [
    {
      id: 'spell-slots',
      type: 'field',
      fieldType: 'number',
      binding: 'spellSlots'
    }
  ]
}
```

## Example 7: Nested in Grid Layout

```typescript
{
  id: 'abilities-grid',
  type: 'grid',
  columns: 2,
  gap: '1rem',
  children: [
    {
      id: 'str-group',
      type: 'fieldGroup',
      layout: 'inline',
      label: { literal: 'STR' },
      labelWidth: '60px',
      children: [
        {
          id: 'str-field',
          type: 'field',
          fieldType: 'number',
          binding: 'abilities.strength'
        }
      ]
    },
    {
      id: 'dex-group',
      type: 'fieldGroup',
      layout: 'inline',
      label: { literal: 'DEX' },
      labelWidth: '60px',
      children: [
        {
          id: 'dex-field',
          type: 'field',
          fieldType: 'number',
          binding: 'abilities.dexterity'
        }
      ]
    },
    {
      id: 'con-group',
      type: 'fieldGroup',
      layout: 'inline',
      label: { literal: 'CON' },
      labelWidth: '60px',
      children: [
        {
          id: 'con-field',
          type: 'field',
          fieldType: 'number',
          binding: 'abilities.constitution'
        }
      ]
    },
    {
      id: 'int-group',
      type: 'fieldGroup',
      layout: 'inline',
      label: { literal: 'INT' },
      labelWidth: '60px',
      children: [
        {
          id: 'int-field',
          type: 'field',
          fieldType: 'number',
          binding: 'abilities.intelligence'
        }
      ]
    }
  ]
}
```

## CSS Classes Applied

The FieldGroup renderer applies the following CSS classes:

- `.form-group` - Base container class
- `.form-group.stacked` - For stacked layout
- `.form-group.inline` - For inline layout
- `.form-group.slim` - For slim/compact layout
- `.form-group.required` - When `required: true`
- `.form-label` - Label element
- `.form-label.required` - Label when field is required
- `.required-indicator` - The asterisk (*) for required fields
- `.form-field-container` - Container for child fields
- `.form-help` - Help text element

## Styling Customization

You can customize the appearance using CSS variables:

```css
.form-group {
  --text-color: #333;
  --muted-color: #666;
  --danger-color: #c00;
}
```

Or add custom styles via the `style` property:

```typescript
{
  type: 'fieldGroup',
  label: { literal: 'Custom Styled' },
  style: {
    'background-color': '#f5f5f5',
    'padding': '1rem',
    'border-radius': '8px'
  },
  children: [...]
}
```

## Best Practices

1. **Use for Consistency**: Use FieldGroup for all labeled fields to maintain visual consistency
2. **Inline for Forms**: Use inline layout for form-like interfaces (labels on left, fields on right)
3. **Stacked for Mobile**: Stacked layout works better on narrow screens
4. **Slim for Compact**: Use slim layout when space is limited
5. **Set Label Width**: For inline layouts, set a consistent `labelWidth` for alignment
6. **Add Help Text**: Provide `helpText` for fields that may be confusing
7. **Mark Required**: Always set `required: true` for mandatory fields

## Integration with Existing Field Nodes

FieldGroup works seamlessly with all existing field types:

- `text`, `number`, `textarea`
- `checkbox`, `select`
- `resource`, `rating`, `slider`
- `tags`, `color`, `date`
- `richtext`, `image`
- `dice`, `reference`

And can contain other layout nodes too (though fields are most common).
