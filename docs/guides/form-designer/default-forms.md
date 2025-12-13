# Default Forms Guide

This guide documents the default forms provided with the VTT system for various game systems.

## D&D 5e OGL Forms

The following default forms are provided for the D&D 5th Edition Open Game License system:

### Character/Actor Sheet (`actor.form.json`)

**Location**: `game-systems/core/dnd5e-ogl/forms/actor.form.json`

**Purpose**: Basic character and NPC sheet for D&D 5th Edition.

**Key Features**:
- Character information (name, class, race, level)
- Ability scores (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma)
- Hit points tracking
- Tabbed interface for inventory, spells, and notes

**Entity Type**: `actor`

### Complete Character Sheet (`character.form.json`)

**Location**: `game-systems/core/dnd5e-ogl/forms/character.form.json`

**Purpose**: Comprehensive character sheet for D&D 5th Edition with all core features including computed fields for automatic calculations.

**Key Features**:

- **Header Section**:
  - Character Name (required)
  - Class & Subclass
  - Level (1-20)
  - Race
  - Background
  - Alignment (dropdown with all 9 alignments)
  - Experience Points
  - Proficiency Bonus (computed from level)
  - Inspiration (checkbox)

- **Character Tab**:
  - **Ability Scores**:
    - All six abilities (STR, DEX, CON, INT, WIS, CHA) with values 1-30
    - Computed modifiers displayed for each ability
    - Organized in bordered groups for clarity

  - **Saving Throws**:
    - All six saving throws with proficiency checkboxes
    - Computed bonuses (ability modifier + proficiency if proficient)

  - **Skills**:
    - All 18 D&D 5e skills with proficiency checkboxes
    - Computed bonuses for each skill
    - Ability source shown in parentheses (e.g., "Acrobatics (Dex)")

  - **Combat Stats**:
    - Armor Class (manual entry)
    - Initiative (computed from DEX modifier)
    - Speed in feet
    - Passive Perception (computed: 10 + Perception bonus)

  - **Hit Points**:
    - Resource field with current/max and visual bar
    - Temporary HP field
    - Hit Dice (type and remaining count)

  - **Death Saves** (collapsible):
    - 3 success checkboxes
    - 3 failure checkboxes

  - **Features & Traits** (repeater):
    - Feature name, source, and description
    - Reorderable and deletable
    - For class features, racial traits, feats, etc.

- **Spells Tab**:
  - Conditional rendering based on spellcasting enabled flag
  - **Spellcasting Section** (when enabled):
    - Spellcasting class
    - Spellcasting ability (INT/WIS/CHA dropdown)
    - Spell Save DC (computed: 8 + proficiency + ability modifier)
    - Spell Slots for levels 1-9 (resource fields with visual bars)
    - Spell list placeholder (for future spell item references)
  - **No Spellcasting** (when disabled):
    - Checkbox to enable spellcasting
    - Informative message

- **Equipment Tab**:
  - **Currency**:
    - Five currency types (cp, sp, ep, gp, pp)

  - **Inventory** (repeater):
    - Item name, quantity, weight, equipped checkbox
    - Item notes
    - Reorderable and deletable

  - **Weapons** (repeater):
    - Weapon name, attack bonus, damage dice, damage type
    - Properties description
    - Reorderable and deletable

- **Notes Tab**:
  - **Personality**:
    - Personality Traits
    - Ideals
    - Bonds
    - Flaws

  - **Appearance**:
    - Age, Height, Weight
    - Eyes, Hair, Skin
    - Physical Description

  - **Backstory** (rich text):
    - Character backstory editor

  - **Notes** (rich text):
    - General notes, session logs, etc.

**Entity Type**: `actor`

**Data Bindings**:
- `name` - Character name
- `data.class` - Class and subclass
- `data.level` - Character level (1-20)
- `data.race` - Race
- `data.background` - Background
- `data.alignment` - Alignment code
- `data.experience.current` - Current XP
- `data.inspiration` - Inspiration flag
- `data.abilities.{ability}.value` - Ability scores
- `data.saves.{ability}.proficient` - Saving throw proficiency
- `data.skills.{skill}.proficient` - Skill proficiency
- `data.combat.armorClass` - AC value
- `data.combat.speed` - Speed in feet
- `data.hitPoints` - HP resource (current/max)
- `data.hitPoints.temp` - Temporary HP
- `data.hitDice.type` - Hit dice type
- `data.hitDice.current` - Remaining hit dice
- `data.deathSaves.successes` - Death save success array
- `data.deathSaves.failures` - Death save failure array
- `data.features` - Features array (name, source, description)
- `data.spellcasting.enabled` - Spellcasting enabled flag
- `data.spellcasting.class` - Spellcasting class
- `data.spellcasting.ability` - Spellcasting ability
- `data.spellSlots.level{1-9}` - Spell slot resources
- `data.currency.{cp/sp/ep/gp/pp}` - Currency amounts
- `data.inventory` - Inventory items array
- `data.weapons` - Weapons array
- `data.personality.{traits/ideals/bonds/flaws}` - Personality info
- `data.appearance.{age/height/weight/eyes/hair/skin/description}` - Appearance info
- `data.backstory` - Character backstory
- `data.notes` - General notes

**Computed Fields**:
- **Proficiency Bonus**: `Math.floor(((@level - 1) / 4) + 2)`
- **Ability Modifiers** (6 fields): `Math.floor((@abilities.{ability}.value - 10) / 2)`
- **Initiative**: Same as DEX modifier
- **Saving Throws** (6 fields): Ability modifier + (proficiency bonus if proficient)
- **Skills** (18 fields): Ability modifier + (proficiency bonus if proficient)
- **Passive Perception**: `10 + Perception bonus`
- **Spell Save DC**: `8 + proficiency + spellcasting ability modifier`

**Layout Features**:
- Two-column layout on Character tab (abilities/skills on left, combat stats on right)
- Tabbed interface for organization
- Collapsible sections for less frequently used features
- Visual resource bars for HP and spell slots
- Grid layouts for organized presentation
- Flex layouts for checkbox + computed value rows

**Styling**:
- Default theme
- Responsive grid layouts
- Visual resource bars with color coding (red for HP, purple for spell slots)

### Item Sheet (`item.form.json`)

**Location**: `game-systems/core/dnd5e-ogl/forms/item.form.json`

**Purpose**: Default item sheet for D&D 5th Edition weapons, armor, and equipment.

**Key Features**:
- Item name and type selection (weapon, armor, potion, scroll, wand, ring, equipment, consumable, treasure)
- Rich text description
- Properties grid (rarity, attunement requirement, weight, value)
- Tabbed interface for description and properties

**Entity Type**: `item`

### Spell Card (`spell.form.json`)

**Location**: `game-systems/core/dnd5e-ogl/forms/spell.form.json`

**Purpose**: Default spell card for D&D 5th Edition spells.

**Key Features**:
- **Header Section**:
  - Spell name (required)
  - Level selection (Cantrip through 9th level)
  - School of magic (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation)
  - Ritual and Concentration checkboxes

- **Casting Information Grid**:
  - Casting Time (text field)
  - Range (text field)
  - Components (V, S, M checkboxes with conditional material description)
  - Duration (text field)

- **Description Section**:
  - Rich text editor for spell description with preview toggle

- **At Higher Levels Section** (Conditional):
  - Only appears when "Has Higher Level Scaling" is checked
  - Rich text editor for higher level effects

- **Additional Information Section**:
  - Has Higher Level Scaling checkbox (controls visibility of "At Higher Levels" section)
  - Classes tag list (with suggestions for all D&D 5e classes)
  - Source book reference

**Entity Type**: `spell`

**Data Bindings**:
- `name` - Spell name
- `data.level` - Spell level (0-9, where 0 = Cantrip)
- `data.school` - School of magic
- `data.ritual` - Ritual spell flag
- `data.concentration` - Concentration requirement flag
- `data.castingTime` - Casting time text
- `data.range` - Range text
- `data.components.verbal` - Verbal component flag
- `data.components.somatic` - Somatic component flag
- `data.components.material` - Material component flag
- `data.components.materialDescription` - Material component description
- `data.duration` - Duration text
- `data.description` - Main spell description (rich text)
- `data.hasHigherLevels` - Flag to show higher levels section
- `data.atHigherLevels` - Higher level scaling description (rich text)
- `data.classes` - Array of class names
- `data.source` - Source book reference

### Monster Stat Block (`monster.form.json`)

**Location**: `game-systems/core/dnd5e-ogl/forms/monster.form.json`

**Purpose**: Default monster and NPC stat block for D&D 5th Edition following official stat block format.

**Key Features**:
- **Header Section**:
  - Monster name (required)
  - Size dropdown (Tiny, Small, Medium, Large, Huge, Gargantuan)
  - Creature type (text field for dragon, humanoid, undead, etc.)
  - Alignment (text field)

- **Basic Stats**:
  - Armor Class (number + armor type description)
  - Hit Points (value + dice formula like "11d10+33")
  - Speed (walk, fly, swim, burrow, climb in feet)

- **Ability Scores**:
  - Six ability scores in a grid (STR, DEX, CON, INT, WIS, CHA)
  - Values from 1-30

- **Proficiencies**:
  - Saving Throws (text field for formatted saves)
  - Skills (text field for formatted skills)

- **Resistances and Immunities**:
  - Damage Vulnerabilities (tag field)
  - Damage Resistances (tag field)
  - Damage Immunities (tag field)
  - Condition Immunities (tag field)

- **Senses and Languages**:
  - Senses (darkvision, passive Perception, etc.)
  - Languages (text field)

- **Challenge Rating**:
  - Challenge Rating dropdown (0, 1/8, 1/4, 1/2, 1-30)
  - Experience Points (number field)

- **Special Traits** (Repeater):
  - Trait name and description
  - Supports reordering and deletion

- **Actions** (Repeater):
  - Action name and description
  - Attack bonus, damage dice, and damage type fields
  - Supports reordering and deletion

- **Reactions** (Conditional):
  - Only shown when "Has Reactions" is checked
  - Repeater for reaction name and description

- **Legendary Actions** (Conditional):
  - Only shown when "Has Legendary Actions" is checked
  - Legendary actions per round counter
  - Legendary actions description
  - Repeater for legendary actions with name, cost, and description

- **Lair Actions** (Conditional):
  - Only shown when "Has Lair Actions" is checked
  - Lair actions description
  - Repeater for lair action name and description

- **Additional Notes**:
  - Rich text editor for GM notes, lore, regional effects

**Entity Type**: `monster`

**Data Bindings**:
- `name` - Monster name
- `data.size` - Size category
- `data.type` - Creature type
- `data.alignment` - Alignment
- `data.armorClass.value` - AC value
- `data.armorClass.type` - Armor type description
- `data.hitPoints.value` - Hit point total
- `data.hitPoints.formula` - Hit dice formula
- `data.speed.walk` - Walking speed
- `data.speed.fly` - Flying speed
- `data.speed.swim` - Swimming speed
- `data.speed.burrow` - Burrowing speed
- `data.speed.climb` - Climbing speed
- `data.abilities.strength` - Strength score
- `data.abilities.dexterity` - Dexterity score
- `data.abilities.constitution` - Constitution score
- `data.abilities.intelligence` - Intelligence score
- `data.abilities.wisdom` - Wisdom score
- `data.abilities.charisma` - Charisma score
- `data.savingThrows` - Saving throws text
- `data.skills` - Skills text
- `data.damageVulnerabilities` - Damage vulnerabilities array
- `data.damageResistances` - Damage resistances array
- `data.damageImmunities` - Damage immunities array
- `data.conditionImmunities` - Condition immunities array
- `data.senses` - Senses text
- `data.languages` - Languages text
- `data.challengeRating` - Challenge rating value
- `data.experiencePoints` - XP value
- `data.traits` - Special traits array (name, description)
- `data.actions` - Actions array (name, description, attackBonus, damageDice, damageType)
- `data.hasReactions` - Has reactions flag
- `data.reactions` - Reactions array (name, description)
- `data.hasLegendaryActions` - Has legendary actions flag
- `data.legendaryActionsPerRound` - Number of legendary actions
- `data.legendaryActionsDescription` - Legendary actions description
- `data.legendaryActions` - Legendary actions array (name, cost, description)
- `data.hasLairActions` - Has lair actions flag
- `data.lairActionsDescription` - Lair actions description
- `data.lairActions` - Lair actions array (name, description)
- `data.notes` - Additional notes (rich text)

**Computed Fields**:
- Ability modifiers for all six abilities (automatically calculated from ability scores)

**Styling**:
- Uses "parchment" theme for authentic D&D look
- Custom CSS for monster stat block formatting
- Custom CSS variables for colors and borders

## Form Schema Patterns

### Common Patterns in Default Forms

#### 1. Required Fields
Fields that are essential to the entity should be marked with `"required": true`:
```json
{
  "type": "field",
  "id": "spell-name",
  "fieldType": "text",
  "binding": "name",
  "label": "Spell Name",
  "required": true
}
```

#### 2. Conditional Sections
Use conditional nodes to show/hide sections based on field values:
```json
{
  "type": "conditional",
  "id": "higher-levels-conditional",
  "condition": {
    "type": "simple",
    "field": "data.hasHigherLevels",
    "operator": "equals",
    "value": true
  },
  "then": [
    {
      "type": "section",
      "id": "higher-levels-section",
      "title": "At Higher Levels",
      "children": [...]
    }
  ]
}
```

#### 3. Grid Layouts
Use grid layouts for organized field presentation:
```json
{
  "type": "grid",
  "id": "casting-grid",
  "columns": 2,
  "gap": "1rem",
  "children": [...]
}
```

#### 4. Tag Fields with Suggestions
Provide suggestions while allowing custom values:
```json
{
  "type": "field",
  "id": "spell-classes",
  "fieldType": "tags",
  "binding": "data.classes",
  "label": "Classes",
  "options": {
    "suggestions": ["Bard", "Cleric", "Druid", ...],
    "allowCustom": true
  }
}
```

#### 5. Rich Text with Preview
Enable preview toggle for markdown content:
```json
{
  "type": "field",
  "id": "description-field",
  "fieldType": "richtext",
  "binding": "data.description",
  "label": "Spell Description",
  "options": {
    "multiline": true,
    "showPreview": true
  }
}
```

## Creating Custom Forms

To create a custom form based on these defaults:

1. **Copy the default form** as a starting point
2. **Modify the layout** to match your needs
3. **Update bindings** to match your data structure
4. **Adjust field types** as needed
5. **Add or remove sections** to suit your requirements
6. **Test thoroughly** with sample data

## Form Validation

All forms should:
- Have valid JSON syntax
- Include required metadata (name, description, entityType, version)
- Use valid field types from the schema
- Have unique node IDs
- Use correct binding paths
- Include appropriate labels and help text

## Best Practices

1. **Keep forms focused**: Each form should represent one entity type
2. **Use sections**: Group related fields together
3. **Provide placeholders**: Help users understand expected input
4. **Use appropriate field types**: Match the data type to the field type
5. **Add help text**: Explain complex fields
6. **Test with real data**: Ensure bindings work correctly
7. **Consider mobile**: Keep layouts responsive
8. **Accessibility**: Include labels and ARIA attributes

## Version History

- **1.0.0** (2025-12-12): Initial default forms for D&D 5e
  - Basic Actor/Character sheet
  - Complete Character sheet with computed fields
  - Item sheet
  - Spell card
  - Monster stat block
