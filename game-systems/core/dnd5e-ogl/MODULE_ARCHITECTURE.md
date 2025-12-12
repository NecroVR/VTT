# D&D 5e SRD Module Architecture

## Module System Overview

The D&D 5e SRD module is part of the new EAV (Entity-Attribute-Value) module system that enables flexible, validated loading of game content into campaigns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE LOADING ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  File System                                                                 │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  game-systems/core/dnd5e-ogl/                                                │
│  │                                                                           │
│  ├─ module.json ──────────────┐  (Module Manifest)                          │
│  │  {                         │                                             │
│  │    moduleId: "dnd5e-srd"   │                                             │
│  │    gameSystemId: "dnd5e"   │                                             │
│  │    entities: [...]         │                                             │
│  │  }                         │                                             │
│  │                            │                                             │
│  ├─ compendium/               │                                             │
│  │  ├─ items/                 │                                             │
│  │  │  └─ simple-melee-weapons.json ──┐                                     │
│  │  │     {                            │                                    │
│  │  │       entries: [                 │                                    │
│  │  │         {id: "club", ...},       │  (Entity Files)                    │
│  │  │         {id: "dagger", ...}      │                                    │
│  │  │       ]                          │                                    │
│  │  │     }                            │                                    │
│  │  ├─ spells/                         │                                    │
│  │  └─ monsters/                       │                                    │
│  │                                     │                                    │
│  └─ templates/                         │                                    │
│     └─ items/                          │                                    │
│        └─ weapon.json ─────────────────┼─┐  (Item Templates - Schemas)     │
│                                        │ │                                  │
│                                        │ │                                  │
│                          ┌─────────────┘ │                                  │
│                          ▼               ▼                                  │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                     ModuleLoaderService                             │     │
│  │                     ───────────────────                             │     │
│  │                                                                     │     │
│  │  1. readManifest()     - Parse module.json                         │     │
│  │  2. loadEntityFiles()  - Scan & load entity files                  │     │
│  │  3. validateModule()   - Validate structure & content              │     │
│  │  4. insertEntity()     - Insert into database                      │     │
│  │  5. flattenToProperties() - Convert to EAV format                  │     │
│  │                                                                     │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                     │                                        │
│                                     ▼                                        │
│  Database (PostgreSQL)                                                       │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  ┌────────────────────────┐                                                 │
│  │       modules          │  Module metadata & validation                   │
│  │  ────────────────────  │                                                 │
│  │  id (PK)               │                                                 │
│  │  module_id             │  "dnd5e-srd"                                    │
│  │  game_system_id        │  "dnd5e-ogl"                                    │
│  │  name                  │  "D&D 5e SRD"                                   │
│  │  version               │  "1.0.0"                                        │
│  │  validation_status     │  'valid' | 'invalid' | 'pending'                │
│  │  source_path           │  Path to module directory                       │
│  │  source_hash           │  SHA256 for change detection                    │
│  └────────────────────────┘                                                 │
│           │                                                                  │
│           │ 1:M                                                              │
│           ▼                                                                  │
│  ┌────────────────────────┐                                                 │
│  │   module_entities      │  Entity metadata                                │
│  │  ────────────────────  │                                                 │
│  │  id (PK)               │                                                 │
│  │  module_id (FK)        │                                                 │
│  │  entity_id             │  "club"                                         │
│  │  entity_type           │  "item"                                         │
│  │  name                  │  "Club"                                         │
│  │  description           │  "A simple wooden club."                        │
│  │  img                   │  "icons/weapons/clubs/club-wood.webp"           │
│  │  template_id           │  "dnd5e-weapon"                                 │
│  │  tags                  │  ["weapon", "simple", "melee"]                  │
│  └────────────────────────┘                                                 │
│           │                                                                  │
│           │ 1:M                                                              │
│           ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │               entity_properties (EAV Core)                       │        │
│  │  ─────────────────────────────────────────────────────────────  │        │
│  │  id (PK)               │ entity_id (FK)  │ property_key         │        │
│  │  ─────────────────────────────────────────────────────────────  │        │
│  │  uuid-1                │ club-uuid       │ "weaponType"         │        │
│  │  uuid-2                │ club-uuid       │ "damage"             │        │
│  │  uuid-3                │ club-uuid       │ "damageType"         │        │
│  │  uuid-4                │ club-uuid       │ "properties.0"       │        │
│  │  uuid-5                │ club-uuid       │ "weight"             │        │
│  │  uuid-6                │ club-uuid       │ "price"              │        │
│  │                                                                  │        │
│  │  Value Columns (one per row):                                   │        │
│  │  ├─ value_string   │ value_integer │ value_number               │        │
│  │  ├─ "simple-melee" │ null          │ null                       │        │
│  │  ├─ "1d4"          │ null          │ null                       │        │
│  │  ├─ "bludgeoning"  │ null          │ null                       │        │
│  │  ├─ "light"        │ null          │ null                       │        │
│  │  ├─ null           │ 2             │ null                       │        │
│  │  └─ null           │ null          │ 0.1                        │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  Campaign Integration                                                        │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  ┌────────────────────┐           ┌──────────────────────┐                  │
│  │    campaigns       │           │  campaign_modules    │                  │
│  │  ────────────────  │           │  ──────────────────  │                  │
│  │  id (PK)           │◄──────────│  campaign_id (FK)    │                  │
│  │  game_system_id    │           │  module_id (FK) ─────┼──► modules       │
│  │  "dnd5e-ogl"       │           │  load_order          │                  │
│  └────────────────────┘           │  is_active           │                  │
│                                    └──────────────────────┘                  │
│                                                                              │
│  CONSTRAINT: campaigns.game_system_id == modules.game_system_id             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Module Loading

```typescript
// Server: Load module from file system
const loader = new ModuleLoaderService();
await loader.loadModule(db, 'game-systems/core/dnd5e-ogl');

// Process:
// 1. Read module.json manifest
// 2. Scan entity files (compendium/*.json)
// 3. Validate content structure
// 4. Insert module record
// 5. For each entity:
//    - Insert module_entities record
//    - Flatten data to entity_properties (EAV)
//    - Validate against template (if specified)
```

### 2. Campaign Integration

```typescript
// Server: Add module to campaign
await db.insert(campaignModules).values({
  campaignId: '<campaign-uuid>',
  moduleId: '<module-uuid>',
  loadOrder: 0,
  isActive: true
});

// Validation:
// - Verify campaign.game_system_id == module.game_system_id
// - Check dependencies are loaded
// - Validate load order
```

### 3. Entity Querying

```typescript
// Server: Get entity with properties
const entity = await db
  .select()
  .from(moduleEntities)
  .where(eq(moduleEntities.entityId, 'club'))
  .limit(1);

const properties = await db
  .select()
  .from(entityProperties)
  .where(eq(entityProperties.entityId, entity.id));

// Reconstruct object from EAV
const reconstructed = loader.reconstructFromProperties(properties);
// Result: { weaponType: "simple-melee", damage: "1d4", ... }
```

### 4. Property Search

```typescript
// Find all magic weapons (search by property value)
const magicWeapons = await db
  .select({ entity: moduleEntities })
  .from(moduleEntities)
  .innerJoin(
    entityProperties,
    eq(entityProperties.entityId, moduleEntities.id)
  )
  .where(
    and(
      eq(moduleEntities.entityType, 'item'),
      eq(entityProperties.propertyKey, 'rarity'),
      ne(entityProperties.valueString, 'common')
    )
  );
```

## Module Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MODULE LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────┐                                                              │
│  │   Create   │  File system: module.json + entity files                    │
│  └──────┬─────┘                                                              │
│         │                                                                    │
│         ▼                                                                    │
│  ┌────────────┐                                                              │
│  │    Load    │  ModuleLoaderService.loadModule()                           │
│  │            │  - Parse manifest                                            │
│  │            │  - Validate structure                                        │
│  │            │  - Insert into database                                      │
│  │            │  - Status: 'pending' → 'valid' or 'invalid'                 │
│  └──────┬─────┘                                                              │
│         │                                                                    │
│         ▼                                                                    │
│  ┌────────────┐                                                              │
│  │  Activate  │  Campaign integration                                        │
│  │            │  - Add to campaign_modules                                   │
│  │            │  - Set load_order                                            │
│  │            │  - Enable is_active flag                                     │
│  └──────┬─────┘                                                              │
│         │                                                                    │
│         ▼                                                                    │
│  ┌────────────┐                                                              │
│  │    Use     │  Entity access in game                                       │
│  │            │  - Query entities                                            │
│  │            │  - Reconstruct from EAV                                      │
│  │            │  - Apply to characters/scenes                                │
│  └──────┬─────┘                                                              │
│         │                                                                    │
│         ▼                                                                    │
│  ┌────────────┐                                                              │
│  │   Update   │  Content changes                                             │
│  │            │  - Edit entity files                                         │
│  │            │  - Bump version in manifest                                  │
│  │            │  - ModuleLoaderService.reloadModule()                        │
│  │            │  - Re-validate content                                       │
│  └──────┬─────┘                                                              │
│         │                                                                    │
│         │                                                                    │
│         ▼                                                                    │
│  ┌────────────┐                                                              │
│  │  Unload    │  Remove from database                                        │
│  │            │  - ModuleLoaderService.unloadModule()                        │
│  │            │  - Cascade delete entities & properties                      │
│  └────────────┘                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## EAV Property Flattening

The ModuleLoader flattens nested objects and arrays into individual property rows:

### Input (JSON)

```json
{
  "id": "club",
  "name": "Club",
  "data": {
    "weaponType": "simple-melee",
    "damage": "1d4",
    "damageType": "bludgeoning",
    "properties": ["light"],
    "cost": {
      "amount": 1,
      "currency": "sp"
    }
  }
}
```

### Output (EAV Rows)

```
entity_properties table:
┌──────────┬──────────────────┬──────────────┬───────────────┬────────────────┐
│ property │ property_path    │ value_type   │ value_string  │ value_integer  │
├──────────┼──────────────────┼──────────────┼───────────────┼────────────────┤
│ weapon   │ [weaponType]     │ string       │ simple-melee  │ null           │
│ Type     │                  │              │               │                │
├──────────┼──────────────────┼──────────────┼───────────────┼────────────────┤
│ damage   │ [damage]         │ string       │ 1d4           │ null           │
├──────────┼──────────────────┼──────────────┼───────────────┼────────────────┤
│ damage   │ [damageType]     │ string       │ bludgeoning   │ null           │
│ Type     │                  │              │               │                │
├──────────┼──────────────────┼──────────────┼───────────────┼────────────────┤
│ proper   │ [properties,0]   │ string       │ light         │ null           │
│ ties.0   │                  │              │               │                │
├──────────┼──────────────────┼──────────────┼───────────────┼────────────────┤
│ cost.    │ [cost,amount]    │ integer      │ null          │ 1              │
│ amount   │                  │              │               │                │
├──────────┼──────────────────┼──────────────┼───────────────┼────────────────┤
│ cost.    │ [cost,currency]  │ string       │ sp            │ null           │
│ currency │                  │              │               │                │
└──────────┴──────────────────┴──────────────┴───────────────┴────────────────┘
```

### Reconstruction

The `reconstructFromProperties()` method rebuilds the original structure:

```typescript
const properties = [...]; // Array of EntityProperty rows
const data = loader.reconstructFromProperties(properties);

// Result:
{
  weaponType: "simple-melee",
  damage: "1d4",
  damageType: "bludgeoning",
  properties: ["light"],
  cost: {
    amount: 1,
    currency: "sp"
  }
}
```

## Benefits of EAV Architecture

### 1. Flexibility
- No schema changes needed for new properties
- Supports arbitrary nesting and complex data
- Easy to add new entity types

### 2. Queryability
- Search by any property value
- Filter entities by multiple criteria
- Complex property-based queries

### 3. Validation
- Track validation errors at property level
- Support for property definitions registry
- Type enforcement per property

### 4. Modularity
- Clean separation of content from system
- Version tracking and change detection
- Module dependencies and load order

### 5. Multi-tenancy
- Modules shared across campaigns
- Campaign-specific overrides
- Per-campaign activation

## API Endpoints

```
GET    /api/v1/modules                  - List all modules
GET    /api/v1/modules/:id              - Get module details
POST   /api/v1/modules                  - Create module
PUT    /api/v1/modules/:id              - Update module
DELETE /api/v1/modules/:id              - Delete module
POST   /api/v1/modules/:id/reload       - Reload from file system
GET    /api/v1/modules/:id/status       - Get load status
GET    /api/v1/modules/:id/entities     - List entities in module

GET    /api/v1/campaigns/:id/modules    - List campaign's modules
POST   /api/v1/campaigns/:id/modules    - Add module to campaign
PUT    /api/v1/campaigns/:id/modules/:moduleId - Update campaign module settings
DELETE /api/v1/campaigns/:id/modules/:moduleId - Remove module from campaign
```

## See Also

- [EAV Module Schema](../../../docs/architecture/EAV_MODULE_SCHEMA.md)
- [Module Types](../../../packages/shared/src/types/modules.ts)
- [ModuleLoader Service](../../../apps/server/src/services/moduleLoader.ts)
- [MODULE_README.md](./MODULE_README.md) - User documentation
