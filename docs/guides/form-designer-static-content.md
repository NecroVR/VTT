# Form Designer: Static Content Guide

This guide explains how to use static content nodes in the Form Designer to display text, images, icons, and HTML with dynamic property interpolation.

## Overview

Static content nodes allow you to add non-interactive content to your forms. They support:

- **Text** - Plain text content
- **HTML** - Rich HTML formatting
- **Images** - Display images from URLs or entity properties
- **Icons** - Show emoji/Unicode icons
- **Property Interpolation** - Insert entity values using `{{path}}` syntax

## Property Interpolation

All static content types support property interpolation, which allows you to insert entity data into your content using the `{{path}}` syntax.

### Basic Interpolation

Use double curly braces with a property path to insert values:

```json
{
  "type": "static",
  "id": "character-summary",
  "contentType": "text",
  "content": "{{name}} is a level {{level}} {{class}}"
}
```

**Result:** If the entity has `{name: "Aragorn", level: 5, class: "Ranger"}`, this displays:
```
Aragorn is a level 5 Ranger
```

### Nested Property Paths

Access nested properties using dot notation:

```json
{
  "type": "static",
  "contentType": "text",
  "content": "HP: {{hp.current}}/{{hp.max}}"
}
```

**Result:** With `{hp: {current: 25, max: 30}}`, displays:
```
HP: 25/30
```

### Multiple Interpolations

You can use multiple interpolations in a single content string:

```json
{
  "type": "static",
  "contentType": "text",
  "content": "{{name}} - STR {{abilities.strength.value}} DEX {{abilities.dexterity.value}}"
}
```

### Repeater Context

When used inside a repeater, you can reference the current index:

```json
{
  "type": "static",
  "contentType": "text",
  "content": "Item {{index}}: {{name}}"
}
```

## Text Content

The default content type for displaying plain text.

### Example

```json
{
  "type": "static",
  "id": "description-label",
  "contentType": "text",
  "content": "Character Description",
  "style": {
    "font-weight": "bold",
    "margin-bottom": "0.5rem"
  }
}
```

### With Interpolation

```json
{
  "type": "static",
  "contentType": "text",
  "content": "Current XP: {{experience.current}}/{{experience.next}}"
}
```

## HTML Content

Display rich HTML content with formatting and structure.

### Example

```json
{
  "type": "static",
  "id": "help-text",
  "contentType": "html",
  "content": "<div class='help-box'><strong>Note:</strong> This is important information.</div>"
}
```

### With Interpolation

```json
{
  "type": "static",
  "contentType": "html",
  "content": "<h3>{{name}}</h3><p>{{description}}</p>"
}
```

**Security Note:** HTML content is rendered using `@html`, so ensure content is trusted.

## Image Content

Display images from URLs or entity properties.

### Static Image URL

```json
{
  "type": "static",
  "id": "character-portrait",
  "contentType": "image",
  "content": "https://example.com/portraits/character.jpg",
  "alt": "Character portrait",
  "width": "200px",
  "height": "200px"
}
```

### Dynamic Image from Entity

```json
{
  "type": "static",
  "contentType": "image",
  "content": "{{profile.imageUrl}}",
  "alt": "Character image",
  "width": "150px"
}
```

### Properties

- **content** - URL or `{{path}}` to image URL property
- **alt** - Alt text for accessibility (optional)
- **width** - Image width (CSS value, optional)
- **height** - Image height (CSS value, optional)

### Styling

Images automatically scale to fit their container with `max-width: 100%` and `height: auto`.

## Icon Content

Display emoji or Unicode icons for visual indicators.

### Example

```json
{
  "type": "static",
  "id": "weapon-icon",
  "contentType": "icon",
  "content": "sword",
  "size": "24px"
}
```

### Available Icons

The following icon names are supported:

| Name | Icon | Use Case |
|------|------|----------|
| `sword` | ⚔️ | Weapons, combat |
| `shield` | 🛡️ | Defense, armor |
| `heart` | ❤️ | Health, life |
| `star` | ⭐ | Abilities, ratings |
| `fire` | 🔥 | Fire damage, magic |
| `water` | 💧 | Water damage, potions |
| `lightning` | ⚡ | Lightning damage, speed |
| `skull` | 💀 | Death, danger |
| `book` | 📖 | Spells, knowledge |
| `scroll` | 📜 | Spells, documents |
| `potion` | 🧪 | Potions, alchemy |
| `coin` | 🪙 | Currency, wealth |
| `bag` | 🎒 | Inventory, storage |
| `gem` | 💎 | Treasure, value |
| `key` | 🔑 | Access, unlocking |
| `lock` | 🔒 | Locked, secured |
| `crown` | 👑 | Royalty, leadership |
| `dice` | 🎲 | Randomness, rolls |
| `map` | 🗺️ | Navigation, exploration |
| `compass` | 🧭 | Direction, guidance |

### Dynamic Icons

You can use interpolation to select icons dynamically:

```json
{
  "type": "static",
  "contentType": "icon",
  "content": "{{weaponType}}",
  "size": "32px"
}
```

If the entity has `{weaponType: "sword"}`, this will display ⚔️.

### Properties

- **content** - Icon name (see table above) or `{{path}}` to property
- **size** - Font size for the icon (CSS value, optional)

## Common Use Cases

### Character Header

```json
{
  "type": "flex",
  "direction": "row",
  "align": "center",
  "gap": "1rem",
  "children": [
    {
      "type": "static",
      "contentType": "image",
      "content": "{{profile.avatar}}",
      "alt": "Character portrait",
      "width": "80px",
      "height": "80px"
    },
    {
      "type": "container",
      "children": [
        {
          "type": "static",
          "contentType": "html",
          "content": "<h2>{{name}}</h2>"
        },
        {
          "type": "static",
          "contentType": "text",
          "content": "Level {{level}} {{race}} {{class}}"
        }
      ]
    }
  ]
}
```

### Health Bar Label

```json
{
  "type": "flex",
  "direction": "row",
  "align": "center",
  "gap": "0.5rem",
  "children": [
    {
      "type": "static",
      "contentType": "icon",
      "content": "heart",
      "size": "20px"
    },
    {
      "type": "static",
      "contentType": "text",
      "content": "HP: {{hp.current}}/{{hp.max}}"
    }
  ]
}
```

### Inventory Item (Repeater)

```json
{
  "type": "repeater",
  "binding": "inventory.items",
  "itemTemplate": [
    {
      "type": "flex",
      "direction": "row",
      "align": "center",
      "gap": "0.5rem",
      "children": [
        {
          "type": "static",
          "contentType": "icon",
          "content": "{{iconName}}",
          "size": "24px"
        },
        {
          "type": "static",
          "contentType": "text",
          "content": "{{name}} (x{{quantity}})"
        }
      ]
    }
  ]
}
```

### Ability Score Display

```json
{
  "type": "flex",
  "direction": "column",
  "align": "center",
  "children": [
    {
      "type": "static",
      "contentType": "text",
      "content": "STR",
      "style": {
        "font-size": "0.75rem",
        "font-weight": "bold"
      }
    },
    {
      "type": "static",
      "contentType": "html",
      "content": "<div style='font-size: 2rem'>{{abilities.strength.value}}</div>"
    },
    {
      "type": "static",
      "contentType": "text",
      "content": "Modifier: {{abilities.strength.modifier}}"
    }
  ]
}
```

## Styling Static Content

All static content nodes support the `style` property for inline CSS:

```json
{
  "type": "static",
  "contentType": "text",
  "content": "Important Note",
  "style": {
    "color": "red",
    "font-weight": "bold",
    "background-color": "#fff3cd",
    "padding": "0.5rem",
    "border-radius": "4px"
  }
}
```

## Best Practices

1. **Use Appropriate Content Types**
   - Use `text` for simple labels and values
   - Use `html` when you need formatting or structure
   - Use `image` for visual content
   - Use `icon` for small visual indicators

2. **Property Interpolation**
   - Always use exact property paths that exist in your entity
   - Missing properties will render as empty strings
   - Test your interpolations with sample data

3. **Image Sizing**
   - Specify `width` and `height` for consistent layouts
   - Use responsive units (`%`, `rem`) for flexible designs
   - Provide `alt` text for accessibility

4. **Icons**
   - Use icons to enhance visual recognition
   - Keep icon sizes consistent (16px-32px typically)
   - Don't rely solely on icons; include text labels

5. **Performance**
   - Avoid very large images; resize before upload
   - Use HTML sparingly; prefer simple text when possible
   - Test forms with realistic entity data

## Troubleshooting

**Interpolation not working?**
- Check the property path matches your entity structure exactly
- Ensure the property exists and has a value
- Use browser dev tools to inspect the entity data

**Image not displaying?**
- Verify the URL is correct and accessible
- Check browser console for CORS or network errors
- Ensure the interpolated property contains a valid URL

**Icon showing as text?**
- Verify you're using a supported icon name (see table above)
- Check that `contentType` is set to `'icon'`
- Try using a literal icon name first before interpolation

**HTML not rendering?**
- Ensure `contentType` is set to `'html'`
- Check HTML is valid
- Be aware of security implications of user-generated HTML
