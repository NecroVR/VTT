# Session Notes: Content Import Planning (Foundry VTT + D&D Beyond)

> **Session ID:** 0100
> **Date:** 2025-12-13
> **Focus:** Research and planning for multi-source content import feature

---

## Session Summary

This session focused on researching the technical and legal landscape for importing content from **both Foundry VTT and D&D Beyond** into the VTT. We analyzed the existing module architecture and created a comprehensive multi-phase implementation plan covering both import sources, with Foundry VTT as the simpler first implementation.

---

## Research Findings

### Foundry VTT Technical Landscape

**Key Finding: Open and User-Friendly**

Foundry VTT is significantly more open than D&D Beyond:
- **Explicit data ownership** - Users own their created data per license
- **Built-in JSON export** - Right-click export for actors, items, scenes, journals
- **Local storage** - All data stored as accessible JSON files
- **Public API** - Comprehensive JavaScript API, REST API modules available
- **No ToS restrictions** on third-party import/export tools

**Data Format:**
- World data: JSON files in User Data directory
- Compendiums: LevelDB (binary) but convertible to JSON via CLI
- Images: Separate files (WebP, PNG, SVG) - need ZIP upload approach

**Legal Status:**
- ✅ User-created content: Full ownership, export freely
- ✅ SRD content: CC BY 4.0, redistributable
- ⚠️ Imported DDB content: Gray area (not Foundry's concern)
- ⚠️ Purchased modules: Personal use only

### D&D Beyond Technical Landscape

**Key Finding: No Public API**
- D&D Beyond explicitly does NOT provide a public API and has stated they will not
- ToS explicitly prohibits scraping and unauthorized API access
- However, personal use tools are *tolerated* (not officially approved)

**Available Integration Methods:**

| Method | Risk Level | Precedent |
|--------|------------|-----------|
| Browser Extension (DOM reading) | Low | Beyond20 (500K+ users) |
| Proxy + User Cookies | Medium | DDB-Importer for Foundry |
| Server-side Scraping | High | IP blocking enforced |

### How Other VTTs Handle This

1. **Foundry VTT (DDB-Importer)** - Most comprehensive
   - Uses Cobalt cookie authentication via proxy
   - Full import: characters, monsters, spells, items, adventures
   - Patreon-supported with self-host option

2. **Beyond20** - Most popular, most legal
   - Browser extension reads page DOM only
   - No import - sends dice rolls to VTT in real-time
   - Completely client-side

3. **AboveVTT** - Innovative overlay
   - Overlays VTT directly on D&D Beyond website
   - No separate VTT needed

### Our VTT Architecture Analysis

The existing module system is well-suited for this:
- **EAV pattern** handles arbitrary D&D 5e properties flexibly
- **Module manifest system** can track imported content
- **Validation framework** already built
- **Compendium system** for entity collections
- Existing schemas for: items, spells, monsters, races, classes, backgrounds, feats

---

## Decisions Made

### Chosen Approach: Browser Extension + Popup Extraction

User selected this approach based on:
1. **Personal use only** - GM downloads content for their campaigns
2. **Campaign-bound content** - Players can't take content to other campaigns
3. **GMs may charge for sessions** - Adds commercial element but similar to physical books

**Implementation Flow:**
1. User installs our Chrome/Firefox extension
2. User clicks "Import from D&D Beyond" in VTT
3. Popup opens to dndbeyond.com (user's existing session)
4. Extension injects import buttons on D&D Beyond pages
5. User selects content → clicks "Import to VTT"
6. Extension extracts DOM data → sends to our server
7. Server transforms & stores as campaign-bound module
8. Popup closes - no longer needed
9. Content available in campaign compendium

**Benefits:**
- No cookie extraction needed (uses user's existing login)
- No API calls to D&D Beyond servers (DOM extraction only)
- One-time import, no persistent connection
- Content bound to GM's campaigns
- Legally similar to Beyond20

---

## Implementation Plan Created

A comprehensive 9-phase implementation plan was created at:
`docs/architecture/CONTENT_IMPORT_PLAN.md`

### Phase Summary

| Phase | Part | Name | Scope |
|-------|------|------|-------|
| 1 | Shared | Foundation & Database Schema | Types, schema, migrations |
| 2 | Shared | Server Import Infrastructure | API endpoints, import service, image handling |
| 3 | A | Foundry VTT Parser | Actor, item, scene, journal parsers |
| 4 | A | Foundry Import UI | File upload, content preview, progress |
| 5 | B | D&D Beyond Browser Extension | Chrome/Firefox extension, DOM extraction |
| 6 | B | D&D Beyond Parsers | Character, monster, spell, item parsers |
| 7 | B | D&D Beyond Import UI | Extension integration, progress |
| 8 | Shared | Campaign Binding & Permissions | Access control, binding system |
| 9 | Shared | Testing & Documentation | E2E tests, user guides |

### Implementation Order

**Part A (Foundry VTT)** should be implemented first because:
- Simpler (file upload, no browser extension)
- Legally clear (users own their data)
- Documented, stable data formats
- Provides immediate value for migrating GMs

**Part B (D&D Beyond)** comes second because:
- More complex (requires browser extension)
- Legal gray area
- Undocumented, potentially changing DOM structure

### Key Design Decisions in Plan

1. **Status Tracking**: Agents must update plan status after each task
2. **Self-Contained Phases**: Each phase can be completed in one session
3. **Explicit Acceptance Criteria**: Clear definition of "done" for each task
4. **Sample Code**: Detailed implementation specifications included
5. **File Manifests**: Every phase lists files to create/modify
6. **Image Handling**: Comprehensive image import for all content types

### Image Handling (Added per User Request)

The plan includes explicit image import requirements:
- **Foundry**: ZIP upload containing JSON + image files
- **D&D Beyond**: CDN download of character portraits, monster art, spell/item icons
- **Processing**: Sharp for resize, optimize, convert to WebP
- **Storage**: Local uploads directory (S3 for production)
- **Rate Limiting**: Max 5 concurrent downloads for D&D Beyond
- **Fallbacks**: Use game-icons.net icons when images unavailable

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `docs/architecture/CONTENT_IMPORT_PLAN.md` | Comprehensive implementation plan (v2.1) |
| `docs/session_notes/2025-12-13-0100-DDB-Import-Planning.md` | This session note |
| `docs/architecture/DND_BEYOND_IMPORT_PLAN.md` | DELETED (superseded by CONTENT_IMPORT_PLAN.md) |

---

## Technical Details for Future Sessions

### Database Schema (Phase 1)

New tables needed:
- `import_sources` - Tracks where content was imported from
- `import_jobs` - Tracks individual import operations
- Add `source_type`, `source_id`, `source_url` to `module_entities`

### Browser Extension Structure (Phase 2)

```
apps/browser-extension/
├── manifest.json (Manifest V3)
├── src/
│   ├── background/index.ts
│   ├── content/ddb-inject.ts
│   ├── popup/
│   └── utils/domExtractor.ts
```

### Key API Endpoints (Phase 3)

- `POST /api/v1/ddb-import` - Start import job
- `GET /api/v1/ddb-import/jobs` - List jobs
- `GET /api/v1/ddb-import/jobs/:id` - Get job status
- `GET /api/v1/ddb-import/sources` - List sources
- `DELETE /api/v1/ddb-import/sources/:id` - Delete source

---

## Pending User Actions

None - plan is ready for implementation.

---

## Next Steps

1. **Begin Phase 1**: Create database schema and types
   - Start with `packages/shared/src/types/ddbImport.ts`
   - Create database schemas
   - Run migration

2. **Parallel Work Possible**:
   - Phase 2 (extension) can start after Phase 1
   - Phase 3 (API) can start after Phase 1
   - Phases 4-6 (parsers) can run in parallel after Phase 3

---

## Key Learnings

1. **D&D Beyond won't provide API** - Community workarounds are the only option
2. **DOM extraction is safest** - Reading visible page content is most defensible
3. **Personal use is tolerated** - Despite ToS, no enforcement on personal tools
4. **Our EAV system is flexible** - Well-suited for arbitrary D&D content
5. **Campaign binding is critical** - Prevents content "leakage" between campaigns

---

## References

- [Beyond20 GitHub](https://github.com/kakaroto/Beyond20)
- [DDB-Importer for Foundry](https://github.com/MrPrimate/ddb-importer)
- [D&D Beyond ToS Discussion](https://www.dndbeyond.com/forums/d-d-beyond-general/general-discussion/49086-d-d-beyond-terms-of-service-api)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)

