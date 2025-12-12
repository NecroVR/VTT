# D&D 5e SRD Module

This directory contains the D&D 5th Edition System Reference Document (SRD) content module for the VTT platform.

## Overview

The D&D 5e SRD module provides official open-licensed game content that can be loaded into campaigns using the new EAV (Entity-Attribute-Value) module system. This includes weapons, armor, spells, monsters, races, classes, and more.

## Module Structure

```
dnd5e-ogl/
├── module.json              # Module manifest (NEW - EAV format)
├── manifest.json            # Legacy game system manifest
├── system.json              # Game system definition (attributes, skills, etc.)
├── compendium/              # Content files (entities)
│   ├── items/
│   │   └── simple-melee-weapons.json
│   ├── spells/              # (planned)
│   ├── monsters/            # (planned)
│   ├── races/               # (planned)
│   └── classes/             # (planned)
├── templates/               # Item templates (schemas)
│   ├── items/
│   │   ├── weapon.json
│   │   ├── armor.json
│   │   ├── spell.json
│   │   └── ...
│   ├── character.json
│   └── monster.json
├── content/                 # Frontend content (UI components)
├── styles/                  # CSS styles
└── i18n/                    # Localization files
```

## Module Manifest (`module.json`)

The `module.json` file defines the module metadata and content paths for the new EAV module system.

### Key Fields

| Field | Description |
|-------|-------------|
| `moduleId` | Unique identifier: `"dnd5e-srd"` |
| `gameSystemId` | Game system: `"dnd5e-ogl"` |
| `name` | Display name |
| `version` | Semantic version |
| `author` | Content creator |
| `moduleType` | Type: `"content"`, `"mechanics"`, or `"integration"` |
| `isOfficial` | Whether this is official content |
| `license` | License information (OGL 1.0a) |
| `entities` | Array of entity file paths to load |
| `dependencies` | Other modules this module depends on |
| `data` | Additional metadata (JSONB) |

### Example

```json
{
  "moduleId": "dnd5e-srd",
  "gameSystemId": "dnd5e-ogl",
  "name": "D&D 5e System Reference Document",
  "version": "1.0.0",
  "author": "Wizards of the Coast",
  "moduleType": "content",
  "isOfficial": true,
  "license": "OGL 1.0a",
  "entities": [
    "compendium/items/simple-melee-weapons.json",
    "compendium/items/simple-ranged-weapons.json"
  ]
}
```

## Entity File Formats

### Current Format (Compendium Batch)

The existing compendium files use a batch format with an `entries` array:

```json
{
  "compendiumId": "dnd5e-srd-weapons-simple-melee",
  "name": "Simple Melee Weapons",
  "templateId": "dnd5e-weapon",
  "source": "SRD 5.1",
  "entries": [
    {
      "id": "club",
      "name": "Club",
      "img": "icons/weapons/clubs/club-wood.webp",
      "description": "A simple wooden club.",
      "templateId": "dnd5e-weapon",
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d4",
        "damageType": "bludgeoning",
        "properties": ["light"],
        "weight": 2,
        "price": 0.1
      }
    }
  ]
}
```

### Target Format (EAV Entity)

The ModuleLoader expects entity files in this format:

**Single Entity:**
```json
{
  "id": "club",
  "entityType": "item",
  "name": "Club",
  "description": "A simple wooden club.",
  "img": "icons/weapons/clubs/club-wood.webp",
  "templateId": "dnd5e-weapon",
  "tags": ["weapon", "simple", "melee"],
  "data": {
    "weaponType": "simple-melee",
    "damage": "1d4",
    "damageType": "bludgeoning"
  }
}
```

**Array of Entities:**
```json
[
  {
    "id": "club",
    "entityType": "item",
    "name": "Club",
    ...
  },
  {
    "id": "dagger",
    "entityType": "item",
    "name": "Dagger",
    ...
  }
]
```

### Migration Required

The current compendium files need to be updated to work with the ModuleLoader. Options:

1. **Update ModuleLoader** - Add support for the `entries` wrapper format
2. **Restructure Files** - Convert compendium files to the expected format
3. **Add Converter** - Create a migration script to transform files

## Loading Modules

Modules are loaded using the `ModuleLoaderService`:

```typescript
import { ModuleLoaderService } from './services/moduleLoader';

const loader = new ModuleLoaderService();

// Load module from file system into database
const module = await loader.loadModule(
  db,
  'game-systems/core/dnd5e-ogl',
  {
    validate: true,
    skipInvalid: false,
    authorUserId: 'system'
  }
);

// Reload updated module
await loader.reloadModule(db, 'dnd5e-srd', 'game-systems/core/dnd5e-ogl');

// Get module status
const status = await loader.getModuleStatus(db, 'dnd5e-srd');
console.log(`Loaded ${status.entityCount} entities with ${status.propertyCount} properties`);
```

## EAV Database Schema

When loaded, module content is stored in the following tables:

### `modules` Table
- Module metadata (id, name, version, etc.)
- Validation status
- Source path and hash for change detection

### `module_entities` Table
- Entity metadata (id, name, description, img)
- Entity type (item, spell, monster, etc.)
- Template reference
- Search text and tags

### `entity_properties` Table (EAV Core)
- Flattened properties as rows
- Property key and path (e.g., `"damage.dice"`)
- Typed value columns (string, number, integer, boolean, json, reference)
- Array support with index tracking

### Example: Club Weapon

**Entity Record:**
```
id: 550e8400-e29b-41d4-a716-446655440000
moduleId: <module-uuid>
entityId: "club"
entityType: "item"
name: "Club"
templateId: "dnd5e-weapon"
```

**Property Records:**
```
| property_key      | value_type | value_string    | value_number | value_integer |
|-------------------|------------|-----------------|--------------|---------------|
| weaponType        | string     | "simple-melee"  | null         | null          |
| damage            | string     | "1d4"           | null         | null          |
| damageType        | string     | "bludgeoning"   | null         | null          |
| properties.0      | string     | "light"         | null         | null          |
| weight            | integer    | null            | null         | 2             |
| price             | number     | null            | 0.1          | null          |
```

## Campaign Integration

Modules are loaded into campaigns via the `campaign_modules` junction table:

```typescript
// Add module to campaign
await db.insert(campaignModules).values({
  campaignId: '<campaign-uuid>',
  moduleId: '<module-uuid>',
  loadOrder: 0,
  isActive: true
});
```

**Important:** Modules must share the same `gameSystemId` as the campaign.

## Validation

The module system includes two-stage validation:

1. **Load Validation** - Checks manifest structure and required fields
2. **Reload Validation** - Re-validates on file changes

Validation errors are stored in the `modules.validationErrors` JSONB column and can be displayed to users for resolution.

## License

This content is released under the **Open Game License Version 1.0a (OGL 1.0a)**.

- **Source**: Wizards of the Coast D&D 5e SRD
- **Version**: SRD 5.1
- **Released**: January 12, 2016
- **Homepage**: https://dnd.wizards.com/resources/systems-reference-document

Product Identity (copyrighted material) is not included. See LICENSE.txt for complete terms.

## Planned Content

The module will eventually include:

### Items
- **Weapons**: Simple/martial, melee/ranged
- **Armor**: Light, medium, heavy, shields
- **Equipment**: Adventuring gear, tools, mounts, vehicles
- **Magic Items**: Potions, scrolls, wands, rings, wondrous items

### Spells
- All SRD spells (cantrips through 9th level)
- Organized by school (abjuration, evocation, etc.)

### Monsters
- All SRD monsters
- CR 0 through CR 30
- All creature types

### Character Options
- **Races**: Dwarf, elf, halfling, human, dragonborn, gnome, half-elf, half-orc, tiefling
- **Classes**: All 12 core classes with subclasses
- **Backgrounds**: Acolyte, criminal, folk hero, noble, sage, soldier
- **Features**: Class features, feats, racial traits

### Conditions
- All standard conditions (blinded, charmed, etc.)
- Exhaustion levels

## Development

### Adding New Content

1. Create entity JSON file in appropriate `compendium/` subdirectory
2. Add file path to `module.json` `entities` array
3. Reload module using `ModuleLoaderService.reloadModule()`
4. Verify in database using `getModuleStatus()`

### Testing

```bash
# Test module loading
pnpm test moduleLoader

# Validate module manifest
pnpm run validate:modules

# Check database content
psql -U claude -d vtt -c "SELECT * FROM modules WHERE module_id = 'dnd5e-srd';"
```

## References

- [EAV Module Schema](../../../docs/architecture/EAV_MODULE_SCHEMA.md)
- [Module Types](../../../packages/shared/src/types/modules.ts)
- [ModuleLoader Service](../../../apps/server/src/services/moduleLoader.ts)
- [Compendium System](../../../docs/architecture/COMPENDIUM_SYSTEM.md)
