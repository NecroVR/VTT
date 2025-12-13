# Field Type Reference

This document provides detailed information about all available field types in the VTT Form Designer.

## Basic Input Fields

### Text Field
Single-line text input for short text values.

**Configuration:**
- **Placeholder**: Hint text shown when empty
- **Required**: Mark field as mandatory
- **Read Only**: Prevent editing

**Use Cases**: Names, titles, short descriptions

### Number Field
Numeric input with optional validation.

**Configuration:**
- **Min**: Minimum allowed value
- **Max**: Maximum allowed value
- **Step**: Increment/decrement step size
- **Required**: Mark field as mandatory
- **Read Only**: Prevent editing

**Use Cases**: Level, ability scores, hit points, gold pieces

### Textarea
Multi-line text input for longer content.

**Configuration:**
- **Placeholder**: Hint text shown when empty
- **Required**: Mark field as mandatory
- **Read Only**: Prevent editing

**Use Cases**: Descriptions, notes, backstory, spell effects

### Checkbox
Boolean true/false toggle.

**Configuration:**
- **Required**: Mark field as mandatory (must be checked)
- **Read Only**: Prevent toggling

**Use Cases**: Proficiency, attunement, concentration

### Select
Dropdown selection from predefined options.

**Configuration:**
- **Options**: List of value:label pairs (one per line)
  ```
  fighter:Fighter
  wizard:Wizard
  rogue:Rogue
  ```
- **Required**: Mark field as mandatory
- **Read Only**: Prevent selection changes

**Use Cases**: Class, race, alignment, spell school

## Specialized Input Fields

### Dice Field
Dice notation input with validation (e.g., "2d6+3", "1d20").

**Configuration:**
- **Placeholder**: Hint text (defaults to "e.g., 2d6+3")
- **Required**: Mark field as mandatory
- **Read Only**: Prevent editing

**Format**: `[count]d[sides][+/-][modifier]`
- Examples: `1d20`, `2d6+3`, `8d8-2`

**Use Cases**: Damage dice, hit dice, healing rolls

**View Mode**: Displays the dice notation as-is

### Resource Field
Current/max value pair with optional visual progress bar.

**Configuration:**
- **Show Max Value**: Display the max value input (default: true)
- **Show Progress Bar**: Display visual bar showing current/max ratio
- **Bar Color**: Color for the progress bar (hex value, default: #4CAF50)
- **Min**: Minimum value for both current and max
- **Max**: Maximum value for both current and max
- **Required**: Mark field as mandatory
- **Read Only**: Prevent editing

**Data Structure**: Stores as object with `current` and `max` properties
```json
{
  "current": 25,
  "max": 50
}
```

**Use Cases**: Hit points, spell slots, ki points, rage charges

**View Mode**: Displays "current / max" format

### Rating Field
Star/circle/pip rating input with configurable icons.

**Configuration:**
- **Max**: Maximum rating value (1-10, default: 5)
- **Icon Style**: Visual style
  - `stars`: ★ Star icons
  - `circles`: ● Circle icons
  - `pips`: ♦ Diamond pips
- **Required**: Mark field as mandatory
- **Read Only**: Prevent rating changes

**Use Cases**: Difficulty rating, threat level, importance

**View Mode**: Displays filled icons up to the current value

### Slider Field
Range slider for numeric values.

**Configuration:**
- **Min**: Minimum value (default: 0)
- **Max**: Maximum value (default: 100)
- **Step**: Increment size (default: 1)
- **Show Value Label**: Display current value next to slider (default: true)
- **Show Tick Marks**: Display tick marks along slider (default: false)
- **Required**: Mark field as mandatory
- **Read Only**: Disable slider

**Use Cases**: Percentage values, gradual scales, mood/morale

**View Mode**: Displays numeric value only

### Tags Field
Tag list with autocomplete and suggestions.

**Configuration:**
- **Suggestions**: Predefined tag suggestions (one per line)
- **Allow Custom Tags**: Allow user-created tags (default: true)
- **Required**: Mark field as mandatory
- **Read Only**: Prevent adding/removing tags

**Data Structure**: Stores as array of strings
```json
["fire", "concentration", "verbal"]
```

**Usage:**
- Type and press Enter or comma to add a tag
- Click X to remove a tag
- Click suggestions to add them quickly

**Use Cases**: Spell components, damage types, weapon properties, creature types

**View Mode**: Displays tags as colored badges

### Reference Field
Reference to another entity (actor, item, etc.).

**Configuration:**
- **Entity Type**: Type of entity to reference (`actor`, `item`, `spell`, etc.)
- **Allow Creating New Entity**: Enable creating new entities (default: false)
- **Required**: Mark field as mandatory
- **Read Only**: Prevent selection changes

**Data Structure**: Stores entity ID as string

**Use Cases**: Equipped weapon, spellcasting focus, mount, familiar

**View Mode**: Displays entity name (future: clickable link)

**Note**: Currently displays as text input. Full entity picker coming in future update.

### Rich Text Field
Markdown editor with optional preview.

**Configuration:**
- **Show Preview**: Display markdown preview below editor (default: true)
- **Required**: Mark field as mandatory
- **Read Only**: Prevent editing

**Supported Markdown:**
- **Bold**: `**text**`
- *Italic*: `*text*`
- Lists: `- item` or `1. item`
- Links: `[text](url)`
- Headers: `# Heading`

**Use Cases**: Formatted descriptions, spell text, ability text

**View Mode**: Renders markdown as HTML

### Color Field
Color picker with hex value and optional presets.

**Configuration:**
- **Preset Colors**: Comma-separated hex values for quick selection
  ```
  #FF0000, #00FF00, #0000FF, #FFFF00
  ```
- **Required**: Mark field as mandatory
- **Read Only**: Prevent color changes

**Data Structure**: Stores as hex color string (`#RRGGBB`)

**Use Cases**: Token colors, status indicators, theme customization

**View Mode**: Displays color swatch with hex value

### Image Field
Image URL input with thumbnail preview.

**Configuration:**
- **Accepted File Types**: MIME types (default: `image/*`)
- **Max File Size**: Maximum size in bytes (e.g., `5242880` for 5MB)
- **Required**: Mark field as mandatory
- **Read Only**: Prevent URL changes

**Data Structure**: Stores URL as string

**Usage:** Enter image URL to display preview

**Use Cases**: Character portraits, item images, spell icons

**View Mode**: Displays full image (scaled to fit)

**Note**: File upload coming in future update. Currently URL input only.

### Date Field
Date picker with optional time component.

**Configuration:**
- **Include Time**: Show time picker in addition to date (default: false)
- **Date Format**: Display format string (e.g., `YYYY-MM-DD`, `MM/DD/YYYY`)
- **Required**: Mark field as mandatory
- **Read Only**: Prevent date changes

**Data Structure**: Stores as ISO date string

**Use Cases**: Session dates, character birthdays, quest deadlines, rest tracking

**View Mode**: Displays formatted date/time

---

## Examples

### Example: Health Tracker with Resource Field

```
Resource Field
├── Label: "Hit Points"
├── Binding: "hp"
├── Show Max: true
├── Show Bar: true
├── Bar Color: #DC3545 (red)
```

**Result**: Displays "25 / 50" with a red progress bar at 50% full

### Example: Spell Components with Tags Field

```
Tags Field
├── Label: "Components"
├── Binding: "components"
├── Suggestions: ["verbal", "somatic", "material", "concentration"]
├── Allow Custom: false
```

**Result**: User can select from predefined component tags

### Example: Difficulty Rating

```
Rating Field
├── Label: "Encounter Difficulty"
├── Binding: "difficulty"
├── Max: 5
├── Icon Style: stars
```

**Result**: 5-star rating display

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Form Designer Version**: Phase 4.1 (Additional Field Types)
