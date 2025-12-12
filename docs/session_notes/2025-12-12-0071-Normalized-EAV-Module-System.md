# Session Notes: Normalized EAV Module System Implementation

**Date**: 2025-12-12
**Session ID**: 0071
**Focus**: Implementing a fully normalized EAV (Entity-Attribute-Value) module system for game data

---

## Session Goals

1. Implement a module system for organizing game data
2. Use EAV pattern for fully normalized data storage
3. Implement file validation before database loading
4. Implement re-validation with error tagging for broken entries
5. Ensure game system tagging prevents mixing incompatible modules

---

## Current State Analysis

### Existing Architecture
The codebase has a hybrid architecture:
- **File-based system definitions** for immutable game content
- **Database-backed instances** for user-created content
- **JSONB denormalization** for system-specific attributes (not normalized)
- **In-memory indexing** for fast compendium lookups

### Key Files Identified
| Purpose | File Path |
|---------|-----------|
| Type Definitions | `packages/shared/src/types/compendium.ts` |
| Game Systems Types | `packages/shared/src/types/game-systems.ts` |
| Item Template Types | `packages/shared/src/types/item-templates.ts` |
| Compendium Schema | `packages/database/src/schema/compendiums.ts` |
| Game Systems Loader | `apps/server/src/services/gameSystemLoader.ts` |
| Compendium API | `apps/server/src/routes/api/v1/compendiums.ts` |

### Current Limitations
1. All system-specific attributes stored as JSONB without normalization
2. Queries like "find all spells of level 2" require iterating all items
3. No module concept - data is organized by compendium only
4. No validation pipeline for user-supplied content
5. No game system compatibility enforcement at module level

---

## Design Decisions

### Module System
- Modules can contain anything from core mechanics to item packs
- All modules loaded for a campaign must share the same game system tag
- Data starts in file format and gets loaded into database
- Validation occurs before loading and on reload

### EAV Pattern (Option A)
Every element of items, races, classes, etc. is a property:
```
entities: id, module_id, entity_type, name, base_data
entity_properties: entity_id, property_key, property_value, value_type
```

---

## Task Progress

### Completed
- [x] Explored current codebase structure
- [x] Analyzed existing compendium, game systems, and database schema
- [x] Documented current architecture and limitations

### In Progress
- [ ] Design normalized EAV database schema for modules system

### Pending
- [ ] Create database migrations for modules and EAV tables
- [ ] Implement file validation system for module files
- [ ] Implement module loader service with EAV normalization
- [ ] Update API endpoints for module and entity management
- [ ] Implement re-validation system with error tagging
- [ ] Update frontend compendium browser for new data structure
- [ ] Run regression tests
- [ ] Commit, push to GitHub, and deploy to Docker

---

## Agent Work Log

### Agent 1: Codebase Exploration (ab1b4e1)
**Task**: Explore compendium/game system codebase
**Status**: Completed
**Findings**:
- Identified hybrid architecture with file-based and database-backed storage
- Found JSONB denormalization pattern in use
- Mapped all relevant type definitions and database schemas
- Documented API endpoints and frontend stores
- Identified migration path for EAV implementation

---

## Next Steps

1. Design complete EAV schema with modules table
2. Create migrations
3. Implement validation and loader services
4. Update APIs and frontend

---

## Notes

- Preserve file-based system for templates and official compendiums
- Normalize entity attributes in new tables
- Keep JSONB for extensibility where needed
- Implement attribute registry to map system fields to normalized columns
