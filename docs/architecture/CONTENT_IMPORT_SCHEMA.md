# Content Import Schema Architecture

## Overview

The Content Import System provides a comprehensive framework for importing game content from multiple sources (Foundry VTT, D&D Beyond, manual uploads) into the VTT platform. The system tracks import sources, manages asynchronous import jobs, and maintains relationships between imported content and their source systems.

### Key Features

- **Multi-source support**: Foundry VTT, D&D Beyond, manual imports
- **Async job processing**: Track long-running imports with progress updates
- **Content type flexibility**: Support for actors, items, spells, scenes, journals, and more
- **Error tracking**: Detailed error logging for failed imports
- **Source attribution**: Link imported content back to their origin
- **Campaign binding**: Associate import sources with specific campaigns

## Design Principles

1. **Traceability**: Track all imported content back to its source
2. **Flexibility**: Support multiple import sources with extensible architecture
3. **Async-first**: Non-blocking import jobs with progress tracking
4. **Error resilience**: Graceful handling of partial failures
5. **Metadata preservation**: Maintain source information for potential re-imports or updates

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        IMPORT SYSTEM ERD                         │
└─────────────────────────────────────────────────────────────────┘

    ┌────────────────┐
    │     users      │
    └────────────────┘
           │
           │ owns (user_id)
           ├──────────────┬──────────────┐
           │              │              │
           ▼              ▼              ▼
    ┌─────────────┐  ┌────────────┐  ┌──────────────┐
    │import_      │  │import_     │  │module_       │
    │sources      │  │jobs        │  │entities      │
    └─────────────┘  └────────────┘  └──────────────┘
           │              │
           │ (optional)   │
           └──────────────┘
           source_id references

    Import Source contains:
    - Source metadata (type, name, version)
    - Content inventory (types, count)
    - Import history (importedAt, lastSyncAt)

    Import Job tracks:
    - Processing status and progress
    - Content type and batch info
    - Error tracking per item
    - Raw data storage for debugging

    Module Entity links:
    - Source attribution (sourceType, sourceId)
    - Original URL if applicable
    - Validation status post-import
```

### Table Schemas

#### `import_sources` Table

Tracks import sources and their metadata.

```sql
CREATE TABLE import_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,           -- 'foundryvtt', 'dndbeyond', 'manual'
  source_name TEXT NOT NULL,           -- e.g., "My Foundry World", "SRD 5.1"
  source_version TEXT,                 -- Foundry world version, D&D Beyond edition
  content_types JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ContentType
  item_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,  -- Source-specific metadata
  imported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMP,              -- NULL until first sync
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Column Descriptions:**

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | Primary Key | Unique identifier for the import source |
| `user_id` | UUID | FK → users.id | GM/user who owns this import |
| `source_type` | TEXT | NOT NULL | Type of source: `'foundryvtt'`, `'dndbeyond'`, `'manual'` |
| `source_name` | TEXT | NOT NULL | Human-readable name of the source |
| `source_version` | TEXT | Nullable | Version info (e.g., Foundry world version) |
| `content_types` | JSONB | Array | List of ContentType values present in this source |
| `item_count` | INTEGER | NOT NULL, ≥ 0 | Total items imported from this source |
| `metadata` | JSONB | Object | Source-specific metadata (flexible structure) |
| `imported_at` | TIMESTAMP | NOT NULL | When this source was first imported |
| `last_sync_at` | TIMESTAMP | Nullable | Last successful sync/re-import time |
| `created_at` | TIMESTAMP | NOT NULL | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Record last modification timestamp |

**Example Record:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660f9401-f30c-42e5-b727-557766551111",
  "sourceType": "foundryvtt",
  "sourceName": "Dragon of Icespire Peak",
  "sourceVersion": "11.304",
  "contentTypes": ["actor", "item", "spell", "scene"],
  "itemCount": 2847,
  "metadata": {
    "worldId": "dragon-icespire-peak-v2",
    "system": "dnd5e",
    "systemVersion": "3.4.2",
    "lastFoundryVersion": "12.331"
  },
  "importedAt": "2025-12-01T14:30:00Z",
  "lastSyncAt": "2025-12-12T09:15:00Z",
  "createdAt": "2025-12-01T14:30:00Z",
  "updatedAt": "2025-12-12T09:15:00Z"
}
```

#### `import_jobs` Table

Tracks individual import job executions and their progress.

```sql
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES import_sources(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,           -- Denormalized for queries
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'partial'
  content_type TEXT NOT NULL,          -- Specific content type being imported
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,    -- Array of ImportError objects
  raw_data JSONB,                      -- Original data for debugging
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,              -- NULL until job completes
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Column Descriptions:**

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | UUID | Primary Key | Unique identifier for the import job |
| `user_id` | UUID | FK → users.id | User executing the import |
| `source_id` | UUID | FK → import_sources.id | Reference to source (nullable for manual imports) |
| `source_type` | TEXT | NOT NULL | Type of source (denormalized for queries) |
| `status` | TEXT | NOT NULL | Job status: `'pending'`, `'processing'`, `'completed'`, `'failed'`, `'partial'` |
| `content_type` | TEXT | NOT NULL | Type of content being imported (e.g., `'spell'`, `'actor'`) |
| `total_items` | INTEGER | NOT NULL, ≥ 0 | Expected total items to process |
| `processed_items` | INTEGER | NOT NULL, ≥ 0 | Items successfully processed |
| `failed_items` | INTEGER | NOT NULL, ≥ 0 | Items that failed to import |
| `errors` | JSONB | Array | Array of error objects with details |
| `raw_data` | JSONB | Nullable | Original source data (useful for debugging) |
| `started_at` | TIMESTAMP | NOT NULL | When the import job started |
| `completed_at` | TIMESTAMP | Nullable | When the import completed or failed |
| `created_at` | TIMESTAMP | NOT NULL | Record creation timestamp |

**Example Record:**

```json
{
  "id": "660f9401-f30c-42e5-b727-557766551111",
  "userId": "660f9401-f30c-42e5-b727-557766551111",
  "sourceId": "550e8400-e29b-41d4-a716-446655440000",
  "sourceType": "foundryvtt",
  "status": "partial",
  "contentType": "actor",
  "totalItems": 47,
  "processedItems": 45,
  "failedItems": 2,
  "errors": [
    {
      "itemName": "Corrupted Minion",
      "itemId": "abc-123",
      "error": "Invalid ability scores",
      "details": "STR value exceeds maximum: 35"
    },
    {
      "itemName": "Missing HP Monster",
      "itemId": "def-456",
      "error": "Required field missing",
      "details": "hp field not found in source data"
    }
  ],
  "rawData": null,
  "startedAt": "2025-12-12T09:00:00Z",
  "completedAt": "2025-12-12T09:15:00Z",
  "createdAt": "2025-12-12T09:00:00Z"
}
```

#### `module_entities` Table Extensions

The `module_entities` table includes columns to track import source information.

```sql
ALTER TABLE module_entities ADD COLUMN (
  source_type TEXT,                    -- 'foundryvtt', 'dndbeyond', etc.
  source_id TEXT,                      -- ID from source system
  source_url TEXT                      -- Original URL if applicable
);

CREATE INDEX idx_module_entities_source ON module_entities(source_type, source_id);
```

**Import-Related Columns:**

| Column | Type | Purpose |
|--------|------|---------|
| `source_type` | TEXT | Type of original source system |
| `source_id` | TEXT | Identifier in the source system |
| `source_url` | TEXT | Original URL/location in source (D&D Beyond, etc.) |

**Example Record Extension:**

```json
{
  "id": "770g0502-g31d-53f6-c828-668877662222",
  "moduleId": "...",
  "entityId": "longsword-001",
  "entityType": "item",
  "name": "Longsword",
  "description": "A sword with a long blade...",
  "img": "icons/weapons/swords/longsword-steel.webp",
  "sourceType": "dndbeyond",
  "sourceId": "item-12345",
  "sourceUrl": "https://www.dndbeyond.com/equipment/12345-longsword",
  "validationStatus": "valid",
  "validationErrors": [],
  "createdAt": "2025-12-12T09:10:00Z",
  "updatedAt": "2025-12-12T09:10:00Z"
}
```

## TypeScript Types

### Core Type Definitions

Located in `/packages/shared/src/types/contentImport.ts`:

```typescript
// Import source types
export type ImportSourceType = 'foundryvtt' | 'dndbeyond' | 'manual';

// Supported content types
export type ContentType =
  | 'actor'       // Characters, NPCs, monsters
  | 'item'        // Items, equipment, loot
  | 'spell'
  | 'class'
  | 'subclass'
  | 'race'
  | 'subrace'
  | 'background'
  | 'feat'
  | 'scene'       // Battle maps (Foundry)
  | 'journal'     // Notes, handouts (Foundry)
  | 'rolltable'   // Random tables (Foundry)
  | 'playlist';   // Audio (Foundry)

// Job processing states
export type ImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial';    // Partial success (some items failed)

// Main import source interface
export interface ImportSource {
  id: string;
  userId: string;
  sourceType: ImportSourceType;
  sourceName: string;
  sourceVersion?: string;
  importedAt: Date;
  lastSyncAt?: Date;
  contentTypes: ContentType[];
  itemCount: number;
  metadata: Record<string, unknown>;
}

// Single import job tracking
export interface ImportJob {
  id: string;
  userId: string;
  sourceId?: string;              // Optional for manual imports
  sourceType: ImportSourceType;
  status: ImportStatus;
  contentType: ContentType;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: ImportError[];
  startedAt: Date;
  completedAt?: Date;
  rawData?: unknown;              // For debugging
}

// Error details for failed items
export interface ImportError {
  itemName: string;
  itemId?: string;
  error: string;                  // Human-readable error message
  details?: unknown;              // Additional error details
}

// API request format
export interface ImportRequest {
  sourceType: ImportSourceType;
  contentType: ContentType;
  items: RawImportItem[];
  sourceName: string;
  sourceVersion?: string;
}

// Raw item from import source
export interface RawImportItem {
  sourceId: string;               // Original system ID
  name: string;
  type: ContentType;
  data: unknown;                  // Raw source-specific data
  img?: string;                   // Image URL
  folder?: string;                // Folder/category
}

// Campaign-to-import binding
export interface CampaignImportBinding {
  campaignId: string;
  importSourceId: string;
  addedAt: Date;
  addedByUserId: string;
}
```

### Foundry-Specific Types

```typescript
// Foundry export format
export interface FoundryExportData {
  type: 'world' | 'compendium' | 'folder' | 'single';
  system?: string;                // e.g., 'dnd5e'
  systemVersion?: string;
  foundryVersion?: string;
  actors?: FoundryActor[];
  items?: FoundryItem[];
  scenes?: FoundryScene[];
  journals?: FoundryJournal[];
  tables?: FoundryRollTable[];
  playlists?: FoundryPlaylist[];
}

// Base Foundry document
export interface FoundryDocument {
  _id: string;
  name: string;
  type?: string;
  img?: string;
  folder?: string | null;
  flags?: Record<string, unknown>;
  system?: Record<string, unknown>;
}

// Specific Foundry entity types
export interface FoundryActor extends FoundryDocument {
  type: 'character' | 'npc' | 'vehicle';
  prototypeToken?: Record<string, unknown>;
  items?: FoundryItem[];
  effects?: unknown[];
}

export interface FoundryItem extends FoundryDocument {
  type: string;
  effects?: unknown[];
}

export interface FoundryScene extends FoundryDocument {
  navigation: boolean;
  width: number;
  height: number;
  background?: { src: string };
  grid?: { size: number; type: number };
  walls?: unknown[];
  lights?: unknown[];
  tokens?: unknown[];
}

export interface FoundryJournal extends FoundryDocument {
  pages?: Array<{
    _id: string;
    name: string;
    type: 'text' | 'image' | 'video';
    text?: { content: string; format: number };
    src?: string;
  }>;
}

export interface FoundryRollTable extends FoundryDocument {
  formula: string;
  results?: Array<{
    _id: string;
    text: string;
    weight: number;
    range: [number, number];
  }>;
}

export interface FoundryPlaylist extends FoundryDocument {
  sounds?: Array<{
    _id: string;
    name: string;
    path: string;
    volume: number;
  }>;
}
```

## Indexes and Performance

### Primary Indexes

```sql
-- Import Sources
CREATE INDEX idx_import_sources_user ON import_sources(user_id);
CREATE INDEX idx_import_sources_type ON import_sources(source_type);
CREATE INDEX idx_import_sources_name ON import_sources(source_name);
CREATE INDEX idx_import_sources_imported ON import_sources(imported_at DESC);

-- Import Jobs
CREATE INDEX idx_import_jobs_user ON import_jobs(user_id);
CREATE INDEX idx_import_jobs_source ON import_jobs(source_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_source_status ON import_jobs(source_id, status);
CREATE INDEX idx_import_jobs_started ON import_jobs(started_at DESC);

-- Module Entities (Import Source Tracking)
CREATE INDEX idx_module_entities_source ON module_entities(source_type, source_id);
CREATE INDEX idx_module_entities_source_type ON module_entities(source_type);
```

**Index Purposes:**

| Index | Use Case |
|-------|----------|
| `idx_import_sources_user` | Find all import sources owned by a user |
| `idx_import_sources_type` | Filter sources by type (Foundry, D&D Beyond, etc.) |
| `idx_import_sources_imported` | Sort sources chronologically |
| `idx_import_jobs_status` | Track in-progress jobs |
| `idx_import_jobs_source_status` | Find jobs for specific source with status |
| `idx_import_jobs_started` | Recent job queries |
| `idx_module_entities_source` | Link entities back to import source |

## API Query Examples

### Finding Imports by User

```sql
-- Get all import sources for a user
SELECT * FROM import_sources
WHERE user_id = $1
ORDER BY imported_at DESC;

-- Get recent import jobs
SELECT * FROM import_jobs
WHERE user_id = $1
ORDER BY started_at DESC
LIMIT 20;
```

### Tracking Import Progress

```sql
-- Get current status of an import job
SELECT
  status,
  total_items,
  processed_items,
  failed_items,
  (processed_items::float / NULLIF(total_items, 0)) * 100 as progress_pct,
  errors
FROM import_jobs
WHERE id = $1;

-- Find failed items in a job
SELECT
  jsonb_array_elements(errors) as error_detail
FROM import_jobs
WHERE id = $1
  AND failed_items > 0;
```

### Linking Entities to Sources

```sql
-- Find all entities imported from a source
SELECT
  me.*
FROM module_entities me
WHERE me.source_type = $1
  AND me.source_id = $2;

-- Get import source for an entity
SELECT
  ims.id,
  ims.source_name,
  ims.source_type,
  ims.imported_at
FROM module_entities me
JOIN import_sources ims ON (
  me.source_type = ims.source_type
  AND me.source_id = ims.id
)
WHERE me.id = $1;
```

### Import Statistics

```sql
-- Content type breakdown by source
SELECT
  source_type,
  jsonb_array_elements(content_types) as content_type,
  COUNT(*) as source_count,
  SUM(item_count) as total_items
FROM import_sources
WHERE user_id = $1
GROUP BY source_type, content_type;

-- Job completion stats
SELECT
  source_type,
  status,
  COUNT(*) as job_count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM import_jobs
WHERE user_id = $1
  AND completed_at IS NOT NULL
GROUP BY source_type, status;
```

## Common Operations

### Starting an Import Job

```typescript
// 1. Create import source (first time only)
const source = await db
  .insert(importSources)
  .values({
    userId: currentUserId,
    sourceType: 'foundryvtt',
    sourceName: 'My World',
    sourceVersion: '11.304',
    contentTypes: ['actor', 'item'],
    itemCount: 2847,
    metadata: { worldId: 'my-world' }
  })
  .returning();

// 2. Create import job
const job = await db
  .insert(importJobs)
  .values({
    userId: currentUserId,
    sourceId: source.id,
    sourceType: 'foundryvtt',
    status: 'pending',
    contentType: 'actor',
    totalItems: 100
  })
  .returning();

// 3. Start background processing (via queue)
await importQueue.add('foundry-actors', {
  jobId: job.id,
  sourceId: source.id,
  data: rawFoundryData
});
```

### Updating Import Progress

```typescript
// Update as items are processed
await db
  .update(importJobs)
  .set({
    processedItems: processed,
    failedItems: failed,
    status: failed > 0 ? 'partial' : 'processing'
  })
  .where(eq(importJobs.id, jobId));

// On completion
await db
  .update(importJobs)
  .set({
    status: finalFailed > 0 ? 'partial' : 'completed',
    completedAt: new Date()
  })
  .where(eq(importJobs.id, jobId));
```

### Recording Imported Entity

```typescript
// After successful import, link entity to source
const entity = await db
  .insert(moduleEntities)
  .values({
    moduleId: moduleId,
    entityId: generatedId,
    entityType: 'actor',
    name: sourceData.name,
    description: sourceData.description,
    img: sourceData.img,
    sourceType: 'foundryvtt',
    sourceId: sourceData._id,
    sourceUrl: null,
    validationStatus: 'valid',
    data: transformedData
  })
  .returning();
```

## Workflow Examples

### Importing Foundry VTT World

```
1. User uploads Foundry export file
   └── POST /api/v1/import/upload
       └── Validate file format (JSON)
       └── Parse FoundryExportData
       └── Create ImportSource record

2. System analyzes content
   └── Count entities by type
   └── Build list of RawImportItem
   └── Store in ImportRequest

3. Create import jobs (one per content type)
   └── POST /api/v1/import/start
       ├── Create ImportJob for actors
       ├── Create ImportJob for items
       ├── Create ImportJob for spells
       └── Queue background processing

4. Background workers process
   └── For each ImportJob:
       ├── Fetch RawImportItem list
       ├── Transform to local schema
       ├── Validate against templates
       ├── Insert into module_entities
       ├── Update progress in ImportJob
       └── Log errors

5. Frontend polls for status
   └── GET /api/v1/import/jobs/:jobId
       └── Return status, progress, errors

6. User completes import
   └── All jobs reach 'completed' or 'partial'
   └── Update ImportSource.lastSyncAt
   └── Show summary to user
```

### Re-syncing Existing Source

```
1. User clicks "Re-sync" on ImportSource
   └── POST /api/v1/import/:sourceId/sync

2. System checks for updates
   └── Call Foundry API or re-download file
   └── Identify new/modified items

3. Create new ImportJob
   └── Link to existing ImportSource
   └── Process only changed items

4. Update ImportSource
   └── Add new content types
   └── Update item count
   └── Set lastSyncAt
```

### Querying Imported Content

```
1. User opens Assets panel
   └── GET /api/v1/assets?source=foundryvtt

2. System returns entities with source info
   └── moduleEntities with sourceType='foundryvtt'
   └── Include source attribution

3. User filters by source
   └── GET /api/v1/assets?sourceId=abc-123
   └── Show only from that import

4. User searches imported content
   └── Full-text search includes source metadata
   └── Results highlight origin
```

## Error Handling

### Common Error Scenarios

```typescript
// 1. Missing required fields
{
  itemName: "Broken Item",
  itemId: "item-123",
  error: "Missing required field",
  details: {
    field: "hitPoints",
    message: "hp field required for actor"
  }
}

// 2. Type mismatch
{
  itemName: "Invalid Weapon",
  itemId: "weapon-456",
  error: "Type validation failed",
  details: {
    expected: "number",
    received: "string",
    field: "damage"
  }
}

// 3. Reference not found
{
  itemName: "Spell with Missing Class",
  itemId: "spell-789",
  error: "Referenced entity not found",
  details: {
    reference: "class",
    value: "unknown-class-id"
  }
}

// 4. Corrupt source data
{
  itemName: "Unknown",
  error: "Cannot parse source data",
  details: {
    message: "Unexpected JSON structure",
    rawData: {...}
  }
}
```

### Retry Strategy

```typescript
// Jobs can be retried with exponential backoff
async function retryImportJob(jobId: string, attempt = 1) {
  const maxRetries = 3;
  const backoff = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s

  if (attempt <= maxRetries) {
    setTimeout(() => {
      // Re-queue failed items
    }, backoff);
  } else {
    // Mark as permanently failed
    await db
      .update(importJobs)
      .set({ status: 'failed' })
      .where(eq(importJobs.id, jobId));
  }
}
```

## Future Extensions

### Planned Features

1. **Scheduled Re-imports**: Auto-sync on intervals
2. **Conflict Resolution**: Handle modified items
3. **Selective Imports**: Choose specific content types/categories
4. **Import Mappings**: Store user customizations across re-imports
5. **Content Validation**: Template-based validation during import
6. **Batch Operations**: Bulk delete, move, organize imported content
7. **Import History**: Rollback to previous import versions
8. **D&D Beyond Integration**: API-based sync instead of uploads

### Extensibility Points

- **Custom Import Sources**: Plugin architecture for new sources
- **Transformation Rules**: User-defined data transformations
- **Post-Import Hooks**: Custom logic after successful import
- **Validation Rules**: Custom validation per content type
- **Error Handlers**: Custom error recovery strategies

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Process import items in batches (500-1000)
2. **Deferred Validation**: Validate during import, not before
3. **Search Indexing**: Update search indices asynchronously
4. **Metadata Caching**: Cache import source metadata
5. **Job Queue**: Use Redis for reliable job tracking

### Scaling

```
Small installations (< 10k items):
├── Single worker process
├── No special configuration
└── Full-text search sufficient

Medium installations (10k - 100k items):
├── Background job queue (Bull/Kue)
├── Partitioned indices
├── Pagination for large result sets
└── Read replicas for analytics

Large installations (> 100k items):
├── Multiple worker pools
├── Sharded storage
├── Materialized views for statistics
└── Dedicated import infrastructure
```

## Security Considerations

### Access Control

- Only the user who imported content can view it
- GMing users can share sources with their campaign
- Source metadata is user-visible but protected

### Data Validation

```typescript
// Validate imported data against schema
const validate = (item: RawImportItem): ValidationResult => {
  const errors: string[] = [];

  // Validate required fields
  if (!item.name) errors.push('name required');
  if (!item.sourceId) errors.push('sourceId required');

  // Validate types
  if (!isValidContentType(item.type))
    errors.push('invalid content type');

  // Validate data against template
  const template = getTemplate(item.type);
  if (!template.validate(item.data))
    errors.push('data does not match template');

  return { valid: errors.length === 0, errors };
};
```

### Malicious File Handling

- Sandboxed JSON parsing
- Size limits on uploads (max 100MB)
- Rate limiting on imports (max 5 concurrent)
- Quarantine suspicious data for review

---

**Last Updated**: 2025-12-13

**Related Documentation**:
- [CONTENT_IMPORT_PLAN.md](./CONTENT_IMPORT_PLAN.md) - Implementation roadmap
- [COMPENDIUM_SYSTEM.md](./COMPENDIUM_SYSTEM.md) - Content management system
- [EAV_MODULE_SCHEMA.md](./EAV_MODULE_SCHEMA.md) - Entity storage
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - Overall database architecture
