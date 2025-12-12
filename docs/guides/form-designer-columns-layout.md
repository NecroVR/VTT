# Form Designer: Columns Layout Type

The Columns layout type provides a simple, intuitive way to create multi-column layouts in your custom forms. It's perfect for creating side-by-side content arrangements without needing to understand CSS Grid syntax.

## When to Use Columns vs Grid

### Use Columns When:
- You want a simple side-by-side layout
- Each column has its own width specification
- You're thinking in terms of "columns" rather than "grid cells"
- You want a straightforward API for common layouts

### Use Grid When:
- You need complex 2D layouts with rows and columns
- You want cells to span multiple columns or rows
- You need more granular control over grid template areas
- You're comfortable with CSS Grid concepts

## Basic Structure

A columns layout consists of:
- **widths**: An array of width specifications (one per column)
- **children**: An array of layout nodes (one per column)
- **gap**: Optional spacing between columns

```json
{
  "type": "columns",
  "id": "my-columns",
  "widths": ["1fr", "2fr"],
  "gap": "1rem",
  "children": [
    // First column content
    {
      "type": "field",
      "id": "name",
      "fieldType": "text",
      "binding": "name",
      "label": "Name"
    },
    // Second column content
    {
      "type": "field",
      "id": "description",
      "fieldType": "textarea",
      "binding": "description",
      "label": "Description"
    }
  ]
}
```

## Width Specifications

The `widths` array accepts any valid CSS width value:

### Fractional Units (fr)
The most flexible option - distributes available space proportionally:
```json
"widths": ["1fr", "2fr", "1fr"]
// Creates 3 columns: left is 25%, middle is 50%, right is 25%
```

### Fixed Pixels (px)
Use for columns that should maintain a specific size:
```json
"widths": ["200px", "1fr"]
// Left column is always 200px, right column fills remaining space
```

### Percentages (%)
Use for relative sizing:
```json
"widths": ["33%", "67%"]
// Left column is 1/3, right column is 2/3
```

### Auto
Use for columns that should fit their content:
```json
"widths": ["auto", "1fr", "auto"]
// Left and right fit content, middle fills remaining space
```

### Mix and Match
You can combine different units:
```json
"widths": ["200px", "1fr", "25%", "auto"]
// 4 columns with mixed sizing strategies
```

## Gap Configuration

The `gap` property controls spacing between columns. If not specified, defaults to `1rem`.

```json
{
  "type": "columns",
  "id": "tight-columns",
  "widths": ["1fr", "1fr"],
  "gap": "0.5rem",  // Tighter spacing
  "children": [...]
}
```

```json
{
  "type": "columns",
  "id": "wide-columns",
  "widths": ["1fr", "1fr"],
  "gap": "2rem",  // More generous spacing
  "children": [...]
}
```

## Common Layout Patterns

### Equal Columns
```json
{
  "type": "columns",
  "id": "equal-cols",
  "widths": ["1fr", "1fr"],
  "children": [...]
}
```

### Sidebar Layout (Left)
```json
{
  "type": "columns",
  "id": "left-sidebar",
  "widths": ["250px", "1fr"],
  "children": [
    // Sidebar content
    {...},
    // Main content
    {...}
  ]
}
```

### Sidebar Layout (Right)
```json
{
  "type": "columns",
  "id": "right-sidebar",
  "widths": ["1fr", "250px"],
  "children": [
    // Main content
    {...},
    // Sidebar content
    {...}
  ]
}
```

### Three Column Layout
```json
{
  "type": "columns",
  "id": "three-cols",
  "widths": ["1fr", "2fr", "1fr"],
  "children": [
    // Left sidebar
    {...},
    // Main content (wider)
    {...},
    // Right sidebar
    {...}
  ]
}
```

### Form with Labels and Inputs
```json
{
  "type": "columns",
  "id": "form-row",
  "widths": ["150px", "1fr"],
  "gap": "0.5rem",
  "children": [
    {
      "type": "static",
      "id": "label",
      "content": "Character Name:"
    },
    {
      "type": "field",
      "id": "name",
      "fieldType": "text",
      "binding": "name"
    }
  ]
}
```

## Nesting Layouts

You can nest columns within columns or combine with other layout types:

```json
{
  "type": "columns",
  "id": "outer-cols",
  "widths": ["1fr", "2fr"],
  "children": [
    // Left column: Simple field
    {
      "type": "field",
      "id": "portrait",
      "fieldType": "image",
      "binding": "portrait"
    },
    // Right column: Nested layout
    {
      "type": "grid",
      "id": "stats-grid",
      "columns": 3,
      "children": [
        {"type": "field", "id": "str", "fieldType": "number", "binding": "stats.strength"},
        {"type": "field", "id": "dex", "fieldType": "number", "binding": "stats.dexterity"},
        {"type": "field", "id": "con", "fieldType": "number", "binding": "stats.constitution"}
      ]
    }
  ]
}
```

## Custom Styling

You can add custom styles to the columns container:

```json
{
  "type": "columns",
  "id": "styled-cols",
  "widths": ["1fr", "1fr"],
  "style": {
    "background": "#f5f5f5",
    "padding": "1rem",
    "border-radius": "4px"
  },
  "children": [...]
}
```

## Visibility Conditions

Like other layout nodes, columns support visibility conditions:

```json
{
  "type": "columns",
  "id": "conditional-cols",
  "widths": ["1fr", "1fr"],
  "visibility": {
    "type": "simple",
    "field": "showAdvanced",
    "operator": "equals",
    "value": true
  },
  "children": [...]
}
```

## Best Practices

1. **Use fractional units for responsive layouts**: `"widths": ["1fr", "2fr"]` adapts better than fixed pixels
2. **Keep gap consistent**: Use the same gap value across your form for visual consistency
3. **Limit nesting depth**: More than 2-3 levels of nested layouts can become hard to maintain
4. **Consider mobile**: Very narrow columns may not work well on small screens
5. **Use semantic grouping**: Group related fields in the same column

## Examples by Use Case

### Character Sheet Header
```json
{
  "type": "columns",
  "id": "header",
  "widths": ["120px", "1fr", "120px"],
  "children": [
    {"type": "field", "id": "portrait", "fieldType": "image", "binding": "portrait"},
    {
      "type": "container",
      "id": "name-info",
      "children": [
        {"type": "field", "id": "name", "fieldType": "text", "binding": "name", "label": "Name"},
        {"type": "field", "id": "class", "fieldType": "text", "binding": "class", "label": "Class"}
      ]
    },
    {"type": "field", "id": "level", "fieldType": "number", "binding": "level", "label": "Level"}
  ]
}
```

### Item Card
```json
{
  "type": "columns",
  "id": "item-card",
  "widths": ["60px", "1fr", "auto"],
  "gap": "0.75rem",
  "children": [
    {"type": "field", "id": "icon", "fieldType": "image", "binding": "icon"},
    {
      "type": "container",
      "id": "details",
      "children": [
        {"type": "field", "id": "name", "fieldType": "text", "binding": "name"},
        {"type": "field", "id": "description", "fieldType": "textarea", "binding": "description"}
      ]
    },
    {"type": "field", "id": "quantity", "fieldType": "number", "binding": "quantity", "label": "Qty"}
  ]
}
```

### Stat Block
```json
{
  "type": "columns",
  "id": "abilities",
  "widths": ["1fr", "1fr", "1fr"],
  "children": [
    {
      "type": "container",
      "id": "physical",
      "children": [
        {"type": "static", "id": "physical-label", "content": "Physical"},
        {"type": "field", "id": "str", "fieldType": "number", "binding": "abilities.strength"},
        {"type": "field", "id": "dex", "fieldType": "number", "binding": "abilities.dexterity"},
        {"type": "field", "id": "con", "fieldType": "number", "binding": "abilities.constitution"}
      ]
    },
    {
      "type": "container",
      "id": "mental",
      "children": [
        {"type": "static", "id": "mental-label", "content": "Mental"},
        {"type": "field", "id": "int", "fieldType": "number", "binding": "abilities.intelligence"},
        {"type": "field", "id": "wis", "fieldType": "number", "binding": "abilities.wisdom"},
        {"type": "field", "id": "cha", "fieldType": "number", "binding": "abilities.charisma"}
      ]
    },
    {
      "type": "container",
      "id": "derived",
      "children": [
        {"type": "static", "id": "derived-label", "content": "Derived"},
        {"type": "computed", "id": "ac", "fieldId": "armor-class"},
        {"type": "field", "id": "hp", "fieldType": "resource", "binding": "hp"},
        {"type": "field", "id": "speed", "fieldType": "number", "binding": "speed"}
      ]
    }
  ]
}
```

## Troubleshooting

### Columns don't align properly
- Check that you have exactly one child per width specification
- Verify your width values add up correctly (for percentages)
- Check for conflicting styles on child elements

### Gap not appearing
- Make sure gap value includes units (e.g., "1rem" not "1")
- Check that gap is not being overridden by custom styles

### Column widths not behaving as expected
- Remember that fractional units (fr) distribute *available* space after fixed units
- Fixed pixel widths don't adapt to screen size
- Auto-sized columns can grow larger than expected if content is wide

## Related Documentation

- [Form Designer: Grid Layout](./form-designer-grid-layout.md)
- [Form Designer: Flex Layout](./form-designer-flex-layout.md)
- [Form Designer: Layout Overview](./form-designer-layouts.md)
