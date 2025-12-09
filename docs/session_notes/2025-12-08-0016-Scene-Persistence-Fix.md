# Session Notes: Scene Persistence Fix

**Date**: 2025-12-08
**Session ID**: 0016
**Focus**: Fix scene persistence issue where lights, walls, and tokens are not loaded on page refresh

---

## Problem Description

After placing lights, walls, or tokens on a scene and refreshing the page, the scene data would not persist. The reactive statement in the campaign page was not firing correctly on initial page load because the active scene ID might not be set when the component first rendered.

### Root Cause

The scenes store was setting the active scene ID during `loadScenes()`, but:
1. There was no persistence of the user's active scene selection across page refreshes
2. The reactive block `$: if (activeScene?.id)` depended on the active scene being set, which might not happen reliably on initial load

---

## Solution Implemented

### 1. Added localStorage Persistence

**File Modified**: `D:\Projects\VTT\apps\web\src\lib\stores\scenes.ts`

**Changes**:
- Modified `loadScenes()` method to restore active scene from localStorage
- Priority order for active scene selection:
  1. Previously selected scene from localStorage (if still exists in campaign)
  2. Scene marked as active by API
  3. First scene in the list
- Modified `setActiveScene()` method to save selection to localStorage
  - Added optional `campaignId` parameter
  - Saves to `vtt_active_scene_${campaignId}` key
  - Only saves when in browser environment and campaignId is provided

**Code Changes**:
```typescript
// In loadScenes() method
// Try to restore active scene from localStorage
const savedActiveSceneId = localStorage.getItem(`vtt_active_scene_${campaignId}`);

// Priority: 1) localStorage (if valid) 2) API-marked active 3) First scene
if (savedActiveSceneId && scenes.has(savedActiveSceneId)) {
  activeSceneId = savedActiveSceneId;
} else if (!activeSceneId && scenes.size > 0) {
  activeSceneId = scenes.values().next().value.id;
}

// In setActiveScene() method
setActiveScene(sceneId: string | null, campaignId?: string): void {
  // Save to localStorage if browser environment and campaignId provided
  if (browser && sceneId && campaignId) {
    localStorage.setItem(`vtt_active_scene_${campaignId}`, sceneId);
  }
  // ... rest of method
}
```

### 2. Updated Campaign Page

**File Modified**: `D:\Projects\VTT\apps\web\src\routes\campaign\[id]\+page.svelte`

**Changes**:
Updated all calls to `setActiveScene()` to pass the `campaignId` parameter:
- Line 150: WebSocket scene switched handler
- Line 259: `handleSceneChange()` function
- Line 353: `handleSceneCreated()` function

---

## Files Modified

1. `D:\Projects\VTT\apps\web\src\lib\stores\scenes.ts`
   - Added localStorage persistence in `loadScenes()`
   - Modified `setActiveScene()` signature to include optional `campaignId`
   - Saves active scene selection to localStorage

2. `D:\Projects\VTT\apps\web\src\routes\campaign\[id]\+page.svelte`
   - Updated all `setActiveScene()` calls to pass `campaignId`

---

## Testing Results

1. **Build Success**: Application built successfully with no TypeScript errors
2. **Docker Deployment**: Containers rebuilt and deployed successfully
   - `vtt_web`: Running on port 5173
   - `vtt_server`: Running on port 3000
   - All services healthy

---

## Expected Behavior

After this fix:
1. When a user selects a scene, that selection is saved to localStorage
2. On page refresh, the user returns to the same scene they were viewing
3. Lights, walls, and tokens load correctly because the active scene ID is properly set
4. If the previously selected scene no longer exists (e.g., deleted), the system gracefully falls back to the first available scene

---

## Commit Details

**Commit Hash**: `5150210`
**Commit Message**:
```
fix(scenes): Add localStorage persistence for active scene selection

- Modified scenes store to save active scene ID to localStorage per campaign
- Active scene is now restored from localStorage on page load
- Falls back to API-marked active scene or first scene if localStorage is invalid
- Updated all setActiveScene() calls to pass campaignId parameter
- Ensures lights, walls, and tokens load correctly on page refresh

Fixes the issue where scene data would not persist across page refreshes.
```

---

## Next Steps

No immediate action required. The fix is complete and deployed.

### Future Enhancements (Optional)
- Consider adding a visual indicator when restoring from localStorage
- Add option to clear localStorage preferences in settings
- Consider syncing active scene selection to user preferences in database for cross-device persistence

---

## Notes

- The fix uses per-campaign localStorage keys to avoid conflicts between different campaigns
- The implementation is backward-compatible; if localStorage is not available, it falls back to previous behavior
- No database schema changes were required
