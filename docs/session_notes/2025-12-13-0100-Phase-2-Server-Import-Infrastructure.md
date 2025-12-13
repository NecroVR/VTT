# Session Notes: Phase 2 Server Import Infrastructure

**Date:** 2025-12-13
**Session ID:** 0100
**Status:** COMPLETE
**Related Plan:** docs/architecture/CONTENT_IMPORT_PLAN.md (Phase 2)

---

## Session Summary

Successfully implemented Phase 2 of the Content Import System - Server Import Infrastructure. This provides the foundation for importing content from Foundry VTT and D&D Beyond into the VTT.

---

## Implementation Overview

### What Was Built

#### 1. Base Import Service (`apps/server/src/services/importService.ts`)
- **ContentParser interface** - Defines contract for source-specific parsers
- **ParsedEntity type** - Standard format for parsed content
- **ImportService class** with:
  - Parser registration system (registerParser, getParser)
  - Import job creation and async processing
  - Import source management (create, update, list, delete)
  - Module entity creation with EAV property flattening
  - Job status tracking and error handling
- **EAV Property Flattening** - Reused pattern from moduleLoader.ts to store nested data
- **Module Integration** - Auto-creates user-specific import modules (e.g., "import-foundryvtt-{userId}")

#### 2. Image Import Service (`apps/server/src/services/imageImportService.ts`)
- **URL-based imports** - Download images from D&D Beyond CDN
- **File-based imports** - Process uploaded image files from Foundry exports
- **Image processing** with Sharp:
  - Resize (max 512x512, preserving aspect ratio)
  - Format conversion to WebP
  - Quality optimization (85%)
- **Batch imports** - Rate-limited parallel processing (max 5 concurrent, using p-limit)
- **Storage** - Saves to `uploads/imports/` directory
- **Cleanup** - Methods to delete imported images

#### 3. Import API Routes (`apps/server/src/routes/api/v1/import.ts`)
All routes require authentication via Bearer token.

- **POST /api/v1/import** - Start new import job (JSON body)
  - Validates request with zod schema
  - Creates import job and starts async processing
  - Returns job ID immediately

- **POST /api/v1/import/upload** - Upload Foundry JSON/ZIP file
  - Accepts JSON or ZIP files (50MB limit)
  - Parses and previews Foundry export structure
  - Returns content summary (counts of actors, items, scenes, etc.)
  - Note: ZIP support stubbed for future implementation

- **GET /api/v1/import/jobs** - List user's import jobs
  - Optional filters: sourceType, limit
  - Ordered by most recent first

- **GET /api/v1/import/jobs/:jobId** - Get specific job status
  - Returns progress, errors, completion status

- **GET /api/v1/import/sources** - List user's import sources
  - Shows all sources user has imported from
  - Optional filter by sourceType

- **DELETE /api/v1/import/sources/:sourceId** - Delete source and entities
  - Cascades to delete all entities from that source

#### 4. Route Registration
- Added import routes to API v1 router
- Updated endpoint listing in API index

---

## Technical Details

### Dependencies Added
- **multer** - File upload handling (Note: Actually using @fastify/multipart already installed)
- **p-limit** - Concurrent request rate limiting
- **sharp** - Already installed, used for image processing
- **adm-zip** - ZIP file extraction (for future use)

### Database Integration
- Services accept `db: Database` parameter (Drizzle ORM)
- Routes access db via `fastify.db` decorator
- Uses existing schema:
  - `importSources` - Tracks import sources per user
  - `importJobs` - Tracks import job progress
  - `moduleEntities` - Stores imported content with sourceType/sourceId
  - `entityProperties` - EAV storage for nested data

### Module System Integration
- Import service creates user-specific modules per source type
- Module ID format: `import-{sourceType}-{userId}`
- Examples: `import-foundryvtt-abc123`, `import-dndbeyond-xyz789`
- Entities stored using existing EAV pattern from moduleLoader
- Property flattening handles nested objects and arrays

### Parser System Architecture
- Parsers registered per `sourceType:contentType` combination
- Example: `foundryvtt:actor`, `dndbeyond:spell`
- Parsers transform source data to ParsedEntity format
- No parsers implemented yet (coming in Phases 3 & 6)

### Async Job Processing
- Jobs created immediately, return job ID
- Processing happens asynchronously in background
- Status updates written to database during processing
- Progress tracking: totalItems, processedItems, failedItems
- Error collection: Array of {itemName, error} objects

### WebSocket Support (Stubbed)
- `emitProgress` method logs to console for now
- Ready for WebSocket integration in future phase
- Will enable real-time progress updates in UI

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `apps/server/src/services/importService.ts` | 530 | Core import service with parser system |
| `apps/server/src/services/imageImportService.ts` | 135 | Image download and processing |
| `apps/server/src/routes/api/v1/import.ts` | 283 | Import API endpoints |

## Files Modified

| File | Changes |
|------|---------|
| `apps/server/src/routes/api/v1/index.ts` | Added import route registration |
| `apps/server/package.json` | Added multer, p-limit, adm-zip, @types/multer |
| `docs/architecture/CONTENT_IMPORT_PLAN.md` | Marked Phase 2 tasks complete |

---

## Testing & Verification

### TypeScript Compilation
```bash
pnpm --filter @vtt/server run build
```
✅ **Result:** Clean build, no TypeScript errors

### Docker Deployment
```bash
docker-compose up -d --build
```
✅ **Result:** Containers built and started successfully

### Server Startup
```bash
docker-compose logs server
```
✅ **Result:** Server listening on port 3000, no errors

---

## Key Design Decisions

### 1. EAV Property Storage
**Decision:** Reused existing EAV pattern from moduleLoader.ts
**Rationale:**
- Consistent with existing module system
- Handles arbitrary nested structures
- Enables property-level queries
- Already proven and tested

### 2. Async Job Processing
**Decision:** Process imports asynchronously after creating job record
**Rationale:**
- Immediate response to client (better UX)
- Handles long-running imports
- Enables progress tracking
- Prevents request timeouts

### 3. User-Specific Import Modules
**Decision:** Create one module per user per source type
**Rationale:**
- Isolates user's imported content
- Integrates with existing module permissions
- Simplifies module management
- Avoids module proliferation

### 4. File Upload Approach
**Decision:** Use @fastify/multipart (already installed) instead of multer
**Rationale:**
- Already integrated with Fastify
- Consistent with existing assets route
- Simpler integration
- Spec originally said multer but we adapted

### 5. Image Processing
**Decision:** Process all images to WebP format at 512x512 max
**Rationale:**
- Consistent format across sources
- Smaller file sizes
- Faster loading in browser
- WebP has excellent quality/size ratio

---

## Integration Points

### With Existing Systems
1. **Module System** - Import entities are stored as module entities
2. **Authentication** - All routes use existing auth middleware
3. **Database** - Uses existing Drizzle ORM connection
4. **EAV Storage** - Uses existing property flattening logic

### Future Integration Needed
1. **Foundry Parser** (Phase 3) - Register parsers for Foundry content types
2. **DDB Parser** (Phase 6) - Register parsers for D&D Beyond content types
3. **WebSocket** - Connect emitProgress to WebSocket broadcast
4. **Campaign Binding** (Phase 8) - Restrict imported content to campaigns

---

## Known Limitations & TODOs

### Current Limitations
1. **No parsers registered** - Service infrastructure ready but no parsers yet
2. **ZIP support stubbed** - File upload only handles JSON currently
3. **WebSocket stubbed** - Progress updates log to console only
4. **No unit tests** - Deferred to Phase 9 (Testing & Documentation)
5. **No image deduplication** - Could optimize storage with content hashing

### Planned Enhancements
1. **ZIP file extraction** - Extract and process Foundry ZIP exports
2. **Image deduplication** - Hash-based storage to avoid duplicates
3. **Orphan cleanup** - Delete images not referenced by entities
4. **Progress events** - Real-time WebSocket progress notifications
5. **Resumable imports** - Resume failed imports from checkpoint

---

## Next Steps

### Immediate Next Phase: Phase 3 - Foundry VTT Parser
1. Create Foundry actor parser (characters, NPCs, monsters)
2. Create Foundry item parser (items, spells, equipment)
3. Create Foundry scene parser (battle maps)
4. Create Foundry journal parser (notes, handouts)
5. Register parsers with import service
6. Write unit tests with sample Foundry exports

### Dependencies Satisfied
Phase 2 completion unblocks:
- ✅ Phase 3 (Foundry VTT Parser) - can now register parsers
- ✅ Phase 4 (Foundry Import UI) - API endpoints ready
- ✅ Phase 6 (D&D Beyond Parsers) - parser system ready

---

## Commit Strategy

Phase 2 is complete and ready to commit. Recommended commit message:

```
feat(import): Implement Phase 2 server import infrastructure

- Add base import service with parser registration system
- Implement image import service with Sharp processing
- Create import API routes for job management
- Add support for Foundry JSON file uploads
- Integrate with existing module and EAV systems

Supports both Foundry VTT and D&D Beyond import flows.
Parser implementations coming in Phases 3 and 6.

Related: docs/architecture/CONTENT_IMPORT_PLAN.md Phase 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Session Completion

✅ All Phase 2 tasks completed
✅ TypeScript compiles without errors
✅ Docker deployment successful
✅ Server starts and runs correctly
✅ Documentation updated
✅ Ready to proceed to Phase 3

---

**End of Session Notes**
