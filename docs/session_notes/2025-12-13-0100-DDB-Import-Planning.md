# Session Notes: D&D Beyond Import Planning

> **Session ID:** 0100
> **Date:** 2025-12-13
> **Focus:** Research and planning for D&D Beyond content import feature

---

## Session Summary

This session focused on researching the technical and legal landscape for importing D&D Beyond content into the VTT, analyzing the existing module architecture, and creating a comprehensive multi-phase implementation plan.

---

## Research Findings

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
`docs/architecture/DND_BEYOND_IMPORT_PLAN.md`

### Phase Summary

| Phase | Name | Scope |
|-------|------|-------|
| 1 | Foundation & Database Schema | Types, schema, migrations |
| 2 | Browser Extension Core | Chrome/Firefox extension |
| 3 | Server Import API | API endpoints, import service |
| 4 | Content Parsers - Characters | Character data transformation |
| 5 | Content Parsers - Monsters | Monster stat block transformation |
| 6 | Content Parsers - Spells & Items | Spell/item transformation |
| 7 | Frontend Import UI | React components, wizard flow |
| 8 | Campaign Binding & Permissions | Access control, binding system |
| 9 | Testing & Documentation | E2E tests, user guides |

### Key Design Decisions in Plan

1. **Status Tracking**: Agents must update plan status after each task
2. **Self-Contained Phases**: Each phase can be completed in one session
3. **Explicit Acceptance Criteria**: Clear definition of "done" for each task
4. **Sample Code**: Detailed implementation specifications included
5. **File Manifests**: Every phase lists files to create/modify

---

## Files Created

| File | Purpose |
|------|---------|
| `docs/architecture/DND_BEYOND_IMPORT_PLAN.md` | Comprehensive implementation plan |
| `docs/session_notes/2025-12-13-0100-DDB-Import-Planning.md` | This session note |

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

