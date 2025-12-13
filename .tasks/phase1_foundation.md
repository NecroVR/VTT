# Task: Content Import System - Phase 1 Foundation (Tasks 1.1-1.4)

## Context
Implementing Phase 1 (tasks 1.1-1.4) of the Content Import System per `docs/architecture/CONTENT_IMPORT_PLAN.md`.

## Tasks to Complete

### 1.1 Create Shared TypeScript Types
**File:** `packages/shared/src/types/contentImport.ts`
- Copy ALL type definitions from CONTENT_IMPORT_PLAN.md section 1.1 (lines 149-312)
- Include:
  - ImportSourceType, ContentType, ImportStatus
  - ImportSource, ImportJob, ImportError
  - ImportRequest, RawImportItem
  - CampaignImportBinding
  - FoundryExportData and all Foundry-specific types (FoundryDocument, FoundryActor, FoundryItem, FoundryScene, FoundryJournal, FoundryRollTable, FoundryPlaylist)

### 1.1b Export Types
**File:** `packages/shared/src/types/index.ts`
- Add: `export * from './contentImport.js';`

### 1.2 Create Import Sources Schema
**File:** `packages/database/src/schema/importSources.ts`
- Follow the exact specification in CONTENT_IMPORT_PLAN.md section 1.2 (lines 317-334)
- Use drizzle-orm pg-core
- Reference users table for foreign key
- Include all columns: id, userId, sourceType, sourceName, sourceVersion, contentTypes, itemCount, metadata, importedAt, lastSyncAt, createdAt, updatedAt

### 1.3 Create Import Jobs Schema
**File:** `packages/database/src/schema/importJobs.ts`
- Follow the exact specification in CONTENT_IMPORT_PLAN.md section 1.3 (lines 338-359)
- Reference both users and importSources tables
- Include all columns: id, userId, sourceId, sourceType, status, contentType, totalItems, processedItems, failedItems, errors, rawData, startedAt, completedAt, createdAt

### 1.4 Add Source Columns to moduleEntities
**File:** `packages/database/src/schema/moduleEntities.ts`
- Add three new nullable columns:
  - `sourceType: text('source_type')`
  - `sourceId: text('source_id')`
  - `sourceUrl: text('source_url')`
- Add index for lookups: `idx_module_entities_source` on (sourceType, sourceId)

### 1.5 Export Schemas
**File:** `packages/database/src/schema/index.ts`
- Add: `export * from './importSources.js';`
- Add: `export * from './importJobs.js';`

## Important Guidelines

1. **Match Existing Patterns:**
   - Look at `packages/database/src/schema/users.ts` for schema patterns
   - Look at `packages/database/src/schema/moduleEntities.ts` for existing entity schema
   - Follow the exact import style and structure

2. **Code Style:**
   - Use `.js` extensions in imports (TypeScript convention for this project)
   - Use `drizzle-orm/pg-core` for schema definitions
   - Use `defaultRandom()` for UUID primary keys
   - Use `defaultNow()` for timestamp defaults
   - Use `.notNull()` where appropriate, leave optional fields without it

3. **Validation:**
   - Ensure all TypeScript compiles without errors
   - All types should be properly exported
   - Schema references should match existing table names

## Reference Files

- Plan: `docs/architecture/CONTENT_IMPORT_PLAN.md`
- Existing schema example: `packages/database/src/schema/users.ts`
- Existing schema example: `packages/database/src/schema/moduleEntities.ts`
- Type index: `packages/shared/src/types/index.ts`
- Schema index: `packages/database/src/schema/index.ts`

## Success Criteria

- [ ] contentImport.ts created with all types from plan
- [ ] Types exported from shared/types/index.ts
- [ ] importSources.ts schema created and matches specification
- [ ] importJobs.ts schema created and matches specification
- [ ] moduleEntities.ts updated with source columns and index
- [ ] Schemas exported from database/schema/index.ts
- [ ] All TypeScript compiles without errors (run `pnpm build` in packages/shared and packages/database)
- [ ] No linting errors

## Deliverables

Report back with:
1. List of files created/modified
2. Confirmation that TypeScript compiles
3. Any issues encountered or deviations from the plan
