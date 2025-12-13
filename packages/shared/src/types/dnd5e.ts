/**
 * D&D 5th Edition Game System Type Definitions
 *
 * Comprehensive type definitions for D&D 5e game mechanics, character data,
 * items, spells, NPCs/monsters, and system configuration.
 *
 * These types are designed to work with the VTT's game system framework,
 * item template system, and form designer.
 *
 * @see packages/shared/src/types/game-systems.ts
 * @see packages/shared/src/types/item-templates.ts
 * @see packages/shared/src/types/forms.ts
 */

// ============================================================================
// CORE D&D 5E TYPES
// ============================================================================

/**
 * The six core ability scores in D&D 5e
 */
export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

/**
 * All 18 skills in D&D 5e, mapped to their governing abilities
 */
export type Skill =
  | 'acrobatics'      // DEX
  | 'animalHandling'  // WIS
  | 'arcana'          // INT
  | 'athletics'       // STR
  | 'deception'       // CHA
  | 'history'         // INT
  | 'insight'         // WIS
  | 'intimidation'    // CHA
  | 'investigation'   // INT
  | 'medicine'        // WIS
  | 'nature'          // INT
  | 'perception'      // WIS
  | 'performance'     // CHA
  | 'persuasion'      // CHA
  | 'religion'        // INT
  | 'sleightOfHand'   // DEX
  | 'stealth'         // DEX
  | 'survival';       // WIS

/**
 * Standard polyhedral dice used in D&D 5e
 */
export type DieSize = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

/**
 * All damage types in D&D 5e
 */
export type DamageType =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder';

/**
 * The eight schools of magic
 */
export type SpellSchool =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

/**
 * Action types for abilities and items (based on Foundry VTT conventions)
 */
export type DnD5eActivationType =
  | 'action'       // Standard action
  | 'bonus'        // Bonus action
  | 'reaction'     // Reaction
  | 'minute'       // Takes 1+ minutes
  | 'hour'         // Takes 1+ hours
  | 'day'          // Takes 1+ days
  | 'special'      // Special activation condition
  | 'legendary'    // Legendary action
  | 'mythic'       // Mythic action
  | 'lair'         // Lair action
  | 'none';        // No action required (passive)

/**
 * Target types for spells and abilities
 */
export type TargetType =
  | 'self'       // Targets only the caster
  | 'creature'   // Single creature
  | 'ally'       // Friendly creature
  | 'enemy'      // Hostile creature
  | 'object'     // An object
  | 'space'      // A point in space
  | 'sphere'     // Spherical area
  | 'cylinder'   // Cylindrical area
  | 'cone'       // Cone-shaped area
  | 'cube'       // Cubic area
  | 'line'       // Line-shaped area
  | 'wall';      // Wall-shaped area

/**
 * Distance units
 */
export type DistanceUnit =
  | 'feet'
  | 'miles'
  | 'touch'
  | 'self'
  | 'sight'
  | 'unlimited'
  | 'special';

/**
 * Time units for durations
 */
export type TimeUnit =
  | 'instant'
  | 'round'
  | 'minute'
  | 'hour'
  | 'day'
  | 'until_dispelled'
  | 'until_dispelled_or_triggered'
  | 'concentration'
  | 'special'
  | 'permanent';

/**
 * Creature sizes
 */
export type CreatureSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

/**
 * Creature types
 */
export type CreatureType =
  | 'aberration'
  | 'beast'
  | 'celestial'
  | 'construct'
  | 'dragon'
  | 'elemental'
  | 'fey'
  | 'fiend'
  | 'giant'
  | 'humanoid'
  | 'monstrosity'
  | 'ooze'
  | 'plant'
  | 'undead';

/**
 * Weapon properties
 */
export type WeaponProperty =
  | 'ammunition'
  | 'finesse'
  | 'heavy'
  | 'light'
  | 'loading'
  | 'reach'
  | 'special'
  | 'thrown'
  | 'two_handed'
  | 'versatile';

/**
 * Armor types
 */
export type ArmorType = 'light' | 'medium' | 'heavy' | 'shield' | 'natural';

/**
 * Weapon types
 */
export type WeaponType = 'simple' | 'martial';

/**
 * Weapon range categories
 */
export type WeaponRange = 'melee' | 'ranged';

/**
 * Consumable item types
 */
export type ConsumableType =
  | 'potion'
  | 'scroll'
  | 'wand'
  | 'rod'
  | 'food'
  | 'ammunition'
  | 'trinket'
  | 'other';

/**
 * Rarity levels for magic items
 */
export type DnD5eItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare'
  | 'legendary'
  | 'artifact';

// ============================================================================
// CHARACTER DATA
// ============================================================================

/**
 * A single ability score with all related values
 */
export interface DnD5eAbilityScore {
  /** Raw ability score value (typically 1-20, can go higher) */
  value: number;
  /** Ability modifier: floor((value - 10) / 2) */
  mod: number;
  /** Saving throw bonus (includes proficiency if proficient) */
  save: number;
  /** Whether proficient in this saving throw */
  proficient: boolean;
  /** Override value (e.g., from magic items) */
  override?: number;
}

/**
 * All six ability scores
 */
export interface DnD5eAbilityScores {
  str: DnD5eAbilityScore;
  dex: DnD5eAbilityScore;
  con: DnD5eAbilityScore;
  int: DnD5eAbilityScore;
  wis: DnD5eAbilityScore;
  cha: DnD5eAbilityScore;
}

/**
 * Skill proficiency data
 */
export interface DnD5eSkill {
  /** The ability this skill is based on */
  ability: Ability;
  /** Proficiency level: 0 = none, 0.5 = half, 1 = proficient, 2 = expertise */
  proficiency: 0 | 0.5 | 1 | 2;
  /** Total skill bonus (ability mod + proficiency bonus if proficient) */
  bonus: number;
  /** Passive score (10 + bonus) */
  passive: number;
}

/**
 * Hit dice for a character class
 */
export interface DnD5eHitDice {
  /** Total number of hit dice */
  total: number;
  /** Number of hit dice used (remaining = total - used) */
  used: number;
  /** Size of hit die (d6, d8, d10, d12) */
  size: DieSize;
}

/**
 * Movement speeds
 */
export interface DnD5eSpeed {
  /** Walking speed in feet */
  walk: number;
  /** Flying speed in feet (if any) */
  fly?: number;
  /** Swimming speed in feet (if any) */
  swim?: number;
  /** Climbing speed in feet (if any) */
  climb?: number;
  /** Burrowing speed in feet (if any) */
  burrow?: number;
  /** Hover capability for flying */
  hover?: boolean;
}

/**
 * Armor class calculation
 */
export interface DnD5eArmorClass {
  /** Base AC value */
  base: number;
  /** Bonus from shield */
  shield?: number;
  /** Bonus from magic items/spells */
  bonus: number;
  /** Formula used to calculate AC (e.g., "10 + @dex + @shield") */
  formula?: string;
  /** Flat override value (ignores formula) */
  override?: number;
}

/**
 * Hit points
 */
export interface DnD5eHitPoints {
  /** Current hit points */
  current: number;
  /** Maximum hit points */
  max: number;
  /** Temporary hit points */
  temp: number;
  /** Override for max HP (e.g., from magic items) */
  maxOverride?: number;
}

/**
 * Initiative
 */
export interface DnD5eInitiative {
  /** Initiative bonus (typically DEX modifier + bonuses) */
  bonus: number;
  /** Advantage on initiative rolls */
  advantage?: boolean;
}

/**
 * Death saving throws
 */
export interface DnD5eDeathSaves {
  /** Number of successful death saves (0-3) */
  successes: number;
  /** Number of failed death saves (0-3) */
  failures: number;
}

/**
 * Currency
 */
export interface DnD5eCurrency {
  /** Copper pieces */
  cp: number;
  /** Silver pieces */
  sp: number;
  /** Electrum pieces */
  ep: number;
  /** Gold pieces */
  gp: number;
  /** Platinum pieces */
  pp: number;
}

/**
 * Character class level information
 */
export interface DnD5eClassLevel {
  /** Class name (e.g., "Fighter", "Wizard") */
  className: string;
  /** Subclass name (e.g., "Champion", "School of Evocation") */
  subclass?: string;
  /** Level in this class (1-20) */
  level: number;
  /** Hit die size for this class */
  hitDie: DieSize;
  /** Spellcasting ability for this class (if applicable) */
  spellcastingAbility?: Ability;
}

/**
 * Spellcasting data
 */
export interface DnD5eSpellcasting {
  /** Primary spellcasting ability */
  ability: Ability;
  /** Spell save DC (8 + proficiency + ability mod) */
  saveDC: number;
  /** Spell attack bonus (proficiency + ability mod) */
  attackBonus: number;
  /** Spell slots by level (index 0 = cantrips, 1-9 = spell levels) */
  slots: DnD5eSpellSlots;
  /** Whether using spell points variant rule */
  useSpellPoints?: boolean;
  /** Current spell points (if using variant rule) */
  spellPoints?: { current: number; max: number };
}

/**
 * Spell slots by level
 */
export interface DnD5eSpellSlots {
  /** Cantrips known (not slots) */
  0?: number;
  /** 1st level slots */
  1: { current: number; max: number };
  /** 2nd level slots */
  2: { current: number; max: number };
  /** 3rd level slots */
  3: { current: number; max: number };
  /** 4th level slots */
  4: { current: number; max: number };
  /** 5th level slots */
  5: { current: number; max: number };
  /** 6th level slots */
  6: { current: number; max: number };
  /** 7th level slots */
  7: { current: number; max: number };
  /** 8th level slots */
  8: { current: number; max: number };
  /** 9th level slots */
  9: { current: number; max: number };
  /** Pact magic slots (Warlock) */
  pact?: { current: number; max: number; level: number };
}

/**
 * Complete D&D 5e character data
 */
export interface DnD5eCharacterData {
  // ===== Basic Information =====
  /** Character level (sum of all class levels) */
  level: number;
  /** Current experience points */
  xp: number;
  /** Proficiency bonus (based on level) */
  proficiencyBonus: number;

  // ===== Abilities & Skills =====
  /** All six ability scores with modifiers and saves */
  abilities: DnD5eAbilityScores;
  /** All 18 skills with proficiency and bonuses */
  skills: Record<Skill, DnD5eSkill>;

  // ===== Combat Statistics =====
  /** Armor class */
  armorClass: DnD5eArmorClass;
  /** Hit points */
  hitPoints: DnD5eHitPoints;
  /** Hit dice by class */
  hitDice: DnD5eHitDice[];
  /** Movement speeds */
  speed: DnD5eSpeed;
  /** Initiative */
  initiative: DnD5eInitiative;

  // ===== Character Identity =====
  /** Class levels (supports multiclassing) */
  classes: DnD5eClassLevel[];
  /** Race/species */
  race?: string;
  /** Subrace */
  subrace?: string;
  /** Background */
  background?: string;
  /** Alignment */
  alignment?: string;

  // ===== Spellcasting =====
  /** Spellcasting data (if character can cast spells) */
  spellcasting?: DnD5eSpellcasting;

  // ===== Resources & Status =====
  /** Inspiration (true/false) */
  inspiration: boolean;
  /** Death saving throws */
  deathSaves: DnD5eDeathSaves;
  /** Exhaustion level (0-6) */
  exhaustion: number;

  // ===== Currency & Wealth =====
  /** Character's money */
  currency: DnD5eCurrency;

  // ===== Additional Metadata =====
  /** Custom resources (e.g., Ki Points, Sorcery Points, Rage) */
  resources?: Record<string, { current: number; max: number; per: string }>;
  /** Languages known */
  languages?: string[];
  /** Tool proficiencies */
  toolProficiencies?: string[];
  /** Weapon proficiencies */
  weaponProficiencies?: string[];
  /** Armor proficiencies */
  armorProficiencies?: string[];
}

// ============================================================================
// ITEM DATA
// ============================================================================

/**
 * Weapon data for D&D 5e
 */
export interface DnD5eWeaponData {
  /** Weapon category (simple or martial) */
  weaponType: WeaponType;
  /** Range category (melee or ranged) */
  range: WeaponRange;
  /** Primary damage */
  damage: {
    /** Damage dice formula (e.g., "1d8", "2d6") */
    dice: string;
    /** Damage type */
    type: DamageType;
  };
  /** Versatile damage (for versatile weapons) */
  versatileDamage?: {
    /** Damage when wielded two-handed */
    dice: string;
    /** Damage type */
    type: DamageType;
  };
  /** Weapon properties (finesse, reach, etc.) */
  properties: WeaponProperty[];
  /** Attack bonus (not including ability modifier or proficiency) */
  attackBonus: number;
  /** Whether character is proficient with this weapon */
  proficient: boolean;
  /** Weapon's normal range (for ranged/thrown weapons) */
  rangeNormal?: number;
  /** Weapon's long range (for ranged/thrown weapons) */
  rangeLong?: number;
  /** Weapon's reach (for melee weapons, typically 5 or 10 feet) */
  reach?: number;
  /** Ammunition tracking */
  ammunition?: {
    /** Current ammunition count */
    current: number;
    /** Maximum ammunition */
    max: number;
  };
  /** Ability used for attack rolls (overrides default) */
  abilityOverride?: Ability;
}

/**
 * Armor data for D&D 5e
 */
export interface DnD5eArmorData {
  /** Armor category */
  armorType: ArmorType;
  /** Base AC value */
  baseAC: number;
  /** Maximum DEX modifier that can be added (null for light armor = unlimited) */
  maxDexBonus?: number | null;
  /** Whether armor imposes disadvantage on Stealth checks */
  stealthDisadvantage: boolean;
  /** Minimum Strength score required to wear without speed penalty */
  strengthRequirement?: number;
  /** Whether armor is currently equipped */
  equipped: boolean;
  /** Whether character is proficient with this armor type */
  proficient: boolean;
}

/**
 * Spell data for D&D 5e
 */
export interface DnD5eSpellData {
  /** Spell level (0 = cantrip, 1-9 = spell levels) */
  level: number;
  /** School of magic */
  school: SpellSchool;
  /** Casting time */
  castingTime: {
    /** Number of actions/time units */
    value: number;
    /** Type of action */
    type: DnD5eActivationType;
  };
  /** Range */
  range: {
    /** Range value in feet (or 0 for touch/self) */
    value: number;
    /** Range unit */
    unit: DistanceUnit;
  };
  /** Target */
  target?: {
    /** Type of target */
    type: TargetType;
    /** Number of targets (if applicable) */
    value?: number;
    /** Area size in feet (for area spells) */
    size?: number;
  };
  /** Duration */
  duration: {
    /** Duration value (0 for instant) */
    value: number;
    /** Duration unit */
    unit: TimeUnit;
  };
  /** Spell components */
  components: {
    /** Verbal component required */
    verbal: boolean;
    /** Somatic component required */
    somatic: boolean;
    /** Material component required */
    material: boolean;
    /** Description of material components */
    materialCost?: string;
    /** Gold piece cost for materials */
    materialGP?: number;
    /** Whether materials are consumed */
    consumed?: boolean;
  };
  /** Damage (if spell deals damage) */
  damage?: {
    /** Base damage dice formula */
    dice: string;
    /** Damage type */
    type: DamageType;
    /** Damage scaling by spell level (for upcasting) */
    scaling?: Record<number, string>;
  };
  /** Healing (if spell heals) */
  healing?: {
    /** Healing dice formula */
    dice: string;
    /** Healing scaling by spell level */
    scaling?: Record<number, string>;
  };
  /** Saving throw */
  save?: {
    /** Ability used for saving throw */
    ability: Ability;
    /** Effect on successful save */
    effect: 'none' | 'half' | 'other';
    /** DC override (if not using caster's spell save DC) */
    dcOverride?: number;
  };
  /** Attack roll */
  attack?: {
    /** Type of attack */
    type: 'melee' | 'ranged';
    /** Attack bonus override */
    bonusOverride?: number;
  };
  /** Whether spell can be cast as a ritual */
  ritual: boolean;
  /** Whether spell requires concentration */
  concentration: boolean;
  /** Whether spell is prepared (for prepared casters) */
  prepared?: boolean;
  /** Spellcasting ability override (if different from class default) */
  abilityOverride?: Ability;
  /** Upcasting damage/healing */
  upcast?: {
    /** Additional dice per spell level */
    dice: string;
    /** How many levels per additional dice */
    per: number;
  };
}

/**
 * Consumable item data for D&D 5e
 */
export interface DnD5eConsumableData {
  /** Type of consumable */
  consumableType: ConsumableType;
  /** Usage tracking */
  uses: {
    /** Current uses */
    current: number;
    /** Maximum uses */
    max: number;
    /** Recovery period */
    per: 'charges' | 'dawn' | 'dusk' | 'short_rest' | 'long_rest' | 'day' | 'use';
  };
  /** Effect when consumed/used */
  effect?: {
    /** Healing provided (dice formula) */
    healing?: string;
    /** Damage dealt */
    damage?: {
      /** Damage dice formula */
      dice: string;
      /** Damage type */
      type: DamageType;
    };
    /** Condition applied */
    condition?: string;
    /** Save required to avoid effect */
    save?: {
      /** Ability for saving throw */
      ability: Ability;
      /** Save DC */
      dc: number;
    };
  };
  /** Item rarity */
  rarity?: DnD5eItemRarity;
  /** Whether item requires attunement */
  requiresAttunement?: boolean;
}

/**
 * Feature data (class features, racial traits, feats)
 */
export interface DnD5eFeatureData {
  /** Source of feature (class name, race, feat, etc.) */
  source: string;
  /** Activation requirements */
  activation?: {
    /** Type of action required */
    type: DnD5eActivationType;
    /** Number of actions */
    cost?: number;
    /** Condition or trigger */
    condition?: string;
  };
  /** Resource consumption */
  consume?: {
    /** Type of resource consumed */
    type: 'charges' | 'slot' | 'resource' | 'item';
    /** Amount consumed */
    amount: number;
    /** Target resource ID */
    target?: string;
  };
  /** Usage limits */
  uses?: {
    /** Current uses */
    current: number;
    /** Maximum uses */
    max: number;
    /** Recovery period */
    per: 'short_rest' | 'long_rest' | 'day' | 'charge' | 'turn';
  };
  /** Damage dealt (if applicable) */
  damage?: {
    dice: string;
    type: DamageType;
  };
  /** Save required */
  save?: {
    ability: Ability;
    dc: number;
  };
  /** Duration of effect */
  duration?: {
    value: number;
    unit: TimeUnit;
  };
  /** Whether feature is always active (passive) */
  passive: boolean;
}

/**
 * Tool data
 */
export interface DnD5eToolData {
  /** Tool category */
  toolType: 'artisan' | 'gaming' | 'musical' | 'other';
  /** Ability used with this tool */
  ability: Ability;
  /** Proficiency bonus applied */
  proficient: boolean;
  /** Additional bonus */
  bonus: number;
}

/**
 * Loot/treasure data
 */
export interface DnD5eLootData {
  /** Item rarity */
  rarity?: DnD5eItemRarity;
  /** Value in gold pieces */
  value: number;
  /** Weight in pounds */
  weight: number;
  /** Whether item is magical */
  magical: boolean;
  /** Whether item requires attunement */
  requiresAttunement?: boolean;
}

// ============================================================================
// NPC/MONSTER DATA
// ============================================================================

/**
 * Sense data for NPCs/monsters
 */
export interface DnD5eSenses {
  /** Darkvision range in feet */
  darkvision?: number;
  /** Blindsight range in feet */
  blindsight?: number;
  /** Tremorsense range in feet */
  tremorsense?: number;
  /** Truesight range in feet */
  truesight?: number;
  /** Passive Perception score */
  passivePerception: number;
  /** Passive Investigation score */
  passiveInvestigation?: number;
  /** Passive Insight score */
  passiveInsight?: number;
}

/**
 * Action definition for NPCs/monsters
 */
export interface DnD5eAction {
  /** Action name */
  name: string;
  /** Description/rules text */
  description: string;
  /** Attack data (if this is an attack action) */
  attack?: {
    /** Type of attack */
    type: 'melee' | 'ranged' | 'spell';
    /** Attack bonus */
    bonus: number;
    /** Reach in feet (for melee) */
    reach?: number;
    /** Range (for ranged attacks) */
    range?: {
      /** Normal range in feet */
      normal: number;
      /** Long range in feet */
      long?: number;
    };
  };
  /** Damage dealt */
  damage?: Array<{
    /** Damage dice formula */
    dice: string;
    /** Damage type */
    type: DamageType;
    /** Average damage (for stat blocks) */
    average?: number;
  }>;
  /** Saving throw required */
  save?: {
    /** Save DC */
    dc: number;
    /** Ability for save */
    ability: Ability;
    /** Effect description */
    effect: string;
  };
  /** Recharge mechanics (e.g., "Recharge 5-6") */
  recharge?: {
    /** Minimum roll to recharge (5 = recharge on 5-6) */
    on: number;
    /** Whether currently recharged */
    charged?: boolean;
  };
  /** Limited uses per day/rest */
  uses?: {
    /** Number of uses */
    count: number;
    /** Recovery period */
    per: 'day' | 'short_rest' | 'long_rest' | 'turn' | 'recharge';
    /** Current uses remaining */
    current?: number;
  };
  /** Legendary action cost (if this is a legendary action) */
  legendaryCost?: number;
}

/**
 * Spellcasting data for NPCs/monsters
 */
export interface DnD5eNPCSpellcasting {
  /** Spellcasting ability */
  ability: Ability;
  /** Spell save DC */
  saveDC: number;
  /** Spell attack bonus */
  attackBonus: number;
  /** Caster level */
  level: number;
  /** Spells known/prepared */
  spells: {
    /** Cantrips (at-will) */
    0?: string[];
    /** 1st level spells */
    1?: { slots: number; spells: string[] };
    /** 2nd level spells */
    2?: { slots: number; spells: string[] };
    /** 3rd level spells */
    3?: { slots: number; spells: string[] };
    /** 4th level spells */
    4?: { slots: number; spells: string[] };
    /** 5th level spells */
    5?: { slots: number; spells: string[] };
    /** 6th level spells */
    6?: { slots: number; spells: string[] };
    /** 7th level spells */
    7?: { slots: number; spells: string[] };
    /** 8th level spells */
    8?: { slots: number; spells: string[] };
    /** 9th level spells */
    9?: { slots: number; spells: string[] };
  };
  /** Innate spellcasting uses per day instead of slots */
  innate?: Record<string, { spell: string; uses: number }>;
  /** Spellcasting note (e.g., "The mage is a 9th-level spellcaster...") */
  note?: string;
}

/**
 * Complete D&D 5e NPC/monster data
 */
export interface DnD5eNPCData {
  // ===== Challenge & Type =====
  /** Challenge rating (can be fractions: 0, 0.125, 0.25, 0.5, 1-30) */
  cr: number;
  /** XP value for this CR */
  xpValue: number;
  /** Creature size */
  size: CreatureSize;
  /** Creature type */
  type: CreatureType;
  /** Creature subtype (e.g., "goblinoid", "shapechanger") */
  subtype?: string;
  /** Alignment */
  alignment: string;

  // ===== Ability Scores =====
  /** Simplified abilities (just value and modifier) */
  abilities: Record<Ability, { value: number; mod: number }>;

  // ===== Combat Statistics =====
  /** Armor class */
  armorClass: {
    /** AC value */
    value: number;
    /** AC source/formula (e.g., "natural armor", "plate armor") */
    formula?: string;
  };
  /** Hit points */
  hitPoints: {
    /** Current HP */
    current: number;
    /** Maximum HP */
    max: number;
    /** HP formula (e.g., "8d8 + 16") */
    formula: string;
    /** Average HP from formula (for stat blocks) */
    average?: number;
  };
  /** Movement speeds */
  speed: Record<string, number>;

  // ===== Defenses =====
  /** Saving throw bonuses (only list proficient saves) */
  savingThrows: Partial<Record<Ability, number>>;
  /** Skill bonuses (only list trained skills) */
  skills: Partial<Record<Skill, number>>;
  /** Damage vulnerabilities */
  vulnerabilities: DamageType[];
  /** Damage resistances */
  resistances: DamageType[];
  /** Damage immunities */
  immunities: DamageType[];
  /** Condition immunities */
  conditionImmunities: string[];

  // ===== Senses & Languages =====
  /** Special senses */
  senses: DnD5eSenses;
  /** Languages spoken */
  languages: string[];

  // ===== Abilities & Actions =====
  /** Passive traits (always active) */
  traits: DnD5eAction[];
  /** Standard actions */
  actions: DnD5eAction[];
  /** Bonus actions */
  bonusActions?: DnD5eAction[];
  /** Reactions */
  reactions?: DnD5eAction[];
  /** Legendary actions */
  legendaryActions?: {
    /** Number of legendary actions per round */
    count: number;
    /** Available legendary actions */
    actions: DnD5eAction[];
    /** Description text for legendary actions */
    description?: string;
  };
  /** Lair actions */
  lairActions?: DnD5eAction[];
  /** Regional effects */
  regionalEffects?: string[];

  // ===== Spellcasting =====
  /** Spellcasting data (if creature can cast spells) */
  spellcasting?: DnD5eNPCSpellcasting;

  // ===== Additional Data =====
  /** Creature's source book */
  source?: string;
  /** Environment where creature is typically found */
  environment?: string[];
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * D&D 5e system configuration with labels and metadata
 */
export const DND5E_CONFIG = {
  /** Ability score configuration */
  abilities: {
    str: { label: 'Strength', abbr: 'STR' },
    dex: { label: 'Dexterity', abbr: 'DEX' },
    con: { label: 'Constitution', abbr: 'CON' },
    int: { label: 'Intelligence', abbr: 'INT' },
    wis: { label: 'Wisdom', abbr: 'WIS' },
    cha: { label: 'Charisma', abbr: 'CHA' },
  } as const satisfies Record<Ability, { label: string; abbr: string }>,

  /** Skill configuration with labels and governing abilities */
  skills: {
    acrobatics: { label: 'Acrobatics', ability: 'dex' },
    animalHandling: { label: 'Animal Handling', ability: 'wis' },
    arcana: { label: 'Arcana', ability: 'int' },
    athletics: { label: 'Athletics', ability: 'str' },
    deception: { label: 'Deception', ability: 'cha' },
    history: { label: 'History', ability: 'int' },
    insight: { label: 'Insight', ability: 'wis' },
    intimidation: { label: 'Intimidation', ability: 'cha' },
    investigation: { label: 'Investigation', ability: 'int' },
    medicine: { label: 'Medicine', ability: 'wis' },
    nature: { label: 'Nature', ability: 'int' },
    perception: { label: 'Perception', ability: 'wis' },
    performance: { label: 'Performance', ability: 'cha' },
    persuasion: { label: 'Persuasion', ability: 'cha' },
    religion: { label: 'Religion', ability: 'int' },
    sleightOfHand: { label: 'Sleight of Hand', ability: 'dex' },
    stealth: { label: 'Stealth', ability: 'dex' },
    survival: { label: 'Survival', ability: 'wis' },
  } as const satisfies Record<Skill, { label: string; ability: Ability }>,

  /** Damage type configuration */
  damageTypes: {
    acid: { label: 'Acid', color: '#9acd32' },
    bludgeoning: { label: 'Bludgeoning', color: '#8b4513' },
    cold: { label: 'Cold', color: '#87ceeb' },
    fire: { label: 'Fire', color: '#ff4500' },
    force: { label: 'Force', color: '#9370db' },
    lightning: { label: 'Lightning', color: '#1e90ff' },
    necrotic: { label: 'Necrotic', color: '#2f4f4f' },
    piercing: { label: 'Piercing', color: '#696969' },
    poison: { label: 'Poison', color: '#32cd32' },
    psychic: { label: 'Psychic', color: '#ff1493' },
    radiant: { label: 'Radiant', color: '#ffd700' },
    slashing: { label: 'Slashing', color: '#a9a9a9' },
    thunder: { label: 'Thunder', color: '#4169e1' },
  } as const satisfies Record<DamageType, { label: string; color: string }>,

  /** Spell school configuration */
  spellSchools: {
    abjuration: { label: 'Abjuration', icon: 'shield' },
    conjuration: { label: 'Conjuration', icon: 'sparkles' },
    divination: { label: 'Divination', icon: 'eye' },
    enchantment: { label: 'Enchantment', icon: 'heart' },
    evocation: { label: 'Evocation', icon: 'fire' },
    illusion: { label: 'Illusion', icon: 'mask' },
    necromancy: { label: 'Necromancy', icon: 'skull' },
    transmutation: { label: 'Transmutation', icon: 'wand-sparkles' },
  } as const satisfies Record<SpellSchool, { label: string; icon: string }>,

  /** Weapon property configuration */
  weaponProperties: {
    ammunition: { label: 'Ammunition', abbr: 'Ammo' },
    finesse: { label: 'Finesse', abbr: 'Fin' },
    heavy: { label: 'Heavy', abbr: 'Hvy' },
    light: { label: 'Light', abbr: 'Light' },
    loading: { label: 'Loading', abbr: 'Load' },
    reach: { label: 'Reach', abbr: 'Rch' },
    special: { label: 'Special', abbr: 'Spc' },
    thrown: { label: 'Thrown', abbr: 'Thr' },
    two_handed: { label: 'Two-Handed', abbr: '2H' },
    versatile: { label: 'Versatile', abbr: 'Ver' },
  } as const satisfies Record<WeaponProperty, { label: string; abbr: string }>,

  /** Armor type configuration */
  armorTypes: {
    light: { label: 'Light Armor', maxDex: null },
    medium: { label: 'Medium Armor', maxDex: 2 },
    heavy: { label: 'Heavy Armor', maxDex: 0 },
    shield: { label: 'Shield', maxDex: null },
    natural: { label: 'Natural Armor', maxDex: null },
  } as const satisfies Record<ArmorType, { label: string; maxDex: number | null }>,

  /** Activation type configuration */
  activationTypes: {
    action: { label: 'Action', abbr: 'A' },
    bonus: { label: 'Bonus Action', abbr: 'BA' },
    reaction: { label: 'Reaction', abbr: 'R' },
    minute: { label: 'Minute', abbr: 'M' },
    hour: { label: 'Hour', abbr: 'H' },
    day: { label: 'Day', abbr: 'D' },
    special: { label: 'Special', abbr: 'Spc' },
    legendary: { label: 'Legendary Action', abbr: 'LA' },
    mythic: { label: 'Mythic Action', abbr: 'MA' },
    lair: { label: 'Lair Action', abbr: 'Lair' },
    none: { label: 'None', abbr: '-' },
  } as const satisfies Record<DnD5eActivationType, { label: string; abbr: string }>,

  /** Item rarity configuration */
  itemRarities: {
    common: { label: 'Common', color: '#000000' },
    uncommon: { label: 'Uncommon', color: '#1eff00' },
    rare: { label: 'Rare', color: '#0070dd' },
    very_rare: { label: 'Very Rare', color: '#a335ee' },
    legendary: { label: 'Legendary', color: '#ff8000' },
    artifact: { label: 'Artifact', color: '#e6cc80' },
  } as const satisfies Record<DnD5eItemRarity, { label: string; color: string }>,

  /** Creature size configuration */
  creatureSizes: {
    tiny: { label: 'Tiny', space: 2.5, hitDie: 'd4' },
    small: { label: 'Small', space: 5, hitDie: 'd6' },
    medium: { label: 'Medium', space: 5, hitDie: 'd8' },
    large: { label: 'Large', space: 10, hitDie: 'd10' },
    huge: { label: 'Huge', space: 15, hitDie: 'd12' },
    gargantuan: { label: 'Gargantuan', space: 20, hitDie: 'd20' },
  } as const satisfies Record<CreatureSize, { label: string; space: number; hitDie: string }>,

  /** Creature type configuration */
  creatureTypes: {
    aberration: { label: 'Aberration' },
    beast: { label: 'Beast' },
    celestial: { label: 'Celestial' },
    construct: { label: 'Construct' },
    dragon: { label: 'Dragon' },
    elemental: { label: 'Elemental' },
    fey: { label: 'Fey' },
    fiend: { label: 'Fiend' },
    giant: { label: 'Giant' },
    humanoid: { label: 'Humanoid' },
    monstrosity: { label: 'Monstrosity' },
    ooze: { label: 'Ooze' },
    plant: { label: 'Plant' },
    undead: { label: 'Undead' },
  } as const satisfies Record<CreatureType, { label: string }>,

  /** Challenge rating to XP and proficiency bonus mapping */
  challengeRatings: {
    0: { xp: 10, proficiency: 2 },
    0.125: { xp: 25, proficiency: 2 },
    0.25: { xp: 50, proficiency: 2 },
    0.5: { xp: 100, proficiency: 2 },
    1: { xp: 200, proficiency: 2 },
    2: { xp: 450, proficiency: 2 },
    3: { xp: 700, proficiency: 2 },
    4: { xp: 1100, proficiency: 2 },
    5: { xp: 1800, proficiency: 3 },
    6: { xp: 2300, proficiency: 3 },
    7: { xp: 2900, proficiency: 3 },
    8: { xp: 3900, proficiency: 3 },
    9: { xp: 5000, proficiency: 4 },
    10: { xp: 5900, proficiency: 4 },
    11: { xp: 7200, proficiency: 4 },
    12: { xp: 8400, proficiency: 4 },
    13: { xp: 10000, proficiency: 5 },
    14: { xp: 11500, proficiency: 5 },
    15: { xp: 13000, proficiency: 5 },
    16: { xp: 15000, proficiency: 5 },
    17: { xp: 18000, proficiency: 6 },
    18: { xp: 20000, proficiency: 6 },
    19: { xp: 22000, proficiency: 6 },
    20: { xp: 25000, proficiency: 6 },
    21: { xp: 33000, proficiency: 7 },
    22: { xp: 41000, proficiency: 7 },
    23: { xp: 50000, proficiency: 7 },
    24: { xp: 62000, proficiency: 7 },
    25: { xp: 75000, proficiency: 8 },
    26: { xp: 90000, proficiency: 8 },
    27: { xp: 105000, proficiency: 8 },
    28: { xp: 120000, proficiency: 8 },
    29: { xp: 135000, proficiency: 9 },
    30: { xp: 155000, proficiency: 9 },
  } as const,

  /** Character level to proficiency bonus mapping */
  proficiencyByLevel: {
    1: 2, 2: 2, 3: 2, 4: 2,
    5: 3, 6: 3, 7: 3, 8: 3,
    9: 4, 10: 4, 11: 4, 12: 4,
    13: 5, 14: 5, 15: 5, 16: 5,
    17: 6, 18: 6, 19: 6, 20: 6,
  } as const,

  /** Character level to XP thresholds */
  xpByLevel: {
    1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500,
    6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
    11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
    16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
  } as const,
} as const;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Helper type to get ability modifier from ability score
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Helper type to get proficiency bonus from character level
 */
export function getProficiencyBonus(level: number): number {
  return DND5E_CONFIG.proficiencyByLevel[level as keyof typeof DND5E_CONFIG.proficiencyByLevel] || 2;
}

/**
 * Helper to get XP for a given CR
 */
export function getXPForCR(cr: number): number {
  return DND5E_CONFIG.challengeRatings[cr as keyof typeof DND5E_CONFIG.challengeRatings]?.xp || 0;
}

/**
 * Helper to get proficiency bonus for a given CR
 */
export function getProficiencyBonusForCR(cr: number): number {
  return DND5E_CONFIG.challengeRatings[cr as keyof typeof DND5E_CONFIG.challengeRatings]?.proficiency || 2;
}
