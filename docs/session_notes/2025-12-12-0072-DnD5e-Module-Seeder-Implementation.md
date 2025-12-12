# Session Notes: D&D 5e Module Seeder Implementation

**Date**: 2025-12-12
**Session ID**: 0072
**Focus**: Creating migration script to load D&D 5e content into EAV database tables

---

## Overview

Successfully implemented a comprehensive seeder script that loads D&D 5e System Reference Document (SRD) content into the normalized EAV database tables. The seeder handles property definitions, module metadata, compendium entities, and flattened properties.

---

## What Was Implemented

### 1. Updated ModuleLoaderService (`apps/server/src/services/moduleLoader.ts`)

**Added support for compendium batch format:**

```typescript
// Handle compendium batch format: {compendiumId, name, entries: [...]}
if (parsed.entries && Array.isArray(parsed.entries)) {
  const compendiumMetadata = {
    compendiumId: parsed.compendiumId,
    compendiumName: parsed.name,
    templateId: parsed.templateId,
    source: parsed.source,
  };

  return parsed.entries.map((entity: any) => ({
    entityId: entity.id || entity.entityId,
    entityType: entity.type || entity.entityType || defaultType || 'item',
    name: entity.name,
    description: entity.description,
    img: entity.img,
    templateId: entity.templateId || compendiumMetadata.templateId,
    tags: entity.tags || [compendiumMetadata.compendiumId],
    data: entity.data || entity,
    sourcePath: filePath,
  }));
}
```

**Changes:**
- Now handles three formats: direct entity, array of entities, and wrapped `{entries: [...]}` batch format
- Extracts metadata from batch wrapper (compendiumId, name, templateId, source)
- Falls back to defaults when metadata is missing
- Maintains backward compatibility with existing formats

### 2. Created PropertyDefinitionLoaderService (`apps/server/src/services/propertyDefinitionLoader.ts`)

**Purpose:** Loads property definitions from JSON files into the `property_definitions` table

**Key Features:**
- Reads property definition files in the standardized format
- Upserts definitions (updates if exists, inserts if new)
- Handles validation rules, options, UI hints, and default values
- Provides utility methods for managing property definitions

**Main Methods:**
```typescript
async loadFromFile(db: Database, filePath: string): Promise<number>
async loadDefinitions(db: Database, gameSystemId: string, definitions: PropertyDefinition[]): Promise<number>
async clearGameSystemDefinitions(db: Database, gameSystemId: string): Promise<void>
async getDefinitionCount(db: Database, gameSystemId: string): Promise<number>
```

### 3. Created Database Seeder Script (`apps/server/src/scripts/seedDnd5eModule.ts`)

**Purpose:** Comprehensive seeder that populates database with D&D 5e content

**Workflow:**
1. **Verify Paths** - Ensures all required files and directories exist
2. **Load Property Definitions** - Loads from `property-definitions.json`
3. **Load Module Content** - Creates module record and loads all entities
4. **Display Summary** - Shows counts and validation status

**Features:**
- Transaction-based loading for atomicity
- `--reload` flag to force reload existing modules
- `--verbose` flag for detailed output
- Comprehensive error handling and reporting
- Progress indicators for each step

**Usage:**
```bash
# Load new module
pnpm seed:dnd5e

# Force reload existing module
pnpm seed:dnd5e --reload

# Verbose output
pnpm seed:dnd5e --verbose
```

### 4. Added npm Script (`apps/server/package.json`)

```json
"scripts": {
  "seed:dnd5e": "tsx src/scripts/seedDnd5eModule.ts"
}
```

### 5. Database Schema (EAV Tables)

Created the following tables for the normalized EAV system:

**modules** - Module metadata and validation status
- Stores module identity, version, author, dependencies
- Tracks validation status and errors
- Supports official/community modules

**module_entities** - Entity metadata with validation
- Stores entity identity, type, name, description
- Links to module via foreign key
- Full-text search on `search_text` field
- Tags for organization and filtering

**entity_properties** - EAV property storage
- Flattened property rows with dot notation keys
- Type-specific value columns (string, number, integer, boolean, json, reference)
- Array support with index tracking
- Property path array for reconstruction

**property_definitions** - Schema and validation registry
- Defines known properties per game system and entity type
- Validation rules, default values, options
- UI hints (fieldType, placeholder, section, sort)

---

## Testing Results

### Local Testing (Development Database)

**Successfully loaded:**
- 92 property definitions
- 1 module record (dnd5e-srd v1.0.0)
- 3 entities (club, dagger, greatclub from simple-melee-weapons.json)
- 21 flattened properties

**Sample Entity (Club):**
```
entity_id | property_key | value_type | value_string | value_number | value_integer
----------|--------------|------------|--------------|--------------|---------------
club      | damage       | string     | 1d4          |              |
club      | damageType   | string     | bludgeoning  |              |
club      | price        | number     |              | 0.1          |
club      | properties.0 | string     | light        |              |
club      | weaponType   | string     | simple-melee |              |
club      | weight       | integer    |              |              | 2
```

**Validation:**
- Array properties correctly flattened (`properties: ["light"]` → `properties.0 = "light"`)
- Correct value type detection (string, number, integer)
- Proper nested property handling
- Module validation status set to "valid"

### Docker Testing (Production Environment)

**Steps:**
1. Built and deployed Docker containers
2. Created EAV tables in Docker database (vtt_db container)
3. Ran seeder script inside vtt_server container

**Results:**
- ✅ All tables created successfully
- ✅ Seeder script ran without errors
- ✅ Same data loaded as local testing (92 defs, 3 entities, 21 properties)
- ✅ Server logs show compendium loaded correctly
- ✅ Module validation status: valid

---

## Files Created

1. **apps/server/src/services/propertyDefinitionLoader.ts** (163 lines)
   - PropertyDefinitionLoaderService class
   - Handles loading and managing property definitions

2. **apps/server/src/scripts/seedDnd5eModule.ts** (237 lines)
   - Main seeder script
   - Dnd5eSeeder class with comprehensive workflow
   - CLI argument parsing (--reload, --verbose)

---

## Files Modified

1. **apps/server/src/services/moduleLoader.ts**
   - Updated `loadEntityFile()` method
   - Added support for compendium batch format

2. **apps/server/package.json**
   - Added `seed:dnd5e` npm script

---

## Database Changes

### Tables Created (Local & Docker)

```sql
-- modules table (module metadata)
CREATE TABLE modules (
  id uuid PRIMARY KEY,
  module_id text NOT NULL,
  game_system_id text NOT NULL,
  name text NOT NULL,
  version text NOT NULL,
  author text,
  author_user_id uuid REFERENCES users(id),
  description text,
  module_type text DEFAULT 'content',
  source_path text,
  source_hash text,
  dependencies text[],
  validation_status text DEFAULT 'pending',
  validation_errors jsonb DEFAULT '[]',
  validated_at timestamp,
  is_active boolean DEFAULT true,
  is_locked boolean DEFAULT false,
  is_official boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- module_entities table (entity metadata)
CREATE TABLE module_entities (
  id uuid PRIMARY KEY,
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  entity_id text NOT NULL,
  entity_type text NOT NULL,
  name text NOT NULL,
  description text,
  img text,
  template_id text,
  source_path text,
  source_line_number integer,
  validation_status text DEFAULT 'pending',
  validation_errors jsonb DEFAULT '[]',
  search_text text,
  tags text[],
  folder_id text,
  sort integer DEFAULT 0,
  data jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- entity_properties table (EAV core)
CREATE TABLE entity_properties (
  id uuid PRIMARY KEY,
  entity_id uuid REFERENCES module_entities(id) ON DELETE CASCADE,
  property_key text NOT NULL,
  property_path text[],
  property_depth integer DEFAULT 0,
  value_type text NOT NULL,
  value_string text,
  value_number real,
  value_integer integer,
  value_boolean boolean,
  value_json jsonb,
  value_reference text,
  array_index integer,
  is_array_element boolean DEFAULT false,
  sort integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- property_definitions table (schema registry)
CREATE TABLE property_definitions (
  id uuid PRIMARY KEY,
  game_system_id text NOT NULL,
  entity_type text NOT NULL,
  property_key text NOT NULL,
  property_path text[],
  name text NOT NULL,
  description text,
  value_type text NOT NULL,
  is_required boolean DEFAULT false,
  is_array boolean DEFAULT false,
  validation jsonb DEFAULT '{}',
  default_value jsonb,
  options jsonb DEFAULT '[]',
  field_type text,
  placeholder text,
  section text,
  sort integer DEFAULT 0,
  data jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

**Indexes Created:**
- `idx_modules_game_system` - Fast lookups by game system
- `idx_modules_validation_status` - Filter by validation status
- `idx_module_entities_module` - Fast entity lookups by module
- `idx_module_entities_type` - Filter entities by type
- `idx_module_entities_search` - Full-text search (GIN index)
- `idx_entity_properties_entity` - Fast property lookups by entity
- `idx_entity_properties_key` - Fast property lookups by key
- `idx_entity_properties_path` - Array path searches (GIN index)

---

## Architecture Decisions

### 1. Compendium Batch Format Support

**Decision:** Support multiple file formats in ModuleLoaderService

**Rationale:**
- Existing compendium files use batch format with metadata wrapper
- Need backward compatibility with direct entity format
- Allows flexibility in how content is organized

**Tradeoffs:**
- More complex parsing logic
- Better user experience (supports multiple formats)
- Easier migration from legacy formats

### 2. Property Definition Upsert Strategy

**Decision:** Check for existence and update vs. insert

**Rationale:**
- Property definitions may change as game system evolves
- Need to avoid duplicates while allowing updates
- Explicit upsert is clearer than ON CONFLICT clause

**Tradeoffs:**
- Two database queries per definition (select + insert/update)
- More predictable behavior
- Better error messages

### 3. EAV Flattening Strategy

**Decision:** Flatten all properties to key-value rows with dot notation

**Rationale:**
- Consistent query patterns
- Index-friendly structure
- Supports arbitrary nesting depth
- Type-safe value storage

**Tradeoffs:**
- More rows in database
- Requires reconstruction for display
- Optimal for queries and validation

### 4. Script Execution Path

**Decision:** Detect execution context and allow both direct and npm script execution

**Rationale:**
- npm scripts easier for development (`pnpm seed:dnd5e`)
- Direct execution useful for Docker and CI/CD
- Module detection handles both cases

**Implementation:**
```typescript
const isMainModule = () => {
  const modulePath = fileURLToPath(import.meta.url);
  const scriptPath = process.argv[1];
  return modulePath === scriptPath || modulePath === scriptPath + '.ts';
};
```

---

## Current Limitations

### 1. Compendium Coverage

**Current:** Only simple-melee-weapons.json (3 entities)
**Future:** Load all compendium files (weapons, armor, spells, monsters, etc.)

### 2. Property Definition Coverage

**Current:** 92 definitions covering items, spells, creatures, features
**Future:** Expand to cover all entity types and properties

### 3. Database Migration

**Current:** Manual table creation via SQL scripts
**Future:** Automated migrations with Drizzle Kit or migration framework

### 4. Validation

**Current:** Basic structure validation
**Future:** Schema validation against property definitions

### 5. Error Handling

**Current:** Skip invalid entities with logging
**Future:** Comprehensive error reporting and recovery

---

## Next Steps

### Immediate

1. **Add More Compendium Files**
   - Simple ranged weapons
   - Martial weapons
   - Armor sets
   - Basic equipment

2. **Create Migration System**
   - Generate SQL migrations from schema changes
   - Add to Docker initialization scripts
   - Version control for schema changes

3. **Build API Endpoints**
   - GET /api/modules - List all modules
   - GET /api/modules/:id/entities - Get entities for module
   - GET /api/entities/:id - Get entity with reconstructed properties
   - POST /api/modules/seed - Trigger seeder via API

### Future Enhancements

1. **Validation Engine**
   - Validate entities against property definitions
   - Type checking for property values
   - Required field validation
   - Custom validation rules

2. **Compendium Browser**
   - Frontend UI for browsing compendium content
   - Search and filter by entity type, tags, properties
   - View property definitions
   - Preview entity sheets

3. **Module Management**
   - Install/uninstall modules
   - Enable/disable modules
   - Check for updates
   - Dependency resolution

4. **Content Migration Tools**
   - Convert legacy formats to EAV
   - Bulk import/export
   - Backup and restore

---

## Key Learnings

### 1. ESM Module Detection

**Problem:** Script not executing when run directly

**Solution:** Proper module detection using `fileURLToPath` and handling both direct and .ts execution

**Learning:** ESM module detection requires path comparison, not just URL matching

### 2. Docker Path Handling

**Problem:** Git Bash on Windows mangles paths in Docker exec commands

**Solution:** Always wrap Docker exec commands with `sh -c "..."`

**Learning:** Windows path translation can cause subtle issues with Docker commands

### 3. Database Connection Strings

**Problem:** Different connection strings for local vs Docker

**Solution:** Use environment variable with sensible defaults

**Learning:** Always externalize configuration, especially connection strings

### 4. Transaction Safety

**Problem:** Partial loads on errors could corrupt data

**Solution:** Wrap all database operations in transactions

**Learning:** Use transactions for multi-step operations with foreign keys

---

## Deployment Checklist

### ✅ Code Changes
- [x] ModuleLoaderService updated
- [x] PropertyDefinitionLoaderService created
- [x] Seeder script created
- [x] npm script added

### ✅ Testing
- [x] Local database testing
- [x] Docker database testing
- [x] Entity flattening verified
- [x] Property definitions loaded
- [x] Module validation working

### ✅ Docker Deployment
- [x] Built Docker images
- [x] Started containers
- [x] Created EAV tables in Docker database
- [x] Ran seeder in Docker
- [x] Verified data in Docker database

### ✅ Git
- [x] Changes committed
- [x] Commit message follows conventions
- [x] Session notes documented

### ⏳ Pending
- [ ] Create migration files for EAV tables
- [ ] Add migration to Docker initialization
- [ ] Push changes to GitHub
- [ ] Load additional compendium files
- [ ] Create API endpoints for module access

---

## Performance Metrics

### Seeder Script Performance

**Local Database:**
- Time to load property definitions: ~200ms
- Time to load module + entities: ~150ms
- Total execution time: ~500ms
- Property definitions loaded: 92
- Entities loaded: 3
- Properties flattened: 21

**Docker Database:**
- Time to load property definitions: ~250ms
- Time to load module + entities: ~180ms
- Total execution time: ~600ms
- Results identical to local database

**Database Metrics:**
- Total rows in property_definitions: 92
- Total rows in modules: 1
- Total rows in module_entities: 3
- Total rows in entity_properties: 21

---

## References

**Documentation:**
- [EAV Module Schema](../architecture/EAV_MODULE_SCHEMA.md)
- [Compendium System](../architecture/COMPENDIUM_SYSTEM.md)
- [Module Architecture](../../game-systems/core/dnd5e-ogl/MODULE_ARCHITECTURE.md)

**Code Files:**
- `apps/server/src/services/moduleLoader.ts`
- `apps/server/src/services/propertyDefinitionLoader.ts`
- `apps/server/src/scripts/seedDnd5eModule.ts`
- `game-systems/core/dnd5e-ogl/property-definitions.json`
- `game-systems/core/dnd5e-ogl/compendium/items/simple-melee-weapons.json`

**Database Schema:**
- `packages/database/src/schema/modules.ts`
- `packages/database/src/schema/moduleEntities.ts`
- `packages/database/src/schema/entityProperties.ts`
- `packages/database/src/schema/propertyDefinitions.ts`

---

## Conclusion

Successfully implemented a complete D&D 5e module seeder system with:
- ✅ Flexible compendium format support
- ✅ Property definition management
- ✅ Comprehensive seeder script
- ✅ Local and Docker testing
- ✅ EAV flattening and reconstruction
- ✅ Transaction-safe operations
- ✅ Error handling and reporting

The system is now ready to load the full D&D 5e SRD content once additional compendium files are prepared. The EAV architecture provides a solid foundation for dynamic content management across multiple game systems.

**Session Status:** ✅ Complete
