# D&D 5e SRD Spell Data Update

## Summary

Successfully updated all D&D 5e OGL spell data files by fetching from the Open5e API and transforming to match the existing VTT schema.

**Date:** December 12, 2025  
**Source:** Open5e API v1 (https://api.open5e.com/spells/)  
**Filter:** SRD 5.1 Official Content (`document__slug=wotc-srd`)  
**Total Spells:** 319

## Files Updated

All spell files in `game-systems/core/dnd5e-ogl/compendium/spells/`:

- `cantrips.json` - 24 spells
- `level-1.json` - 49 spells
- `level-2.json` - 54 spells
- `level-3.json` - 42 spells
- `level-4.json` - 31 spells
- `level-5.json` - 37 spells
- `level-6.json` - 31 spells
- `level-7.json` - 20 spells
- `level-8.json` - 16 spells
- `level-9.json` - 15 spells

## Schema Compliance

All updated files maintain the existing VTT schema:

### Compendium Structure
- `compendiumId`: Unique identifier for the compendium
- `name`: Display name (e.g., "Cantrips (0 Level)")
- `templateId`: "dnd5e-spell"
- `source`: "SRD 5.1"
- `entries`: Array of spell objects

### Spell Entry Structure
- `id`: Kebab-case spell identifier
- `name`: Spell display name
- `img`: Icon path
- `description`: Full spell description
- `templateId`: "dnd5e-spell"
- `source`: "SRD 5.1"
- `data`: Object containing spell mechanics

### Spell Data Fields
- `level`: 0-9 (0 for cantrips)
- `school`: abjuration, conjuration, divination, enchantment, evocation, illusion, necromancy, transmutation
- `castingTime`: e.g., "1 action", "1 bonus action", "1 minute"
- `range`: e.g., "60 feet", "Touch", "Self"
- `components`: Array of "V", "S", "M"
- `materials`: Material component description (if applicable)
- `duration`: e.g., "Instantaneous", "Concentration, up to 1 minute"
- `concentration`: Boolean
- `ritual`: Boolean
- `classes`: Array of class names
- `damage`: Damage dice (if applicable)
- `damageType`: Type of damage (if applicable)
- `saveAbility`: Saving throw ability (if applicable)
- `attackType`: "melee" or "ranged" (if applicable)
- `higherLevels`: Upcast description (if applicable)
- `scalingType`: "cantrip" for damage cantrips
- `areaOfEffect`: Area description (if applicable)
- `healing`: Healing dice (for healing spells)

## Statistics

### Spells by School
- Evocation: 60 spells
- Transmutation: 59 spells
- Conjuration: 52 spells
- Abjuration: 39 spells
- Divination: 29 spells
- Enchantment: 29 spells
- Illusion: 27 spells
- Necromancy: 24 spells

### Spell Attributes
- Concentration spells: 126
- Ritual spells: 29
- Damage spells: 75
- Healing spells: 9

### Damage Types
- Fire: 17 spells
- Necrotic: 9 spells
- Radiant: 8 spells
- Force: 7 spells
- Psychic: 7 spells
- Bludgeoning: 6 spells
- Cold: 4 spells
- Lightning: 4 spells
- Piercing: 4 spells
- Thunder: 3 spells
- Acid: 2 spells
- Poison: 2 spells
- Slashing: 1 spell

### Spells by Class
- Wizard: 204 spells
- Cleric: 142 spells
- Druid: 125 spells
- Sorcerer: 120 spells
- Bard: 112 spells
- Warlock: 88 spells
- Ranger: 37 spells

## Validation

All files have been validated to ensure:
- Valid JSON syntax
- Correct schema structure
- Required fields present
- Proper data types
- Consistent formatting

## Sample Spells

### Cantrip Example: Eldritch Blast
- **Level:** 0 (evocation)
- **Casting Time:** 1 action
- **Range:** 120 feet
- **Components:** V, S
- **Duration:** Instantaneous
- **Damage:** 1d10 force
- **Classes:** warlock

### Level 1 Example: Shield
- **Level:** 1 (abjuration)
- **Casting Time:** 1 reaction
- **Range:** Self
- **Components:** V, S
- **Duration:** 1 round
- **Classes:** sorcerer, wizard

### Level 3 Example: Fireball
- **Level:** 3 (evocation)
- **Casting Time:** 1 action
- **Range:** 150 feet
- **Components:** V, S, M (bat guano and sulfur)
- **Duration:** Instantaneous
- **Damage:** 8d6 fire
- **Classes:** sorcerer, wizard

### Level 9 Example: Wish
- **Level:** 9 (conjuration)
- **Casting Time:** 1 action
- **Range:** Self
- **Components:** V
- **Duration:** Instantaneous
- **Classes:** sorcerer, wizard

## Notes

- Icon paths follow existing patterns: `icons/magic/{category}/{description}.webp`
- Material components are included in the `materials` field when applicable
- Higher level descriptions are included when spells can be upcast
- All descriptions are complete and unmodified from the SRD source
- Spell IDs use kebab-case format matching the Open5e slug

## Transformation Process

1. Fetched 319 spells from Open5e API with SRD filter
2. Parsed API response and extracted relevant fields
3. Transformed to match existing VTT schema
4. Organized spells by level (0-9)
5. Sorted spells alphabetically within each level
6. Validated all JSON files for correctness
7. Generated statistics and summary reports

All updates complete and validated successfully!
