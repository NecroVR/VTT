# Content Import System - Implementation Plan

> **Plan Version:** 2.0.0
> **Created:** 2025-12-13
> **Updated:** 2025-12-13
> **Status:** NOT STARTED
> **Target:** Personal use VTT with GM-bound content licensing

---

## Executive Summary

This plan implements a multi-source content import system for the VTT. GMs can import content from:

1. **Part A: Foundry VTT** (Simpler - File Upload)
   - Users export JSON from Foundry using built-in tools
   - Upload to VTT via web interface
   - No browser extension needed
   - Legally clear (users own their data)

2. **Part B: D&D Beyond** (Complex - Browser Extension)
   - Browser extension extracts content from D&D Beyond pages
   - DOM extraction approach (not API scraping)
   - Legal gray area but widely accepted

All imported content becomes bound to the GM's campaigns - players cannot take content to other campaigns.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTENT IMPORT SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PART A: FOUNDRY VTT IMPORT                        │   │
│  │                         (File Upload)                                │   │
│  │                                                                      │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐       │   │
│  │  │ Foundry VTT  │───▶│  JSON Export │───▶│  VTT File Upload │       │   │
│  │  │ (User's PC)  │    │  (User's PC) │    │  Interface       │       │   │
│  │  └──────────────┘    └──────────────┘    └────────┬─────────┘       │   │
│  │                                                   │                  │   │
│  │                                                   ▼                  │   │
│  │                                          ┌──────────────────┐       │   │
│  │                                          │ Foundry Parser   │       │   │
│  │                                          │ Service          │       │   │
│  │                                          └────────┬─────────┘       │   │
│  └───────────────────────────────────────────────────┼─────────────────┘   │
│                                                      │                      │
│  ┌───────────────────────────────────────────────────┼─────────────────┐   │
│  │                    PART B: D&D BEYOND IMPORT                    │   │   │
│  │                      (Browser Extension)                        │   │   │
│  │                                                                 │   │   │
│  │  ┌──────────────┐    ┌──────────────────┐                      │   │   │
│  │  │ D&D Beyond   │───▶│ Browser Extension│                      │   │   │
│  │  │ (Popup)      │    │ (DOM Extraction) │                      │   │   │
│  │  └──────────────┘    └────────┬─────────┘                      │   │   │
│  │                               │                                 │   │   │
│  │                               ▼                                 │   │   │
│  │                      ┌──────────────────┐                      │   │   │
│  │                      │ DDB Parser       │                      │   │   │
│  │                      │ Service          │──────────────────────┼───┘   │
│  └──────────────────────┴──────────────────┴──────────────────────┘       │
│                                                      │                      │
│                                                      ▼                      │
│                                          ┌──────────────────┐              │
│                                          │  Import Service  │              │
│                                          │  (Shared)        │              │
│                                          └────────┬─────────┘              │
│                                                   │                         │
│                                                   ▼                         │
│                                          ┌──────────────────┐              │
│                                          │  Module System   │              │
│                                          │  (Campaign-Bound)│              │
│                                          └──────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Plan Status Tracking

### CRITICAL: Agent Instructions for Status Updates

**Every agent MUST update this section when completing work:**

1. After completing each task, update its status from `[ ]` to `[x]`
2. Add completion date in format `(YYYY-MM-DD)`
3. If a task is blocked, add `[BLOCKED: reason]`
4. Update the Phase status when all tasks complete
5. Run `git add` and `git commit` with the status update

### Phase Status Summary

| Phase | Part | Name | Status | Progress |
|-------|------|------|--------|----------|
| 1 | Shared | Foundation & Database Schema | COMPLETE | 8/8 |
| 2 | Shared | Server Import Infrastructure | COMPLETE | 4/4 |
| 3 | A | Foundry VTT Parser | IN PROGRESS | 7/8 |
| 4 | A | Foundry Import UI | NOT STARTED | 0/7 |
| 5 | B | D&D Beyond Browser Extension | NOT STARTED | 0/12 |
| 6 | B | D&D Beyond Parsers | NOT STARTED | 0/9 |
| 7 | B | D&D Beyond Import UI | NOT STARTED | 0/7 |
| 8 | Shared | Campaign Binding & Permissions | NOT STARTED | 0/7 |
| 9 | Shared | Testing & Documentation | NOT STARTED | 0/8 |

---

# PART A: FOUNDRY VTT IMPORT

Foundry VTT import is simpler and legally clearer than D&D Beyond:
- Users explicitly own their data per Foundry's license
- Built-in JSON export functionality
- No browser extension needed
- Documented, stable data formats

---

## Phase 1: Foundation & Database Schema (Shared)

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** None
> **Used By:** Both Part A and Part B

### Objective

Establish the database schema, shared types, and foundational architecture for all content imports.

### Tasks

- [x] 1.1 Create shared TypeScript types for content import (`packages/shared/src/types/contentImport.ts`) (2025-12-13)
- [x] 1.2 Create database schema for import sources (`packages/database/src/schema/importSources.ts`) (2025-12-13)
- [x] 1.3 Create database schema for import jobs (`packages/database/src/schema/importJobs.ts`) (2025-12-13)
- [x] 1.4 Add `sourceType` and `sourceId` columns to `moduleEntities` table (2025-12-13)
- [x] 1.5 Create database migration for new tables (2025-12-13)
- [x] 1.6 Run migration and verify schema (2025-12-13)
- [x] 1.7 Document schema in `docs/architecture/CONTENT_IMPORT_SCHEMA.md` (2025-12-13)
- [x] 1.8 Commit and deploy to Docker (2025-12-13)

### Detailed Specifications

#### 1.1 Shared Types (`packages/shared/src/types/contentImport.ts`)

```typescript
// Content Import Types - Supports multiple import sources

export type ImportSourceType = 'foundryvtt' | 'dndbeyond' | 'manual';

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

export type ImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial';

export interface ImportSource {
  id: string;
  userId: string;              // GM who owns this import
  sourceType: ImportSourceType;
  sourceName: string;          // e.g., "My Foundry World", "Player's Handbook"
  sourceVersion?: string;      // Foundry world version, etc.
  importedAt: Date;
  lastSyncAt?: Date;
  contentTypes: ContentType[];
  itemCount: number;
  metadata: Record<string, unknown>;
}

export interface ImportJob {
  id: string;
  userId: string;
  sourceId?: string;
  sourceType: ImportSourceType;
  status: ImportStatus;
  contentType: ContentType;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: ImportError[];
  startedAt: Date;
  completedAt?: Date;
  rawData?: unknown;           // Original data (for debugging)
}

export interface ImportError {
  itemName: string;
  itemId?: string;
  error: string;
  details?: unknown;
}

export interface ImportRequest {
  sourceType: ImportSourceType;
  contentType: ContentType;
  items: RawImportItem[];
  sourceName: string;
  sourceVersion?: string;
}

export interface RawImportItem {
  sourceId: string;            // ID from source system
  name: string;
  type: ContentType;
  data: unknown;               // Raw source data
  img?: string;
  folder?: string;
}

// Campaign binding
export interface CampaignImportBinding {
  campaignId: string;
  importSourceId: string;
  addedAt: Date;
  addedByUserId: string;
}

// Foundry-specific types
export interface FoundryExportData {
  type: 'world' | 'compendium' | 'folder' | 'single';
  system?: string;             // e.g., 'dnd5e'
  systemVersion?: string;
  foundryVersion?: string;
  actors?: FoundryActor[];
  items?: FoundryItem[];
  scenes?: FoundryScene[];
  journals?: FoundryJournal[];
  tables?: FoundryRollTable[];
  playlists?: FoundryPlaylist[];
}

export interface FoundryDocument {
  _id: string;
  name: string;
  type?: string;
  img?: string;
  folder?: string | null;
  flags?: Record<string, unknown>;
  system?: Record<string, unknown>;  // System-specific data (dnd5e, etc.)
}

export interface FoundryActor extends FoundryDocument {
  type: 'character' | 'npc' | 'vehicle';
  prototypeToken?: Record<string, unknown>;
  items?: FoundryItem[];
  effects?: unknown[];
}

export interface FoundryItem extends FoundryDocument {
  type: string;  // 'weapon', 'spell', 'feat', 'class', etc.
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

#### 1.2 Import Sources Schema (`packages/database/src/schema/importSources.ts`)

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const importSources = pgTable('import_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').notNull(),  // 'foundryvtt', 'dndbeyond', 'manual'
  sourceName: text('source_name').notNull(),
  sourceVersion: text('source_version'),
  contentTypes: jsonb('content_types').$type<string[]>().notNull().default([]),
  itemCount: integer('item_count').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  importedAt: timestamp('imported_at').notNull().defaultNow(),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

#### 1.3 Import Jobs Schema (`packages/database/src/schema/importJobs.ts`)

```typescript
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { importSources } from './importSources';

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceId: uuid('source_id').references(() => importSources.id, { onDelete: 'set null' }),
  sourceType: text('source_type').notNull(),
  status: text('status').notNull().default('pending'),
  contentType: text('content_type').notNull(),
  totalItems: integer('total_items').notNull().default(0),
  processedItems: integer('processed_items').notNull().default(0),
  failedItems: integer('failed_items').notNull().default(0),
  errors: jsonb('errors').$type<Array<{itemName: string; error: string}>>().default([]),
  rawData: jsonb('raw_data'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

#### 1.4 Module Entities Extension

Add to existing `moduleEntities` table:
```sql
ALTER TABLE module_entities ADD COLUMN source_type TEXT;
ALTER TABLE module_entities ADD COLUMN source_id TEXT;
ALTER TABLE module_entities ADD COLUMN source_url TEXT;
CREATE INDEX idx_module_entities_source ON module_entities(source_type, source_id);
```

### Acceptance Criteria

- [x] All TypeScript types compile without errors (2025-12-13)
- [x] Database migration runs successfully (2025-12-13)
- [x] Schema matches specification (2025-12-13)
- [x] Can insert/query import_sources table (2025-12-13)
- [x] Can insert/query import_jobs table (2025-12-13)
- [x] Docker deployment successful (2025-12-13)
- [x] Documentation complete (2025-12-13)

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/shared/src/types/contentImport.ts` | CREATE |
| `packages/shared/src/types/index.ts` | MODIFY (add export) |
| `packages/database/src/schema/importSources.ts` | CREATE |
| `packages/database/src/schema/importJobs.ts` | CREATE |
| `packages/database/src/schema/moduleEntities.ts` | MODIFY |
| `packages/database/src/schema/index.ts` | MODIFY (add exports) |
| `packages/database/src/migrations/XXXX_content_import.ts` | CREATE |
| `docs/architecture/CONTENT_IMPORT_SCHEMA.md` | CREATE |

---

## Phase 2: Server Import Infrastructure (Shared)

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phase 1 complete
> **Used By:** Both Part A and Part B

### Objective

Create the server-side import service infrastructure that both Foundry and D&D Beyond imports will use.

### Tasks

- [x] 2.1 Create base import service (`apps/server/src/services/importService.ts`) (2025-12-13)
- [x] 2.2 Create image import service (`apps/server/src/services/imageImportService.ts`) (2025-12-13)
- [x] 2.3 Create import API routes (`apps/server/src/routes/api/v1/import.ts`) (2025-12-13)
- [x] 2.4 Register routes in API router (2025-12-13)
- [ ] 2.5 Add WebSocket notifications for import progress (stubbed for later)
- [ ] 2.6 Write unit tests for import service (deferred to Phase 9)

### Detailed Specifications

#### 2.1 Base Import Service (`apps/server/src/services/importService.ts`)

```typescript
import { db } from '@vtt/database';
import { importSources, importJobs, moduleEntities, entityProperties } from '@vtt/database/schema';
import { eq, and } from 'drizzle-orm';
import {
  ImportRequest,
  ImportJob,
  ImportSource,
  ImportSourceType,
  ContentType,
  ImportStatus,
  RawImportItem
} from '@vtt/shared/types/contentImport';

export interface ContentParser {
  parse(item: RawImportItem): Promise<ParsedEntity>;
}

export interface ParsedEntity {
  entityType: string;
  entityId: string;
  name: string;
  description?: string;
  img?: string;
  data: Record<string, unknown>;
  sourceId: string;
}

export class ImportService {
  private parsers: Map<string, ContentParser> = new Map();

  registerParser(sourceType: ImportSourceType, contentType: ContentType, parser: ContentParser) {
    this.parsers.set(`${sourceType}:${contentType}`, parser);
  }

  getParser(sourceType: ImportSourceType, contentType: ContentType): ContentParser | undefined {
    return this.parsers.get(`${sourceType}:${contentType}`);
  }

  /**
   * Create a new import job
   */
  async createImportJob(
    userId: string,
    request: ImportRequest
  ): Promise<ImportJob> {
    const [job] = await db.insert(importJobs).values({
      userId,
      sourceType: request.sourceType,
      status: 'pending',
      contentType: request.contentType,
      totalItems: request.items.length,
      processedItems: 0,
      failedItems: 0,
      errors: [],
      rawData: request,
    }).returning();

    // Start processing asynchronously
    this.processImportJob(job.id, userId, request).catch(err => {
      console.error(`Import job ${job.id} failed:`, err);
    });

    return this.mapJobToDTO(job);
  }

  /**
   * Process import job (runs asynchronously)
   */
  private async processImportJob(
    jobId: string,
    userId: string,
    request: ImportRequest
  ): Promise<void> {
    // Update status to processing
    await db.update(importJobs)
      .set({ status: 'processing' })
      .where(eq(importJobs.id, jobId));

    const parser = this.getParser(request.sourceType, request.contentType);
    if (!parser) {
      await this.failJob(jobId, `No parser for ${request.sourceType}:${request.contentType}`);
      return;
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors: Array<{itemName: string; error: string}> = [];

    // Create or find import source
    const source = await this.getOrCreateSource(userId, request);

    for (const item of request.items) {
      try {
        // Parse source data into VTT format
        const parsed = await parser.parse(item);

        // Create module entity
        await this.createModuleEntity(userId, source.id, request.sourceType, parsed);

        processedCount++;
      } catch (error) {
        failedCount++;
        errors.push({
          itemName: item.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Update progress
      await db.update(importJobs)
        .set({
          processedItems: processedCount,
          failedItems: failedCount,
          errors
        })
        .where(eq(importJobs.id, jobId));

      // Emit WebSocket progress event
      this.emitProgress(jobId, processedCount, request.items.length);
    }

    // Update source item count
    await db.update(importSources)
      .set({
        itemCount: processedCount,
        lastSyncAt: new Date()
      })
      .where(eq(importSources.id, source.id));

    // Mark job as completed
    const finalStatus: ImportStatus = failedCount === 0
      ? 'completed'
      : failedCount === request.items.length
        ? 'failed'
        : 'partial';

    await db.update(importJobs)
      .set({
        status: finalStatus,
        completedAt: new Date()
      })
      .where(eq(importJobs.id, jobId));
  }

  /**
   * Get or create import source record
   */
  private async getOrCreateSource(
    userId: string,
    request: ImportRequest
  ): Promise<ImportSource> {
    // Check if source already exists
    const existing = await db.query.importSources.findFirst({
      where: and(
        eq(importSources.userId, userId),
        eq(importSources.sourceType, request.sourceType),
        eq(importSources.sourceName, request.sourceName)
      )
    });

    if (existing) {
      // Update content types if new type added
      const types = new Set([...existing.contentTypes, request.contentType]);
      await db.update(importSources)
        .set({
          contentTypes: Array.from(types),
          lastSyncAt: new Date()
        })
        .where(eq(importSources.id, existing.id));
      return existing as ImportSource;
    }

    // Create new source
    const [source] = await db.insert(importSources).values({
      userId,
      sourceType: request.sourceType,
      sourceName: request.sourceName,
      sourceVersion: request.sourceVersion,
      contentTypes: [request.contentType]
    }).returning();

    return source as ImportSource;
  }

  /**
   * Create module entity from parsed data
   */
  private async createModuleEntity(
    userId: string,
    sourceId: string,
    sourceType: ImportSourceType,
    parsed: ParsedEntity
  ): Promise<void> {
    // Get or create user's import module for this source type
    const moduleId = await this.getOrCreateUserImportModule(userId, sourceType);

    // Check for existing entity (for updates)
    const existing = await db.query.moduleEntities.findFirst({
      where: and(
        eq(moduleEntities.moduleId, moduleId),
        eq(moduleEntities.sourceType, sourceType),
        eq(moduleEntities.sourceId, parsed.sourceId)
      )
    });

    if (existing) {
      // Update existing entity
      await db.update(moduleEntities)
        .set({
          name: parsed.name,
          description: parsed.description,
          img: parsed.img,
          data: parsed.data,
          updatedAt: new Date()
        })
        .where(eq(moduleEntities.id, existing.id));

      // Update properties
      await this.updateEntityProperties(existing.id, parsed.data);
    } else {
      // Create new entity
      const [entity] = await db.insert(moduleEntities).values({
        moduleId,
        entityId: parsed.entityId,
        entityType: parsed.entityType,
        name: parsed.name,
        description: parsed.description,
        img: parsed.img,
        data: parsed.data,
        sourceType,
        sourceId: parsed.sourceId,
        searchText: `${parsed.name} ${parsed.description ?? ''}`.toLowerCase()
      }).returning();

      // Create properties
      await this.createEntityProperties(entity.id, parsed.data);
    }
  }

  /**
   * Get or create user's import module for source type
   */
  private async getOrCreateUserImportModule(
    userId: string,
    sourceType: ImportSourceType
  ): Promise<string> {
    // Implementation: Create a personal import module for the user per source type
    // e.g., "user-123-foundryvtt-imports" or "user-123-dndbeyond-imports"
    return `user-${sourceType}-module-id`; // Placeholder
  }

  // Property management methods
  private async createEntityProperties(entityId: string, data: Record<string, unknown>): Promise<void> {
    // Use existing EAV flattening logic
  }

  private async updateEntityProperties(entityId: string, data: Record<string, unknown>): Promise<void> {
    await db.delete(entityProperties).where(eq(entityProperties.entityId, entityId));
    await this.createEntityProperties(entityId, data);
  }

  // Job management
  async getJobStatus(jobId: string, userId: string): Promise<ImportJob | null> {
    const job = await db.query.importJobs.findFirst({
      where: and(eq(importJobs.id, jobId), eq(importJobs.userId, userId))
    });
    return job ? this.mapJobToDTO(job) : null;
  }

  async listJobs(userId: string, sourceType?: ImportSourceType, limit = 20): Promise<ImportJob[]> {
    const conditions = [eq(importJobs.userId, userId)];
    if (sourceType) conditions.push(eq(importJobs.sourceType, sourceType));

    const jobs = await db.query.importJobs.findMany({
      where: and(...conditions),
      orderBy: (jobs, { desc }) => [desc(jobs.startedAt)],
      limit
    });
    return jobs.map(this.mapJobToDTO);
  }

  async listSources(userId: string, sourceType?: ImportSourceType): Promise<ImportSource[]> {
    const conditions = [eq(importSources.userId, userId)];
    if (sourceType) conditions.push(eq(importSources.sourceType, sourceType));

    return await db.query.importSources.findMany({
      where: and(...conditions),
      orderBy: (sources, { desc }) => [desc(sources.importedAt)]
    }) as ImportSource[];
  }

  async deleteSource(sourceId: string, userId: string): Promise<void> {
    // Delete source and associated entities
    await db.delete(importSources).where(
      and(eq(importSources.id, sourceId), eq(importSources.userId, userId))
    );
  }

  // Helpers
  private mapJobToDTO(job: any): ImportJob {
    return {
      id: job.id,
      userId: job.userId,
      sourceId: job.sourceId,
      sourceType: job.sourceType,
      status: job.status,
      contentType: job.contentType,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      failedItems: job.failedItems,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };
  }

  private async failJob(jobId: string, error: string): Promise<void> {
    await db.update(importJobs)
      .set({
        status: 'failed',
        errors: [{ itemName: 'Job', error }],
        completedAt: new Date()
      })
      .where(eq(importJobs.id, jobId));
  }

  private emitProgress(jobId: string, processed: number, total: number): void {
    // Emit WebSocket event for real-time progress
  }
}

export const importService = new ImportService();
```

#### 2.2 Import API Routes (`apps/server/src/routes/api/v1/import.ts`)

```typescript
import { Router } from 'express';
import { importService } from '../../../services/importService';
import { requireAuth } from '../../../middleware/auth';
import { z } from 'zod';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Validation schemas
const importRequestSchema = z.object({
  sourceType: z.enum(['foundryvtt', 'dndbeyond', 'manual']),
  contentType: z.enum(['actor', 'item', 'spell', 'class', 'race', 'background', 'feat', 'scene', 'journal']),
  items: z.array(z.object({
    sourceId: z.string(),
    name: z.string(),
    type: z.string(),
    data: z.unknown(),
    img: z.string().optional(),
    folder: z.string().optional()
  })),
  sourceName: z.string(),
  sourceVersion: z.string().optional()
});

/**
 * POST /api/v1/import
 * Start a new import job (JSON body)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const request = importRequestSchema.parse(req.body);
    const job = await importService.createImportJob(req.user!.id, request);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid import request', details: error.errors });
    }
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: 'Failed to start import' });
  }
});

/**
 * POST /api/v1/import/upload
 * Upload Foundry VTT JSON file for import
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const jsonContent = req.file.buffer.toString('utf-8');
    const data = JSON.parse(jsonContent);

    // Return parsed structure for client to review before import
    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        size: req.file.size,
        preview: summarizeFoundryExport(data)
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to parse uploaded file' });
  }
});

/**
 * GET /api/v1/import/jobs
 * List user's import jobs
 */
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const sourceType = req.query.sourceType as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const jobs = await importService.listJobs(req.user!.id, sourceType as any, limit);
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list import jobs' });
  }
});

/**
 * GET /api/v1/import/jobs/:jobId
 * Get import job status
 */
router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const job = await importService.getJobStatus(req.params.jobId, req.user!.id);
    if (!job) return res.status(404).json({ success: false, error: 'Import job not found' });
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get import job' });
  }
});

/**
 * GET /api/v1/import/sources
 * List user's import sources
 */
router.get('/sources', requireAuth, async (req, res) => {
  try {
    const sourceType = req.query.sourceType as string | undefined;
    const sources = await importService.listSources(req.user!.id, sourceType as any);
    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list import sources' });
  }
});

/**
 * DELETE /api/v1/import/sources/:sourceId
 * Delete an import source and its entities
 */
router.delete('/sources/:sourceId', requireAuth, async (req, res) => {
  try {
    await importService.deleteSource(req.params.sourceId, req.user!.id);
    res.json({ success: true, message: 'Import source deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete import source' });
  }
});

// Helper function to summarize Foundry export
function summarizeFoundryExport(data: any) {
  return {
    system: data.system,
    systemVersion: data.systemVersion,
    foundryVersion: data.foundryVersion,
    counts: {
      actors: data.actors?.length ?? 0,
      items: data.items?.length ?? 0,
      scenes: data.scenes?.length ?? 0,
      journals: data.journals?.length ?? 0,
      tables: data.tables?.length ?? 0,
      playlists: data.playlists?.length ?? 0
    }
  };
}

export default router;
```

### Acceptance Criteria

- [ ] Import service handles multiple source types
- [ ] File upload endpoint works for JSON files up to 50MB
- [ ] Import jobs are created and tracked correctly
- [ ] Progress updates work via WebSocket
- [ ] Sources are tracked per user
- [ ] All endpoints require authentication
- [ ] Unit tests pass
- [ ] Docker deployment successful

### Files to Create/Modify

| File | Action |
|------|--------|
| `apps/server/src/services/importService.ts` | CREATE |
| `apps/server/src/routes/api/v1/import.ts` | CREATE |
| `apps/server/src/routes/api/v1/index.ts` | MODIFY (add route) |
| `apps/server/tests/services/importService.test.ts` | CREATE |
| `apps/server/tests/routes/import.test.ts` | CREATE |
| `docs/api/IMPORT_API.md` | CREATE |

---

## Phase 3: Foundry VTT Parser

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phase 2 complete

### Objective

Create parsers that transform Foundry VTT export data into our VTT format.

### Tasks

- [x] 3.1 Create Foundry actor parser (`apps/server/src/services/parsers/foundry/actorParser.ts`) (2025-12-13)
- [x] 3.2 Create Foundry item parser (`apps/server/src/services/parsers/foundry/itemParser.ts`) (2025-12-13)
- [x] 3.3 Create Foundry scene parser (`apps/server/src/services/parsers/foundry/sceneParser.ts`) (2025-12-13)
- [x] 3.4 Create Foundry journal parser (`apps/server/src/services/parsers/foundry/journalParser.ts`) (2025-12-13)
- [x] 3.5 Handle D&D 5e system-specific data structures (2025-12-13)
- [x] 3.6 Register parsers with import service (2025-12-13)
- [x] 3.7 Write unit tests with sample Foundry export data (2025-12-13)
- [ ] 3.8 Commit and deploy to Docker

### Detailed Specifications

#### 3.1 Foundry Actor Parser

```typescript
import { ContentParser, ParsedEntity } from '../../importService';
import { RawImportItem, FoundryActor } from '@vtt/shared/types/contentImport';

export class FoundryActorParser implements ContentParser {

  async parse(item: RawImportItem): Promise<ParsedEntity> {
    const foundry = item.data as FoundryActor;
    const system = foundry.system || {};

    // Map Foundry actor type to our entity type
    const entityType = this.mapActorType(foundry.type);

    // Transform to our schema
    const data = this.transformActorData(foundry, system);

    return {
      entityType,
      entityId: `foundry-${foundry._id}`,
      name: foundry.name,
      description: this.extractDescription(system),
      img: foundry.img,
      data,
      sourceId: foundry._id
    };
  }

  private mapActorType(foundryType: string): string {
    const typeMap: Record<string, string> = {
      'character': 'character',
      'npc': 'monster',
      'vehicle': 'vehicle'
    };
    return typeMap[foundryType] || 'character';
  }

  private transformActorData(foundry: FoundryActor, system: Record<string, any>): Record<string, unknown> {
    // Handle D&D 5e system data
    if (this.isDnd5e(system)) {
      return this.transformDnd5eActor(foundry, system);
    }

    // Generic fallback
    return {
      name: foundry.name,
      type: foundry.type,
      system: system,
      items: foundry.items?.map(i => ({
        name: i.name,
        type: i.type,
        data: i.system
      }))
    };
  }

  private isDnd5e(system: any): boolean {
    return system.abilities !== undefined || system.attributes !== undefined;
  }

  private transformDnd5eActor(foundry: FoundryActor, system: Record<string, any>): Record<string, unknown> {
    return {
      name: foundry.name,

      // Abilities
      abilities: this.transformAbilities(system.abilities),

      // Attributes
      armorClass: system.attributes?.ac?.value || 10,
      hitPoints: {
        current: system.attributes?.hp?.value || 0,
        max: system.attributes?.hp?.max || 0,
        temp: system.attributes?.hp?.temp || 0
      },
      speed: this.transformSpeed(system.attributes?.movement),

      // Details
      race: system.details?.race || '',
      background: system.details?.background || '',
      alignment: system.details?.alignment || '',
      level: system.details?.level || 1,
      xp: system.details?.xp?.value || 0,

      // Classes (for characters)
      classes: this.extractClasses(foundry.items),

      // Skills
      skills: this.transformSkills(system.skills),

      // Saving throws
      savingThrows: this.extractSavingThrows(system.abilities),

      // Proficiencies
      proficiencyBonus: system.attributes?.prof || 2,

      // Spellcasting
      spellcasting: this.transformSpellcasting(system.attributes?.spellcasting, system.spells),

      // Features and items
      features: this.extractFeatures(foundry.items),
      equipment: this.extractEquipment(foundry.items),

      // Currency
      currency: system.currency || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },

      // Biography
      biography: system.details?.biography?.value || ''
    };
  }

  private transformAbilities(abilities: any): Record<string, any> {
    if (!abilities) return {};

    const result: Record<string, any> = {};
    const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

    for (const name of abilityNames) {
      const ability = abilities[name];
      if (ability) {
        result[name] = {
          score: ability.value || 10,
          modifier: ability.mod || 0,
          saveProficient: ability.proficient || 0
        };
      }
    }

    return result;
  }

  private transformSpeed(movement: any): Record<string, number> {
    if (!movement) return { walk: 30 };

    return {
      walk: movement.walk || 0,
      fly: movement.fly || 0,
      swim: movement.swim || 0,
      climb: movement.climb || 0,
      burrow: movement.burrow || 0
    };
  }

  private transformSkills(skills: any): Record<string, any> {
    if (!skills) return {};

    const result: Record<string, any> = {};
    for (const [name, skill] of Object.entries(skills as Record<string, any>)) {
      result[name] = {
        proficient: skill.value || 0, // 0 = none, 1 = proficient, 2 = expertise
        modifier: skill.total || 0
      };
    }
    return result;
  }

  private extractSavingThrows(abilities: any): Record<string, any> {
    if (!abilities) return {};

    const result: Record<string, any> = {};
    for (const [name, ability] of Object.entries(abilities as Record<string, any>)) {
      result[name] = {
        proficient: ability.proficient || 0,
        modifier: ability.save || ability.mod || 0
      };
    }
    return result;
  }

  private extractClasses(items?: any[]): Array<{name: string; level: number; subclass?: string}> {
    if (!items) return [];

    return items
      .filter(i => i.type === 'class')
      .map(i => ({
        name: i.name,
        level: i.system?.levels || 1,
        subclass: i.system?.subclass || undefined
      }));
  }

  private extractFeatures(items?: any[]): Array<{name: string; description: string; source: string}> {
    if (!items) return [];

    return items
      .filter(i => i.type === 'feat' || i.type === 'feature')
      .map(i => ({
        name: i.name,
        description: i.system?.description?.value || '',
        source: i.system?.source?.custom || i.system?.source?.book || ''
      }));
  }

  private extractEquipment(items?: any[]): Array<{name: string; quantity: number; equipped: boolean}> {
    if (!items) return [];

    const equipmentTypes = ['weapon', 'equipment', 'consumable', 'tool', 'loot', 'container'];

    return items
      .filter(i => equipmentTypes.includes(i.type))
      .map(i => ({
        name: i.name,
        quantity: i.system?.quantity || 1,
        equipped: i.system?.equipped || false,
        type: i.type
      }));
  }

  private transformSpellcasting(spellcasting: any, spells: any): any {
    if (!spellcasting && !spells) return undefined;

    return {
      ability: spellcasting?.ability || 'int',
      dc: spellcasting?.dc || 10,
      slots: spells || {}
    };
  }

  private extractDescription(system: any): string {
    return system.details?.biography?.value ||
           system.details?.description?.value ||
           '';
  }
}
```

#### 3.2 Foundry Item Parser

```typescript
import { ContentParser, ParsedEntity } from '../../importService';
import { RawImportItem, FoundryItem } from '@vtt/shared/types/contentImport';

export class FoundryItemParser implements ContentParser {

  async parse(item: RawImportItem): Promise<ParsedEntity> {
    const foundry = item.data as FoundryItem;
    const system = foundry.system || {};

    const entityType = this.mapItemType(foundry.type);
    const data = this.transformItemData(foundry, system);

    return {
      entityType,
      entityId: `foundry-${foundry._id}`,
      name: foundry.name,
      description: system.description?.value || '',
      img: foundry.img,
      data,
      sourceId: foundry._id
    };
  }

  private mapItemType(foundryType: string): string {
    const typeMap: Record<string, string> = {
      'weapon': 'item',
      'equipment': 'item',
      'consumable': 'item',
      'tool': 'item',
      'loot': 'item',
      'spell': 'spell',
      'feat': 'feat',
      'class': 'class',
      'subclass': 'subclass',
      'race': 'race',
      'background': 'background'
    };
    return typeMap[foundryType] || 'item';
  }

  private transformItemData(foundry: FoundryItem, system: Record<string, any>): Record<string, unknown> {
    const baseData = {
      name: foundry.name,
      foundryType: foundry.type,
      description: system.description?.value || '',
      source: system.source?.custom || system.source?.book || ''
    };

    // Add type-specific data
    switch (foundry.type) {
      case 'weapon':
        return { ...baseData, ...this.transformWeapon(system) };
      case 'equipment':
        return { ...baseData, ...this.transformEquipment(system) };
      case 'spell':
        return { ...baseData, ...this.transformSpell(system) };
      case 'feat':
        return { ...baseData, ...this.transformFeat(system) };
      case 'class':
        return { ...baseData, ...this.transformClass(system) };
      default:
        return { ...baseData, system };
    }
  }

  private transformWeapon(system: any): Record<string, unknown> {
    return {
      itemType: 'weapon',
      weaponType: system.weaponType || 'simpleM',
      damage: {
        parts: system.damage?.parts || [],
        versatile: system.damage?.versatile || ''
      },
      range: system.range || { value: 5, units: 'ft' },
      properties: system.properties || {},
      proficient: system.proficient,
      weight: system.weight || 0,
      price: system.price || { value: 0, denomination: 'gp' },
      rarity: system.rarity || 'common',
      attunement: system.attunement || 0
    };
  }

  private transformEquipment(system: any): Record<string, unknown> {
    return {
      itemType: 'equipment',
      armor: system.armor || {},
      weight: system.weight || 0,
      price: system.price || { value: 0, denomination: 'gp' },
      rarity: system.rarity || 'common',
      attunement: system.attunement || 0
    };
  }

  private transformSpell(system: any): Record<string, unknown> {
    return {
      itemType: 'spell',
      level: system.level || 0,
      school: system.school || '',
      castingTime: system.activation || {},
      range: system.range || {},
      components: system.components || {},
      duration: system.duration || {},
      concentration: system.components?.concentration || false,
      ritual: system.components?.ritual || false,
      damage: system.damage || {},
      save: system.save || {},
      materials: system.materials || {}
    };
  }

  private transformFeat(system: any): Record<string, unknown> {
    return {
      itemType: 'feat',
      requirements: system.requirements || '',
      type: system.type?.value || 'feat'
    };
  }

  private transformClass(system: any): Record<string, unknown> {
    return {
      itemType: 'class',
      hitDice: system.hitDice || 'd8',
      levels: system.levels || 1,
      spellcasting: system.spellcasting || {}
    };
  }
}
```

### Acceptance Criteria

- [ ] Actor parser handles characters and NPCs
- [ ] Item parser handles all Foundry item types
- [ ] D&D 5e system data transforms correctly
- [ ] Parsers registered with import service
- [ ] Unit tests cover various Foundry export formats
- [ ] Invalid data handled gracefully
- [ ] Docker deployment successful

### Files to Create

| File | Action |
|------|--------|
| `apps/server/src/services/parsers/foundry/actorParser.ts` | CREATE |
| `apps/server/src/services/parsers/foundry/itemParser.ts` | CREATE |
| `apps/server/src/services/parsers/foundry/sceneParser.ts` | CREATE |
| `apps/server/src/services/parsers/foundry/journalParser.ts` | CREATE |
| `apps/server/src/services/parsers/foundry/index.ts` | CREATE |
| `apps/server/tests/services/parsers/foundry/actorParser.test.ts` | CREATE |
| `apps/server/tests/fixtures/foundryActorSample.json` | CREATE |
| `apps/server/tests/fixtures/foundryItemSample.json` | CREATE |

---

## Phase 4: Foundry Import UI

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phase 3 complete

### Objective

Create the frontend UI for Foundry VTT imports with file upload and content preview.

### Tasks

- [ ] 4.1 Create import page component (`apps/web/src/components/import/FoundryImport.tsx`)
- [ ] 4.2 Create file upload component with drag-and-drop
- [ ] 4.3 Create content preview/selection interface
- [ ] 4.4 Create progress tracking component
- [ ] 4.5 Create import history view (shared with D&D Beyond)
- [ ] 4.6 Implement WebSocket progress updates
- [ ] 4.7 Commit and deploy to Docker

### Detailed Specifications

#### Import Flow

1. **Step 1: Export from Foundry**
   - Instructions for using Foundry's export feature
   - Supported export types (Easy Exports, individual, compendium)

2. **Step 2: Upload JSON**
   - Drag-and-drop file upload
   - Parse and display content summary
   - Show system compatibility (D&D 5e, etc.)

3. **Step 3: Select Content**
   - Checkbox list of actors, items, etc.
   - Filter by type
   - Preview individual items

4. **Step 4: Import Progress**
   - Progress bar with item count
   - Success/failure indicators
   - Error details for failed items

5. **Step 5: Review & Assign**
   - Summary of imported content
   - Option to bind to campaigns

### Acceptance Criteria

- [ ] File upload works via drag-and-drop and click
- [ ] JSON parsing displays content summary
- [ ] Content selection allows filtering
- [ ] Progress updates in real-time
- [ ] Import history shows past Foundry imports
- [ ] UI is responsive
- [ ] Docker deployment successful

### Files to Create

| File | Action |
|------|--------|
| `apps/web/src/components/import/FoundryImport.tsx` | CREATE |
| `apps/web/src/components/import/FileUpload.tsx` | CREATE |
| `apps/web/src/components/import/ContentPreview.tsx` | CREATE |
| `apps/web/src/components/import/ImportProgress.tsx` | CREATE (shared) |
| `apps/web/src/components/import/ImportHistory.tsx` | CREATE (shared) |
| `apps/web/src/hooks/useFoundryImport.ts` | CREATE |
| `apps/web/src/pages/import/foundry.tsx` | CREATE |

---

# PART B: D&D BEYOND IMPORT

D&D Beyond import is more complex due to:
- No public API (requires browser extension for DOM extraction)
- Legal gray area (ToS prohibits but community tools are tolerated)
- Undocumented, potentially changing data structures

---

## Phase 5: D&D Beyond Browser Extension

> **Estimated Session Time:** 1-2 sessions
> **Status:** NOT STARTED
> **Dependencies:** Phase 2 complete

### Objective

Create the Chrome/Firefox browser extension that injects into D&D Beyond pages and extracts content.

### Tasks

- [ ] 5.1 Create extension directory structure (`apps/browser-extension/`)
- [ ] 5.2 Create extension manifest v3 (`manifest.json`)
- [ ] 5.3 Create background service worker (`background.ts`)
- [ ] 5.4 Create content script for D&D Beyond injection (`content/ddb-inject.ts`)
- [ ] 5.5 Create popup UI for extension status (`popup/`)
- [ ] 5.6 Implement DOM extraction utilities (`utils/domExtractor.ts`)
- [ ] 5.7 Implement message passing to VTT (`utils/vttBridge.ts`)
- [ ] 5.8 Add extension build configuration (esbuild/webpack)
- [ ] 5.9 Test extension loading in Chrome
- [ ] 5.10 Document extension installation in `docs/guides/DDB_EXTENSION_INSTALL.md`

### Detailed Specifications

See original Phase 2 specifications from D&D Beyond plan - directory structure, manifest, background script, content scripts, and DOM extractor remain the same.

### Files to Create

| File | Action |
|------|--------|
| `apps/browser-extension/manifest.json` | CREATE |
| `apps/browser-extension/package.json` | CREATE |
| `apps/browser-extension/tsconfig.json` | CREATE |
| `apps/browser-extension/esbuild.config.js` | CREATE |
| `apps/browser-extension/src/background/index.ts` | CREATE |
| `apps/browser-extension/src/content/ddb-inject.ts` | CREATE |
| `apps/browser-extension/src/content/ddb-inject.css` | CREATE |
| `apps/browser-extension/src/popup/popup.html` | CREATE |
| `apps/browser-extension/src/popup/popup.ts` | CREATE |
| `apps/browser-extension/src/utils/domExtractor.ts` | CREATE |
| `apps/browser-extension/src/types/messages.ts` | CREATE |
| `docs/guides/DDB_EXTENSION_INSTALL.md` | CREATE |

---

## Phase 6: D&D Beyond Parsers

> **Estimated Session Time:** 1-2 sessions
> **Status:** NOT STARTED
> **Dependencies:** Phases 2, 5 complete

### Objective

Create parsers for D&D Beyond content types.

### Tasks

- [ ] 6.1 Create D&D Beyond character parser (`apps/server/src/services/parsers/ddb/characterParser.ts`)
- [ ] 6.2 Create D&D Beyond monster parser (`apps/server/src/services/parsers/ddb/monsterParser.ts`)
- [ ] 6.3 Create D&D Beyond spell parser (`apps/server/src/services/parsers/ddb/spellParser.ts`)
- [ ] 6.4 Create D&D Beyond item parser (`apps/server/src/services/parsers/ddb/itemParser.ts`)
- [ ] 6.5 Register parsers with import service
- [ ] 6.6 Handle DOM-extracted data structures
- [ ] 6.7 Write unit tests
- [ ] 6.8 Commit and deploy to Docker

### Detailed Specifications

See original Phase 4-6 specifications from D&D Beyond plan - character parser, monster parser, spell parser, item parser implementations remain the same.

### Files to Create

| File | Action |
|------|--------|
| `apps/server/src/services/parsers/ddb/characterParser.ts` | CREATE |
| `apps/server/src/services/parsers/ddb/monsterParser.ts` | CREATE |
| `apps/server/src/services/parsers/ddb/spellParser.ts` | CREATE |
| `apps/server/src/services/parsers/ddb/itemParser.ts` | CREATE |
| `apps/server/src/services/parsers/ddb/index.ts` | CREATE |
| `apps/server/tests/services/parsers/ddb/*.test.ts` | CREATE |
| `apps/server/tests/fixtures/ddb*.json` | CREATE |

---

## Phase 7: D&D Beyond Import UI

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phases 5, 6 complete

### Objective

Create the frontend UI for D&D Beyond imports with extension integration.

### Tasks

- [ ] 7.1 Create D&D Beyond import page (`apps/web/src/components/import/DDBImport.tsx`)
- [ ] 7.2 Create extension status component
- [ ] 7.3 Create popup trigger for D&D Beyond
- [ ] 7.4 Create content selection from extension data
- [ ] 7.5 Integrate with shared progress/history components
- [ ] 7.6 Add extension installation instructions
- [ ] 7.7 Commit and deploy to Docker

### Files to Create

| File | Action |
|------|--------|
| `apps/web/src/components/import/DDBImport.tsx` | CREATE |
| `apps/web/src/components/import/ExtensionStatus.tsx` | CREATE |
| `apps/web/src/hooks/useDDBImport.ts` | CREATE |
| `apps/web/src/pages/import/dndbeyond.tsx` | CREATE |

---

## Phase 8: Campaign Binding & Permissions (Shared)

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** Phases 4, 7 complete

### Objective

Implement the campaign binding system that restricts imported content to the GM's campaigns.

### Tasks

- [ ] 8.1 Create campaign-import binding schema
- [ ] 8.2 Implement binding API endpoints
- [ ] 8.3 Implement permission checks for content access
- [ ] 8.4 Add campaign content manager UI
- [ ] 8.5 Ensure players can only see bound content
- [ ] 8.6 Write integration tests
- [ ] 8.7 Commit and deploy to Docker

### Key Requirements

1. **GM-Only Import**: Only campaign GMs can import content
2. **Campaign Binding**: Imported content is bound to specific campaigns
3. **Player Access**: Players in a campaign can view bound content but not take it elsewhere
4. **No Cross-Campaign**: Content doesn't follow players to other campaigns

### Files to Create/Modify

| File | Action |
|------|--------|
| `packages/database/src/schema/campaignImportBindings.ts` | CREATE |
| `apps/server/src/routes/api/v1/campaigns.ts` | MODIFY |
| `apps/server/src/services/campaignContentService.ts` | CREATE |
| `apps/web/src/components/campaign/CampaignContent.tsx` | CREATE |
| `apps/server/tests/integration/campaignContent.test.ts` | CREATE |

---

## Phase 9: Testing & Documentation (Shared)

> **Estimated Session Time:** 1 session
> **Status:** NOT STARTED
> **Dependencies:** All previous phases complete

### Objective

Complete integration testing, end-to-end testing, and documentation.

### Tasks

- [ ] 9.1 Write end-to-end import flow tests (both Foundry and DDB)
- [ ] 9.2 Test Foundry import with real exports
- [ ] 9.3 Test D&D Beyond import with real pages
- [ ] 9.4 Performance testing for bulk imports
- [ ] 9.5 Write user documentation (`docs/guides/CONTENT_IMPORT_USER_GUIDE.md`)
- [ ] 9.6 Write developer documentation (`docs/architecture/CONTENT_IMPORT_ARCHITECTURE.md`)
- [ ] 9.7 Create troubleshooting guide
- [ ] 9.8 Final Docker deployment and verification

### Files to Create

| File | Action |
|------|--------|
| `apps/e2e/tests/foundry-import.spec.ts` | CREATE |
| `apps/e2e/tests/ddb-import.spec.ts` | CREATE |
| `docs/guides/CONTENT_IMPORT_USER_GUIDE.md` | CREATE |
| `docs/guides/FOUNDRY_IMPORT_GUIDE.md` | CREATE |
| `docs/guides/DDB_IMPORT_GUIDE.md` | CREATE |
| `docs/architecture/CONTENT_IMPORT_ARCHITECTURE.md` | CREATE |
| `docs/guides/IMPORT_TROUBLESHOOTING.md` | CREATE |
| `README.md` | MODIFY |

---

## Image Handling Requirements

### CRITICAL: Images Must Be Imported

All import flows MUST capture and store images associated with content:

- **Character/NPC portraits**
- **Monster artwork**
- **Item icons**
- **Spell icons**
- **Token images**
- **Scene backgrounds** (Foundry)
- **Journal images** (Foundry)

### Image Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMAGE IMPORT FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Source Image URL                                                           │
│  (D&D Beyond CDN or Foundry local path)                                    │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────┐                                                       │
│  │ Image Downloader │  ◄── Respects rate limits, handles auth if needed    │
│  │ Service          │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌──────────────────┐                                                       │
│  │ Image Processor  │  ◄── Resize, optimize, convert to WebP               │
│  │ (Sharp/ImageMagick)│                                                     │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐                             │
│  │ Local Storage    │ OR  │ Cloud Storage    │  (S3, etc.)                 │
│  │ /uploads/imports/│     │ /imports/        │                             │
│  └────────┬─────────┘     └────────┬─────────┘                             │
│           │                        │                                        │
│           └────────────┬───────────┘                                        │
│                        ▼                                                    │
│              ┌──────────────────┐                                           │
│              │ Entity Record    │                                           │
│              │ img: "/uploads/  │                                           │
│              │   imports/abc.webp"│                                         │
│              └──────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Foundry VTT Image Handling

**Source:** Images are typically stored as relative paths in Foundry exports:
- `img: "tokens/heroes/dwarf-fighter.webp"`
- `background: { src: "scenes/tavern.webp" }`

**Challenge:** Foundry exports JSON only - images are separate files on user's filesystem.

**Solution Options:**

1. **Option A: User uploads images separately**
   - After JSON import, show list of referenced images
   - User uploads missing images via file picker
   - System matches filenames to imported content

2. **Option B: ZIP archive upload**
   - User creates ZIP containing JSON + image files
   - System extracts and processes all files
   - Matches images to entities by path

3. **Option C: Foundry data directory access** (advanced)
   - User points to their Foundry User Data directory
   - System reads images directly from source

**Recommended:** Option B (ZIP upload) for best UX while keeping it simple.

### D&D Beyond Image Handling

**Source:** Images are served from D&D Beyond's CDN:
- Character portraits: `https://www.dndbeyond.com/avatars/...`
- Monster art: `https://www.dndbeyond.com/avatars/thumbnails/...`
- Item icons: `https://www.dndbeyond.com/content/1-0-...`

**DOM Extraction Points:**
```typescript
// Character portrait
document.querySelector('.ct-character-avatar__image')?.getAttribute('src')

// Monster image
document.querySelector('.mon-stat-block__header-image img')?.getAttribute('src')

// Spell icon
document.querySelector('.spell-icon img')?.getAttribute('src')

// Item image
document.querySelector('.item-detail__image img')?.getAttribute('src')
```

**Processing:**
1. Extension extracts image URLs from DOM
2. Server downloads images from D&D Beyond CDN
3. Images are processed (resize, optimize)
4. Stored locally with entity reference updated

### Image Service Implementation

Add to Phase 2 tasks:

```typescript
// apps/server/src/services/imageImportService.ts

export class ImageImportService {
  private readonly uploadDir = 'uploads/imports';

  /**
   * Download and store an image from URL
   */
  async importFromUrl(
    imageUrl: string,
    entityId: string,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      format?: 'webp' | 'png' | 'jpg';
    } = {}
  ): Promise<string> {
    const { maxWidth = 512, maxHeight = 512, format = 'webp' } = options;

    // Download image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'VTT-Importer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    // Process with Sharp
    const processed = await sharp(Buffer.from(buffer))
      .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
      .toFormat(format, { quality: 85 })
      .toBuffer();

    // Generate filename
    const filename = `${entityId}.${format}`;
    const filepath = path.join(this.uploadDir, filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Save file
    await fs.writeFile(filepath, processed);

    // Return URL path for database
    return `/${this.uploadDir}/${filename}`;
  }

  /**
   * Import from uploaded file (Foundry ZIP)
   */
  async importFromFile(
    file: Buffer,
    originalPath: string,
    entityId: string
  ): Promise<string> {
    // Similar processing but from local file buffer
  }

  /**
   * Handle batch image imports
   */
  async importBatch(
    images: Array<{ url: string; entityId: string }>
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // Process in parallel with rate limiting
    const limit = pLimit(5); // Max 5 concurrent downloads

    await Promise.all(
      images.map(({ url, entityId }) =>
        limit(async () => {
          try {
            const localPath = await this.importFromUrl(url, entityId);
            results.set(entityId, localPath);
          } catch (error) {
            console.error(`Failed to import image for ${entityId}:`, error);
            results.set(entityId, ''); // Empty string = failed
          }
        })
      )
    );

    return results;
  }
}
```

### Updated Phase Tasks

**Phase 2 additions:**
- [ ] 2.10 Create image import service (`apps/server/src/services/imageImportService.ts`)
- [ ] 2.11 Add Sharp dependency for image processing
- [ ] 2.12 Configure upload directory for imported images

**Phase 3 additions (Foundry):**
- [ ] 3.9 Handle image path extraction from Foundry exports
- [ ] 3.10 Implement ZIP upload with image extraction

**Phase 5 additions (D&D Beyond):**
- [ ] 5.11 Extract image URLs in DOM extractor
- [ ] 5.12 Include images in extension-to-VTT data transfer

**Phase 6 additions:**
- [ ] 6.9 Download and store images during D&D Beyond import

### Image Storage Considerations

1. **Storage Location:**
   - Development: `uploads/imports/` directory
   - Production: Consider S3/CloudFlare R2 for scalability

2. **Deduplication:**
   - Hash images before storing
   - Reuse existing images for duplicates

3. **Cleanup:**
   - When import source is deleted, clean up associated images
   - Orphan detection for images not referenced by any entity

4. **Rate Limiting:**
   - D&D Beyond: Max 5 concurrent downloads, 100ms delay between
   - Foundry: No limits needed (local files or user-uploaded)

5. **Fallback Images:**
   - Provide default images per entity type
   - Use existing game-icons.net icons as fallbacks

---

## Appendix A: Foundry VTT Data Structures

### Actor Export (D&D 5e)

```json
{
  "_id": "ABC123xyz",
  "name": "Thorin Ironforge",
  "type": "character",
  "img": "tokens/heroes/dwarf-fighter.webp",
  "system": {
    "abilities": {
      "str": { "value": 16, "proficient": 1 },
      "dex": { "value": 14, "proficient": 0 }
    },
    "attributes": {
      "ac": { "value": 18 },
      "hp": { "value": 45, "max": 45, "temp": 0 },
      "movement": { "walk": 25 }
    },
    "details": {
      "race": "Mountain Dwarf",
      "background": "Soldier",
      "level": 5
    },
    "skills": {
      "athletics": { "value": 2 },
      "perception": { "value": 1 }
    }
  },
  "items": [
    {
      "_id": "item123",
      "name": "Battleaxe",
      "type": "weapon",
      "system": { "damage": { "parts": [["1d8", "slashing"]] } }
    }
  ]
}
```

### Item Export (Spell)

```json
{
  "_id": "spell456",
  "name": "Fireball",
  "type": "spell",
  "img": "icons/magic/fire/fireball.webp",
  "system": {
    "level": 3,
    "school": "evo",
    "activation": { "type": "action", "cost": 1 },
    "range": { "value": 150, "units": "ft" },
    "components": { "verbal": true, "somatic": true, "material": true },
    "duration": { "value": null, "units": "inst" },
    "damage": { "parts": [["8d6", "fire"]] },
    "description": { "value": "<p>A bright streak flashes...</p>" }
  }
}
```

---

## Appendix B: Comparison Summary

| Feature | Foundry VTT Import | D&D Beyond Import |
|---------|-------------------|-------------------|
| **Complexity** | Low (file upload) | High (browser extension) |
| **Legal Status** | Clear (user owns data) | Gray area (ToS prohibits) |
| **Data Format** | JSON (documented) | DOM (undocumented) |
| **User Action** | Export → Upload | Install extension → Navigate |
| **Content Types** | All Foundry types | Characters, monsters, spells, items |
| **Dependencies** | Phase 1-2 | Phase 1-2, 5 |
| **Implementation Order** | First (simpler) | Second (complex) |

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-13 | 1.0.0 | Initial D&D Beyond plan | Claude |
| 2025-12-13 | 2.0.0 | Added Foundry VTT import, restructured as Part A/B | Claude |
| 2025-12-13 | 2.1.0 | Added comprehensive image handling requirements | Claude |

