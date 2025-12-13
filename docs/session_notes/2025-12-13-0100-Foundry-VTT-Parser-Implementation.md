# Session Notes: Foundry VTT Parser Implementation (Phase 3)

**Date:** 2025-12-13
**Session ID:** 0100
**Focus:** Implement Phase 3 - Foundry VTT Parsers for Content Import System

---

## Session Summary

Successfully implemented Phase 3 of the Content Import System: Foundry VTT Parsers. Created four comprehensive parsers (Actor, Item, Scene, Journal) that transform Foundry VTT export data into the VTT's internal format. All parsers support D&D 5e system data with comprehensive unit test coverage (45 tests, all passing).

---

## Problems Addressed

### Challenge 1: Transforming Foundry D&D 5e Data Structure
**Symptoms:**
- Foundry VTT uses a deeply nested data structure with system-specific fields
- D&D 5e system data has different structure than our VTT's internal format
- Need to handle embedded items (weapons, spells, features) within actors

**Root Cause:**
Foundry VTT is highly modular with game system-specific data structures that differ from our entity-attribute-value (EAV) system.

**Solution:**
- Created specialized transformers for D&D 5e data
- Extracted abilities, skills, saves, equipment, features, and spellcasting
- Implemented mapping functions for Foundry types to VTT entity types
- Handled embedded items by extracting and transforming them separately

### Challenge 2: TypeScript Type Safety with Dynamic Data
**Symptoms:**
- TypeScript strict mode errors for optional/dynamic fields
- `Property 'content' does not exist on type` errors
- `Element implicitly has an 'any' type` errors

**Root Cause:**
Foundry export data has optional fields and multiple possible data structures depending on version and game system.

**Solution:**
- Added strategic type assertions (`as any`) for dynamic property access
- Maintained runtime safety with null coalescing operators (`??` and `||`)
- Preserved TypeScript compilation in strict mode

### Challenge 3: ESM Module Resolution in Docker
**Symptoms:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/apps/server/dist/services/parsers/foundry/actorParser'
```

**Root Cause:**
Node.js ESM modules require explicit `.js` extensions in import statements, even though source files are `.ts`.

**Solution:**
- Added `.js` extensions to all relative imports
- Updated all parser imports to include `.js` extension
- Maintained TypeScript compatibility (TS understands `.js` extensions in imports)

---

## Solutions Implemented

### 1. Foundry Actor Parser

**File:** `apps/server/src/services/parsers/foundry/actorParser.ts`

**Key Features:**
- Parses D&D 5e character and NPC exports
- Transforms abilities with scores, modifiers, and save proficiencies
- Extracts skills with proficiency levels (none, proficient, expertise)
- Handles movement speeds (walk, fly, swim, climb, burrow)
- Processes character details (race, background, alignment, level, XP)
- Extracts embedded classes with levels and subclasses
- Parses equipment with equipped status and quantities
- Extracts features and feats with descriptions
- Handles spellcasting ability and spell slots
- Extracts currency (pp, gp, ep, sp, cp)
- Parses biography and description

**Data Transformation:**
```typescript
{
  name: "Thorin Ironforge",
  abilities: {
    str: { score: 16, modifier: 3, saveProficient: 1 },
    dex: { score: 14, modifier: 2, saveProficient: 0 },
    // ...
  },
  hitPoints: { current: 45, max: 45, temp: 0 },
  armorClass: 18,
  classes: [{ name: "Fighter", level: 5, subclass: "Battle Master" }],
  equipment: [{ name: "Battleaxe", quantity: 1, equipped: true }],
  // ...
}
```

### 2. Foundry Item Parser

**File:** `apps/server/src/services/parsers/foundry/itemParser.ts`

**Key Features:**
- Handles all Foundry item types (weapon, equipment, spell, feat, class, race, background)
- Type-specific transformations for each item category
- Weapon properties (damage, range, versatile, properties)
- Spell components (verbal, somatic, material, concentration, ritual)
- Spell damage and save DC information
- Class hit dice and spellcasting progression
- Race size and movement speeds
- Background skills, tools, and languages

**Supported Item Types:**
- **Weapons:** Damage parts, versatile damage, weapon type, properties, proficiency
- **Equipment:** Armor value, weight, price, rarity, attunement
- **Spells:** Level, school, components, duration, range, damage, saves
- **Feats:** Requirements, type
- **Classes:** Hit dice, levels, spellcasting
- **Races:** Size, speed, ability advancement
- **Backgrounds:** Skills, tools, languages

### 3. Foundry Scene Parser

**File:** `apps/server/src/services/parsers/foundry/sceneParser.ts`

**Key Features:**
- Parses battle map scenes with background images
- Extracts grid settings (size, type, distance, units)
- Transforms walls for line-of-sight (movement, sight, sound restrictions)
- Processes lights (position, brightness, dim radius, angle, color, animation)
- Handles tokens (position, size, rotation, actor linkage, hidden/locked states)
- Maps grid types (square, hex rows/columns odd/even)
- Maps token dispositions (hostile, neutral, friendly)
- Extracts scene dimensions and navigation settings

**Grid Type Mapping:**
- Type 1 → square
- Type 2 → hexRowsOdd
- Type 3 → hexRowsEven
- Type 4 → hexColumnsOdd
- Type 5 → hexColumnsEven

### 4. Foundry Journal Parser

**File:** `apps/server/src/services/parsers/foundry/journalParser.ts`

**Key Features:**
- Parses journal entries with multiple pages
- Handles text pages (HTML and Markdown formats)
- Processes image and video pages
- Extracts page sort order
- Strips HTML for description preview (first 200 characters)
- Finds first image for journal thumbnail
- Preserves Foundry flags for round-trip compatibility

**Page Types:**
- **Text:** HTML or Markdown content with format detection
- **Image:** Source path extraction
- **Video:** Source path extraction

### 5. Parser Registration System

**File:** `apps/server/src/services/parsers/foundry/index.ts`

**Key Features:**
- Centralized registration function for all Foundry parsers
- Maps multiple content types to appropriate parsers
- Single item parser handles all item types (weapon, spell, feat, etc.)
- Exports individual parsers for testing
- Called during server startup before server listen

**Registration Mapping:**
```typescript
'foundryvtt:actor' → FoundryActorParser
'foundryvtt:item' → FoundryItemParser
'foundryvtt:spell' → FoundryItemParser
'foundryvtt:feat' → FoundryItemParser
'foundryvtt:class' → FoundryItemParser
'foundryvtt:race' → FoundryItemParser
'foundryvtt:background' → FoundryItemParser
'foundryvtt:scene' → FoundrySceneParser
'foundryvtt:journal' → FoundryJournalParser
```

---

## Files Created

### Parser Implementation Files
1. `apps/server/src/services/parsers/foundry/actorParser.ts` - D&D 5e character/NPC parser (217 lines)
2. `apps/server/src/services/parsers/foundry/itemParser.ts` - Multi-type item parser (161 lines)
3. `apps/server/src/services/parsers/foundry/sceneParser.ts` - Battle map scene parser (147 lines)
4. `apps/server/src/services/parsers/foundry/journalParser.ts` - Journal entry parser (120 lines)
5. `apps/server/src/services/parsers/foundry/index.ts` - Parser registration (46 lines)

### Test Files
6. `apps/server/src/services/parsers/foundry/__tests__/actorParser.test.ts` - Actor parser tests (207 lines, 12 tests)
7. `apps/server/src/services/parsers/foundry/__tests__/itemParser.test.ts` - Item parser tests (185 lines, 11 tests)
8. `apps/server/src/services/parsers/foundry/__tests__/sceneParser.test.ts` - Scene parser tests (157 lines, 12 tests)
9. `apps/server/src/services/parsers/foundry/__tests__/journalParser.test.ts` - Journal parser tests (157 lines, 10 tests)

### Test Fixtures
10. `apps/server/src/services/parsers/foundry/__tests__/fixtures/foundryActorSample.json` - Sample D&D 5e character
11. `apps/server/src/services/parsers/foundry/__tests__/fixtures/foundryItemSample.json` - Sample Fireball spell
12. `apps/server/src/services/parsers/foundry/__tests__/fixtures/foundrySceneSample.json` - Sample tavern scene
13. `apps/server/src/services/parsers/foundry/__tests__/fixtures/foundryJournalSample.json` - Sample lore journal

### Modified Files
14. `apps/server/src/index.ts` - Added parser registration on startup
15. `docs/architecture/CONTENT_IMPORT_PLAN.md` - Updated Phase 3 status to 7/8 complete

---

## Testing Results

### Unit Test Results

**Command:** `pnpm test foundry`

**Results:**
```
✓ src/services/parsers/foundry/__tests__/itemParser.test.ts (11 tests) 3ms
✓ src/services/parsers/foundry/__tests__/actorParser.test.ts (12 tests) 5ms
✓ src/services/parsers/foundry/__tests__/sceneParser.test.ts (12 tests) 4ms
✓ src/services/parsers/foundry/__tests__/journalParser.test.ts (10 tests) 3ms

Test Files: 4 passed (4)
Tests: 45 passed (45)
Duration: 949ms
```

**Coverage:**
- All parser methods tested with sample data
- Edge cases covered (missing fields, empty arrays, null values)
- Type mapping verified
- D&D 5e data transformation accuracy validated

### Build and Deployment Results

**TypeScript Compilation:** ✅ Success
**Docker Build:** ✅ Success
**Container Startup:** ✅ Success
**Parser Registration:** ✅ Confirmed in logs

**Server Log Confirmation:**
```
Foundry VTT parsers registered successfully
Content import parsers registered
Server listening on 0.0.0.0:3000 in production mode
```

---

## Current Status

### Phase 3 Progress: 7/8 Complete (87.5%)

#### Completed Tasks
- ✅ 3.1 Create Foundry actor parser
- ✅ 3.2 Create Foundry item parser
- ✅ 3.3 Create Foundry scene parser
- ✅ 3.4 Create Foundry journal parser
- ✅ 3.5 Handle D&D 5e system-specific data structures
- ✅ 3.6 Register parsers with import service
- ✅ 3.7 Write unit tests with sample Foundry export data

#### Pending Tasks
- ⏳ 3.8 Commit and deploy to Docker (partially complete - need final commit)

### Deployment Status
- Server container running and healthy
- Parser registration confirmed in logs
- All tests passing
- Ready for Phase 4 (Foundry Import UI)

---

## Key Learnings

### 1. ESM Module Resolution
Node.js ESM requires explicit `.js` extensions in import statements even for TypeScript files. This is handled automatically by TypeScript but must be considered for runtime.

### 2. Type Safety vs. Runtime Flexibility
Strategic use of type assertions (`as any`) allows handling dynamic Foundry data structures while maintaining TypeScript compilation. Runtime safety is preserved through null coalescing.

### 3. Parser Pattern
The ContentParser interface provides a clean abstraction:
```typescript
interface ContentParser {
  parse(item: RawImportItem): Promise<ParsedEntity>;
}
```
This allows easy extension for new source types (D&D Beyond, Roll20, etc.).

### 4. Test-Driven Development Benefits
Creating sample fixtures alongside parsers ensured comprehensive test coverage and caught edge cases early.

---

## Next Steps

### Immediate (Phase 3 Completion)
1. Final commit with all changes
2. Mark Phase 3 as COMPLETE in plan
3. Push to GitHub

### Phase 4: Foundry Import UI
1. Create file upload component with drag-and-drop
2. Build content preview/selection interface
3. Implement progress tracking component
4. Add import history view
5. Integrate WebSocket for real-time updates
6. Create Foundry export instructions

### Technical Debt
- Consider adding RollTable and Playlist parsers (currently not in scope)
- Add image import service integration (deferred to image handling phase)
- Implement ZIP upload support for Foundry exports with embedded images

---

## Commit History

1. **feat(import): Implement Phase 3 - Foundry VTT parsers for content import**
   - Initial implementation of all four parsers
   - Comprehensive unit test suite
   - Sample Foundry export fixtures
   - Parser registration system

2. **fix(import): Fix TypeScript type errors in Foundry parsers**
   - Added type assertions for dynamic property access
   - Resolved strict mode compilation errors

3. **fix(import): Add .js extensions to ESM imports in Foundry parsers**
   - Required for proper ESM module resolution in Node.js runtime

---

## Architecture Notes

### Parser Design Pattern
Each parser implements the `ContentParser` interface which requires a single `parse()` method. This provides:
- Consistent API across all source types
- Easy registration with import service
- Testability through interface mocking

### Data Flow
```
Foundry Export JSON
  ↓
RawImportItem (with Foundry-specific type)
  ↓
Parser.parse() - Transform to VTT format
  ↓
ParsedEntity (standardized structure)
  ↓
ImportService - Create module entity + EAV properties
  ↓
Database (module_entities + entity_properties)
```

### Type Mapping Strategy
Foundry types are mapped to VTT entity types:
- `character` → `character`
- `npc` → `monster`
- `vehicle` → `vehicle`
- All item types → Stored as `item` with `foundryType` field preserved

---

## Documentation Updated

- ✅ `CONTENT_IMPORT_PLAN.md` - Phase 3 tasks marked complete, progress 7/8
- ✅ Session notes created with comprehensive implementation details

---

**Session Completed:** 2025-12-13
**Total Lines of Code:** ~1,859 (parsers + tests + fixtures)
**Test Coverage:** 45/45 tests passing
**Docker Deployment:** ✅ Successful
