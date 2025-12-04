# Game Systems Architecture

## Overview

This document defines the abstract framework required to support multiple tabletop RPG systems. The architecture must be flexible enough to handle fundamentally different mechanical paradigms while providing a consistent API and user experience.

---

## Table of Contents

1. [Implementation Phases](#implementation-phases)
2. [System Analysis](#system-analysis)
3. [Core Abstractions](#core-abstractions)
4. [Entity Schema](#entity-schema)
5. [Dice Engine](#dice-engine)
6. [Roll Resolution](#roll-resolution)
7. [Resource Systems](#resource-systems)
8. [Character Sheet Templates](#character-sheet-templates)
9. [Action Economy](#action-economy)
10. [System Modules](#system-modules)

---

## Implementation Phases

### Phase 1 Systems (Launch)

| System | Publisher | Dice | Primary Mechanics |
|--------|-----------|------|-------------------|
| **D&D 5th Edition** | Wizards of the Coast | d20 + modifiers | Class/level, 6 ability scores, advantage/disadvantage |
| **Pathfinder 2e** | Paizo | d20 + modifiers | 4 degrees of success, 3-action economy, proficiency tiers |
| **Daggerheart** | Darrington Press | 2d12 (Hope/Fear) | Dual dice tension, stress/hope, domain cards |

### Phase 2 Systems

| System | Publisher | Dice | Primary Mechanics |
|--------|-----------|------|-------------------|
| **Fate Core/Accelerated** | Evil Hat | 4dF (Fudge dice) | Aspects, fate points, stress/consequences |
| **Blades in the Dark / Forged in the Dark** | Evil Hat / Various | d6 dice pools | Position/effect, clocks, stress/trauma |
| **Year Zero Engine** | Free League | d6 dice pools | Attribute+skill pools, pushing, conditions |
| **Cypher System** | Monte Cook Games | d20 | Stat pools as HP, effort, difficulty tiers |

---

## System Analysis

### Dice Mechanisms

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DICE MECHANISM TAXONOMY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SINGLE DIE + MODIFIER                    DICE POOLS                        │
│  ┌─────────────────────┐                  ┌─────────────────────┐           │
│  │ D&D 5e      d20+mod │                  │ BitD       Xd6      │           │
│  │ Pathfinder  d20+mod │                  │ Year Zero  Xd6      │           │
│  │ Cypher      d20     │                  └─────────────────────┘           │
│  └─────────────────────┘                                                    │
│                                                                              │
│  SPECIAL DICE                             DUAL DICE                         │
│  ┌─────────────────────┐                  ┌─────────────────────┐           │
│  │ Fate        4dF     │                  │ Daggerheart 2d12    │           │
│  │ (-1, 0, +1 each)    │                  │ (Hope vs Fear)      │           │
│  └─────────────────────┘                  └─────────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Success Models

| System | Success Determination | Special Cases |
|--------|----------------------|---------------|
| **D&D 5e** | Roll ≥ DC | Nat 20 auto-success (attacks), Nat 1 auto-fail (attacks) |
| **Pathfinder 2e** | Roll vs DC → 4 degrees | Crit = beat by 10+, Crit fail = miss by 10+ |
| **Daggerheart** | Hope ≥ Fear = success with hope | Higher die determines who narrates |
| **Fate** | Roll + skill vs difficulty ladder | Ties go to defender, shifts matter |
| **Blades/FitD** | Highest d6: 6=full, 4-5=partial, 1-3=fail | Multiple 6s = crit |
| **Year Zero** | Count 6s as successes | 1s on stress dice = damage |
| **Cypher** | Roll × 3 ≥ target number | GM never rolls, effort reduces difficulty |

### Resource Types

```typescript
// Abstract resource categories our system must support

type ResourceCategory = 
  | 'health'           // HP, wounds, harm
  | 'pool'             // Spendable stats (Cypher pools, stress)
  | 'slot'             // Limited uses per rest (spell slots, abilities)
  | 'currency'         // Fate points, hope, XP
  | 'condition'        // Binary or tiered states (exhaustion, conditions)
  | 'track'            // Progress bars (clocks, stress tracks)
  | 'inventory';       // Countable items (arrows, rations)
```

---

## Core Abstractions

### Abstract Interfaces

```typescript
// ============================================================================
// GAME SYSTEM INTERFACE
// Every game system module must implement this interface
// ============================================================================

interface GameSystem {
  // Metadata
  id: string;                          // 'dnd5e', 'pf2e', 'daggerheart'
  name: string;                        // Display name
  version: string;                     // System version
  publisher: string;
  description: string;
  
  // Core configuration
  dice: DiceConfiguration;
  attributes: AttributeDefinition[];
  resources: ResourceDefinition[];
  skills: SkillDefinition[];
  
  // Templates
  characterTemplate: EntityTemplate;
  npcTemplates: EntityTemplate[];
  itemTemplates: EntityTemplate[];
  
  // Roll mechanics
  rollResolver: RollResolver;
  
  // UI configuration
  sheetLayouts: SheetLayout[];
  
  // Optional extensions
  actionEconomy?: ActionEconomyConfig;
  conditions?: ConditionDefinition[];
  spellcasting?: SpellcastingConfig;
}

// ============================================================================
// DICE CONFIGURATION
// Defines what dice the system uses and how
// ============================================================================

interface DiceConfiguration {
  // Standard dice available
  standardDice: DieType[];             // ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']
  
  // Special dice
  fudgeDice: boolean;                  // 4dF for Fate
  customDice?: CustomDie[];            // Hope/Fear for Daggerheart
  
  // Default roll formula
  defaultRoll: string;                 // 'd20', '2d12', '4dF'
  
  // Modifiers
  supportsAdvantage: boolean;          // D&D-style advantage
  supportsExploding: boolean;          // Dice that reroll on max
  supportsPushing: boolean;            // Year Zero pushing
}

interface CustomDie {
  name: string;                        // 'hope', 'fear', 'stress'
  sides: number;
  faces?: (number | string)[];         // Custom face values
  color?: string;                      // UI color hint
}

// ============================================================================
// ATTRIBUTE DEFINITION
// Core stats that characters have
// ============================================================================

interface AttributeDefinition {
  id: string;                          // 'strength', 'might', 'insight'
  name: string;
  abbreviation: string;                // 'STR', 'MGT', 'INS'
  
  // Value constraints
  valueType: 'number' | 'pool' | 'tier';
  minValue?: number;
  maxValue?: number;
  defaultValue: number;
  
  // How this generates a modifier
  modifierFormula?: string;            // 'floor((value - 10) / 2)' for D&D
  
  // Grouping
  category?: string;                   // 'physical', 'mental', 'social'
}

// ============================================================================
// RESOURCE DEFINITION
// Trackable resources (HP, spell slots, stress, etc.)
// ============================================================================

interface ResourceDefinition {
  id: string;
  name: string;
  category: ResourceCategory;
  
  // Value configuration
  valueType: 'current_max' | 'slots' | 'checkboxes' | 'clock';
  
  // For current/max resources
  maxFormula?: string;                 // 'level * 5 + constitution_modifier'
  
  // For slot-based resources
  slotLevels?: number[];               // [4, 3, 3, 3, 2, 1, 1, 1, 1] for spell slots
  
  // For checkbox/track resources
  boxes?: number;                      // 5 stress boxes
  
  // For clocks
  segments?: number;                   // 4, 6, or 8 segment clocks
  
  // Recovery
  recoveryTrigger?: 'short_rest' | 'long_rest' | 'scene' | 'session' | 'manual';
  recoveryFormula?: string;
  
  // UI
  displayStyle: 'bar' | 'boxes' | 'clock' | 'number' | 'slots';
}

// ============================================================================
// SKILL DEFINITION
// Skills, proficiencies, actions ratings
// ============================================================================

interface SkillDefinition {
  id: string;
  name: string;
  
  // What attribute(s) this skill uses
  linkedAttribute: string | string[];  // 'dexterity' or ['insight', 'prowess']
  
  // How proficiency works
  proficiencyType: 'boolean' | 'tiered' | 'rating' | 'dice';
  proficiencyLevels?: string[];        // ['untrained', 'trained', 'expert', 'master', 'legendary']
  maxRating?: number;                  // For dice pool systems
  
  // Roll formula
  rollFormula: string;                 // '{attribute_mod} + {proficiency_bonus}'
  
  // Categorization
  category?: string;                   // 'combat', 'social', 'exploration'
}

// ============================================================================
// ROLL RESOLVER
// How rolls are interpreted into outcomes
// ============================================================================

interface RollResolver {
  // The type of resolution system
  type: 'threshold' | 'degrees' | 'pool_count' | 'pool_highest' | 'comparison';
  
  // For threshold systems (D&D, Cypher)
  resolveThreshold?: (roll: number, target: number) => RollOutcome;
  
  // For degree systems (Pathfinder 2e)
  resolveDegrees?: (roll: number, target: number) => DegreeOfSuccess;
  
  // For dice pool systems
  resolvePool?: (dice: number[]) => PoolResult;
  
  // For comparison systems (Daggerheart)
  resolveComparison?: (dice: DiceResult[]) => ComparisonResult;
  
  // Critical detection
  detectCritical?: (dice: DiceResult[], outcome: RollOutcome) => CriticalType;
}

type DegreeOfSuccess = 'critical_failure' | 'failure' | 'success' | 'critical_success';
type CriticalType = 'none' | 'critical_success' | 'critical_failure';

interface RollOutcome {
  success: boolean;
  margin?: number;                     // How much over/under
  degree?: DegreeOfSuccess;
  critical?: CriticalType;
  narration?: 'player' | 'gm';         // For Daggerheart
  complications?: string[];
}

interface PoolResult {
  successes: number;
  ones?: number;                       // For pushing/stress damage
  highestDie: number;
  critical: boolean;
}

interface ComparisonResult {
  higher: 'hope' | 'fear' | 'tie';
  hopeValue: number;
  fearValue: number;
  withHope: boolean;
  withFear: boolean;
}
```

---

## Entity Schema

### Flexible Entity Model

```typescript
// ============================================================================
// ENTITY TEMPLATE
// Defines the structure of a type of entity (character, NPC, item, etc.)
// ============================================================================

interface EntityTemplate {
  id: string;
  systemId: string;                    // Which game system this belongs to
  entityType: 'character' | 'npc' | 'creature' | 'item' | 'vehicle' | 'location';
  name: string;
  
  // Schema definition
  fields: FieldDefinition[];
  
  // Computed values
  computedFields: ComputedFieldDefinition[];
  
  // Sections for sheet layout
  sections: SectionDefinition[];
  
  // Rolls that can be made from this entity
  rolls: RollDefinition[];
  
  // Actions available
  actions?: ActionDefinition[];
}

interface FieldDefinition {
  id: string;
  name: string;
  fieldType: FieldType;
  
  // Constraints
  required?: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  
  // For select/enum fields
  options?: { value: string; label: string }[];
  
  // For reference fields
  referenceType?: string;              // 'item', 'spell', 'feat'
  
  // UI hints
  placeholder?: string;
  helpText?: string;
  width?: 'quarter' | 'third' | 'half' | 'full';
}

type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'resource'                         // Current/max with bar
  | 'slots'                            // Checkbox array
  | 'clock'                            // Segment clock
  | 'dice'                             // Dice formula input
  | 'reference'                        // Link to another entity
  | 'reference_list'                   // List of entity references
  | 'calculated';                      // Read-only computed value

interface ComputedFieldDefinition {
  id: string;
  name: string;
  formula: string;                     // Expression to evaluate
  dependencies: string[];              // Fields this depends on
}

// ============================================================================
// DATABASE REPRESENTATION
// How entities are stored
// ============================================================================

interface Entity {
  id: string;
  templateId: string;
  campaignId: string;
  ownerId: string;
  
  // Core fields (indexed, searchable)
  name: string;
  entityType: string;
  
  // Flexible data storage
  data: Record<string, any>;           // JSONB - template-defined fields
  computed: Record<string, any>;       // Cached computed values
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;                     // For optimistic locking
}
```

### Example: D&D 5e Character Template

```typescript
const dnd5eCharacterTemplate: EntityTemplate = {
  id: 'dnd5e-character',
  systemId: 'dnd5e',
  entityType: 'character',
  name: 'D&D 5e Character',
  
  fields: [
    // Identity
    { id: 'name', name: 'Character Name', fieldType: 'text', required: true },
    { id: 'class', name: 'Class', fieldType: 'reference', referenceType: 'class' },
    { id: 'level', name: 'Level', fieldType: 'number', defaultValue: 1 },
    { id: 'race', name: 'Race', fieldType: 'reference', referenceType: 'race' },
    { id: 'background', name: 'Background', fieldType: 'reference', referenceType: 'background' },
    
    // Ability Scores
    { id: 'strength', name: 'Strength', fieldType: 'number', defaultValue: 10 },
    { id: 'dexterity', name: 'Dexterity', fieldType: 'number', defaultValue: 10 },
    { id: 'constitution', name: 'Constitution', fieldType: 'number', defaultValue: 10 },
    { id: 'intelligence', name: 'Intelligence', fieldType: 'number', defaultValue: 10 },
    { id: 'wisdom', name: 'Wisdom', fieldType: 'number', defaultValue: 10 },
    { id: 'charisma', name: 'Charisma', fieldType: 'number', defaultValue: 10 },
    
    // Combat
    { id: 'hp', name: 'Hit Points', fieldType: 'resource' },
    { id: 'temp_hp', name: 'Temporary HP', fieldType: 'number', defaultValue: 0 },
    { id: 'hit_dice', name: 'Hit Dice', fieldType: 'slots' },
    
    // Spellcasting
    { id: 'spell_slots', name: 'Spell Slots', fieldType: 'slots' },
    { id: 'spells_known', name: 'Spells', fieldType: 'reference_list', referenceType: 'spell' },
    
    // Proficiencies
    { id: 'saving_throw_proficiencies', name: 'Saving Throw Proficiencies', fieldType: 'multiselect' },
    { id: 'skill_proficiencies', name: 'Skill Proficiencies', fieldType: 'multiselect' },
    
    // Equipment
    { id: 'inventory', name: 'Inventory', fieldType: 'reference_list', referenceType: 'item' },
    { id: 'currency', name: 'Currency', fieldType: 'number' },
  ],
  
  computedFields: [
    { id: 'proficiency_bonus', name: 'Proficiency Bonus', 
      formula: 'ceil(level / 4) + 1', dependencies: ['level'] },
    { id: 'str_mod', name: 'STR Modifier', 
      formula: 'floor((strength - 10) / 2)', dependencies: ['strength'] },
    { id: 'dex_mod', name: 'DEX Modifier', 
      formula: 'floor((dexterity - 10) / 2)', dependencies: ['dexterity'] },
    { id: 'armor_class', name: 'Armor Class', 
      formula: '10 + dex_mod + equipped_armor_bonus', dependencies: ['dex_mod', 'inventory'] },
    { id: 'initiative', name: 'Initiative', 
      formula: 'dex_mod', dependencies: ['dex_mod'] },
    { id: 'max_hp', name: 'Max HP', 
      formula: 'class.hit_die + (level - 1) * (class.hit_die / 2 + 1) + level * con_mod', 
      dependencies: ['class', 'level', 'con_mod'] },
  ],
  
  rolls: [
    { id: 'initiative', name: 'Initiative', formula: 'd20 + {initiative}' },
    { id: 'str_save', name: 'Strength Save', formula: 'd20 + {str_mod} + {proficiency_bonus:saving_throw_proficiencies.includes("strength")}' },
    { id: 'attack', name: 'Attack', formula: 'd20 + {str_mod|dex_mod} + {proficiency_bonus}' },
  ],
  
  sections: [
    { id: 'header', name: 'Header', fields: ['name', 'class', 'level', 'race', 'background'] },
    { id: 'abilities', name: 'Ability Scores', fields: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] },
    { id: 'combat', name: 'Combat', fields: ['hp', 'armor_class', 'initiative', 'speed'] },
    { id: 'skills', name: 'Skills', fields: ['skill_proficiencies'] },
    { id: 'spells', name: 'Spellcasting', fields: ['spell_slots', 'spells_known'] },
    { id: 'inventory', name: 'Equipment', fields: ['inventory', 'currency'] },
  ],
  
  actions: [],
};
```

### Example: Blades in the Dark Character Template

```typescript
const bitdCharacterTemplate: EntityTemplate = {
  id: 'bitd-character',
  systemId: 'blades',
  entityType: 'character',
  name: 'Blades in the Dark Scoundrel',
  
  fields: [
    // Identity
    { id: 'name', name: 'Name', fieldType: 'text', required: true },
    { id: 'alias', name: 'Alias', fieldType: 'text' },
    { id: 'playbook', name: 'Playbook', fieldType: 'select', 
      options: [
        { value: 'cutter', label: 'Cutter' },
        { value: 'hound', label: 'Hound' },
        { value: 'leech', label: 'Leech' },
        { value: 'lurk', label: 'Lurk' },
        { value: 'slide', label: 'Slide' },
        { value: 'spider', label: 'Spider' },
        { value: 'whisper', label: 'Whisper' },
      ]
    },
    { id: 'heritage', name: 'Heritage', fieldType: 'text' },
    { id: 'background', name: 'Background', fieldType: 'text' },
    { id: 'vice', name: 'Vice', fieldType: 'text' },
    
    // Actions (0-4 dots each)
    // Insight
    { id: 'hunt', name: 'Hunt', fieldType: 'number', defaultValue: 0 },
    { id: 'study', name: 'Study', fieldType: 'number', defaultValue: 0 },
    { id: 'survey', name: 'Survey', fieldType: 'number', defaultValue: 0 },
    { id: 'tinker', name: 'Tinker', fieldType: 'number', defaultValue: 0 },
    // Prowess
    { id: 'finesse', name: 'Finesse', fieldType: 'number', defaultValue: 0 },
    { id: 'prowl', name: 'Prowl', fieldType: 'number', defaultValue: 0 },
    { id: 'skirmish', name: 'Skirmish', fieldType: 'number', defaultValue: 0 },
    { id: 'wreck', name: 'Wreck', fieldType: 'number', defaultValue: 0 },
    // Resolve
    { id: 'attune', name: 'Attune', fieldType: 'number', defaultValue: 0 },
    { id: 'command', name: 'Command', fieldType: 'number', defaultValue: 0 },
    { id: 'consort', name: 'Consort', fieldType: 'number', defaultValue: 0 },
    { id: 'sway', name: 'Sway', fieldType: 'number', defaultValue: 0 },
    
    // Stress & Trauma
    { id: 'stress', name: 'Stress', fieldType: 'slots' },  // 9 boxes
    { id: 'trauma', name: 'Trauma', fieldType: 'multiselect',
      options: [
        { value: 'cold', label: 'Cold' },
        { value: 'haunted', label: 'Haunted' },
        { value: 'obsessed', label: 'Obsessed' },
        { value: 'paranoid', label: 'Paranoid' },
        { value: 'reckless', label: 'Reckless' },
        { value: 'soft', label: 'Soft' },
        { value: 'unstable', label: 'Unstable' },
        { value: 'vicious', label: 'Vicious' },
      ]
    },
    
    // Harm
    { id: 'harm_3', name: 'Level 3 Harm', fieldType: 'text' },    // Fatal
    { id: 'harm_2a', name: 'Level 2 Harm', fieldType: 'text' },   // Serious
    { id: 'harm_2b', name: 'Level 2 Harm', fieldType: 'text' },
    { id: 'harm_1a', name: 'Level 1 Harm', fieldType: 'text' },   // Minor
    { id: 'harm_1b', name: 'Level 1 Harm', fieldType: 'text' },
    
    // Healing & Armor
    { id: 'healing_clock', name: 'Healing', fieldType: 'clock' }, // 4-segment
    { id: 'armor', name: 'Armor', fieldType: 'boolean' },
    { id: 'heavy_armor', name: 'Heavy', fieldType: 'boolean' },
    { id: 'special_armor', name: 'Special', fieldType: 'boolean' },
    
    // Load & Items
    { id: 'load', name: 'Load', fieldType: 'select',
      options: [
        { value: 'light', label: 'Light (3)' },
        { value: 'normal', label: 'Normal (5)' },
        { value: 'heavy', label: 'Heavy (6)' },
      ]
    },
    { id: 'items', name: 'Items', fieldType: 'reference_list', referenceType: 'item' },
    
    // XP & Advancement
    { id: 'playbook_xp', name: 'Playbook XP', fieldType: 'clock' }, // 8-segment
    { id: 'insight_xp', name: 'Insight XP', fieldType: 'clock' },   // 6-segment
    { id: 'prowess_xp', name: 'Prowess XP', fieldType: 'clock' },
    { id: 'resolve_xp', name: 'Resolve XP', fieldType: 'clock' },
    
    // Special Abilities
    { id: 'abilities', name: 'Special Abilities', fieldType: 'reference_list', referenceType: 'ability' },
  ],
  
  computedFields: [
    { id: 'insight_rating', name: 'Insight', 
      formula: 'min(hunt, 1) + min(study, 1) + min(survey, 1) + min(tinker, 1)', 
      dependencies: ['hunt', 'study', 'survey', 'tinker'] },
    { id: 'prowess_rating', name: 'Prowess', 
      formula: 'min(finesse, 1) + min(prowl, 1) + min(skirmish, 1) + min(wreck, 1)', 
      dependencies: ['finesse', 'prowl', 'skirmish', 'wreck'] },
    { id: 'resolve_rating', name: 'Resolve', 
      formula: 'min(attune, 1) + min(command, 1) + min(consort, 1) + min(sway, 1)', 
      dependencies: ['attune', 'command', 'consort', 'sway'] },
  ],
  
  rolls: [
    // Action rolls
    { id: 'action_roll', name: 'Action Roll', formula: '{action}d6' },
    // Resistance rolls
    { id: 'insight_resist', name: 'Resist (Insight)', formula: '{insight_rating}d6' },
    { id: 'prowess_resist', name: 'Resist (Prowess)', formula: '{prowess_rating}d6' },
    { id: 'resolve_resist', name: 'Resist (Resolve)', formula: '{resolve_rating}d6' },
    // Fortune rolls
    { id: 'fortune', name: 'Fortune Roll', formula: '{dice_count}d6' },
  ],
  
  sections: [
    { id: 'header', name: 'Identity', fields: ['name', 'alias', 'playbook', 'heritage', 'background', 'vice'] },
    { id: 'insight', name: 'Insight Actions', fields: ['hunt', 'study', 'survey', 'tinker'] },
    { id: 'prowess', name: 'Prowess Actions', fields: ['finesse', 'prowl', 'skirmish', 'wreck'] },
    { id: 'resolve', name: 'Resolve Actions', fields: ['attune', 'command', 'consort', 'sway'] },
    { id: 'stress_trauma', name: 'Stress & Trauma', fields: ['stress', 'trauma'] },
    { id: 'harm', name: 'Harm', fields: ['harm_3', 'harm_2a', 'harm_2b', 'harm_1a', 'harm_1b', 'healing_clock'] },
    { id: 'load', name: 'Loadout', fields: ['load', 'armor', 'heavy_armor', 'special_armor', 'items'] },
    { id: 'xp', name: 'Experience', fields: ['playbook_xp', 'insight_xp', 'prowess_xp', 'resolve_xp'] },
    { id: 'abilities', name: 'Abilities', fields: ['abilities'] },
  ],
  
  actions: [],
};
```

---

## Dice Engine

### Universal Dice Parser

The dice engine must parse and evaluate formulas for all supported systems.

```typescript
// ============================================================================
// DICE FORMULA GRAMMAR
// ============================================================================

/*
FORMULA     := TERM (('+' | '-') TERM)*
TERM        := DICE_EXPR | NUMBER | VARIABLE
DICE_EXPR   := COUNT? DIE_TYPE MODIFIERS* LABEL?
COUNT       := NUMBER | '(' FORMULA ')'
DIE_TYPE    := 'd' NUMBER | 'dF'
MODIFIERS   := KEEP | DROP | REROLL | EXPLODE | TARGET
KEEP        := 'k' ('h' | 'l')? NUMBER
DROP        := 'd' ('h' | 'l')? NUMBER  
REROLL      := 'r' ('o')? COMPARE NUMBER
EXPLODE     := '!' COMPARE? NUMBER?
TARGET      := COMPARE NUMBER
COMPARE     := '>' | '<' | '>=' | '<=' | '='
LABEL       := '"' STRING '"'
VARIABLE    := '{' IDENTIFIER '}'
NUMBER      := DIGIT+
*/

interface DiceExpression {
  count: number | DiceExpression;
  sides: number | 'F';                 // 'F' for Fudge dice
  modifiers: DiceModifier[];
  label?: string;
}

type DiceModifier = 
  | { type: 'keep_highest'; count: number }
  | { type: 'keep_lowest'; count: number }
  | { type: 'drop_highest'; count: number }
  | { type: 'drop_lowest'; count: number }
  | { type: 'reroll'; compare: CompareOp; value: number; once: boolean }
  | { type: 'explode'; compare: CompareOp; value: number }
  | { type: 'target'; compare: CompareOp; value: number };

// ============================================================================
// DICE ROLL RESULT
// ============================================================================

interface DiceRollResult {
  formula: string;                     // Original formula
  rolls: DieRoll[];                    // Individual die results
  total: number;                       // Final calculated value
  breakdown: string;                   // Human-readable breakdown
  
  // For pool systems
  successes?: number;
  ones?: number;
  highest?: number;
  
  // Metadata
  timestamp: Date;
  rollerId: string;
  characterId?: string;
}

interface DieRoll {
  sides: number | 'F';
  result: number;
  kept: boolean;
  exploded: boolean;
  rerolled: boolean;
  isSuccess?: boolean;                 // For target number systems
  originalResult?: number;             // If rerolled
}
```

### System-Specific Roll Examples

```typescript
// D&D 5e - Advantage attack roll
// Formula: 2d20kh1+5 "Attack Roll"
// Result: [17, 8] → keep highest → 17 + 5 = 22

// Pathfinder 2e - Skill check with hero point
// Formula: 2d20kh1+12 "Stealth (Hero Point)"  
// Result: [4, 18] → keep highest → 18 + 12 = 30

// Daggerheart - Action roll
// Formula: 2d12 "Hope vs Fear"
// Result: { hope: 8, fear: 11 } → Fear higher, success with fear

// Fate - Skill roll
// Formula: 4dF+3 "Fight"
// Result: [+1, -1, 0, +1] → +1 + 3 = 4 (Great)

// Blades in the Dark - Action roll
// Formula: 3d6 "Prowl"
// Result: [2, 5, 6] → highest 6 = Full success

// Year Zero Engine - Skill roll
// Formula: 5d6>5 "Manipulation"
// Result: [1, 3, 4, 6, 6] → 2 successes (but one 1 for pushing damage)

// Cypher System - Attack
// Formula: d20 "Melee Attack"
// Result: 15 → vs difficulty 4 (target 12) → Success
```

---

## Roll Resolution

### Resolution Engine Interface

```typescript
// ============================================================================
// ROLL RESOLUTION ENGINE
// Each system implements its own resolution logic
// ============================================================================

interface RollResolutionEngine {
  // Main resolution method
  resolve(roll: DiceRollResult, context: RollContext): ResolvedRoll;
  
  // Get possible outcomes for UI
  getOutcomes(): OutcomeDefinition[];
  
  // Format result for display
  formatResult(resolved: ResolvedRoll): FormattedResult;
}

interface RollContext {
  // Target/difficulty
  targetNumber?: number;
  difficulty?: number;
  opposedRoll?: DiceRollResult;
  
  // Position/Effect (BitD)
  position?: 'controlled' | 'risky' | 'desperate';
  effect?: 'limited' | 'standard' | 'great';
  
  // Modifiers
  advantage?: boolean;
  disadvantage?: boolean;
  bonusDice?: number;
  
  // Character context
  characterId?: string;
  skillId?: string;
}

interface ResolvedRoll {
  outcome: string;                     // 'success', 'failure', 'critical_success', etc.
  degree?: number;                     // For degrees of success
  margin?: number;                     // How much over/under target
  
  // System-specific data
  systemData?: Record<string, any>;
  
  // Narrative hints
  narration?: 'player' | 'gm';
  complications?: string[];
  benefits?: string[];
}

interface FormattedResult {
  summary: string;                     // "Success!" or "4 successes"
  details: string;                     // "[17, ~~8~~] + 5 = 22 vs DC 15"
  cssClass: string;                    // For styling
  icon?: string;                       // Emoji or icon name
}
```

### System-Specific Resolvers

```typescript
// ============================================================================
// D&D 5e RESOLVER
// ============================================================================

const dnd5eResolver: RollResolutionEngine = {
  resolve(roll, context) {
    const total = roll.total;
    const target = context.targetNumber || 10;
    
    // Check for natural 20/1 on attack rolls
    const d20 = roll.rolls.find(r => r.sides === 20 && r.kept);
    const isNat20 = d20?.result === 20;
    const isNat1 = d20?.result === 1;
    
    if (context.skillId?.includes('attack')) {
      if (isNat20) return { outcome: 'critical_success', margin: total - target };
      if (isNat1) return { outcome: 'critical_failure', margin: total - target };
    }
    
    return {
      outcome: total >= target ? 'success' : 'failure',
      margin: total - target,
    };
  },
  
  getOutcomes() {
    return [
      { id: 'critical_success', name: 'Critical Success', color: '#ffd700' },
      { id: 'success', name: 'Success', color: '#22c55e' },
      { id: 'failure', name: 'Failure', color: '#ef4444' },
      { id: 'critical_failure', name: 'Critical Failure', color: '#7f1d1d' },
    ];
  },
  
  formatResult(resolved) {
    const icons = {
      critical_success: '💥',
      success: '✓',
      failure: '✗',
      critical_failure: '💀',
    };
    return {
      summary: resolved.outcome.replace('_', ' ').toUpperCase(),
      details: `Margin: ${resolved.margin >= 0 ? '+' : ''}${resolved.margin}`,
      cssClass: `roll-${resolved.outcome}`,
      icon: icons[resolved.outcome],
    };
  },
};

// ============================================================================
// PATHFINDER 2e RESOLVER
// ============================================================================

const pf2eResolver: RollResolutionEngine = {
  resolve(roll, context) {
    const total = roll.total;
    const dc = context.targetNumber || 15;
    const difference = total - dc;
    
    let degree: DegreeOfSuccess;
    
    if (difference >= 10) {
      degree = 'critical_success';
    } else if (difference >= 0) {
      degree = 'success';
    } else if (difference >= -10) {
      degree = 'failure';
    } else {
      degree = 'critical_failure';
    }
    
    // Natural 20 upgrades one step, natural 1 downgrades
    const d20 = roll.rolls.find(r => r.sides === 20 && r.kept);
    if (d20?.result === 20 && degree !== 'critical_success') {
      degree = upgradeDegree(degree);
    }
    if (d20?.result === 1 && degree !== 'critical_failure') {
      degree = downgradeDegree(degree);
    }
    
    return { outcome: degree, degree: degreeToNumber(degree), margin: difference };
  },
  
  getOutcomes() {
    return [
      { id: 'critical_success', name: 'Critical Success', color: '#ffd700' },
      { id: 'success', name: 'Success', color: '#22c55e' },
      { id: 'failure', name: 'Failure', color: '#ef4444' },
      { id: 'critical_failure', name: 'Critical Failure', color: '#7f1d1d' },
    ];
  },
  
  formatResult(resolved) {
    return {
      summary: resolved.outcome.replace('_', ' '),
      details: `DC ${resolved.margin + resolved.degree}`,
      cssClass: `roll-${resolved.outcome}`,
    };
  },
};

// ============================================================================
// BLADES IN THE DARK RESOLVER
// ============================================================================

const bitdResolver: RollResolutionEngine = {
  resolve(roll, context) {
    const dice = roll.rolls.filter(r => r.kept).map(r => r.result);
    const highest = Math.max(...dice);
    const sixes = dice.filter(d => d === 6).length;
    
    // Zero dice = roll 2, take lowest
    if (dice.length === 0) {
      // This case is handled at roll time
    }
    
    let outcome: string;
    let complications: string[] = [];
    let benefits: string[] = [];
    
    if (sixes >= 2) {
      outcome = 'critical';
      benefits.push('You do it with increased effect');
    } else if (highest === 6) {
      outcome = 'success';
      benefits.push('You do it');
    } else if (highest >= 4) {
      outcome = 'partial';
      complications.push('You do it, but there\'s a consequence');
    } else {
      outcome = 'failure';
      complications.push('Things go badly');
    }
    
    // Apply position
    if (context.position === 'desperate' && outcome !== 'critical') {
      complications.push('Desperate stakes mean worse consequences');
    }
    
    return {
      outcome,
      systemData: { highest, sixes, position: context.position, effect: context.effect },
      complications,
      benefits,
    };
  },
  
  getOutcomes() {
    return [
      { id: 'critical', name: 'Critical', color: '#ffd700' },
      { id: 'success', name: 'Full Success', color: '#22c55e' },
      { id: 'partial', name: 'Partial Success', color: '#f59e0b' },
      { id: 'failure', name: 'Failure', color: '#ef4444' },
    ];
  },
  
  formatResult(resolved) {
    return {
      summary: resolved.outcome === 'critical' ? 'CRITICAL!' : 
               resolved.outcome === 'success' ? 'Success' :
               resolved.outcome === 'partial' ? 'Partial' : 'Failure',
      details: `Highest: ${resolved.systemData.highest}`,
      cssClass: `roll-bitd-${resolved.outcome}`,
    };
  },
};

// ============================================================================
// DAGGERHEART RESOLVER
// ============================================================================

const daggerheartResolver: RollResolutionEngine = {
  resolve(roll, context) {
    // Daggerheart uses 2d12 - one Hope, one Fear
    const hopeDie = roll.rolls[0];
    const fearDie = roll.rolls[1];
    
    const hopeValue = hopeDie.result;
    const fearValue = fearDie.result;
    
    const withHope = hopeValue >= fearValue;
    const withFear = fearValue > hopeValue;
    
    // In Daggerheart, the roll succeeds based on meeting a difficulty
    // But the Hope/Fear determines who narrates
    const total = hopeValue + fearValue;
    const target = context.targetNumber || 10;
    const success = total >= target;
    
    return {
      outcome: success ? (withHope ? 'success_hope' : 'success_fear') 
                       : (withHope ? 'failure_hope' : 'failure_fear'),
      margin: total - target,
      narration: withHope ? 'player' : 'gm',
      systemData: { hopeValue, fearValue, withHope, withFear, total },
    };
  },
  
  getOutcomes() {
    return [
      { id: 'success_hope', name: 'Success with Hope', color: '#60a5fa' },
      { id: 'success_fear', name: 'Success with Fear', color: '#c084fc' },
      { id: 'failure_hope', name: 'Failure with Hope', color: '#93c5fd' },
      { id: 'failure_fear', name: 'Failure with Fear', color: '#a855f7' },
    ];
  },
  
  formatResult(resolved) {
    const { hopeValue, fearValue, withHope } = resolved.systemData;
    return {
      summary: resolved.outcome.includes('success') ? 'Success' : 'Failure',
      details: `Hope: ${hopeValue} | Fear: ${fearValue} → ${withHope ? 'with Hope' : 'with Fear'}`,
      cssClass: `roll-daggerheart-${withHope ? 'hope' : 'fear'}`,
      icon: withHope ? '✨' : '😈',
    };
  },
};
```

---

## Resource Systems

### Universal Resource Tracker

```typescript
// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

interface ResourceTracker {
  // Get current value
  getValue(entityId: string, resourceId: string): ResourceValue;
  
  // Modify value
  spend(entityId: string, resourceId: string, amount: number): ResourceValue;
  recover(entityId: string, resourceId: string, amount: number): ResourceValue;
  set(entityId: string, resourceId: string, value: any): ResourceValue;
  
  // Check availability
  canSpend(entityId: string, resourceId: string, amount: number): boolean;
  
  // Trigger recovery
  triggerRecovery(entityId: string, trigger: RecoveryTrigger): ResourceValue[];
}

type ResourceValue = 
  | { type: 'current_max'; current: number; max: number }
  | { type: 'slots'; slots: boolean[]; perLevel?: boolean[][] }
  | { type: 'checkboxes'; checked: number; total: number }
  | { type: 'clock'; filled: number; segments: number }
  | { type: 'pool'; current: number; max: number };

type RecoveryTrigger = 
  | 'short_rest'      // D&D
  | 'long_rest'       // D&D
  | 'refocus'         // PF2e
  | 'daily_prep'      // PF2e
  | 'downtime'        // BitD
  | 'vice'            // BitD
  | 'scene_end'       // Fate
  | 'milestone'       // General XP
  | 'session_end';    // General

// ============================================================================
// EXAMPLE: D&D 5e SPELL SLOTS
// ============================================================================

const dnd5eSpellSlots: ResourceDefinition = {
  id: 'spell_slots',
  name: 'Spell Slots',
  category: 'slot',
  valueType: 'slots',
  
  // Slots by level, indexed by character level
  slotProgression: {
    // Format: [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
    1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
    2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
    3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
    4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
    5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
    // ... etc
    20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  },
  
  recoveryTrigger: 'long_rest',
  displayStyle: 'slots',
};

// ============================================================================
// EXAMPLE: BLADES STRESS TRACK
// ============================================================================

const bitdStress: ResourceDefinition = {
  id: 'stress',
  name: 'Stress',
  category: 'track',
  valueType: 'checkboxes',
  boxes: 9,
  
  // No automatic recovery - recovered through vice
  recoveryTrigger: 'manual',
  
  // When full, take trauma
  onFull: 'trigger_trauma',
  
  displayStyle: 'boxes',
};

// ============================================================================
// EXAMPLE: CYPHER STAT POOLS
// ============================================================================

const cypherMightPool: ResourceDefinition = {
  id: 'might_pool',
  name: 'Might',
  category: 'pool',
  valueType: 'current_max',
  
  // Max is set during character creation
  maxFormula: 'base_might',
  
  // Partial recovery on rest
  recoveryTrigger: 'recovery_roll',
  recoveryFormula: 'd6 + recovery_bonus',
  
  // Pools are also HP
  damageAbsorption: true,
  
  displayStyle: 'bar',
};
```

---

## Character Sheet Templates

### Layout Engine

```typescript
// ============================================================================
// SHEET LAYOUT SYSTEM
// ============================================================================

interface SheetLayout {
  id: string;
  systemId: string;
  name: string;
  
  // Layout grid
  columns: number;                     // 12-column grid
  rows: LayoutRow[];
  
  // Theme
  theme: SheetTheme;
  
  // Interactivity
  rolls: RollableElement[];
  resourceBars: ResourceBar[];
  toggles: ToggleElement[];
}

interface LayoutRow {
  height: 'auto' | 'fixed' | 'flex';
  fixedHeight?: number;
  cells: LayoutCell[];
}

interface LayoutCell {
  colSpan: number;                     // 1-12
  content: CellContent;
  style?: CellStyle;
}

type CellContent = 
  | { type: 'field'; fieldId: string }
  | { type: 'computed'; computedId: string }
  | { type: 'resource'; resourceId: string }
  | { type: 'roll_button'; rollId: string }
  | { type: 'section'; sectionId: string }
  | { type: 'list'; listId: string }
  | { type: 'custom'; component: string };

interface SheetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderStyle: 'solid' | 'dashed' | 'none';
}

// ============================================================================
// ROLLABLE ELEMENTS
// ============================================================================

interface RollableElement {
  id: string;
  label: string;
  formula: string;                     // With variable references
  displayPosition: { row: number; col: number };
  
  // Optional context
  skillId?: string;
  attributeId?: string;
  
  // Visual style
  style: 'button' | 'inline' | 'hover';
}
```

### Example: D&D 5e Sheet Layout

```typescript
const dnd5eSheetLayout: SheetLayout = {
  id: 'dnd5e-standard',
  systemId: 'dnd5e',
  name: 'Standard Character Sheet',
  columns: 12,
  
  rows: [
    // Header row
    {
      height: 'auto',
      cells: [
        { colSpan: 4, content: { type: 'field', fieldId: 'name' } },
        { colSpan: 2, content: { type: 'field', fieldId: 'class' } },
        { colSpan: 1, content: { type: 'field', fieldId: 'level' } },
        { colSpan: 2, content: { type: 'field', fieldId: 'race' } },
        { colSpan: 3, content: { type: 'field', fieldId: 'background' } },
      ],
    },
    
    // Main content row
    {
      height: 'flex',
      cells: [
        // Left column - Ability scores
        {
          colSpan: 2,
          content: { type: 'section', sectionId: 'abilities' },
          style: { display: 'grid', gap: '8px' },
        },
        
        // Center column - Combat stats, skills
        {
          colSpan: 5,
          content: { type: 'custom', component: 'CombatStatsPanel' },
        },
        
        // Right column - Features, equipment
        {
          colSpan: 5,
          content: { type: 'section', sectionId: 'features' },
        },
      ],
    },
  ],
  
  theme: {
    primaryColor: '#c41e3a',           // D&D Red
    secondaryColor: '#1a1a2e',
    backgroundColor: '#f5f0e6',        // Parchment
    fontFamily: 'Bookinsanity, serif',
    borderStyle: 'solid',
  },
  
  rolls: [
    { id: 'str_check', label: 'STR', formula: 'd20 + {str_mod}', 
      displayPosition: { row: 1, col: 0 }, style: 'hover' },
    { id: 'str_save', label: 'Save', formula: 'd20 + {str_mod} + {proficiency_bonus:str_save_proficient}', 
      displayPosition: { row: 1, col: 0 }, style: 'button' },
    // ... other ability checks and saves
  ],
  
  resourceBars: [
    { id: 'hp_bar', resourceId: 'hp', style: 'bar', showNumbers: true },
    { id: 'temp_hp', resourceId: 'temp_hp', style: 'number' },
  ],
  
  toggles: [],
};
```

---

## Action Economy

### Universal Action Tracker

```typescript
// ============================================================================
// ACTION ECONOMY ABSTRACTION
// ============================================================================

interface ActionEconomyConfig {
  type: 'action_types' | 'action_points' | 'freeform';
  
  // For action_types (D&D 5e)
  actionTypes?: ActionTypeDefinition[];
  
  // For action_points (PF2e)
  actionPoints?: {
    perTurn: number;
    costs: Record<string, number>;     // { 'strike': 1, 'raise_shield': 1, 'sudden_charge': 2 }
  };
  
  // Recovery timing
  resetOn: 'turn_start' | 'round_start' | 'scene_end';
}

interface ActionTypeDefinition {
  id: string;
  name: string;
  countPerTurn: number;                // 1 for most, unlimited for free
  examples: string[];
}

// ============================================================================
// D&D 5e ACTION ECONOMY
// ============================================================================

const dnd5eActionEconomy: ActionEconomyConfig = {
  type: 'action_types',
  actionTypes: [
    { id: 'action', name: 'Action', countPerTurn: 1, 
      examples: ['Attack', 'Cast a Spell', 'Dash', 'Dodge', 'Help'] },
    { id: 'bonus_action', name: 'Bonus Action', countPerTurn: 1, 
      examples: ['Offhand Attack', 'Cunning Action', 'Bonus Action Spells'] },
    { id: 'reaction', name: 'Reaction', countPerTurn: 1, 
      examples: ['Opportunity Attack', 'Shield Spell', 'Counterspell'] },
    { id: 'movement', name: 'Movement', countPerTurn: 1, 
      examples: ['Move up to speed'] },
    { id: 'free', name: 'Free Action', countPerTurn: -1, 
      examples: ['Drop item', 'Speak briefly'] },
  ],
  resetOn: 'turn_start',
};

// ============================================================================
// PATHFINDER 2e ACTION ECONOMY
// ============================================================================

const pf2eActionEconomy: ActionEconomyConfig = {
  type: 'action_points',
  actionPoints: {
    perTurn: 3,
    costs: {
      'stride': 1,
      'strike': 1,
      'raise_shield': 1,
      'cast_spell_1': 1,
      'cast_spell_2': 2,
      'cast_spell_3': 3,
      'sudden_charge': 2,
      'power_attack': 2,
      // Activities can cost more
    },
  },
  resetOn: 'turn_start',
};

// ============================================================================
// BLADES IN THE DARK ACTION ECONOMY
// ============================================================================

const bitdActionEconomy: ActionEconomyConfig = {
  type: 'freeform',
  // BitD doesn't have strict action economy
  // Instead it has position/effect and fictional positioning
  resetOn: 'scene_end',
};
```

---

## System Modules

### Module Package Format

```typescript
// ============================================================================
// GAME SYSTEM MODULE
// A complete, installable game system
// ============================================================================

interface GameSystemModule {
  // Package metadata
  manifest: {
    id: string;                        // 'dnd5e', 'pf2e', 'daggerheart'
    name: string;
    version: string;
    authors: string[];
    description: string;
    license: string;
    homepage?: string;
    
    // Compatibility
    minPlatformVersion: string;
    
    // Dependencies
    dependencies?: string[];           // Other modules required
  };
  
  // The system definition
  system: GameSystem;
  
  // Content (optional - can be separate content packs)
  content?: {
    classes?: EntityTemplate[];
    races?: EntityTemplate[];
    backgrounds?: EntityTemplate[];
    items?: Entity[];
    spells?: Entity[];
    monsters?: Entity[];
    feats?: Entity[];
  };
  
  // Compendiums (searchable databases)
  compendiums?: CompendiumDefinition[];
  
  // UI customizations
  css?: string;
  components?: Record<string, ComponentDefinition>;
  
  // Macros and automation
  macros?: MacroDefinition[];
  
  // Localization
  i18n?: Record<string, Record<string, string>>;
}

// ============================================================================
// COMPENDIUM DEFINITION
// Searchable content databases
// ============================================================================

interface CompendiumDefinition {
  id: string;
  name: string;
  entityType: string;
  
  // Index fields for search
  searchFields: string[];
  
  // Filter options
  filters: FilterDefinition[];
  
  // Display configuration
  listColumns: ColumnDefinition[];
  detailLayout: string;                // Layout template ID
}

interface FilterDefinition {
  id: string;
  field: string;
  type: 'select' | 'multiselect' | 'range' | 'text';
  options?: { value: string; label: string }[];
}
```

### Module Directory Structure

```
dnd5e-module/
├── manifest.json
├── system.json
├── content/
│   ├── classes/
│   │   ├── barbarian.json
│   │   ├── bard.json
│   │   └── ...
│   ├── races/
│   ├── backgrounds/
│   ├── spells/
│   ├── items/
│   └── monsters/
├── templates/
│   ├── character-sheet.json
│   ├── npc-sheet.json
│   └── item-sheet.json
├── assets/
│   ├── icons/
│   └── images/
├── styles/
│   └── dnd5e.css
├── components/
│   └── spell-slot-tracker.jsx
├── macros/
│   ├── short-rest.js
│   └── death-save.js
└── i18n/
    ├── en.json
    ├── es.json
    └── de.json
```

---

## Implementation Priority

### Phase 1: Core Framework + D&D 5e, Pathfinder 2e, Daggerheart

1. **Week 1-2: Dice Engine**
   - Universal parser supporting d20, pools, 4dF, 2d12
   - Roll modifiers (keep, drop, reroll, explode)
   - Variable substitution from character data

2. **Week 3-4: Entity Schema**
   - Template definition format
   - Field types and validation
   - Computed field engine
   - JSONB storage with indexing

3. **Week 5-6: D&D 5e Module**
   - Character template with all fields
   - Ability score modifiers
   - Proficiency system
   - Spell slot tracking
   - Basic monster template

4. **Week 7-8: Pathfinder 2e Module**
   - 4 degrees of success resolver
   - 3-action economy tracker
   - Proficiency tier system (TEML)
   - Focus points

5. **Week 9-10: Daggerheart Module**
   - Hope/Fear dice resolver
   - Stress and Hope resources
   - Domain card references
   - Dual-dice UI component

6. **Week 11-12: Sheet Renderer**
   - Grid-based layout engine
   - Rollable elements
   - Resource bars and trackers
   - Theme customization

### Phase 2: Dice Pool Systems

1. **Week 1-3: Blades in the Dark / Forged in the Dark**
   - d6 pool resolver (highest die, crits)
   - Position/Effect UI
   - Clock system
   - Stress/Trauma tracking
   - Crew sheets

2. **Week 4-5: Year Zero Engine**
   - d6 pool with success counting
   - Pushing mechanics
   - Condition tracking
   - Gear dice

3. **Week 6-7: Fate Core**
   - Fudge dice implementation
   - Aspect management
   - Fate point economy
   - Stress/Consequence tracks
   - Ladder display

4. **Week 8-9: Cypher System**
   - Stat pools as resources
   - Effort system
   - Difficulty reduction mechanics
   - Cypher inventory

5. **Week 10: Polish & Testing**
   - Cross-system testing
   - Performance optimization
   - Documentation

---

## Appendix: Quick Reference

### Dice Notation by System

| System | Standard Roll | Special Notation |
|--------|---------------|------------------|
| D&D 5e | `d20+5` | `2d20kh1+5` (advantage) |
| Pathfinder 2e | `d20+12` | `2d20kh1+12` (hero point) |
| Daggerheart | `2d12` | Hope die vs Fear die |
| Fate | `4dF+3` | Fudge dice: -1, 0, +1 each |
| Blades/FitD | `3d6` | Highest die determines outcome |
| Year Zero | `5d6>=6` | Count 6s as successes |
| Cypher | `d20` | Compare to target (difficulty × 3) |

### Resource Types by System

| System | Primary Resources |
|--------|-------------------|
| D&D 5e | HP, Hit Dice, Spell Slots, Ki, Rage, etc. |
| Pathfinder 2e | HP, Focus Points, Hero Points, Spell Slots |
| Daggerheart | Stress, Hope, Armor, Evasion |
| Fate | Fate Points, Physical Stress, Mental Stress, Consequences |
| Blades/FitD | Stress, Trauma, Harm, Armor |
| Year Zero | Attribute/Skill damage, Conditions |
| Cypher | Might Pool, Speed Pool, Intellect Pool, Effort |
