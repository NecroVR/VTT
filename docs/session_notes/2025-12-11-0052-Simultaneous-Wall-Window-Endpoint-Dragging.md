# Session Notes: Simultaneous Wall and Window Endpoint Dragging Fix

**Date:** 2025-12-11
**Session ID:** 0052
**Focus:** Fix wall and window endpoint dragging to move simultaneously instead of sequentially

---

## Problem Statement

When dragging a shared endpoint between a wall and window:
- **Current behavior:** Wall moves while mouse is down, window moves on mouse up
- **Expected behavior:** BOTH wall and window should move together during the drag (while mouse is down)

This created a poor user experience where only the wall appeared to move during the drag, and the window would suddenly snap into position when the mouse was released.

---

## Root Cause Analysis

The issue was in the `handleMouseMove` and `handleMouseUp` functions in `SceneCanvas.svelte`:

### In `handleMouseMove` (lines 4415-4487)
1. Wall endpoint dragging checked `isDraggingWallEndpoint && draggedWalls.length > 0`
2. Updated wall positions and returned early
3. Window endpoint dragging checked `isDraggingWindowEndpoint && draggedWindows.length > 0`
4. Because of the early return, window dragging code never executed when both flags were true

### In `handleMouseUp` (lines 4671-4762)
1. Used `else if` chain for wall and window endpoint dragging
2. Only one could execute, never both simultaneously

The drag initialization code (lines 3928-3942 and 4024-4038) correctly set both `isDraggingWallEndpoint` and `isDraggingWindowEndpoint` to true when a shared endpoint was detected, but the move and mouseup handlers didn't account for this scenario.

---

## Solution Implemented

### Changes to `handleMouseMove`

Added a new condition at the **beginning** of the drag handling sequence:

```typescript
// Handle shared wall and window endpoint dragging
if (isDraggingWallEndpoint && isDraggingWindowEndpoint && draggedWalls.length > 0 && draggedWindows.length > 0) {
  // Apply snapping based on whether any wall or window requires grid snap
  const targetPos = draggedEndpointRequiresGridSnap ? snapToGrid(worldPos.x, worldPos.y) : worldPos;

  // For snap-to-endpoint, use the first dragged wall for exclusion logic
  const firstDragged = draggedWalls[0];
  nearbyEndpoint = findNearbyWallEndpoint(targetPos.x, targetPos.y, firstDragged.wallId, firstDragged.endpoint);

  // Update all dragged wall endpoints locally for immediate feedback
  for (const dw of draggedWalls) {
    const wall = walls.find(w => w.id === dw.wallId);
    if (wall) {
      if (dw.endpoint === 'start') {
        wall.x1 = targetPos.x;
        wall.y1 = targetPos.y;
      } else {
        wall.x2 = targetPos.x;
        wall.y2 = targetPos.y;
      }
    }
  }

  // Update all dragged window endpoints locally for immediate feedback
  for (const dw of draggedWindows) {
    const window = windows.find(w => w.id === dw.windowId);
    if (window) {
      if (dw.endpoint === 'start') {
        window.x1 = targetPos.x;
        window.y1 = targetPos.y;
      } else {
        window.x2 = targetPos.x;
        window.y2 = targetPos.y;
      }
    }
  }

  // Invalidate visibility cache so walls and windows update during drag
  invalidateVisibilityCache();
  renderWalls(); // renderWalls also renders windows
  return;
}
```

Key points:
- Checks if BOTH flags are true AND both arrays have elements
- Calculates snapped position once and applies to both
- Updates both wall and window positions in the same render frame
- Returns early to prevent individual handlers from executing

### Changes to `handleMouseUp`

Similar change - added shared handling before the `else if` chain:

```typescript
} else if (isDraggingWallEndpoint && isDraggingWindowEndpoint && draggedWalls.length > 0 && draggedWindows.length > 0) {
  // Handle shared wall and window endpoint dragging
  let finalPos: { x: number; y: number };

  // Check if we should snap to a nearby endpoint
  if (nearbyEndpoint) {
    // Snap to the nearby endpoint
    finalPos = { x: nearbyEndpoint.x, y: nearbyEndpoint.y };
  } else {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    // Apply snapping based on whether any wall or window requires grid snap
    finalPos = draggedEndpointRequiresGridSnap ? snapToGrid(worldPos.x, worldPos.y) : worldPos;
  }

  // Send updates for ALL dragged walls
  for (const dw of draggedWalls) {
    const updates: Partial<Wall> = dw.endpoint === 'start'
      ? { x1: finalPos.x, y1: finalPos.y }
      : { x2: finalPos.x, y2: finalPos.y };

    onWallUpdate?.(dw.wallId, updates);
  }

  // Send updates for ALL dragged windows
  for (const dw of draggedWindows) {
    const updates: Partial<Window> = dw.endpoint === 'start'
      ? { x1: finalPos.x, y1: finalPos.y }
      : { x2: finalPos.x, y2: finalPos.y };

    onWindowUpdate?.(dw.windowId, updates);
  }

  // Reset drag state
  isDraggingWallEndpoint = false;
  isDraggingWindowEndpoint = false;
  draggedWalls = [];
  draggedWindows = [];
  draggedEndpointRequiresGridSnap = false;
  draggedWindowEndpointRequiresGridSnap = false;
  nearbyEndpoint = null;
}
```

Key points:
- Sends API updates for both walls and windows
- Resets all drag state flags for both types
- Ensures consistent final positions

---

## Files Modified

### `apps/web/src/lib/components/SceneCanvas.svelte`
- Lines 4415-4530: Added shared wall/window endpoint drag handling in `handleMouseMove`
- Lines 4714-4753: Added shared wall/window endpoint drag completion in `handleMouseUp`

Total changes: +87 lines, -2 lines

---

## Testing

### Build Verification
```bash
cd D:\Projects\VTT\apps\web
pnpm run build
```
Result: Build succeeded with no TypeScript errors (only accessibility warnings)

### Docker Deployment
```bash
cd D:\Projects\VTT
docker-compose up -d --build
```

Container status:
- vtt_server: Up 6 seconds (healthy)
- vtt_web: Up 5 seconds (healthy)
- vtt_nginx: Up 23 hours (healthy)
- vtt_db: Up 24 hours (healthy)
- vtt_redis: Up 24 hours (healthy)

All containers running successfully.

---

## Expected Behavior After Fix

When user drags a shared endpoint:

1. **Mouse down on endpoint**
   - Both `isDraggingWallEndpoint` and `isDraggingWindowEndpoint` set to true
   - Both `draggedWalls` and `draggedWindows` populated

2. **Mouse move**
   - Shared handler executes first
   - Position calculated once with snapping
   - BOTH wall and window positions updated in local state
   - Both rendered in same frame
   - User sees smooth, synchronized movement

3. **Mouse up**
   - Shared handler executes first
   - Final position calculated (with snap-to-endpoint if applicable)
   - API updates sent for ALL walls
   - API updates sent for ALL windows
   - All drag state reset

---

## Git Commit

```
fix(canvas): Wall and window endpoint drag simultaneously

When dragging a shared endpoint between a wall and window, both now
move together during the drag instead of sequentially.

Changes:
- Added shared drag handler in handleMouseMove that updates both walls
  and windows when both isDraggingWallEndpoint and isDraggingWindowEndpoint
  are true
- Added shared drag completion handler in handleMouseUp that persists
  both wall and window positions together
- Both handlers check for the shared condition first before falling back
  to individual wall-only or window-only drag handling
- Uses same snapped position for both elements during drag

This ensures smooth, synchronized movement when dragging shared endpoints.
```

Commit: `c41de04`
Pushed to: `origin/master`

---

## Technical Details

### Snapping Logic
- The shared snapping flag `draggedEndpointRequiresGridSnap` is calculated during drag initialization
- It's set to true if ANY wall OR window has `snapToGrid` enabled
- This ensures consistent snapping behavior for all connected elements

### Snap-to-Endpoint Feature
- The `nearbyEndpoint` detection still uses the first dragged wall for exclusion logic
- This prevents the endpoint from snapping to itself
- When a nearby endpoint is found, both walls and windows snap to it

### Performance Considerations
- No additional overhead - just reorganized existing code paths
- Same number of render calls
- Same visibility cache invalidation
- Just happens in one pass instead of two

---

## Status

**COMPLETE** - All tasks finished successfully:
- [x] Explored codebase to find drag handling code
- [x] Analyzed current drag implementation
- [x] Fixed handleMouseMove to update both simultaneously
- [x] Fixed handleMouseUp to persist both simultaneously
- [x] Build verification passed
- [x] Committed changes
- [x] Pushed to GitHub
- [x] Deployed to Docker
- [x] Verified containers running
- [x] Session notes documented

---

## Next Steps

No follow-up work required. The fix is complete and deployed.
