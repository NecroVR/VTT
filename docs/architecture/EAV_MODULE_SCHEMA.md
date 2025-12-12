# EAV Module Schema Design Document

## Overview

This document describes the normalized EAV (Entity-Attribute-Value) database schema for the VTT module system. The design enables flexible storage of game system data while maintaining query efficiency and data integrity.

## Design Principles

1. **Full Normalization**: Every property is stored as a separate row in the EAV pattern
2. **Module Organization**: All data is organized into modules with game system tagging
3. **Validation Pipeline**: Two-stage validation (on load and on reload) with error tracking
4. **Game System Compatibility**: Modules loaded for a campaign must share the same game system

---

## Schema Tables

### 1. Modules Table

Stores module metadata and validation status.

```typescript
// packages/database/src/schema/modules.ts
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Module Identity
  moduleId: text('module_id').notNull(),           // Unique identifier (e.g., "dnd5e-srd")
  gameSystemId: text('game_system_id').notNull(),  // Must match campaign's game system
  name: text('name').notNull(),
  version: text('version').notNull(),
  author: text('author'),
  authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  description: text('description'),

  // Module Type
  moduleType: text('module_type').notNull().default('content'),  // content, mechanics, integration

  // Source Tracking
  sourcePath: text('source_path'),                 // File path for re-validation
  sourceHash: text('source_hash'),                 // SHA256 hash for change detection

  // Dependencies
  dependencies: text('dependencies').array().default([]),

  // Validation Status
  validationStatus: text('validation_status').notNull().default('pending'),
  validationErrors: jsonb('validation_errors').default([]),
  validatedAt: timestamp('validated_at'),

  // Status Flags
  isActive: boolean('is_active').notNull().default(true),
  isLocked: boolean('is_locked').notNull().default(false),
  isOfficial: boolean('is_official').notNull().default(false),

  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 2. Module Entities Table

Stores entity metadata with validation status.

```typescript
// packages/database/src/schema/moduleEntities.ts
export const moduleEntities = pgTable('module_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

  // Entity Identity
  entityId: text('entity_id').notNull(),           // Unique within module
  entityType: text('entity_type').notNull(),       // item, spell, monster, race, etc.

  // Basic Metadata
  name: text('name').notNull(),
  description: text('description'),
  img: text('img'),

  // Template Reference
  templateId: text('template_id'),

  // Source Tracking
  sourcePath: text('source_path'),
  sourceLineNumber: integer('source_line_number'),

  // Validation Status
  validationStatus: text('validation_status').notNull().default('pending'),
  validationErrors: jsonb('validation_errors').default([]),

  // Full-text Search
  searchText: text('search_text'),
  tags: text('tags').array(),

  // Organization
  folderId: text('folder_id'),
  sort: integer('sort').notNull().default(0),

  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 3. Entity Properties Table (EAV Core)

The heart of the EAV pattern - stores all entity properties as rows.

```typescript
// packages/database/src/schema/entityProperties.ts
export const entityProperties = pgTable('entity_properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull().references(() => moduleEntities.id, { onDelete: 'cascade' }),

  // Property Key (supports dot notation)
  propertyKey: text('property_key').notNull(),     // e.g., "damage.dice"
  propertyPath: text('property_path').array(),     // ["damage", "dice"]
  propertyDepth: integer('property_depth').notNull().default(0),

  // Value Storage (only one populated based on valueType)
  valueType: text('value_type').notNull(),         // string, number, integer, boolean, json, reference
  valueString: text('value_string'),
  valueNumber: real('value_number'),
  valueInteger: integer('value_integer'),
  valueBoolean: boolean('value_boolean'),
  valueJson: jsonb('value_json'),
  valueReference: text('value_reference'),

  // Array Support
  arrayIndex: integer('array_index'),
  isArrayElement: boolean('is_array_element').notNull().default(false),

  // Metadata
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 4. Property Definitions Table

Registry of known properties per game system for validation and UI.

```typescript
// packages/database/src/schema/propertyDefinitions.ts
export const propertyDefinitions = pgTable('property_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Scope
  gameSystemId: text('game_system_id').notNull(),
  entityType: text('entity_type').notNull(),

  // Property Definition
  propertyKey: text('property_key').notNull(),
  propertyPath: text('property_path').array(),
  name: text('name').notNull(),
  description: text('description'),

  // Type Constraints
  valueType: text('value_type').notNull(),
  isRequired: boolean('is_required').notNull().default(false),
  isArray: boolean('is_array').notNull().default(false),

  // Validation Rules
  validation: jsonb('validation').default({}),
  defaultValue: jsonb('default_value'),
  options: jsonb('options').default([]),

  // UI Hints
  fieldType: text('field_type'),
  placeholder: text('placeholder'),
  section: text('section'),
  sort: integer('sort').notNull().default(0),

  // Metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 5. Validation Errors Table

Tracks validation errors for user resolution.

```typescript
// packages/database/src/schema/validationErrors.ts
export const validationErrors = pgTable('validation_errors', {
  id: uuid('id').primaryKey().defaultRandom(),

  // References
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id').references(() => moduleEntities.id, { onDelete: 'cascade' }),

  // Error Details
  errorType: text('error_type').notNull(),
  severity: text('severity').notNull().default('error'),
  propertyKey: text('property_key'),
  message: text('message').notNull(),
  details: jsonb('details').default({}),

  // Source Location
  sourcePath: text('source_path'),
  sourceLineNumber: integer('source_line_number'),
  sourceColumn: integer('source_column'),

  // Resolution Tracking
  isResolved: boolean('is_resolved').notNull().default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by'),
  resolutionNote: text('resolution_note'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 6. Campaign-Module Junction Table

Links campaigns to loaded modules with compatibility enforcement.

```typescript
// packages/database/src/schema/campaignModules.ts
export const campaignModules = pgTable('campaign_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

  // Load Order
  loadOrder: integer('load_order').notNull().default(0),

  // Status
  isActive: boolean('is_active').notNull().default(true),

  // Override Settings
  overrides: jsonb('overrides').default({}),

  // Metadata
  addedAt: timestamp('added_at').defaultNow().notNull(),
  addedBy: uuid('added_by'),
  data: jsonb('data').notNull().default({}),
});
```

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EAV MODULE SYSTEM RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                            │
│  │  campaigns   │                                                            │
│  │  ──────────  │                                                            │
│  │  id          │◄───────────┐                                               │
│  │  game_system │            │                                               │
│  └──────────────┘            │                                               │
│         │                    │                                               │
│         │ 1:M                │                                               │
│         ▼                    │                                               │
│  ┌──────────────────┐        │                                               │
│  │ campaign_modules │────────┘                                               │
│  │ ────────────────  │                                                       │
│  │ campaign_id (FK)  │                                                       │
│  │ module_id (FK)    │─────────┐                                             │
│  │ load_order        │         │                                             │
│  └──────────────────┘          │                                             │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────┐                 │
│  │                      modules                            │                 │
│  │  ────────────────────────────────────────────────────  │                 │
│  │  id              │ game_system_id     │ validation     │                 │
│  │  module_id       │ dependencies[]     │ source_path    │                 │
│  └────────────────────────────────────────────────────────┘                 │
│         │                                     │                              │
│         │ 1:M                                 │ 1:M                          │
│         ▼                                     ▼                              │
│  ┌────────────────────────┐      ┌──────────────────────────┐               │
│  │   module_entities      │      │   validation_errors      │               │
│  │  ────────────────────  │◄─────│  ──────────────────────  │               │
│  │  id                    │      │  entity_id (FK)          │               │
│  │  module_id (FK)        │      │  module_id (FK)          │               │
│  │  entity_type           │      │  error_type, message     │               │
│  │  validation_status     │      │  is_resolved             │               │
│  └────────────────────────┘      └──────────────────────────┘               │
│         │                                                                    │
│         │ 1:M                                                                │
│         ▼                                                                    │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    entity_properties (EAV)                          │     │
│  │  ────────────────────────────────────────────────────────────────  │     │
│  │  entity_id (FK)  │ property_key     │ value_type                    │     │
│  │                  │ property_path[]  │ value_string | value_number   │     │
│  │                  │ property_depth   │ value_boolean | value_json    │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    property_definitions                             │     │
│  │  ────────────────────────────────────────────────────────────────  │     │
│  │  game_system_id  │ entity_type      │ property_key                  │     │
│  │  value_type      │ is_required      │ validation{}                  │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Example Queries

### Get All Properties for an Entity

```sql
SELECT
  ep.property_key,
  ep.value_type,
  CASE ep.value_type
    WHEN 'string' THEN ep.value_string::text
    WHEN 'number' THEN ep.value_number::text
    WHEN 'integer' THEN ep.value_integer::text
    WHEN 'boolean' THEN ep.value_boolean::text
    WHEN 'json' THEN ep.value_json::text
    WHEN 'reference' THEN ep.value_reference
  END as value
FROM entity_properties ep
WHERE ep.entity_id = $1
ORDER BY ep.property_key, ep.array_index;
```

### Search Entities by Property Value

```sql
-- Find all spells of level 3 or higher
SELECT DISTINCT me.*
FROM module_entities me
JOIN entity_properties ep ON ep.entity_id = me.id
WHERE me.entity_type = 'spell'
  AND ep.property_key = 'level'
  AND ep.value_integer >= 3;
```

### Validate Game System Compatibility

```sql
SELECT
  CASE
    WHEN m.game_system_id = c.game_system_id THEN true
    ELSE false
  END as is_compatible
FROM modules m, campaigns c
WHERE m.id = $1 AND c.id = $2;
```

### Get Unresolved Validation Errors

```sql
SELECT
  ve.*,
  me.name as entity_name,
  me.entity_type
FROM validation_errors ve
LEFT JOIN module_entities me ON me.id = ve.entity_id
WHERE ve.module_id = $1
  AND ve.is_resolved = false
ORDER BY ve.severity DESC, me.entity_type, me.name;
```

---

## Index Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `modules` | `idx_modules_game_system` | Filter by game system |
| `modules` | `idx_modules_validation_status` | Filter by validation |
| `module_entities` | `idx_module_entities_module` | Get entities for module |
| `module_entities` | `idx_module_entities_type` | Filter by entity type |
| `module_entities` | `idx_module_entities_search` | Full-text search (GIN) |
| `entity_properties` | `idx_entity_properties_entity` | Get all props for entity |
| `entity_properties` | `idx_entity_properties_key` | Search by property key |
| `entity_properties` | `idx_entity_properties_path` | Path array lookup (GIN) |
| `campaign_modules` | `idx_campaign_modules_campaign` | Get modules for campaign |
| `validation_errors` | `idx_validation_errors_unresolved` | Find unresolved errors |

---

## Migration Strategy

### Phase 1: Add New Tables
Create all new EAV tables alongside existing compendium tables.

### Phase 2: Dual-Write
Write to both old and new systems during transition.

### Phase 3: Migrate Data
Run migration scripts to convert existing compendium data to EAV format.

### Phase 4: Switch Reads
Update APIs to read from new EAV tables.

### Phase 5: Cleanup
Deprecate and eventually remove old compendium tables.
