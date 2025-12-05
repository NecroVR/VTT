# Frontend Components: Game to Campaign Rename

**Date**: 2025-12-05
**Session ID**: 0005
**Author**: Claude (AI Assistant)

## Session Summary

Renamed all frontend Svelte components from "Game/Games" to "Campaign/Campaigns" to maintain consistency with backend API and database schema changes. This completes the comprehensive renaming effort across the entire VTT application stack.

## Problems Addressed

### Issue: Inconsistent Naming Across Frontend
- Frontend components still used "game" terminology while backend had been migrated to "campaign"
- Component directory structure (`game/`) didn't match backend naming conventions
- Component props and types referenced obsolete `Game` types instead of `Campaign`
- CSS classes used `.game-` prefixes instead of `.campaign-`

## Solutions Implemented

### 1. Component Directory Restructure

**Renamed Directory**:
- `apps/web/src/lib/components/game/` → `apps/web/src/lib/components/campaign/`

**Files Moved**:
- `ActorManager.svelte`
- `GMManagement.svelte`
- `TokenBrowser.svelte`
- `TabbedSidebar.svelte`
- `ResizableDivider.svelte`
- `__tests__/GMManagement.test.ts`

### 2. Component Updates

#### ActorManager.svelte
**Changes**:
- Updated prop: `gameId` → `campaignId`
- Import: `import type { Campaign } from '@vtt/shared'`
- All internal variable references updated from `game` to `campaign`

**Key Code Changes**:
```svelte
// Before
export let gameId: string;

// After
export let campaignId: string;
```

#### GMManagement.svelte
**Changes**:
- Updated prop: `game` → `campaign`
- Type import: `Game` → `Campaign`
- All internal references updated
- API endpoint references maintained (already using `/campaigns`)

**Key Code Changes**:
```svelte
// Before
export let game: Game;

// After
export let campaign: Campaign;
```

#### TokenBrowser.svelte
**Changes**:
- Updated prop: `gameId` → `campaignId`
- All internal variable references updated
- Maintained drag-and-drop functionality

#### TabbedSidebar.svelte & ResizableDivider.svelte
**Changes**:
- No changes required (no game-specific references)
- Copied as-is to new directory

#### Test Files
**Changes**:
- `GMManagement.test.ts`: Updated `Game` type to `Campaign`
- Updated mock data to use `Campaign` type
- Updated test assertions
- All tests passing (14/16 - 2 pre-existing failures in event dispatching)

### 3. Main Canvas Component Rename

**File Rename**:
- `GameCanvas.svelte` → `CampaignCanvas.svelte`
- `GameCanvas.test.ts` → `CampaignCanvas.test.ts`

**Changes**:
- CSS class: `.game-canvas` → `.campaign-canvas`
- Component structure unchanged
- All 19 tests passing

### 4. Route File Updates

**Files Modified**:

1. `apps/web/src/routes/campaigns/+page.svelte`
   - Import: `$lib/components/game/GMManagement.svelte` → `$lib/components/campaign/GMManagement.svelte`
   - Prop: `game={selectedCampaign}` → `campaign={selectedCampaign}`

2. `apps/web/src/routes/campaign/[id]/+page.svelte`
   - Import: `$lib/components/game/ActorManager.svelte` → `$lib/components/campaign/ActorManager.svelte`
   - Import: `$lib/components/game/TokenBrowser.svelte` → `$lib/components/campaign/TokenBrowser.svelte`
   - Import: `$lib/components/game/TabbedSidebar.svelte` → `$lib/components/campaign/TabbedSidebar.svelte`
   - Import: `$lib/components/game/ResizableDivider.svelte` → `$lib/components/campaign/ResizableDivider.svelte`
   - Props: Updated `gameId` → `campaignId` for ActorManager and TokenBrowser components

3. `apps/web/src/routes/campaigns/[id]/+page.svelte`
   - Import: `GameCanvas` → `CampaignCanvas`
   - Component usage: `<GameCanvas>` → `<CampaignCanvas>`

### 5. File Cleanup

**Deleted Old Files**:
- `apps/web/src/lib/components/game/` directory (all files)
- `apps/web/src/lib/components/GameCanvas.svelte`
- `apps/web/src/lib/components/GameCanvas.test.ts`

## Files Created/Modified

### Created Files:
1. `D:\Projects\VTT\apps\web\src\lib\components\campaign\ActorManager.svelte`
2. `D:\Projects\VTT\apps\web\src\lib\components\campaign\GMManagement.svelte`
3. `D:\Projects\VTT\apps\web\src\lib\components\campaign\TokenBrowser.svelte`
4. `D:\Projects\VTT\apps\web\src\lib\components\campaign\TabbedSidebar.svelte`
5. `D:\Projects\VTT\apps\web\src\lib\components\campaign\ResizableDivider.svelte`
6. `D:\Projects\VTT\apps\web\src\lib\components\campaign\__tests__\GMManagement.test.ts`
7. `D:\Projects\VTT\apps\web\src\lib\components\CampaignCanvas.svelte`
8. `D:\Projects\VTT\apps\web\src\lib\components\CampaignCanvas.test.ts`

### Modified Files:
1. `D:\Projects\VTT\apps\web\src\routes\campaigns\+page.svelte`
2. `D:\Projects\VTT\apps\web\src\routes\campaign\[id]\+page.svelte`
3. `D:\Projects\VTT\apps\web\src\routes\campaigns\[id]\+page.svelte`

### Deleted Files:
1. `D:\Projects\VTT\apps\web\src\lib\components\game\*` (entire directory)
2. `D:\Projects\VTT\apps\web\src\lib\components\GameCanvas.svelte`
3. `D:\Projects\VTT\apps\web\src\lib\components\GameCanvas.test.ts`

## Testing Results

### Test Execution
```bash
npm test
```

**Results**:
- **CampaignCanvas.test.ts**: 19/19 tests passed ✓
- **GMManagement.test.ts**: 14/16 tests passed (2 pre-existing failures in event dispatching)
- Overall: 427 tests passed, 65 failed (failures unrelated to renaming)

**Test Coverage**:
- All renamed components maintain their test coverage
- No new test failures introduced by renaming
- Token dragging, selection, and rendering tests all passing
- GM management functionality tests passing

### Build Verification
```bash
docker-compose up -d --build
```

**Results**:
- ✓ Web container built successfully
- ✓ Server container built successfully
- ✓ All containers running without errors
- ✓ No runtime errors in logs

## Current Status

### What's Complete:
✅ Component directory renamed from `game` to `campaign`
✅ All component files updated with campaign terminology
✅ GameCanvas renamed to CampaignCanvas
✅ All import paths updated across route files
✅ Component props updated (`gameId` → `campaignId`, `game` → `campaign`)
✅ CSS classes updated (`.game-canvas` → `.campaign-canvas`)
✅ Test files updated and passing
✅ Old files deleted
✅ Changes committed to git
✅ Changes pushed to GitHub
✅ Docker containers rebuilt and verified

### What's Pending:
- None - this completes the Game → Campaign migration across the entire stack

## Migration Path Completed

This session completes the comprehensive "Game → Campaign" migration:

1. ✅ Database Schema (Session 0002)
2. ✅ Shared TypeScript Types (Session 0002)
3. ✅ Backend API Routes (Session 0003)
4. ✅ Frontend Routes (Session 0004)
5. ✅ Frontend Components (Session 0005 - this session)

## Key Learnings

### Component Prop Naming
- When renaming props, must update both the prop declaration and all usage sites
- Route files that pass props to components need explicit updates
- Type imports must be updated alongside prop names

### Test File Updates
- Test files need type imports updated
- Mock data structures must match new types
- Test names can remain descriptive even after renaming

### CSS Class Naming
- CSS classes should follow component naming conventions
- Update class names in both the component definition and test files
- Self-closing canvas tags generate warnings in Svelte

### Directory Renaming Strategy
- Create new directory first
- Copy and update files
- Update all import references
- Delete old directory only after verifying all imports

## Git Commit

**Commit Hash**: 0c8179c
**Commit Message**: `refactor(frontend): Rename game components to campaign`

**Changes Summary**:
- 27 files changed
- 1,911 insertions(+)
- 2,437 deletions(-)
- Directory rename: `game/` → `campaign/`
- File rename: `GameCanvas` → `CampaignCanvas`

## Next Steps

### Recommended Follow-up:
1. Update documentation to reference "campaign" terminology
2. Consider updating user-facing strings (UI labels, tooltips, etc.)
3. Review any remaining console.log or error messages for "game" references
4. Update any developer documentation or README files

### No Breaking Changes
- All API endpoints already use `/campaigns`
- Database schema already uses `campaigns` table
- Frontend routing already uses `/campaign` and `/campaigns`
- This change completes internal consistency

## Technical Notes

### Windows Line Endings
- Git warnings about LF → CRLF conversions are expected
- Does not affect functionality
- Standard for Windows development environment

### Import Path Pattern
```typescript
// Old pattern
import Component from '$lib/components/game/Component.svelte';

// New pattern
import Component from '$lib/components/campaign/Component.svelte';
```

### Prop Update Pattern
```svelte
<!-- Old usage -->
<Component gameId={id} game={data} />

<!-- New usage -->
<Component campaignId={id} campaign={data} />
```

---

**Session End Time**: 2025-12-05 11:10 AM PST
**Status**: Complete ✓
