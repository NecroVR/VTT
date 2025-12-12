# VTTMark Document Markup Reference

This guide describes the markup language used throughout the VTT system for creating character sheets, handouts, lookup tables, cards, and other game content. VTTMark is based on standard Markdown with extensions specifically designed for tabletop roleplaying games.

---

## Table of Contents

1. [Overview](#overview)
2. [Basic Formatting](#basic-formatting)
3. [Dice Notation](#dice-notation)
4. [Variables and References](#variables-and-references)
5. [Entity Links](#entity-links)
6. [Tables](#tables)
7. [Structured Blocks](#structured-blocks)
8. [Interactive Elements](#interactive-elements)
9. [Visibility and Permissions](#visibility-and-permissions)
10. [Document Types](#document-types)
11. [Styling Documents](#styling-documents)
12. [Best Practices](#best-practices)
13. [Quick Reference](#quick-reference)

---

## Overview

### Accessing This Documentation

This documentation is accessible from multiple locations:

- **Main Screen**: Click the Help icon in the navigation bar
- **Campaign View**: Access via the Documentation tab in the sidebar
- **Editor Toolbar**: Click the Help button when editing any document
- **Keyboard Shortcut**: Press `F1` while in any editor

### What is VTTMark?

VTTMark is a document markup language designed for virtual tabletop content. It extends standard Markdown with game-specific features like dice rolling, variable substitution, and interactive elements.

### Design Goals

- **Easy to Learn**: If you know Markdown, you already know 90% of VTTMark
- **Human Readable**: Documents are readable even without rendering
- **Game System Agnostic**: Works with any TTRPG system
- **Progressive Enhancement**: Basic documents work immediately; add advanced features as needed

### When to Use VTTMark

| Content Type | Use VTTMark For |
|--------------|-----------------|
| Character Sheets | Stats, abilities, backstory, inventory |
| Handouts | Player-facing lore, letters, maps |
| Lookup Tables | Random encounters, treasure, weather |
| Cards | Spell cards, item cards, condition cards |
| GM Notes | Session prep, NPC details, plot hooks |
| Rules References | House rules, quick references |

---

## Basic Formatting

VTTMark supports all standard Markdown formatting.

### Headings

```markdown
# Heading Level 1
## Heading Level 2
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6
```

### Text Styles

```markdown
**Bold text** for emphasis
*Italic text* for titles or thoughts
***Bold and italic*** for strong emphasis
~~Strikethrough~~ for removed content
`Inline code` for game terms or commands
```

Renders as:

**Bold text** for emphasis
*Italic text* for titles or thoughts
***Bold and italic*** for strong emphasis
~~Strikethrough~~ for removed content
`Inline code` for game terms or commands

### Lists

**Unordered Lists:**
```markdown
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

**Ordered Lists:**
```markdown
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step
```

**Task Lists:**
```markdown
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task
```

### Blockquotes

Use blockquotes for read-aloud text, quotes, or callouts:

```markdown
> As you enter the chamber, a chill runs down your spine.
> The ancient door creaks ominously behind you.
```

Renders as:

> As you enter the chamber, a chill runs down your spine.
> The ancient door creaks ominously behind you.

### Horizontal Rules

Separate sections with horizontal rules:

```markdown
---
```

---

## Dice Notation

Dice expressions are enclosed in curly braces `{}` and are rendered as interactive roll buttons.

### Basic Dice Rolling

```markdown
Roll for initiative: {1d20}
Attack roll: {1d20+5}
Damage: {2d6+3}
```

### Dice Notation Syntax

| Notation | Description | Example |
|----------|-------------|---------|
| `NdX` | Roll N dice with X sides | `{3d6}` |
| `NdX+M` | Add modifier M | `{1d20+5}` |
| `NdX-M` | Subtract modifier M | `{1d20-2}` |
| `NdXkh` | Keep highest (advantage) | `{2d20kh}` |
| `NdXkl` | Keep lowest (disadvantage) | `{2d20kl}` |
| `NdXkhN` | Keep highest N dice | `{4d6kh3}` |
| `NdXklN` | Keep lowest N dice | `{4d6kl3}` |
| `NdXdh` | Drop highest | `{4d6dh}` |
| `NdXdl` | Drop lowest | `{4d6dl}` |
| `NdXdhN` | Drop highest N dice | `{5d6dh2}` |
| `NdXdlN` | Drop lowest N dice | `{5d6dl2}` |
| `NdXro<N` | Reroll once if less than N | `{1d6ro<2}` |
| `NdXr<N` | Reroll all less than N | `{4d6r<2}` |
| `NdX!` | Exploding dice | `{1d6!}` |
| `NdX!!` | Compounding dice | `{1d6!!}` |

### Damage Types

Append damage type in square brackets:

```markdown
Longsword: {1d8+3}[slashing]
Fireball: {8d6}[fire]
Smite: {2d8}[radiant]
```

### Complex Expressions

```markdown
Great Weapon Master: {1d20+5-5} to hit, {2d6+10+5}[slashing] damage
Sneak Attack: {1d20+7} to hit, {3d6+4d6+4}[piercing] damage
```

### Labeled Rolls

Add a label before the roll:

```markdown
{Strength Save: 1d20+5}
{Initiative: 1d20+3}
{Fireball Damage: 8d6}[fire]
```

### Inline Dice Display

For dice that display results inline without buttons:

```markdown
Average damage: {=2d6+3} (displays: 10)
```

---

## Variables and References

Variables allow documents to reference character stats, campaign settings, and other dynamic values.

### Variable Syntax

Variables use the `@` symbol followed by the path:

```markdown
**Strength**: {@strength} ({@strength_mod})
**Armor Class**: {@armor_class}
**Proficiency Bonus**: {@proficiency_bonus}
```

### Common Variable Paths

**Ability Scores:**
```markdown
{@strength}         {@strength_mod}
{@dexterity}        {@dexterity_mod}
{@constitution}     {@constitution_mod}
{@intelligence}     {@intelligence_mod}
{@wisdom}           {@wisdom_mod}
{@charisma}         {@charisma_mod}
```

**Combat Stats:**
```markdown
{@armor_class}
{@hit_points}
{@hit_points_max}
{@hit_points_temp}
{@initiative}
{@speed}
{@proficiency_bonus}
```

**Spellcasting:**
```markdown
{@spell_attack}
{@spell_save_dc}
{@spellcasting_ability}
```

### Variables in Dice Expressions

Combine variables with dice:

```markdown
Attack: {1d20 + @strength_mod + @proficiency_bonus}
Damage: {1d8 + @strength_mod}[slashing]
Spell Attack: {1d20 + @spell_attack}
```

### Nested References

Access nested data with dot notation:

```markdown
{@character.class.level}
{@character.resources.ki_points}
{@campaign.setting.current_date}
```

### Default Values

Provide fallback values for missing data:

```markdown
{@speed || 30} ft.
{@darkvision || "None"}
```

---

## Entity Links

Link to other entities in the campaign (characters, items, spells, locations, etc.).

### Link Syntax

```markdown
[@type:id]{Display Text}
[@type:id]
```

### Entity Types

| Type | Description | Example |
|------|-------------|---------|
| `actor` | Characters and NPCs | `[@actor:gandalf]{Gandalf the Grey}` |
| `item` | Items and equipment | `[@item:vorpal-sword]` |
| `spell` | Spells and abilities | `[@spell:fireball]{Fireball}` |
| `scene` | Maps and scenes | `[@scene:tavern]{The Rusty Dragon}` |
| `journal` | Journal entries | `[@journal:history]{Kingdom History}` |
| `table` | Rollable tables | `[@table:wild-magic]` |
| `compendium` | Compendium entries | `[@compendium:monsters/goblin]` |

### Examples

```markdown
The wizard casts [@spell:fireball]{Fireball} at the goblin horde.

Speak with [@actor:lord-mayor]{Lord Mayor Aldric} about the missing shipment.

The treasure includes a [@item:potion-healing]{Potion of Healing} and 50 gold pieces.

This connects to [@scene:dungeon-level-2]{the second level of the dungeon}.
```

### Inline Entity Display

Display entity details inline:

```markdown
[@item:longsword inline]
```

Renders the item's summary directly in the document.

---

## Tables

### Basic Tables

```markdown
| Name | HP | AC | Attack |
|------|----|----|--------|
| Goblin | 7 | 15 | +4 |
| Orc | 15 | 13 | +5 |
| Troll | 84 | 15 | +7 |
```

Renders as:

| Name | HP | AC | Attack |
|------|----|----|--------|
| Goblin | 7 | 15 | +4 |
| Orc | 15 | 13 | +5 |
| Troll | 84 | 15 | +7 |

### Column Alignment

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| L | C | R |
```

### Rollable Tables

Create tables that can be rolled on:

```markdown
:::table{rollable die=d6}
| d6 | Random Encounter |
|----|------------------|
| 1 | 2d4 Goblins |
| 2 | 1d3 Wolves |
| 3 | 1 Owlbear |
| 4 | Traveling Merchant |
| 5 | Abandoned Campsite |
| 6 | Nothing |
:::
```

### Weighted Tables

```markdown
:::table{rollable die=d100}
| d100 | Treasure |
|------|----------|
| 01-50 | Copper pieces (2d6 x 10) |
| 51-75 | Silver pieces (3d6 x 5) |
| 76-90 | Gold pieces (2d6) |
| 91-99 | Gem (worth 50 gp) |
| 00 | Magic item |
:::
```

---

## Structured Blocks

Structured blocks define complex content types using the `:::` fence syntax.

### Block Syntax

```markdown
:::blocktype{attribute1=value attribute2="value with spaces"}
Content goes here
:::
```

### Stat Blocks

**Monster/NPC Stat Block:**

```markdown
:::statblock{type=monster}
name: Goblin
size: Small
type: humanoid (goblinoid)
alignment: neutral evil
ac: 15 (leather armor, shield)
hp: 7 (2d6)
speed: 30 ft.

STR: 8 (-1)
DEX: 14 (+2)
CON: 10 (+0)
INT: 10 (+0)
WIS: 8 (-1)
CHA: 8 (-1)

skills: Stealth +6
senses: darkvision 60 ft., passive Perception 9
languages: Common, Goblin
cr: 1/4

## Traits

**Nimble Escape.** The goblin can take the Disengage or Hide action as a bonus action on each of its turns.

## Actions

**Scimitar.** Melee Weapon Attack: {1d20+4} to hit, reach 5 ft., one target. Hit: {1d6+2}[slashing] damage.

**Shortbow.** Ranged Weapon Attack: {1d20+4} to hit, range 80/320 ft., one target. Hit: {1d6+2}[piercing] damage.
:::
```

**Character Summary Block:**

```markdown
:::statblock{type=character}
name: {@name}
class: {@class} {@level}
race: {@race}
background: {@background}

ac: {@armor_class}
hp: {@hit_points}/{@hit_points_max}
speed: {@speed} ft.

STR: {@strength} ({@strength_mod})
DEX: {@dexterity} ({@dexterity_mod})
CON: {@constitution} ({@constitution_mod})
INT: {@intelligence} ({@intelligence_mod})
WIS: {@wisdom} ({@wisdom_mod})
CHA: {@charisma} ({@charisma_mod})

saves: {@saving_throws}
skills: {@skills}
:::
```

### Spell Cards

```markdown
:::spell
name: Fireball
level: 3
school: Evocation
casting_time: 1 action
range: 150 feet
components: V, S, M (a tiny ball of bat guano and sulfur)
duration: Instantaneous
classes: Sorcerer, Wizard

A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes {8d6}[fire] damage on a failed save, or half as much damage on a successful one.

**At Higher Levels.** When you cast this spell using a spell slot of 4th level or higher, the damage increases by {1d6}[fire] for each slot level above 3rd.
:::
```

### Item Cards

```markdown
:::item
name: Vorpal Sword
type: Weapon (any sword that deals slashing damage)
rarity: Legendary
attunement: true

You gain a +3 bonus to attack and damage rolls made with this magic weapon. In addition, the weapon ignores resistance to slashing damage.

When you attack a creature that has at least one head with this weapon and roll a 20 on the attack roll, you cut off one of the creature's heads. The creature dies if it can't survive without the lost head.

**Attack:** {1d20 + @strength_mod + @proficiency_bonus + 3}
**Damage:** {2d6 + @strength_mod + 3}[slashing]
:::
```

### Clocks

For tracking progress or tension (commonly used in Blades in the Dark, etc.):

```markdown
:::clock{segments=4 filled=2}
Escape the Prison
:::

:::clock{segments=8 filled=5}
The Ritual Completes
:::

:::clock{segments=6 filled=0}
Alert Level
:::
```

### Resource Trackers

**Checkbox Style:**

```markdown
:::resource{type=checkboxes}
**Spell Slots (1st Level):** [ ] [ ] [ ] [ ]
**Spell Slots (2nd Level):** [ ] [ ] [ ]
**Spell Slots (3rd Level):** [ ] [ ]
:::
```

**Bar Style:**

```markdown
:::resource{type=bar current=23 max=45 color=red}
Hit Points
:::

:::resource{type=bar current=3 max=5 color=blue}
Ki Points
:::
```

**Pip Style:**

```markdown
:::resource{type=pips filled=3 total=5}
Bardic Inspiration
:::
```

### Callout Boxes

```markdown
:::note
This is a general note or reminder.
:::

:::warning
Danger! This trap deals {10d6}[fire] damage.
:::

:::info
The password is "friend" in Elvish.
:::

:::success
Quest completed! Award 500 XP.
:::
```

### Collapsible Sections

```markdown
:::collapse{title="Trap Details"}
**Type:** Mechanical trap
**Trigger:** Pressure plate
**Effect:** Darts shoot from the walls
**Detection:** DC 15 Investigation
**Disarm:** DC 12 Thieves' Tools
**Damage:** {2d10}[piercing]
:::
```

### Tabs

```markdown
:::tabs
::tab{title="Attacks"}
**Longsword:** {1d20+5} to hit, {1d8+3}[slashing] damage
**Longbow:** {1d20+4} to hit, {1d8+2}[piercing] damage
::

::tab{title="Spells"}
- Cantrips: Fire Bolt, Mage Hand
- 1st Level: Shield, Magic Missile
::

::tab{title="Equipment"}
- Longsword
- Longbow with 20 arrows
- Chain mail
- Explorer's pack
::
:::
```

---

## Interactive Elements

### Roll Buttons

Create clickable buttons that execute dice rolls:

```markdown
[Roll Attack]{1d20+5}
[Roll Damage]{2d6+3}[slashing]
[Roll Initiative]{1d20 + @dexterity_mod}
```

### Action Buttons

```markdown
:::action{name="Multiattack"}
The creature makes two attacks with its claws.

[Claw Attack 1]{1d20+6} - {2d6+4}[slashing]
[Claw Attack 2]{1d20+6} - {2d6+4}[slashing]
:::
```

### Input Fields

Create fillable fields:

```markdown
:::input{id=notes type=textarea rows=4}
Character Notes
:::

:::input{id=custom_value type=number min=0 max=100}
Custom Modifier
:::
```

### Counters

```markdown
:::counter{id=death_saves_success max=3}
Death Save Successes
:::

:::counter{id=death_saves_failure max=3}
Death Save Failures
:::
```

---

## Visibility and Permissions

Control who can see content.

### GM-Only Content

```markdown
:::secret
The shopkeeper is actually a dragon in disguise.
His true name is Xarathax the Deceiver.
:::
```

### Player-Specific Content

```markdown
:::visible{to="player:alice"}
Only Alice can see this secret backstory element.
:::

:::visible{to="owner"}
Only the character's owner can see this.
:::
```

### Conditional Display

```markdown
:::if{condition="@class == 'Wizard'"}
## Spellbook
Your spellbook contains the following spells...
:::

:::if{condition="@level >= 5"}
## Extra Attack
You can attack twice when you take the Attack action.
:::
```

---

## Document Types

VTTMark supports specialized document types with type-specific rendering.

### Character Sheet

```markdown
---
type: character-sheet
system: dnd5e
---

# {@name}
*{@race} {@class} {@level}*

## Ability Scores
| STR | DEX | CON | INT | WIS | CHA |
|:---:|:---:|:---:|:---:|:---:|:---:|
| {@strength} | {@dexterity} | {@constitution} | {@intelligence} | {@wisdom} | {@charisma} |
| ({@strength_mod}) | ({@dexterity_mod}) | ({@constitution_mod}) | ({@intelligence_mod}) | ({@wisdom_mod}) | ({@charisma_mod}) |

## Combat
- **Armor Class:** {@armor_class}
- **Hit Points:** {@hit_points} / {@hit_points_max}
- **Speed:** {@speed} ft.
- **Initiative:** {1d20 + @dexterity_mod}

## Attacks
{@attacks}

## Features and Traits
{@features}
```

### Handout

```markdown
---
type: handout
permission: observer
---

# The Letter

*A weathered parchment with elegant script*

> Dear Adventurer,
>
> If you are reading this, then I am already dead. The artifact must not fall
> into the wrong hands. Seek the Temple of the Morning Star, where the sun
> first touches the mountain. There you will find what you seek.
>
> Trust no one.
>
> -- E.

:::secret
The letter is signed by Elara, the missing scholar the party is searching for.
The Temple is located at coordinates 47.3, -122.1 on the regional map.
:::
```

### Lookup Table

```markdown
---
type: table
category: random-encounters
---

# Forest Random Encounters

:::table{rollable die=d20}
| d20 | Encounter |
|-----|-----------|
| 1-5 | {@=1d4} Wolves |
| 6-8 | {@=1d6} Bandits |
| 9-10 | Traveling Merchant |
| 11-12 | Lost Child |
| 13-14 | {@=1d3} Giant Spiders |
| 15-16 | Abandoned Campsite |
| 17 | Dryad Grove |
| 18 | Owlbear Den |
| 19 | {@=1} Troll |
| 20 | Roll twice |
:::
```

### Card

```markdown
---
type: card
category: conditions
---

:::card{style=condition color=yellow}
# Frightened

- A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.
- The creature can't willingly move closer to the source of its fear.

**Common Sources:** Dragons, certain spells, undead abilities
:::
```

---

## Styling Documents

VTTMark uses a three-tier styling system designed to serve all skill levels, from beginners who want things to "just work" to advanced users who want full creative control.

### Tier 1: Templates (Recommended for Most Users)

The easiest way to style documents. Select a pre-built template and customize colors and fonts through the visual editor.

**How to Use:**
1. Create or open a document
2. Click "Choose Template" in the document toolbar
3. Browse the template gallery
4. Select a template and customize using the sidebar options

**Available Customizations:**
- Primary and secondary colors
- Font family (Sans-serif, Serif, Monospace, Fantasy)
- Spacing (Compact, Normal, Spacious)
- Border style (None, Simple, Ornate)

**Example Templates by Document Type:**

| Document Type | Available Templates |
|---------------|---------------------|
| Character Sheet | Classic, Minimalist, Parchment, Modern |
| Spell Card | Standard, Compact, Illustrated |
| Stat Block | 5e Official, Pathfinder, Simple |
| Handout | Scroll, Letter, Book Page, Notice |
| Card | Standard, Tarot, Playing Card |

Templates are mobile-responsive and accessibility-compliant by default.

### Tier 2: Style Classes (Intermediate)

Add style classes directly in your VTTMark using curly braces after elements.

**Syntax:**
```markdown
# Heading {.class-name}

:::block{.class1 .class2}
Content with multiple classes
:::
```

**Layout Classes:**

| Class | Description |
|-------|-------------|
| `.layout-2col` | Two-column layout |
| `.layout-3col` | Three-column layout |
| `.grid-auto` | Responsive auto-fit grid |
| `.flex-center` | Center content horizontally and vertically |
| `.flex-between` | Space items evenly |

**Spacing Classes:**

| Class | Description |
|-------|-------------|
| `.p-sm`, `.p-md`, `.p-lg` | Padding (small, medium, large) |
| `.m-sm`, `.m-md`, `.m-lg` | Margin (small, medium, large) |
| `.gap-sm`, `.gap-md`, `.gap-lg` | Grid/flex gap |

**Typography Classes:**

| Class | Description |
|-------|-------------|
| `.text-sm`, `.text-lg`, `.text-xl` | Text size |
| `.text-center`, `.text-right` | Text alignment |
| `.font-serif`, `.font-mono`, `.font-fantasy` | Font family |
| `.heading-fancy` | Decorative heading style |

**Color Classes:**

| Class | Description |
|-------|-------------|
| `.color-primary`, `.color-secondary` | Theme colors for text |
| `.color-muted` | Subdued text color |
| `.bg-primary`, `.bg-secondary` | Background colors |
| `.bg-muted` | Subtle background |

**Border Classes:**

| Class | Description |
|-------|-------------|
| `.border-simple` | Thin solid border |
| `.border-ornate` | Decorative border |
| `.border-none` | Remove border |
| `.shadow-sm`, `.shadow-md`, `.shadow-lg` | Drop shadows |

**Table Classes:**

| Class | Description |
|-------|-------------|
| `.table-striped` | Alternating row colors |
| `.table-hover` | Highlight row on hover |
| `.table-bordered` | Borders on all cells |
| `.table-compact` | Reduced padding |

**Example Using Style Classes:**

```markdown
# Thorin Oakenshield {.heading-fancy .text-center}

:::statblock{.border-ornate .bg-muted .p-md}
**Level 5 Fighter** | **HP**: 45/45

::: {.layout-3col .gap-md}
**STR**: 18 (+4)
**DEX**: 14 (+2)
**CON**: 16 (+3)
:::
:::

:::note{.bg-primary .color-secondary}
Remember: Thorin has advantage on saves against being frightened.
:::
```

### Tier 3: Custom CSS (Advanced)

For maximum control, write custom CSS in the document's style editor.

**Accessing the Style Editor:**
1. Open a document for editing
2. Click "Custom CSS" in the toolbar
3. Write CSS in the editor panel
4. Preview changes in real-time

**Class Naming Convention:**

All custom classes must use the `doc-` prefix to prevent conflicts:

```css
/* Correct - uses doc- prefix */
.doc-character-header {
  background: linear-gradient(to right, #8b4513, #deb887);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
}

/* Incorrect - will not work */
.character-header {
  background: red;
}
```

**Available CSS Variables:**

Use these variables for consistency with the application theme:

```css
/* Colors */
--color-primary        /* Primary theme color */
--color-secondary      /* Secondary theme color */
--color-accent         /* Accent/highlight color */
--color-text           /* Default text color */
--color-text-muted     /* Subdued text color */
--color-bg             /* Background color */
--color-bg-secondary   /* Secondary background */
--color-border         /* Border color */

/* Spacing (based on 4px unit) */
--space-xs: 0.25rem    /* 4px */
--space-sm: 0.5rem     /* 8px */
--space-md: 1rem       /* 16px */
--space-lg: 1.5rem     /* 24px */
--space-xl: 2rem       /* 32px */

/* Typography */
--font-base            /* Default font */
--font-heading         /* Heading font */
--font-mono            /* Monospace font */
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */

/* Layout */
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--shadow-sm            /* Small shadow */
--shadow-md            /* Medium shadow */
--shadow-lg            /* Large shadow */
```

**Example Custom CSS:**

```css
/* Custom character sheet styling */
.doc-sheet-header {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.doc-stat-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-bg);
  border: 3px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  font-weight: bold;
}

.doc-ability-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-sm);
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .doc-ability-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Using Custom CSS in Documents:**

```markdown
---
type: character-sheet
---

::: {.doc-sheet-header}
![Portrait](portrait.jpg)
# Gandalf the Grey
*Wizard, Level 20*
:::

::: {.doc-ability-grid}
::: {.doc-stat-circle}
18
:::
::: {.doc-stat-circle}
14
:::
::: {.doc-stat-circle}
16
:::
:::
```

**CSS Security Restrictions:**

For security, the following are not allowed in custom CSS:
- `position: fixed` or `position: sticky`
- `z-index` (prevents overlay hijacking)
- External URLs in `url()` (use uploaded assets instead)
- JavaScript expressions

**Tips for Custom CSS:**
- Use CSS variables for colors to respect user themes
- Use relative units (`rem`, `%`, `clamp()`) for responsive layouts
- Test on mobile viewports
- Use the browser inspector to debug

### Combining Tiers

You can use multiple tiers together:

1. Start with a **template** for the base structure
2. Add **style classes** for quick adjustments
3. Use **custom CSS** for unique elements

```markdown
---
type: character-sheet
template: classic
---

# Character Name {.heading-fancy}

:::statblock{.border-ornate}
Stats here...
:::

::: {.doc-custom-section}
Custom styled content using your CSS
:::
```

### Sharing Styles

**Exporting Styles:**
- Click "Export CSS" to download your custom styles
- Share the CSS file with other GMs
- Import styles via "Import CSS" in the style editor

**Campaign-Wide Styles:**
GMs can set default styles for the entire campaign:
1. Go to Campaign Settings
2. Click "Default Document Styles"
3. Set default template and custom CSS
4. All new documents will use these defaults

---

## Best Practices

### Document Organization

1. **Use Clear Headings**: Structure documents with a logical hierarchy
2. **Keep It Scannable**: Use lists, tables, and short paragraphs
3. **Group Related Content**: Use collapsible sections for optional details
4. **Label Your Rolls**: Always use labeled rolls for clarity

### Performance Tips

1. **Minimize Variables**: Only use variables for values that actually change
2. **Use Entity Links**: Link rather than duplicate content
3. **Split Large Documents**: Break up very long documents into linked pages

### Accessibility

1. **Use Descriptive Link Text**: `[@spell:fireball]{Fireball}` not `[@spell:fireball]{click here}`
2. **Provide Alt Text for Images**: `![Map of the dungeon](map.png "First level map")`
3. **Use Semantic Structure**: Headings in order, lists for lists

### Security Notes

1. **GM Secrets Stay Secret**: Content in `:::secret` blocks is never sent to players
2. **Variables Are Resolved Server-Side**: Players cannot access other characters' data
3. **Roll Results Are Verified**: Dice rolls are processed server-side to prevent cheating

---

## Quick Reference

### Formatting

| Syntax | Result |
|--------|--------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `# Heading` | Heading |
| `- item` | Bulleted list |
| `1. item` | Numbered list |
| `> quote` | Blockquote |
| `---` | Horizontal rule |

### Dice

| Syntax | Description |
|--------|-------------|
| `{1d20}` | Basic roll |
| `{1d20+5}` | Roll with modifier |
| `{2d20kh}` | Advantage |
| `{2d20kl}` | Disadvantage |
| `{4d6kh3}` | Keep highest 3 |
| `{1d6!}` | Exploding dice |
| `{2d6}[fire]` | Typed damage |
| `{Label: 1d20+5}` | Labeled roll |

### Variables

| Syntax | Description |
|--------|-------------|
| `{@stat}` | Reference stat |
| `{@nested.path}` | Nested reference |
| `{@stat \|\| default}` | With default |

### Links

| Syntax | Description |
|--------|-------------|
| `[@actor:id]` | Link to actor |
| `[@item:id]{text}` | Link with text |
| `[@spell:id inline]` | Inline display |

### Blocks

| Block | Purpose |
|-------|---------|
| `:::statblock` | Monster/character stats |
| `:::spell` | Spell description |
| `:::item` | Item description |
| `:::table{rollable}` | Rollable table |
| `:::clock{segments=N}` | Progress clock |
| `:::resource` | Resource tracker |
| `:::secret` | GM-only content |
| `:::collapse{title}` | Collapsible section |
| `:::note` | Callout box |

### Styling

| Tier | Description | Skill Level |
|------|-------------|-------------|
| Templates | Visual template picker | Beginner |
| Style Classes | Add `{.class}` to elements | Intermediate |
| Custom CSS | Write CSS with `doc-` prefix | Advanced |

**Common Style Classes:**

| Class | Effect |
|-------|--------|
| `.layout-2col` | Two columns |
| `.text-center` | Center text |
| `.bg-muted` | Subtle background |
| `.border-ornate` | Decorative border |
| `.table-striped` | Alternating rows |
| `.p-md` | Medium padding |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial specification |

---

*This document is part of the VTT documentation. For technical implementation details, see the developer documentation.*
