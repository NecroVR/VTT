# Form Designer System Proposal

**Status**: Draft (Updated with Key Decisions)
**Date**: 2025-12-12
**Last Updated**: 2025-12-12
**Author**: Claude Code

---

## Executive Summary

This proposal outlines a comprehensive form designer system for the VTT platform that enables GMs to create, customize, and manage forms for displaying and editing game content. The system will support character sheets, item cards, monster stat blocks, and any other structured data within the VTT.

**Key Features:**
- Visual drag-and-drop form designer (GM-only/premium feature)
- Marketplace integration for content creators to publish and monetize custom forms
- Reusable form fragments for efficient design
- Cross-campaign compatibility for licensed forms
- Built-in localization infrastructure (implementation deferred)
- Desktop and tablet optimized (mobile support deferred)
- PDF export capability (implementation deferred)

---

## 1. Goals & Requirements

### 1.1 Primary Goals

1. **Universal Form Rendering**: Display any entity type (characters, items, spells, monsters, etc.) using customizable forms
2. **Visual Form Designer**: Drag-and-drop interface for creating and editing form layouts
3. **Game System Integration**: Forms are scoped to game systems; each system ships with default forms
4. **GM Customization**: GMs can create custom forms or modify copies of default forms
5. **Rich Layout Support**: Support complex layouts including grids, tabs, collapsible sections, and conditional visibility

### 1.2 Key Requirements

| Requirement | Priority | Description |
|-------------|----------|-------------|
| Game system scoping | Critical | Forms tied to specific game systems, no cross-system sharing |
| Default forms | Critical | Each game system includes usable default forms |
| Visual editor | High | Drag-and-drop form builder accessible to non-technical users (GM-only) |
| Field binding | Critical | Bind form fields to entity properties via property path |
| Computed fields | High | Display calculated values (e.g., modifier = floor((ability - 10) / 2)) |
| Conditional visibility | Medium | Show/hide fields based on conditions |
| Custom styling | Medium | Basic styling options (colors, fonts, spacing) |
| Form templates | High | Pre-built templates as starting points |
| Marketplace integration | High | Content creators can design and sell forms |
| Form fragments | Medium | Reusable form sections that can be embedded in multiple forms |
| Localization support | Medium | Infrastructure for translating form labels (implementation deferred) |
| Desktop/tablet focus | Critical | Optimized for desktop and tablet, not mobile phones |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Form Designer UI                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Canvas    │  │  Component  │  │  Property   │  │   Preview   │ │
│  │   Editor    │  │   Palette   │  │   Editor    │  │    Panel    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Form Definition Schema                          │
│  {                                                                   │
│    id, name, gameSystemId, entityType, version,                      │
│    layout: { type, children, ... },                                  │
│    styles: { ... },                                                  │
│    scripts: [ ... ]                                                  │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Form Renderer Engine                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Layout    │  │    Field    │  │  Computed   │  │   Event     │ │
│  │   Engine    │  │   Binder    │  │   Engine    │  │   Handler   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Entity Data (EAV)                             │
│         Properties accessed via propertyPath binding                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

1. **Form Definition Schema**: JSON-based form definition stored in database
2. **Form Designer UI**: Visual editor for creating/editing form definitions
3. **Form Renderer Engine**: Runtime engine that renders forms from definitions
4. **Form Management**: API and UI for CRUD operations on forms

---

## 3. Form Definition Schema

### 3.1 Root Schema

```typescript
interface FormDefinition {
  id: string;                          // Unique identifier (UUID)
  name: string;                        // Display name
  description?: string;                // Optional description
  gameSystemId: string;                // Associated game system
  entityType: string;                  // 'character', 'item', 'spell', 'monster', etc.
  version: string;                     // Semantic version
  isDefault: boolean;                  // Is this a system-provided default?
  isLocked: boolean;                   // Prevent editing (for defaults)

  // Marketplace/ownership
  visibility: 'private' | 'public' | 'marketplace';
  licenseType?: 'free' | 'paid' | 'subscription';
  price?: number;                      // For marketplace items
  ownerId?: string;                    // Creator/owner user ID

  // Layout definition
  layout: LayoutNode;

  // Reusable fragments
  fragments?: FormFragment[];

  // Global styles
  styles: FormStyles;

  // Optional computed field definitions
  computedFields?: ComputedFieldDefinition[];

  // Optional event handlers (sandboxed)
  scripts?: FormScript[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;                  // User ID
}
```

### 3.2 Form Fragments

Form fragments are reusable layout sections that can be embedded in multiple forms:

```typescript
interface FormFragment {
  id: string;                          // Unique identifier within form
  name: string;                        // Display name
  description?: string;                // Optional description
  content: LayoutNode;                 // Fragment content
  parameters?: FragmentParameter[];    // Optional configurable parameters
}

interface FragmentParameter {
  name: string;                        // Parameter name
  type: 'string' | 'number' | 'boolean' | 'binding';
  defaultValue?: unknown;              // Default value if not provided
  description?: string;
}
```

### 3.3 Layout System

The layout system uses a tree of nodes, where each node can be a container (holds other nodes) or a field (displays/edits data).

```typescript
// Base node interface
interface LayoutNodeBase {
  id: string;                          // Unique within form
  type: LayoutNodeType;
  visible?: boolean | VisibilityCondition;
  className?: string;                  // Custom CSS class
  style?: CSSProperties;               // Inline styles
}

// Layout node types
type LayoutNodeType =
  | 'container'     // Generic container
  | 'grid'          // CSS Grid container
  | 'flex'          // Flexbox container
  | 'tabs'          // Tabbed container
  | 'section'       // Collapsible section
  | 'group'         // Visual grouping (fieldset-like)
  | 'columns'       // Multi-column layout
  | 'field'         // Data-bound field
  | 'static'        // Static content (text, images)
  | 'computed'      // Computed/derived value display
  | 'repeater'      // Repeating section (for arrays)
  | 'conditional'   // Conditional rendering wrapper
  | 'fragment'      // Reference to reusable fragment
  | 'spacer'        // Empty space
  | 'divider';      // Horizontal/vertical divider

type LayoutNode =
  | ContainerNode
  | GridNode
  | FlexNode
  | TabsNode
  | SectionNode
  | GroupNode
  | ColumnsNode
  | FieldNode
  | StaticNode
  | ComputedNode
  | RepeaterNode
  | ConditionalNode
  | FragmentNode
  | SpacerNode
  | DividerNode;
```

### 3.4 Container Nodes

```typescript
interface ContainerNode extends LayoutNodeBase {
  type: 'container';
  children: LayoutNode[];
}

interface GridNode extends LayoutNodeBase {
  type: 'grid';
  columns: number | string;            // Number or CSS grid-template-columns
  rows?: number | string;              // Number or CSS grid-template-rows
  gap?: string;                        // Grid gap
  children: GridChildNode[];
}

interface GridChildNode {
  node: LayoutNode;
  column?: number | string;            // Grid column placement
  row?: number | string;               // Grid row placement
  columnSpan?: number;
  rowSpan?: number;
}

interface FlexNode extends LayoutNodeBase {
  type: 'flex';
  direction: 'row' | 'column';
  wrap?: boolean;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  gap?: string;
  children: LayoutNode[];
}

interface TabsNode extends LayoutNodeBase {
  type: 'tabs';
  tabPosition?: 'top' | 'bottom' | 'left' | 'right';
  tabs: TabDefinition[];
}

interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  content: LayoutNode;
}

interface SectionNode extends LayoutNodeBase {
  type: 'section';
  title: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  icon?: string;
  children: LayoutNode[];
}

interface GroupNode extends LayoutNodeBase {
  type: 'group';
  title?: string;
  bordered?: boolean;
  children: LayoutNode[];
}

interface ColumnsNode extends LayoutNodeBase {
  type: 'columns';
  columns: ColumnDefinition[];
  gap?: string;
}

interface ColumnDefinition {
  width: string;                       // CSS width (%, px, fr)
  content: LayoutNode;
}

interface RepeaterNode extends LayoutNodeBase {
  type: 'repeater';
  binding: string;                     // Property path to array
  itemTemplate: LayoutNode;            // Template for each item
  emptyMessage?: string;               // Message when array is empty
  allowAdd?: boolean;
  allowRemove?: boolean;
  allowReorder?: boolean;
}

interface ConditionalNode extends LayoutNodeBase {
  type: 'conditional';
  condition: VisibilityCondition;
  then: LayoutNode;
  else?: LayoutNode;
}

interface FragmentNode extends LayoutNodeBase {
  type: 'fragment';
  fragmentId: string;                  // Reference to fragment definition
  props?: Record<string, unknown>;     // Optional properties to pass to fragment
}
```

### 3.5 Field Nodes

```typescript
interface FieldNode extends LayoutNodeBase {
  type: 'field';
  binding: string;                     // Property path (e.g., "abilities.strength.value")
  fieldType: FieldType;                // Input type
  label?: string;
  labelKey?: string;                   // Localization key for label (infrastructure only)
  placeholder?: string;
  placeholderKey?: string;             // Localization key for placeholder
  helpText?: string;
  helpTextKey?: string;                // Localization key for help text
  required?: boolean;
  readOnly?: boolean | VisibilityCondition;
  disabled?: boolean | VisibilityCondition;

  // Validation
  validation?: FieldValidation;

  // Type-specific options
  options?: FieldTypeOptions;
}

type FieldType =
  | 'text'          // Single line text
  | 'textarea'      // Multi-line text
  | 'number'        // Numeric input
  | 'checkbox'      // Boolean checkbox
  | 'toggle'        // Boolean toggle switch
  | 'select'        // Dropdown selection
  | 'multiselect'   // Multiple selection
  | 'radio'         // Radio button group
  | 'date'          // Date picker
  | 'color'         // Color picker
  | 'image'         // Image upload/URL
  | 'dice'          // Dice notation (e.g., "2d6+3")
  | 'resource'      // Current/Max resource (HP, spell slots)
  | 'rating'        // Star/pip rating
  | 'slider'        // Range slider
  | 'tags'          // Tag input
  | 'reference'     // Reference to another entity
  | 'richtext'      // Rich text editor (markdown)
  | 'json'          // JSON editor
  | 'custom';       // Custom component reference

interface FieldTypeOptions {
  // Number options
  min?: number;
  max?: number;
  step?: number;

  // Select/multiselect/radio options
  choices?: FieldChoice[];
  choicesFromProperty?: string;        // Get choices from entity property

  // Resource options
  showBar?: boolean;
  barColor?: string;

  // Rating options
  maxRating?: number;
  ratingIcon?: string;

  // Reference options
  referenceType?: string;              // Entity type to reference
  allowMultiple?: boolean;

  // Custom component
  componentId?: string;
  componentProps?: Record<string, unknown>;
}

interface FieldChoice {
  value: string | number;
  label: string;
  icon?: string;
}

interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;                    // Regex pattern
  customValidator?: string;            // Script reference
  errorMessage?: string;
}
```

### 3.6 Static & Computed Nodes

```typescript
interface StaticNode extends LayoutNodeBase {
  type: 'static';
  contentType: 'text' | 'html' | 'image' | 'icon';
  content: string;                     // Text, HTML, image URL, or icon name
  interpolate?: boolean;               // Allow {{propertyPath}} interpolation
}

interface ComputedNode extends LayoutNodeBase {
  type: 'computed';
  computedFieldId: string;             // Reference to computed field definition
  displayFormat?: string;              // Format string (e.g., "+{value}" for modifiers)
  label?: string;
}

interface SpacerNode extends LayoutNodeBase {
  type: 'spacer';
  height?: string;
  width?: string;
}

interface DividerNode extends LayoutNodeBase {
  type: 'divider';
  orientation?: 'horizontal' | 'vertical';
  thickness?: string;
  color?: string;
}
```

### 3.7 Visibility Conditions

```typescript
interface VisibilityCondition {
  type: 'simple' | 'compound';
}

interface SimpleCondition extends VisibilityCondition {
  type: 'simple';
  field: string;                       // Property path
  operator: ConditionOperator;
  value: unknown;
}

type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'contains'
  | 'notContains'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'matches';                         // Regex match

interface CompoundCondition extends VisibilityCondition {
  type: 'compound';
  operator: 'and' | 'or';
  conditions: VisibilityCondition[];
}
```

### 3.8 Computed Fields

```typescript
interface ComputedFieldDefinition {
  id: string;
  name: string;
  description?: string;

  // Formula-based computation
  formula?: string;                    // e.g., "floor((abilities.strength.value - 10) / 2)"

  // Reference to game system formula (if predefined)
  gameSystemFormula?: string;

  // Dependencies for optimization
  dependencies: string[];              // Property paths this computation depends on

  // Output configuration
  outputType: 'number' | 'string' | 'boolean';
  precision?: number;                  // For numbers
}
```

### 3.9 Form Styles

```typescript
interface FormStyles {
  // Theme selection
  theme?: 'default' | 'dark' | 'light' | 'parchment' | 'custom';

  // Typography
  fontFamily?: string;
  fontSize?: string;
  headingFontFamily?: string;

  // Colors
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;

  // Spacing
  padding?: string;
  fieldSpacing?: string;
  sectionSpacing?: string;

  // Custom CSS (sanitized)
  customCSS?: string;

  // Background
  backgroundImage?: string;
  backgroundOpacity?: number;
}
```

---

## 4. Form Renderer Engine

### 4.1 Renderer Architecture

```typescript
// Core renderer component
interface FormRendererProps {
  formDefinition: FormDefinition;
  entity: ModuleEntityWithProperties;
  mode: 'view' | 'edit';
  onChange?: (propertyPath: string, value: unknown) => void;
  onSave?: () => void;
}

// Svelte component structure
// FormRenderer.svelte
//   └── LayoutRenderer.svelte (recursive)
//         ├── ContainerRenderer.svelte
//         ├── GridRenderer.svelte
//         ├── FlexRenderer.svelte
//         ├── TabsRenderer.svelte
//         ├── SectionRenderer.svelte
//         ├── FieldRenderer.svelte
//         ├── ComputedRenderer.svelte
//         ├── RepeaterRenderer.svelte
//         ├── FragmentRenderer.svelte
//         └── StaticRenderer.svelte
```

### 4.2 Field Binding System

```typescript
class FieldBinder {
  private entity: ModuleEntityWithProperties;
  private changes: Map<string, unknown>;

  // Get value from entity using property path
  getValue(propertyPath: string): unknown {
    // Supports dot notation: "abilities.strength.value"
    // Supports array access: "inventory[0].name"
    // Supports nested arrays: "spellSlots.level1.slots[0]"
  }

  // Set value (stored in changes map until save)
  setValue(propertyPath: string, value: unknown): void;

  // Get pending changes
  getChanges(): Map<string, unknown>;

  // Commit changes to entity
  commit(): void;
}
```

### 4.3 Computed Field Engine

```typescript
class ComputedFieldEngine {
  private definitions: Map<string, ComputedFieldDefinition>;
  private cache: Map<string, unknown>;
  private binder: FieldBinder;

  // Register computed field
  register(definition: ComputedFieldDefinition): void;

  // Evaluate computed field
  evaluate(fieldId: string): unknown {
    // 1. Check cache
    // 2. Parse formula
    // 3. Resolve dependencies from binder
    // 4. Execute formula in sandbox
    // 5. Cache result
    // 6. Return value
  }

  // Invalidate cache when dependency changes
  invalidate(propertyPath: string): void;
}
```

### 4.4 Formula Language

Support a safe expression language for computed fields:

```javascript
// Mathematical operations
floor((abilities.strength.value - 10) / 2)

// Conditional expressions
if(level >= 5, 3, if(level >= 9, 4, 2))

// Lookup tables
lookup(proficiencyBonus, level)

// Aggregations
sum(inventory.*.weight)
count(inventory[type="weapon"])

// String operations
concat(firstName, " ", lastName)
uppercase(name)

// Boolean logic
and(hasFeature("Sneak Attack"), isHidden)
or(isProficient, hasExpertise)
```

---

## 5. Form Designer UI

### 5.1 Designer Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Form Designer - [Form Name]                                    [Save] │
├───────────────┬──────────────────────────────────┬──────────────────────┤
│               │                                  │                      │
│   Component   │         Canvas Editor            │     Property         │
│   Palette     │                                  │     Editor           │
│               │  ┌───────────────────────────┐   │                      │
│  ┌─────────┐  │  │                           │   │  Selected: [Field]   │
│  │ Fields  │  │  │   Drop components here    │   │                      │
│  ├─────────┤  │  │   to build your form      │   │  Binding:            │
│  │ □ Text  │  │  │                           │   │  [abilities.str.val] │
│  │ □ Number│  │  │  ┌─────────┐ ┌─────────┐  │   │                      │
│  │ □ Select│  │  │  │ Field 1 │ │ Field 2 │  │   │  Label:              │
│  │ □ Check │  │  │  └─────────┘ └─────────┘  │   │  [Strength]          │
│  │ □ ...   │  │  │                           │   │                      │
│  ├─────────┤  │  │  ┌───────────────────┐    │   │  Field Type:         │
│  │ Layout  │  │  │  │ Section: Stats    │    │   │  [number ▼]          │
│  ├─────────┤  │  │  │ ┌───┐ ┌───┐ ┌───┐ │    │   │                      │
│  │ □ Grid  │  │  │  │ │   │ │   │ │   │ │    │   │  Validation:         │
│  │ □ Flex  │  │  │  │ └───┘ └───┘ └───┘ │    │   │  [x] Required        │
│  │ □ Tabs  │  │  │  └───────────────────┘    │   │  Min: [1]            │
│  │ □ Sect  │  │  │                           │   │  Max: [30]           │
│  │ □ ...   │  │  └───────────────────────────┘   │                      │
│  ├─────────┤  │                                  │  Visibility:         │
│  │ Static  │  │  [Tree View] [Visual] [JSON]     │  [Always visible ▼]  │
│  ├─────────┤  │                                  │                      │
│  │ □ Text  │  ├──────────────────────────────────┤  Style:              │
│  │ □ Image │  │         Live Preview             │  [Edit Styles...]    │
│  │ □ Icon  │  │  (Renders with sample data)      │                      │
│  └─────────┘  │                                  │                      │
│               │                                  │                      │
└───────────────┴──────────────────────────────────┴──────────────────────┘
```

### 5.2 Designer Features

**Component Palette**:
- Categorized list of available components
- Drag-and-drop onto canvas
- Search/filter components
- Favorites for commonly used

**Canvas Editor**:
- Visual WYSIWYG editing
- Drag to reposition components
- Resize handles for containers
- Selection and multi-selection
- Copy/paste components
- Undo/redo support
- Zoom controls

**Property Editor**:
- Context-sensitive properties for selected component
- Binding picker with property browser
- Validation configuration
- Visibility condition builder
- Style overrides

**Preview Panel**:
- Real-time preview with sample entity data
- Toggle between view/edit modes
- Test with different data scenarios

**Tree View**:
- Hierarchical view of form structure
- Drag to reorder/reparent
- Collapse/expand nodes
- Quick selection

**JSON View**:
- Raw JSON editor for power users
- Schema validation
- Copy/paste form definitions

### 5.3 Property Binding Picker

```
┌─────────────────────────────────────────┐
│  Select Property Binding                │
├─────────────────────────────────────────┤
│  Search: [________________]             │
│                                         │
│  ▼ abilities                            │
│    ▼ strength                           │
│      • value                    number  │
│      • modifier                 computed│
│      • savingThrow              computed│
│    ▼ dexterity                          │
│      • value                    number  │
│      ...                                │
│  ▼ combat                               │
│    • armorClass                 computed│
│    • initiative                 computed│
│    • speed                      number  │
│  ▼ inventory (array)                    │
│    [0]                                  │
│      • name                     string  │
│      • weight                   number  │
│      ...                                │
│                                         │
│  Selected: abilities.strength.value     │
│                           [Cancel] [OK] │
└─────────────────────────────────────────┘
```

### 5.4 Visibility Condition Builder

```
┌─────────────────────────────────────────┐
│  Visibility Condition                   │
├─────────────────────────────────────────┤
│  [○] Always visible                     │
│  [●] Show when condition is met         │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [level] [>=] [5]              [+AND]││
│  │ [class] [equals] [Wizard]     [+OR] ││
│  │                                     ││
│  │            [+ Add Condition]        ││
│  └─────────────────────────────────────┘│
│                                         │
│  Preview: Show when level >= 5 AND      │
│           class equals "Wizard"         │
│                                         │
│                           [Cancel] [OK] │
└─────────────────────────────────────────┘
```

---

## 6. Database Schema

### 6.1 Forms Table

```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  game_system_id VARCHAR(100) NOT NULL REFERENCES game_systems(system_id),
  entity_type VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,

  -- Marketplace/ownership
  visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'marketplace')),
  license_type VARCHAR(20) CHECK (license_type IN ('free', 'paid', 'subscription')),
  price DECIMAL(10,2),
  owner_id UUID REFERENCES users(id),

  -- Form definition (JSON)
  layout JSONB NOT NULL,
  fragments JSONB,                     -- Reusable form fragments
  styles JSONB,
  computed_fields JSONB,
  scripts JSONB,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_default_form UNIQUE (game_system_id, entity_type, is_default)
    WHERE is_default = true,
  CONSTRAINT price_required_for_paid CHECK (
    (license_type = 'paid' AND price IS NOT NULL AND price > 0) OR
    (license_type != 'paid')
  )
);

-- Indexes
CREATE INDEX idx_forms_game_system ON forms(game_system_id);
CREATE INDEX idx_forms_entity_type ON forms(game_system_id, entity_type);
CREATE INDEX idx_forms_created_by ON forms(created_by);
CREATE INDEX idx_forms_visibility ON forms(visibility);
CREATE INDEX idx_forms_marketplace ON forms(visibility, license_type) WHERE visibility = 'marketplace';
```

### 6.2 Form Licenses

```sql
-- Track user licenses for marketplace forms
CREATE TABLE form_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('free', 'paid', 'subscription')),

  -- Payment tracking
  purchase_price DECIMAL(10,2),
  subscription_expires_at TIMESTAMPTZ,  -- For subscription licenses

  -- Metadata
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,               -- If license is revoked

  CONSTRAINT unique_user_form_license UNIQUE (form_id, user_id)
);

CREATE INDEX idx_form_licenses_user ON form_licenses(user_id);
CREATE INDEX idx_form_licenses_form ON form_licenses(form_id);
CREATE INDEX idx_form_licenses_active ON form_licenses(user_id)
  WHERE revoked_at IS NULL AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW());
```

### 6.3 Campaign Form Assignments

```sql
-- Allow campaigns to use custom forms (users must own/license forms)
CREATE TABLE campaign_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,  -- For multiple forms per type

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_campaign_form UNIQUE (campaign_id, form_id, entity_type)
);

CREATE INDEX idx_campaign_forms_campaign ON campaign_forms(campaign_id);
```

---

## 7. API Design

### 7.1 Form Management Endpoints

```
# List forms for a game system
GET /api/v1/game-systems/:systemId/forms
  Query: ?entityType=character&includeDefaults=true

# Get form by ID
GET /api/v1/forms/:formId

# Create new form
POST /api/v1/game-systems/:systemId/forms
  Body: { name, entityType, layout, styles?, computedFields? }

# Update form
PATCH /api/v1/forms/:formId
  Body: { name?, layout?, styles?, computedFields? }

# Delete form
DELETE /api/v1/forms/:formId

# Duplicate form (for customization)
POST /api/v1/forms/:formId/duplicate
  Body: { name }

# Export form
GET /api/v1/forms/:formId/export
  Returns: JSON file download

# Import form
POST /api/v1/game-systems/:systemId/forms/import
  Body: FormData with JSON file
```

### 7.2 Marketplace Endpoints

```
# List marketplace forms
GET /api/v1/marketplace/forms
  Query: ?gameSystemId=dnd5e&entityType=character&licenseType=free

# Get marketplace form details
GET /api/v1/marketplace/forms/:formId

# Publish form to marketplace
POST /api/v1/forms/:formId/publish
  Body: { visibility: 'marketplace', licenseType: 'free|paid|subscription', price? }

# Unpublish form from marketplace
POST /api/v1/forms/:formId/unpublish

# Purchase/license form
POST /api/v1/marketplace/forms/:formId/license
  Body: { paymentMethod? }  # For paid forms

# Get user's licensed forms
GET /api/v1/users/me/form-licenses
  Query: ?gameSystemId=dnd5e&includeExpired=false

# Revoke license (owner/admin only)
DELETE /api/v1/form-licenses/:licenseId
```

### 7.3 Campaign Form Assignment

```
# List forms available to campaign
GET /api/v1/campaigns/:campaignId/forms
  Returns: { defaults: Form[], custom: Form[], assigned: CampaignForm[] }

# Assign form to campaign
POST /api/v1/campaigns/:campaignId/forms
  Body: { formId, entityType, priority? }

# Remove form assignment
DELETE /api/v1/campaigns/:campaignId/forms/:assignmentId

# Get active form for entity type in campaign
GET /api/v1/campaigns/:campaignId/forms/active/:entityType
  Returns: Form to use for rendering
```

---

## 8. Default Forms

### 8.1 Form Bundling

Default forms will be bundled with each game system:

```
game-systems/
  core/
    dnd5e-ogl/
      manifest.json
      system.json
      forms/                    # NEW: Default forms
        character.form.json     # Character sheet
        monster.form.json       # Monster stat block
        item.form.json          # Generic item card
        weapon.form.json        # Weapon card
        armor.form.json         # Armor card
        spell.form.json         # Spell card
        npc.form.json           # NPC sheet
      templates/
      compendium/
```

### 8.2 Form Loading

During game system loading, forms are:
1. Read from `forms/` directory
2. Validated against schema
3. Inserted into database with `is_default = true`
4. Associated with game system

### 8.3 Form Versioning

When game system updates include form changes:
1. Compare version numbers
2. If default form unchanged by user, update in place
3. If user has customized, preserve custom version
4. Notify user of available form updates

---

## 9. Access Control

### 9.1 Permission Model

| Action | GM/Paid Account | Free/Player Account | System |
|--------|-----------------|---------------------|--------|
| View forms | Yes | Yes (assigned) | N/A |
| Create forms | Yes | No | Yes |
| Edit own forms | Yes | No | N/A |
| Edit default forms | No | No | Yes |
| Delete own forms | Yes | No | N/A |
| Delete default forms | No | No | No |
| Assign forms to campaign | Yes | No | N/A |
| Use form designer | Yes | No | N/A |
| Publish to marketplace | Yes | No | N/A |
| Purchase from marketplace | Yes | Yes | N/A |
| Use licensed forms | Yes (in own campaigns) | Yes (in GM's campaigns) | N/A |

**Note**: The form designer is a premium feature. Only GMs and users with paid accounts can access the form designer interface. Free/player accounts can use forms assigned by their GM but cannot create or modify them.

### 9.2 Form Visibility

- **Default forms**: Visible to all campaigns using that game system
- **Private forms**: Visible only to creator and campaigns where assigned
- **Public forms**: Visible to all users (can be licensed for free)
- **Marketplace forms**: Listed in marketplace; users must license to use
  - Free marketplace forms: Anyone can license
  - Paid marketplace forms: Users must purchase license
  - Subscription marketplace forms: Users must maintain active subscription

### 9.3 Form Licensing Rules

1. **Ownership**: Form creator is the owner
2. **License Scope**: Licenses are per-user, not per-campaign
3. **Cross-Campaign Use**: Licensed forms can be used in any compatible campaign (matching game system)
4. **License Transfer**: Licenses are non-transferable
5. **Revocation**: Owner can revoke licenses (with refund policy TBD)

---

## 10. Integration Points

### 10.1 Entity Display

When displaying an entity:
1. Determine entity type (character, item, spell, etc.)
2. Query campaign for assigned form
3. Fall back to game system default form
4. Render form with entity data

### 10.2 Entity Creation

When creating entities:
1. Open form in edit mode
2. Initialize with template defaults
3. User fills in form
4. Validate against form constraints
5. Save entity with EAV decomposition

### 10.3 Main Menu Integration

Access form-related features from:

**Form Designer** (GM/Paid accounts only):
- Campaign Settings > Form Management > "Create Form"
- Game System Browser > Forms > "Customize"
- Right-click entity > "Edit Form Template"

**Marketplace** (All users):
- Main Menu > Marketplace > Forms
- Campaign Settings > Form Management > "Browse Marketplace"
- Quick access from entity context menu > "Get More Forms"

**My Forms** (All users):
- User Profile > My Forms > Shows created and licensed forms
- Campaign Settings > Form Management > Lists available forms

**Form Assignment** (GM only):
- Campaign Settings > Form Management > Assign forms to entity types
- Set priority for multiple forms of same type

---

## 11. Implementation Phases

### Phase 1: Foundation (Forms DB + Basic Renderer)
- Database schema for forms (including marketplace tables)
- Form definition types
- Basic form renderer (fields only, no layout)
- API endpoints for CRUD
- Default form loading from game systems
- GM-only access control

### Phase 2: Layout System
- Container components (grid, flex, sections)
- Tab component
- Conditional visibility
- Repeater component
- Form fragments (definition and rendering)

### Phase 3: Form Designer UI (Desktop/Tablet)
- Canvas editor with drag-drop
- Component palette
- Property editor panel
- Tree view navigation
- Fragment library UI
- Optimized for desktop and tablet viewports

### Phase 4: Advanced Features
- Computed field engine
- Formula language
- Custom styling
- Import/export
- Form versioning
- Localization infrastructure (keys only, no translation)

### Phase 5: Marketplace Integration
- Marketplace listing UI
- Form publishing workflow
- License management
- Purchase/subscription flow
- Cross-campaign form usage
- Revenue sharing (if applicable)

### Phase 6: Polish & Optimization
- Undo/redo
- Copy/paste
- Templates gallery
- Performance optimization
- Documentation

### Future Phases (Deferred)
- **PDF Export**: Print-optimized layouts and PDF generation
- **Full Localization**: Translation implementation for all supported languages
- **Mobile Optimization**: Responsive design for phone screens

---

## 12. Technical Considerations

### 12.1 Performance

- **Lazy rendering**: Only render visible tabs/sections
- **Virtual scrolling**: For long lists in repeaters
- **Computed caching**: Memoize computed field results
- **Form caching**: Cache parsed form definitions

### 12.2 Security

- **Formula sandboxing**: Execute formulas in isolated context
- **CSS sanitization**: Sanitize custom CSS
- **Input validation**: Validate all form inputs
- **XSS prevention**: Escape interpolated values

### 12.3 Extensibility

- **Custom field types**: Plugin architecture for new field types
- **Custom renderers**: Override rendering for specific types
- **Hooks**: Pre/post save hooks for validation

---

## 13. Example Form Definition

Here's a simplified D&D 5e character sheet form demonstrating marketplace and fragment features:

```json
{
  "id": "dnd5e-character-default",
  "name": "D&D 5e Character Sheet",
  "gameSystemId": "dnd5e-ogl",
  "entityType": "character",
  "version": "1.0.0",
  "isDefault": true,
  "isLocked": true,
  "visibility": "public",
  "licenseType": "free",
  "ownerId": null,

  "fragments": [
    {
      "id": "ability-score-block",
      "name": "Ability Score Block",
      "description": "Reusable ability score display with value and modifier",
      "content": {
        "type": "group",
        "id": "ability-group",
        "bordered": true,
        "children": [
          {
            "type": "field",
            "id": "ability-value",
            "binding": "{{abilityPath}}.value",
            "fieldType": "number",
            "options": { "min": 1, "max": 30 }
          },
          {
            "type": "computed",
            "id": "ability-mod",
            "computedFieldId": "{{abilityPath}}-modifier",
            "displayFormat": "{value:+d}"
          }
        ]
      },
      "parameters": [
        {
          "name": "abilityPath",
          "type": "binding",
          "description": "Path to ability score (e.g., abilities.strength)"
        }
      ]
    }
  ],

  "layout": {
    "type": "container",
    "id": "root",
    "children": [
      {
        "type": "section",
        "id": "header",
        "title": "Character Info",
        "collapsible": false,
        "children": [
          {
            "type": "grid",
            "id": "header-grid",
            "columns": 3,
            "gap": "1rem",
            "children": [
              {
                "node": {
                  "type": "field",
                  "id": "name-field",
                  "binding": "name",
                  "fieldType": "text",
                  "label": "Character Name",
                  "labelKey": "dnd5e.character.name.label",
                  "required": true
                }
              },
              {
                "node": {
                  "type": "field",
                  "id": "class-field",
                  "binding": "class",
                  "fieldType": "select",
                  "label": "Class",
                  "options": {
                    "choicesFromProperty": "availableClasses"
                  }
                }
              },
              {
                "node": {
                  "type": "field",
                  "id": "level-field",
                  "binding": "level",
                  "fieldType": "number",
                  "label": "Level",
                  "options": { "min": 1, "max": 20 }
                }
              }
            ]
          }
        ]
      },
      {
        "type": "tabs",
        "id": "main-tabs",
        "tabs": [
          {
            "id": "stats-tab",
            "label": "Stats",
            "content": {
              "type": "grid",
              "id": "abilities-grid",
              "columns": 6,
              "gap": "0.5rem",
              "children": [
                {
                  "node": {
                    "type": "group",
                    "id": "str-group",
                    "title": "STR",
                    "children": [
                      {
                        "type": "fragment",
                        "id": "str-fragment",
                        "fragmentId": "ability-score-block",
                        "props": {
                          "abilityPath": "abilities.strength"
                        }
                      }
                    ]
                  }
                },
                {
                  "node": {
                    "type": "group",
                    "id": "dex-group",
                    "title": "DEX",
                    "children": [
                      {
                        "type": "fragment",
                        "id": "dex-fragment",
                        "fragmentId": "ability-score-block",
                        "props": {
                          "abilityPath": "abilities.dexterity"
                        }
                      }
                    ]
                  }
                }
                // ... other abilities use the same fragment
              ]
            }
          },
          {
            "id": "inventory-tab",
            "label": "Inventory",
            "content": {
              "type": "repeater",
              "id": "inventory-list",
              "binding": "inventory",
              "allowAdd": true,
              "allowRemove": true,
              "itemTemplate": {
                "type": "flex",
                "id": "item-row",
                "direction": "row",
                "gap": "1rem",
                "children": [
                  {
                    "type": "field",
                    "id": "item-name",
                    "binding": "name",
                    "fieldType": "text"
                  },
                  {
                    "type": "field",
                    "id": "item-qty",
                    "binding": "quantity",
                    "fieldType": "number"
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  },

  "computedFields": [
    {
      "id": "strength-modifier",
      "name": "Strength Modifier",
      "formula": "floor((abilities.strength.value - 10) / 2)",
      "dependencies": ["abilities.strength.value"],
      "outputType": "number"
    }
  ],

  "styles": {
    "theme": "parchment",
    "fontFamily": "Bookinsanity, serif",
    "accentColor": "#8b4513"
  }
}
```

---

## 14. Design Decisions

This section documents key design decisions that were made during the proposal phase.

### 14.1 Resolved Questions

**Q: Should forms be shareable across campaigns?**
✅ **Decision**: Yes. Forms are shareable across campaigns that use the same game system. This enables a marketplace where content creators can design and sell forms. Users who create or license forms can use them in any compatible campaign.

**Q: How granular should form permissions be?**
✅ **Decision**: Form designer access is GM-only (or paid accounts). Free/player accounts cannot access the form designer. This simplifies the permission model and positions the form designer as a premium feature. Players use forms assigned by their GM.

**Q: Should we support form "fragments"?**
✅ **Decision**: Yes. The schema includes `FormFragment` type and a `fragments` collection in the form definition. Fragments can be inserted via `FragmentNode`, enabling reusable sections across multiple forms.

**Q: What about print/PDF export?**
✅ **Decision**: Deferred to future phases. PDF export is noted as a valuable secondary feature but not part of the initial implementation. The infrastructure will support it (print-optimized layouts can be defined), but implementation is postponed.

**Q: Mobile/responsive design?**
✅ **Decision**: Target desktop/tablet only. The form designer and renderer will be optimized for desktop and tablet viewports. Mobile phone support is explicitly excluded from the initial scope to reduce complexity.

**Q: Localization?**
✅ **Decision**: Infrastructure only, implementation deferred. The framework supports localization via locale keys (`labelKey`, `placeholderKey`, `helpTextKey` in field definitions), but actual translation implementation is not part of the initial rollout. This future-proofs the system without adding immediate complexity.

### 14.2 Key Architectural Choices

1. **Marketplace-First Design**: Forms are designed as potentially monetizable assets from the start, with licensing and ownership built into the core schema.

2. **Fragment System**: Enables DRY principles for form design and creates opportunities for a fragment marketplace.

3. **Game System Scoping**: Forms are always tied to a specific game system, preventing cross-system compatibility issues.

4. **Premium Feature Positioning**: Form designer is GM/paid-tier only, creating a clear value proposition for premium accounts.

5. **Desktop-First UX**: By targeting desktop/tablet, we can deliver a richer editing experience without mobile constraints.

---

## 15. Success Metrics

### 15.1 Core Metrics
- **Adoption**: % of campaigns using custom forms
- **Creation**: Average forms created per GM
- **Satisfaction**: User feedback scores
- **Performance**: Form render time < 100ms
- **Stability**: Error rate in form designer < 0.1%

### 15.2 Marketplace Metrics
- **Marketplace Listings**: Number of forms published to marketplace
- **License Velocity**: Forms licensed per week/month
- **Creator Revenue**: Average revenue per form creator
- **Conversion Rate**: % of users who license marketplace forms
- **Fragment Reuse**: Average times each fragment is used across forms

### 15.3 Premium Feature Metrics
- **Designer Access**: % of GMs using form designer
- **Upgrade Attribution**: % of upgrades attributed to form designer feature
- **Time to First Form**: Average time from signup to first custom form creation

---

## Conclusion

This form designer system provides a flexible, powerful way for GMs to customize how game content is displayed and edited. The schema-based approach ensures forms remain portable and version-controlled while the visual designer makes customization accessible to non-technical users.

Key innovations in this design:

1. **Marketplace Integration**: Forms as monetizable assets creates opportunities for content creators and provides value to the user community.

2. **Fragment System**: Reusable form fragments reduce duplication and enable a secondary marketplace for form components.

3. **Premium Positioning**: GM-only access to the form designer creates a clear premium feature that justifies paid tiers.

4. **Future-Proof Architecture**: Built-in support for localization and PDF export (even though implementation is deferred) means these features can be added without schema changes.

5. **Cross-Campaign Compatibility**: Licensed forms work across all compatible campaigns, reducing friction and increasing value.

The phased implementation approach allows us to deliver value incrementally while building toward the full vision. The marketplace and licensing infrastructure are built from the start, even though marketplace features roll out in Phase 5, ensuring the foundation is solid.
