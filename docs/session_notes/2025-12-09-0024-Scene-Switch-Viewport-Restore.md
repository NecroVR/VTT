# Session Notes: Scene Switch Viewport Restore

**Date**: 2025-12-09
**Session ID**: 0024
**Focus**: Fix viewport loading when switching between scenes

---

## Problem Summary

When switching between scenes in the VTT, the camera position and zoom level were NOT being restored to the saved values for the new scene. The camera would stay at the same position as the previous scene, causing a jarring user experience.

### Root Cause

The `SceneCanvas` component was being **reused** (not remounted) when switching scenes. When the `scene` prop changed, Svelte would update the component but not remount it. This meant:

1. The `onMount` lifecycle hook only ran once when the component first mounted
2. When switching to a new scene, `onMount` did NOT run again
3. The viewport for the new scene was never loaded from the API
4. The camera stayed at the previous scene's position

---

## Solution Implemented

### Changes Made to `apps/web/src/lib/components/SceneCanvas.svelte`

#### 1. Added Scene Tracking Variable

```typescript
let previousSceneId: string | null = null;
```

This tracks the ID of the currently displayed scene to detect when it changes.

#### 2. Created `loadViewport()` Function

```typescript
async function loadViewport(sceneId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/viewport`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.viewport) {
        viewX = data.viewport.cameraX;
        viewY = data.viewport.cameraY;
        scale = data.viewport.zoom;

        // Update last saved values to prevent immediate save
        lastSavedViewX = viewX;
        lastSavedViewY = viewY;
        lastSavedScale = scale;

        // Invalidate caches to reflect new viewport
        invalidateVisibilityCache();
        gridNeedsUpdate = true;
        backgroundNeedsUpdate = true;

        // Re-render with loaded viewport position
        render();
      }
    }
  } catch (error) {
    console.error('Failed to load viewport:', error);
  }
}
```

This extracts the viewport loading logic into a reusable function that can be called both on mount and when the scene changes.

#### 3. Created `saveViewportImmediate()` Function

```typescript
async function saveViewportImmediate(sceneId: string, x: number, y: number, z: number) {
  try {
    await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/viewport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        cameraX: x,
        cameraY: y,
        zoom: z
      })
    });
  } catch (error) {
    console.error('Failed to save viewport immediately:', error);
  }
}
```

This provides immediate (non-debounced) saving for when switching scenes. The existing `saveViewport()` function uses a 500ms debounce, which is appropriate for user interactions like panning and zooming, but when switching scenes we need to save immediately.

#### 4. Added Reactive Statement for Scene Changes

```typescript
$: if (scene.id && scene.id !== previousSceneId) {
  // Save viewport for previous scene before switching
  if (previousSceneId) {
    saveViewportImmediate(previousSceneId, viewX, viewY, scale);
  }
  // Reset to scene defaults while loading
  viewX = scene.initialX ?? 0;
  viewY = scene.initialY ?? 0;
  scale = scene.initialScale ?? 1;
  // Load viewport for new scene
  loadViewport(scene.id);
  previousSceneId = scene.id;
}
```

This reactive statement:
1. Detects when `scene.id` changes
2. Saves the **old** scene's viewport immediately before switching
3. Resets to the **new** scene's default values (while the async load happens)
4. Loads the **new** scene's saved viewport from the API
5. Updates `previousSceneId` to track the new current scene

#### 5. Updated `onMount` Hook

```typescript
onMount(async () => {
  initializeCanvases();
  loadBackgroundImage();
  resizeCanvases();

  // Load saved viewport position
  await loadViewport(scene.id);
  previousSceneId = scene.id;

  render();
  startAnimationLoop();

  window.addEventListener('resize', resizeCanvases);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('resize', resizeCanvases);
    window.removeEventListener('keydown', handleKeyDown);
    stopAnimationLoop();
  };
});
```

The `onMount` hook now:
1. Calls the extracted `loadViewport()` function instead of inline fetch code
2. Sets `previousSceneId` to track the initial scene
3. Is significantly simplified (30+ lines reduced to 2 lines)

---

## How It Works

### User Flow

1. **User opens Scene A**
   - Component mounts
   - `onMount` runs: loads Scene A's viewport
   - `previousSceneId` = Scene A's ID

2. **User switches to Scene B**
   - `scene` prop changes
   - Reactive statement detects `scene.id !== previousSceneId`
   - **Saves Scene A's viewport** immediately (current camera position)
   - Resets viewport to Scene B's defaults (instant feedback)
   - **Loads Scene B's saved viewport** asynchronously
   - Updates `previousSceneId` = Scene B's ID

3. **User switches back to Scene A**
   - Same process: saves Scene B's viewport, loads Scene A's viewport
   - Scene A's viewport was saved in step 2, so it returns to the correct position

### Key Design Decisions

1. **Immediate Save Before Load**: We save the old scene's viewport before loading the new scene's viewport to ensure no viewport state is lost.

2. **Reset to Defaults While Loading**: We immediately reset to the new scene's default values (from `scene.initialX`, `scene.initialY`, `scene.initialScale`) while the async load happens. This provides instant visual feedback.

3. **Separate Immediate Save Function**: We created `saveViewportImmediate()` separate from the debounced `saveViewport()` to ensure the old viewport is saved immediately when switching, not after a 500ms delay.

4. **Reactive Statement vs onMount**: We use a reactive statement (`$:`) instead of `onMount` because reactive statements run whenever their dependencies change, while `onMount` only runs once.

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/lib/components/SceneCanvas.svelte` | - Added `previousSceneId` tracking variable<br>- Created `loadViewport()` function<br>- Created `saveViewportImmediate()` function<br>- Added reactive statement for scene changes<br>- Updated `onMount` to use new functions |

**Net Impact**: +70 lines, -30 lines (40 net lines added, but much cleaner code organization)

---

## Testing & Verification

### Build Status
- ✅ TypeScript compilation successful
- ✅ No new errors or warnings
- ✅ All existing accessibility warnings remain (pre-existing)

### Docker Deployment
- ✅ `docker-compose up -d --build` completed successfully
- ✅ All containers running:
  - `vtt_db` (PostgreSQL) - Up 25 hours (healthy)
  - `vtt_redis` (Redis) - Up 25 hours (healthy)
  - `vtt_nginx` (Nginx) - Up 3 hours
  - `vtt_server` (Backend API) - Up and running
  - `vtt_web` (Frontend) - Up and running
- ✅ No errors in server logs
- ✅ No errors in web logs
- ✅ WebSocket connection established successfully

### Git Status
- ✅ Changes committed: `8e9af91` - "fix(canvas): Restore viewport when switching between scenes"
- ✅ Pushed to GitHub: master branch updated

---

## Expected Behavior

After this fix:

1. **Scene Switching**: When switching from Scene A to Scene B, the camera should move to Scene B's last saved position
2. **Viewport Persistence**: Each scene remembers its own camera position and zoom level
3. **No Loss of State**: The old scene's viewport is saved before switching to the new scene
4. **Smooth Transitions**: User sees scene defaults briefly, then saved viewport loads asynchronously

---

## Next Steps

### For User
1. Test the scene switching functionality in the application
2. Verify that viewport positions are correctly saved and restored
3. Check that there are no console errors when switching scenes

### Future Improvements
- Consider adding a loading indicator while viewport is being loaded
- Consider caching viewport data in memory to avoid API calls on rapid scene switching
- Consider adding viewport animations/transitions for smoother user experience

---

## Related Issues

This fix addresses the core issue reported by the user where viewport state was not being restored when switching between scenes. The previous implementation only loaded viewport in `onMount`, which only runs once per component lifecycle.

---

**Session Status**: ✅ Complete
**All Changes Deployed**: Yes
**Ready for Testing**: Yes
