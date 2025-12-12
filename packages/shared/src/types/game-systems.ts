/**
 * Game Systems Type Definitions
 *
 * This file defines the core abstractions for supporting multiple tabletop RPG systems.
 * These types provide a flexible framework for handling fundamentally different mechanical
 * paradigms while maintaining a consistent API and user experience.
 *
 * @see docs/architecture/GAME_SYSTEMS.md
 */

// ============================================================================
// CORE TYPE ALIASES
// ============================================================================

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type ResourceCategory =
  | 'health'           // HP, wounds, harm
  | 'pool'             // Spendable stats (Cypher pools, stress)
  | 'slot'             // Limited uses per rest (spell slots, abilities)
  | 'currency'         // Fate points, hope, XP
  | 'condition'        // Binary or tiered states (exhaustion, conditions)
  | 'track'            // Progress bars (clocks, stress tracks)
  | 'inventory';       // Countable items (arrows, rations)

export type DegreeOfSuccess = 'critical_failure' | 'failure' | 'success' | 'critical_success';

export type CriticalType = 'none' | 'critical_success' | 'critical_failure';

export type RecoveryTrigger =
  | 'short_rest'      // D&D
  | 'long_rest'       // D&D
  | 'refocus'         // PF2e
  | 'daily_prep'      // PF2e
  | 'downtime'        // BitD
  | 'vice'            // BitD
  | 'scene_end'       // Fate
  | 'milestone'       // General XP
  | 'session_end'     // General
  | 'manual';         // Manual recovery only

export type FieldType =
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

export type CompareOp = '>' | '<' | '>=' | '<=' | '=';

// ============================================================================
// GAME SYSTEM MANIFEST
// Package metadata for a game system module
// ============================================================================

export interface GameSystemManifest {
  id: string;                          // 'dnd5e', 'pf2e', 'daggerheart'
  name: string;
  version: string;
  authors: string[];
  description: string;
  license: string;
  homepage?: string;

  // Compatibility
  minPlatformVersion: string;

  // Dependencies
  dependencies?: string[];             // Other modules required
}

// ============================================================================
// GAME SYSTEM INTERFACE
// Every game system module must implement this interface
// ============================================================================

export interface GameSystem {
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

export interface DiceConfiguration {
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

export interface CustomDie {
  name: string;                        // 'hope', 'fear', 'stress'
  sides: number;
  faces?: (number | string)[];         // Custom face values
  color?: string;                      // UI color hint
}

// ============================================================================
// ATTRIBUTE DEFINITION
// Core stats that characters have
// ============================================================================

export interface AttributeDefinition {
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

export interface ResourceDefinition {
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
  recoveryTrigger?: RecoveryTrigger;
  recoveryFormula?: string;

  // UI
  displayStyle: 'bar' | 'boxes' | 'clock' | 'number' | 'slots';
}

// ============================================================================
// SKILL DEFINITION
// Skills, proficiencies, actions ratings
// ============================================================================

export interface SkillDefinition {
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

export interface RollResolver {
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

export interface RollOutcome {
  success: boolean;
  margin?: number;                     // How much over/under
  degree?: DegreeOfSuccess;
  critical?: CriticalType;
  narration?: 'player' | 'gm';         // For Daggerheart
  complications?: string[];
}

export interface PoolResult {
  successes: number;
  ones?: number;                       // For pushing/stress damage
  highestDie: number;
  critical: boolean;
}

export interface ComparisonResult {
  higher: 'hope' | 'fear' | 'tie';
  hopeValue: number;
  fearValue: number;
  withHope: boolean;
  withFear: boolean;
}

// ============================================================================
// ENTITY TEMPLATE
// Defines the structure of a type of entity (character, NPC, item, etc.)
// ============================================================================

export interface EntityTemplate {
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

export interface FieldDefinition {
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

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface ComputedFieldDefinition {
  id: string;
  name: string;
  formula: string;                     // Expression to evaluate
  dependencies: string[];              // Fields this depends on
}

export interface SectionDefinition {
  id: string;
  name: string;
  fields: string[];                    // Field IDs in this section
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface RollDefinition {
  id: string;
  name: string;
  formula: string;                     // Dice formula with variable references
  skillId?: string;
  attributeId?: string;
  description?: string;
}

export interface ActionDefinition {
  id: string;
  name: string;
  actionType?: string;                 // 'action', 'bonus_action', 'reaction', etc.
  cost?: number;                       // For action point systems
  description: string;
  rolls?: RollDefinition[];
}

// ============================================================================
// DICE ENGINE TYPES
// ============================================================================

export interface DiceExpression {
  count: number | DiceExpression;
  sides: number | 'F';                 // 'F' for Fudge dice
  modifiers: DiceModifier[];
  label?: string;
}

export type DiceModifier =
  | { type: 'keep_highest'; count: number }
  | { type: 'keep_lowest'; count: number }
  | { type: 'drop_highest'; count: number }
  | { type: 'drop_lowest'; count: number }
  | { type: 'reroll'; compare: CompareOp; value: number; once: boolean }
  | { type: 'explode'; compare: CompareOp; value: number }
  | { type: 'target'; compare: CompareOp; value: number };

export interface DiceRollResult {
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

export interface DieRoll {
  sides: number | 'F';
  result: number;
  kept: boolean;
  exploded: boolean;
  rerolled: boolean;
  isSuccess?: boolean;                 // For target number systems
  originalResult?: number;             // If rerolled
}

export interface DiceResult {
  value: number;
  die: number | 'F';
  kept: boolean;
}

// ============================================================================
// ROLL RESOLUTION ENGINE
// Each system implements its own resolution logic
// ============================================================================

export interface RollResolutionEngine {
  // Main resolution method
  resolve(roll: DiceRollResult, context: RollContext): ResolvedRoll;

  // Get possible outcomes for UI
  getOutcomes(): OutcomeDefinition[];

  // Format result for display
  formatResult(resolved: ResolvedRoll): FormattedResult;
}

export interface RollContext {
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

export interface ResolvedRoll {
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

export interface FormattedResult {
  summary: string;                     // "Success!" or "4 successes"
  details: string;                     // "[17, ~~8~~] + 5 = 22 vs DC 15"
  cssClass: string;                    // For styling
  icon?: string;                       // Emoji or icon name
}

export interface OutcomeDefinition {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

export interface ResourceTracker {
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

export type ResourceValue =
  | { type: 'current_max'; current: number; max: number }
  | { type: 'slots'; slots: boolean[]; perLevel?: boolean[][] }
  | { type: 'checkboxes'; checked: number; total: number }
  | { type: 'clock'; filled: number; segments: number }
  | { type: 'pool'; current: number; max: number };

// ============================================================================
// SHEET LAYOUT SYSTEM
// ============================================================================

export interface SheetLayout {
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

export interface LayoutRow {
  height: 'auto' | 'fixed' | 'flex';
  fixedHeight?: number;
  cells: LayoutCell[];
}

export interface LayoutCell {
  colSpan: number;                     // 1-12
  content: CellContent;
  style?: CellStyle;
}

export type CellContent =
  | { type: 'field'; fieldId: string }
  | { type: 'computed'; computedId: string }
  | { type: 'resource'; resourceId: string }
  | { type: 'roll_button'; rollId: string }
  | { type: 'section'; sectionId: string }
  | { type: 'list'; listId: string }
  | { type: 'custom'; component: string };

export interface CellStyle {
  display?: string;
  gap?: string;
  padding?: string;
  backgroundColor?: string;
  border?: string;
}

export interface SheetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderStyle: 'solid' | 'dashed' | 'none';
}

export interface RollableElement {
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

export interface ResourceBar {
  id: string;
  resourceId: string;
  style: 'bar' | 'number' | 'slots' | 'boxes' | 'clock';
  showNumbers?: boolean;
  showLabel?: boolean;
}

export interface ToggleElement {
  id: string;
  label: string;
  fieldId: string;
  style: 'checkbox' | 'switch' | 'button';
}

// ============================================================================
// ACTION ECONOMY ABSTRACTION
// ============================================================================

export interface ActionEconomyConfig {
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

export interface ActionTypeDefinition {
  id: string;
  name: string;
  countPerTurn: number;                // 1 for most, -1 for unlimited/free
  examples: string[];
}

// ============================================================================
// CONDITION SYSTEM
// ============================================================================

export interface ConditionDefinition {
  id: string;
  name: string;
  description: string;
  effects: ConditionEffect[];
  duration?: 'instant' | 'turn' | 'round' | 'encounter' | 'permanent';
  stackable?: boolean;
  maxStacks?: number;
}

export interface ConditionEffect {
  type: 'modifier' | 'disable' | 'override';
  target: string;                      // Field or computed value to affect
  value?: any;
  formula?: string;
}

// ============================================================================
// SPELLCASTING SYSTEM
// ============================================================================

export interface SpellcastingConfig {
  type: 'prepared' | 'spontaneous' | 'pact' | 'points' | 'none';

  // Spell slot configuration
  slotProgression?: Record<number, number[]>;  // Level -> [1st, 2nd, 3rd, ...]

  // For spell point systems
  pointsFormula?: string;

  // Spell preparation
  canPrepare?: boolean;
  preparedCountFormula?: string;       // 'level + intelligence_modifier'

  // Ritual casting
  ritualCasting?: boolean;

  // Spellcasting ability
  defaultAbility?: string;             // 'intelligence', 'wisdom', 'charisma'
}

// ============================================================================
// COMPENDIUM DEFINITION
// Searchable content databases
// ============================================================================

export interface CompendiumDefinition {
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

export interface FilterDefinition {
  id: string;
  field: string;
  type: 'select' | 'multiselect' | 'range' | 'text';
  options?: { value: string; label: string }[];
}

export interface ColumnDefinition {
  id: string;
  field: string;
  label: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
}

// ============================================================================
// GAME SYSTEM MODULE
// A complete, installable game system
// ============================================================================

export interface GameSystemModule {
  // Package metadata
  manifest: GameSystemManifest;

  // The system definition
  system: GameSystem;

  // Content (optional - can be separate content packs)
  content?: {
    classes?: EntityTemplate[];
    races?: EntityTemplate[];
    backgrounds?: EntityTemplate[];
    items?: any[];
    spells?: any[];
    monsters?: any[];
    feats?: any[];
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

export interface ComponentDefinition {
  id: string;
  name: string;
  type: 'react' | 'vue' | 'html';
  source: string;                      // Component source code or path
  props?: Record<string, any>;
}

export interface MacroDefinition {
  id: string;
  name: string;
  description: string;
  script: string;                      // JavaScript source
  icon?: string;
}
