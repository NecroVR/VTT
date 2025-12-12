# Compendium System Architecture

## Overview

The Compendium System provides a file-based framework for defining game content (items, spells, races, classes, monsters, etc.) that can be loaded at runtime and used across campaigns. Content is stored as JSON files within game system folders, NOT in the database.

## Design Principles

1. **File-Based**: All templates and compendium entries are JSON files
2. **Game-System Scoped**: Each game system defines its own content
3. **Hierarchical**: Templates define structure, entries provide instances
4. **Extensible**: Easy to add new entity types without code changes
5. **Shareable**: Content packs can be distributed as folders

## Directory Structure

```
game-systems/
├── core/
│   └── dnd5e-ogl/
│       ├── system.json                 # System manifest
│       │
│       ├── templates/                  # Structure definitions
│       │   ├── _base/                  # Base templates (inherited by others)
│       │   │   └── entity.json         # Common fields for all entities
│       │   ├── items/
│       │   │   ├── _item.json          # Base item template
│       │   │   ├── weapon.json
│       │   │   ├── armor.json
│       │   │   ├── spell.json
│       │   │   └── consumable.json
│       │   ├── actors/
│       │   │   ├── character.json
│       │   │   ├── npc.json
│       │   │   └── monster.json
│       │   ├── features/
│       │   │   ├── class-feature.json
│       │   │   ├── racial-trait.json
│       │   │   └── feat.json
│       │   └── journal/
│       │       ├── race.json
│       │       ├── class.json
│       │       └── background.json
│       │
│       └── compendium/                 # Actual content entries
│           ├── items/
│           │   ├── weapons/
│           │   │   ├── simple-melee.json
│           │   │   ├── simple-ranged.json
│           │   │   ├── martial-melee.json
│           │   │   └── martial-ranged.json
│           │   ├── armor/
│           │   │   ├── light-armor.json
│           │   │   ├── medium-armor.json
│           │   │   └── heavy-armor.json
│           │   └── magic-items/
│           │       ├── common.json
│           │       ├── uncommon.json
│           │       └── rare.json
│           ├── spells/
│           │   ├── cantrips.json
│           │   ├── level-1.json
│           │   ├── level-2.json
│           │   └── ...
│           ├── monsters/
│           │   ├── cr-0-1.json
│           │   ├── cr-2-4.json
│           │   └── ...
│           ├── races/
│           │   └── core-races.json
│           ├── classes/
│           │   └── core-classes.json
│           └── backgrounds/
│               └── core-backgrounds.json
│
└── community/
    └── dnd5e-homebrew/
        ├── system.json
        ├── templates/
        └── compendium/
```

## File Formats

### Template File (defines structure)

Templates define the **schema** for a category of entries. They specify what fields are available, their types, validation rules, and UI layout.

```json
// templates/items/weapon.json
{
  "id": "dnd5e-weapon",
  "name": "Weapon",
  "extends": "_item",
  "entityType": "item",
  "category": "weapon",

  "fields": [
    {
      "id": "weaponType",
      "name": "Weapon Type",
      "fieldType": "select",
      "required": true,
      "options": [
        { "value": "simple-melee", "label": "Simple Melee" },
        { "value": "simple-ranged", "label": "Simple Ranged" },
        { "value": "martial-melee", "label": "Martial Melee" },
        { "value": "martial-ranged", "label": "Martial Ranged" }
      ]
    },
    {
      "id": "damage",
      "name": "Damage",
      "fieldType": "dice",
      "required": true,
      "placeholder": "1d8"
    },
    {
      "id": "damageType",
      "name": "Damage Type",
      "fieldType": "select",
      "options": [
        { "value": "slashing", "label": "Slashing" },
        { "value": "piercing", "label": "Piercing" },
        { "value": "bludgeoning", "label": "Bludgeoning" }
      ]
    },
    {
      "id": "properties",
      "name": "Properties",
      "fieldType": "multiselect",
      "options": [
        { "value": "ammunition", "label": "Ammunition" },
        { "value": "finesse", "label": "Finesse" },
        { "value": "heavy", "label": "Heavy" },
        { "value": "light", "label": "Light" },
        { "value": "loading", "label": "Loading" },
        { "value": "range", "label": "Range" },
        { "value": "reach", "label": "Reach" },
        { "value": "thrown", "label": "Thrown" },
        { "value": "two-handed", "label": "Two-Handed" },
        { "value": "versatile", "label": "Versatile" }
      ]
    },
    {
      "id": "range",
      "name": "Range",
      "fieldType": "text",
      "placeholder": "20/60"
    }
  ],

  "physical": {
    "hasWeight": true,
    "hasPrice": true,
    "hasQuantity": true,
    "stackable": false,
    "weightUnit": "lb",
    "priceUnit": "gp"
  },

  "equippable": {
    "equipSlots": ["mainHand", "offHand", "twoHand"],
    "requiresAttunement": false
  },

  "rolls": [
    {
      "id": "attack",
      "name": "Attack Roll",
      "formula": "1d20 + @actor.attributes.strength.mod + @actor.proficiencyBonus"
    },
    {
      "id": "damage",
      "name": "Damage Roll",
      "formula": "@item.damage + @actor.attributes.strength.mod"
    }
  ],

  "sections": [
    {
      "id": "basic",
      "name": "Basic Info",
      "fields": ["name", "img", "description", "weaponType"]
    },
    {
      "id": "combat",
      "name": "Combat",
      "fields": ["damage", "damageType", "properties", "range"]
    },
    {
      "id": "details",
      "name": "Details",
      "fields": ["weight", "price", "rarity"]
    }
  ]
}
```

### Compendium File (actual content)

Compendium files contain arrays of **entries** - actual game content that players can use.

```json
// compendium/items/weapons/simple-melee.json
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
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d4",
        "damageType": "bludgeoning",
        "properties": ["light"],
        "weight": 2,
        "price": 0.1
      }
    },
    {
      "id": "dagger",
      "name": "Dagger",
      "img": "icons/weapons/daggers/dagger-steel.webp",
      "description": "A small, easily concealed blade.",
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d4",
        "damageType": "piercing",
        "properties": ["finesse", "light", "thrown"],
        "range": "20/60",
        "weight": 1,
        "price": 2
      }
    },
    {
      "id": "greatclub",
      "name": "Greatclub",
      "img": "icons/weapons/clubs/club-heavy-wood.webp",
      "description": "A large, two-handed club.",
      "data": {
        "weaponType": "simple-melee",
        "damage": "1d8",
        "damageType": "bludgeoning",
        "properties": ["two-handed"],
        "weight": 10,
        "price": 0.2
      }
    }
  ]
}
```

### Spell Template & Entries

```json
// templates/items/spell.json
{
  "id": "dnd5e-spell",
  "name": "Spell",
  "extends": "_item",
  "entityType": "item",
  "category": "spell",

  "fields": [
    {
      "id": "level",
      "name": "Spell Level",
      "fieldType": "select",
      "required": true,
      "options": [
        { "value": "0", "label": "Cantrip" },
        { "value": "1", "label": "1st Level" },
        { "value": "2", "label": "2nd Level" },
        { "value": "3", "label": "3rd Level" },
        { "value": "4", "label": "4th Level" },
        { "value": "5", "label": "5th Level" },
        { "value": "6", "label": "6th Level" },
        { "value": "7", "label": "7th Level" },
        { "value": "8", "label": "8th Level" },
        { "value": "9", "label": "9th Level" }
      ]
    },
    {
      "id": "school",
      "name": "School",
      "fieldType": "select",
      "options": [
        { "value": "abjuration", "label": "Abjuration" },
        { "value": "conjuration", "label": "Conjuration" },
        { "value": "divination", "label": "Divination" },
        { "value": "enchantment", "label": "Enchantment" },
        { "value": "evocation", "label": "Evocation" },
        { "value": "illusion", "label": "Illusion" },
        { "value": "necromancy", "label": "Necromancy" },
        { "value": "transmutation", "label": "Transmutation" }
      ]
    },
    {
      "id": "castingTime",
      "name": "Casting Time",
      "fieldType": "text",
      "placeholder": "1 action"
    },
    {
      "id": "range",
      "name": "Range",
      "fieldType": "text",
      "placeholder": "120 feet"
    },
    {
      "id": "components",
      "name": "Components",
      "fieldType": "multiselect",
      "options": [
        { "value": "V", "label": "Verbal" },
        { "value": "S", "label": "Somatic" },
        { "value": "M", "label": "Material" }
      ]
    },
    {
      "id": "materials",
      "name": "Material Components",
      "fieldType": "text"
    },
    {
      "id": "duration",
      "name": "Duration",
      "fieldType": "text",
      "placeholder": "Instantaneous"
    },
    {
      "id": "concentration",
      "name": "Concentration",
      "fieldType": "boolean",
      "defaultValue": false
    },
    {
      "id": "ritual",
      "name": "Ritual",
      "fieldType": "boolean",
      "defaultValue": false
    },
    {
      "id": "classes",
      "name": "Spell Lists",
      "fieldType": "multiselect",
      "options": [
        { "value": "bard", "label": "Bard" },
        { "value": "cleric", "label": "Cleric" },
        { "value": "druid", "label": "Druid" },
        { "value": "paladin", "label": "Paladin" },
        { "value": "ranger", "label": "Ranger" },
        { "value": "sorcerer", "label": "Sorcerer" },
        { "value": "warlock", "label": "Warlock" },
        { "value": "wizard", "label": "Wizard" }
      ]
    },
    {
      "id": "damage",
      "name": "Damage/Effect",
      "fieldType": "dice"
    },
    {
      "id": "save",
      "name": "Saving Throw",
      "fieldType": "select",
      "options": [
        { "value": "none", "label": "None" },
        { "value": "str", "label": "Strength" },
        { "value": "dex", "label": "Dexterity" },
        { "value": "con", "label": "Constitution" },
        { "value": "int", "label": "Intelligence" },
        { "value": "wis", "label": "Wisdom" },
        { "value": "cha", "label": "Charisma" }
      ]
    },
    {
      "id": "atHigherLevels",
      "name": "At Higher Levels",
      "fieldType": "textarea"
    }
  ],

  "physical": {
    "hasWeight": false,
    "hasPrice": false,
    "hasQuantity": false,
    "stackable": false
  },

  "activation": {
    "type": "action"
  }
}
```

```json
// compendium/spells/level-1.json
{
  "compendiumId": "dnd5e-srd-spells-1",
  "name": "1st Level Spells",
  "templateId": "dnd5e-spell",
  "source": "SRD 5.1",

  "entries": [
    {
      "id": "burning-hands",
      "name": "Burning Hands",
      "img": "icons/magic/fire/flame-burning-hand.webp",
      "description": "As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one.",
      "data": {
        "level": "1",
        "school": "evocation",
        "castingTime": "1 action",
        "range": "Self (15-foot cone)",
        "components": ["V", "S"],
        "duration": "Instantaneous",
        "concentration": false,
        "ritual": false,
        "classes": ["sorcerer", "wizard"],
        "damage": "3d6",
        "save": "dex",
        "atHigherLevels": "When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st."
      }
    },
    {
      "id": "magic-missile",
      "name": "Magic Missile",
      "img": "icons/magic/light/projectile-bolt-blue.webp",
      "description": "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4+1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.",
      "data": {
        "level": "1",
        "school": "evocation",
        "castingTime": "1 action",
        "range": "120 feet",
        "components": ["V", "S"],
        "duration": "Instantaneous",
        "concentration": false,
        "ritual": false,
        "classes": ["sorcerer", "wizard"],
        "damage": "3d4+3",
        "save": "none",
        "atHigherLevels": "When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st."
      }
    }
  ]
}
```

### Race/Class Templates (Journal Entries)

For character options that aren't "owned" by an actor but referenced:

```json
// templates/journal/race.json
{
  "id": "dnd5e-race",
  "name": "Race",
  "entityType": "journal",
  "category": "race",

  "fields": [
    {
      "id": "abilityScoreIncrease",
      "name": "Ability Score Increase",
      "fieldType": "text"
    },
    {
      "id": "age",
      "name": "Age",
      "fieldType": "textarea"
    },
    {
      "id": "size",
      "name": "Size",
      "fieldType": "select",
      "options": [
        { "value": "tiny", "label": "Tiny" },
        { "value": "small", "label": "Small" },
        { "value": "medium", "label": "Medium" },
        { "value": "large", "label": "Large" }
      ]
    },
    {
      "id": "speed",
      "name": "Speed",
      "fieldType": "number",
      "defaultValue": 30
    },
    {
      "id": "languages",
      "name": "Languages",
      "fieldType": "multiselect"
    },
    {
      "id": "traits",
      "name": "Racial Traits",
      "fieldType": "reference_list",
      "referenceType": "racial-trait"
    },
    {
      "id": "subraces",
      "name": "Subraces",
      "fieldType": "reference_list",
      "referenceType": "subrace"
    }
  ]
}
```

## Loading Architecture

### Game System Loader Flow

```
1. Server Startup
   └── gameSystemLoader.loadAllSystems()
       ├── Scan game-systems/core/ and game-systems/community/
       ├── For each system folder:
       │   ├── Load system.json (manifest)
       │   ├── Load templates/ folder
       │   │   ├── Build template inheritance tree
       │   │   └── Resolve "extends" references
       │   └── Load compendium/ folder
       │       ├── Index all entries by ID
       │       └── Build search indices
       └── Store in memory (GameSystemRegistry)

2. API Request for Compendium
   └── GET /api/v1/compendium/:systemId/:type
       ├── Look up in GameSystemRegistry
       ├── Apply filters/search
       └── Return paginated results

3. Add Entry to Actor
   └── POST /api/v1/actors/:actorId/items
       ├── Receive compendium entry reference
       ├── Copy entry data to new Item record
       ├── Store in database with actorId
       └── Return created Item
```

### In-Memory Data Structure

```typescript
interface GameSystemRegistry {
  systems: Map<string, LoadedGameSystem>;
}

interface LoadedGameSystem {
  manifest: GameSystemManifest;
  system: GameSystem;

  // Templates indexed by ID
  templates: Map<string, ResolvedTemplate>;

  // Compendium entries indexed by type, then ID
  compendium: {
    items: Map<string, CompendiumEntry>;
    spells: Map<string, CompendiumEntry>;
    monsters: Map<string, CompendiumEntry>;
    races: Map<string, CompendiumEntry>;
    classes: Map<string, CompendiumEntry>;
    features: Map<string, CompendiumEntry>;
    backgrounds: Map<string, CompendiumEntry>;
  };

  // Search indices
  searchIndex: SearchIndex;
}

interface CompendiumEntry {
  id: string;
  name: string;
  img?: string;
  description?: string;
  templateId: string;
  source: string;
  data: Record<string, any>;
}
```

## API Endpoints

### Templates API

```
GET /api/v1/systems/:systemId/templates
GET /api/v1/systems/:systemId/templates/:templateId
```

### Compendium API

```
# List compendium entries with filtering
GET /api/v1/compendium/:systemId/:type
    ?search=fireball
    &filter[level]=1
    &filter[school]=evocation
    &page=1
    &limit=20

# Get single entry
GET /api/v1/compendium/:systemId/:type/:entryId

# Add entry to actor (creates database record)
POST /api/v1/actors/:actorId/items
{
  "fromCompendium": {
    "systemId": "dnd5e-ogl",
    "type": "items",
    "entryId": "longsword"
  }
}
```

## UI Integration

### Assets Tab Structure

```
┌─────────────────────────────────────────┐
│  Assets                                 │
│  ┌────────┐ ┌────────┐ ┌──────────────┐ │
│  │ Files  │ │ Items  │ │ Spells/Other │ │
│  └────────┘ └────────┘ └──────────────┘ │
├─────────────────────────────────────────┤
│  [Search...] [Category ▼] [Source ▼]    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ 🗡️ Longsword                        ││
│  │ Martial Melee | 1d8 slashing        ││
│  │ [View] [Add to Actor ▼]             ││
│  ├─────────────────────────────────────┤│
│  │ 🗡️ Dagger                           ││
│  │ Simple Melee | 1d4 piercing         ││
│  │ [View] [Add to Actor ▼]             ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Add to Actor Flow

1. Click "Add to Actor" dropdown
2. Shows list of actors in campaign
3. Select actor → Creates copy in database
4. Item now appears in actor's inventory

## Database Storage

**Only store in database:**
- Actor-attached instances (items with actorId)
- Custom/homebrew entries created by users
- Modifications to compendium entries

**Never store in database:**
- Game system templates (loaded from files)
- SRD/official compendium entries (loaded from files)

## Migration Path

1. Move existing `templates/items/` to new structure
2. Create compendium folder with item entries
3. Update gameSystemLoader to load new structure
4. Add compendium API endpoints
5. Update Assets tab UI
6. Update actor item creation to support compendium

## Future Extensions

- **Content Packs**: Additional compendium folders that extend a base system
- **User Homebrew**: Save custom entries to database, export to JSON
- **Import/Export**: Load community content packs
- **Versioning**: Track source versions for updates
