# Session Notes: Delete Spline Point Context Menu Option

**Date**: 2025-12-10
**Session ID**: 0032
**Topic**: Delete Spline Point Feature

---

## Session Summary

Implemented the "Delete Spline Point" context menu option for curved walls, allowing users to remove individual control points from curved walls by right-clicking on them. This complements the existing "Add Spline Point" feature and provides full control over spline point management.

---

## Objectives

- Add context menu option to delete individual control points from curved walls
- Detect when user right-clicks on a control point vs. the wall itself
- Show appropriate menu items based on what was clicked
- Update wall geometry after control point deletion

---

## Implementation Details

### 1. Context Menu State Management

**File**: `apps/web/src/lib/components/SceneCanvas.svelte`

Added new state variable to track which control point (if any) was clicked:

```typescript
let contextMenuControlPointIndex: number | null = null;
```

### 2. Control Point Click Detection

Modified the context menu opening logic to detect control point clicks before wall clicks:

```typescript
// Check for control point at position (for curved walls)
const controlPointHit = findControlPointAtPoint(worldX, worldY);
if (controlPointHit) {
  const wall = walls.find(w => w.id === controlPointHit.wallId);
  if (wall) {
    showContextMenu = true;
    contextMenuX = e.clientX;
    contextMenuY = e.clientY;
    contextMenuElementType = 'wall';
    contextMenuElementId = controlPointHit.wallId;
    contextMenuControlPointIndex = controlPointHit.controlPointIndex;
    // ... other state setup
    return;
  }
}

// Check for wall at position (if not clicking on control point)
const clickedWallId = findWallAtPoint(worldX, worldY);
if (clickedWallId) {
  // ... existing wall click logic
  contextMenuControlPointIndex = null; // Not clicking on a control point
  return;
}
```

This ensures:
- Control point clicks take priority over wall clicks
- The menu knows whether a control point or the wall itself was clicked
- The `controlPointIndex` is tracked for later deletion

### 3. Delete Spline Point Handler

**File**: `apps/web/src/lib/components/SceneCanvas.svelte`

Added handler to remove the control point at the specified index:

```typescript
function handleDeleteSplinePoint(event: CustomEvent<{ controlPointIndex: number }>) {
  showContextMenu = false;
  if (contextMenuElementType === 'wall' && contextMenuElementId) {
    const wall = walls.find(w => w.id === contextMenuElementId);
    if (wall && wall.wallShape === 'curved') {
      const existingControlPoints = wall.controlPoints || [];

      // Remove the control point at the specified index
      const newControlPoints = [
        ...existingControlPoints.slice(0, event.detail.controlPointIndex),
        ...existingControlPoints.slice(event.detail.controlPointIndex + 1)
      ];

      // Update the wall with the new control points array
      // If this was the last control point, the wall becomes effectively straight
      // (but remains wallShape: 'curved' with empty controlPoints)
      onWallUpdate?.(contextMenuElementId, { controlPoints: newControlPoints });
    }
  }
}
```

Key features:
- Removes control point using array slicing
- Preserves wall's `wallShape: 'curved'` type even with zero control points
- Wall with empty `controlPoints` array renders as a straight line

### 4. SceneContextMenu Component Updates

**File**: `apps/web/src/lib/components/SceneContextMenu.svelte`

#### Added Prop

```typescript
export let controlPointIndex: number | null = null;
```

#### Added Event Type

```typescript
const dispatch = createEventDispatcher<{
  // ... existing events
  deleteSplinePoint: { controlPointIndex: number };
  // ... existing events
}>();
```

#### Added Handler

```typescript
function handleDeleteSplinePoint() {
  if (controlPointIndex !== null) {
    dispatch('deleteSplinePoint', { controlPointIndex });
    close();
  }
}
```

#### Modified Menu Items Display Logic

Updated the "Add Spline Point" menu item to only show when NOT clicking on a control point:

```svelte
<!-- Add Spline Point (curved walls only) -->
{#if elementType === 'wall' && wallShape === 'curved' && controlPointIndex === null}
  <button class="menu-item" on:click={handleAddSplinePoint}>
    <!-- ... -->
    <span>Add Spline Point</span>
  </button>
{/if}
```

Added new "Delete Spline Point" menu item that only shows when clicking on a control point:

```svelte
<!-- Delete Spline Point (curved walls only, when clicking on a control point) -->
{#if elementType === 'wall' && wallShape === 'curved' && controlPointIndex !== null}
  <button class="menu-item danger" on:click={handleDeleteSplinePoint}>
    <span class="icon">
      <!-- Trash icon -->
      <svg>...</svg>
    </span>
    <span>Delete Spline Point</span>
  </button>
{/if}
```

Features:
- Uses red/danger styling (same as "Delete Wall")
- Uses trash icon (same as other delete operations)
- Only visible when right-clicking directly on a control point
- Mutually exclusive with "Add Spline Point" option

### 5. Event Wiring

**File**: `apps/web/src/lib/components/SceneCanvas.svelte`

Added the new prop and event handler to the SceneContextMenu component:

```svelte
<SceneContextMenu
  controlPointIndex={contextMenuControlPointIndex}
  on:deleteSplinePoint={handleDeleteSplinePoint}
  <!-- ... other props and events -->
/>
```

---

## User Experience

### Context Menu Behavior

1. **Right-click on control point**:
   - Shows "Delete Spline Point" option (red/danger styling)
   - Does NOT show "Add Spline Point" option

2. **Right-click on curved wall (not on control point)**:
   - Shows "Add Spline Point" option
   - Does NOT show "Delete Spline Point" option

3. **After deletion**:
   - Control point is removed immediately
   - Wall curve updates to reflect the change
   - Wall remains type "curved" even if all control points are removed
   - Wall with zero control points renders as straight line

---

## Technical Details

### Control Point Detection

The implementation reuses the existing `findControlPointAtPoint()` function:

```typescript
function findControlPointAtPoint(worldX: number, worldY: number): { wallId: string; controlPointIndex: number } | null {
  const threshold = 8 / scale; // Same as endpoint detection

  for (const wall of walls) {
    if (wall.wallShape === 'curved' && wall.controlPoints && wall.controlPoints.length > 0) {
      for (let i = 0; i < wall.controlPoints.length; i++) {
        const cp = wall.controlPoints[i];
        const dx = worldX - cp.x;
        const dy = worldY - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= threshold) {
          return { wallId: wall.id, controlPointIndex: i };
        }
      }
    }
  }

  return null;
}
```

Features:
- Uses 8-pixel threshold (in world coordinates) for hit detection
- Returns both wall ID and control point index
- Consistent with endpoint detection logic

### Array Manipulation

Control point deletion uses array slicing for immutability:

```typescript
const newControlPoints = [
  ...existingControlPoints.slice(0, index),
  ...existingControlPoints.slice(index + 1)
];
```

This creates a new array without the element at `index`, preserving immutability for proper reactive updates.

---

## Files Modified

1. **apps/web/src/lib/components/SceneCanvas.svelte**
   - Added `contextMenuControlPointIndex` state variable
   - Modified context menu opening to detect control point clicks
   - Added `handleDeleteSplinePoint()` handler
   - Wired up new event to SceneContextMenu component

2. **apps/web/src/lib/components/SceneContextMenu.svelte**
   - Added `controlPointIndex` prop
   - Added `deleteSplinePoint` event type
   - Added `handleDeleteSplinePoint()` handler
   - Modified "Add Spline Point" visibility logic
   - Added "Delete Spline Point" menu item with danger styling

---

## Testing

### Build Verification

```bash
cd apps/web
pnpm run build
```

**Result**: Build succeeded with no errors (warnings about accessibility are pre-existing)

### Docker Deployment

```bash
docker-compose up -d --build
```

**Result**:
- All containers built and started successfully
- Server listening on port 3000
- Web listening on port 5173
- All services healthy

---

## Git Commit

**Commit Hash**: 39dcc20

**Message**:
```
feat(canvas): Add Delete Spline Point context menu option

- Add contextMenuControlPointIndex state variable to track clicked control point
- Detect control point clicks before wall clicks in context menu handler
- Add controlPointIndex prop to SceneContextMenu component
- Add handleDeleteSplinePoint handler to remove control point from array
- Add Delete Spline Point menu item with danger styling (red)
- Show Delete Spline Point only when right-clicking on a control point
- Show Add Spline Point only when NOT clicking on a control point
- Wire up deleteSplinePoint event from menu to canvas handler
```

---

## Next Steps

The curved wall feature set is now functionally complete with:
- ✅ Curved wall creation tool
- ✅ Control point visualization (cyan dots)
- ✅ Control point dragging (Shift+Click)
- ✅ Add spline point (right-click on curve)
- ✅ Delete spline point (right-click on control point)

Potential future enhancements:
- Control point snapping to other walls/grid
- Multi-select control points for bulk operations
- Keyboard shortcuts for add/delete operations
- Undo/redo support for control point operations

---

## Notes

- The wall remains `wallShape: 'curved'` even with zero control points
  - This is intentional - the wall type doesn't change
  - With empty `controlPoints`, the wall renders as a straight line
  - User can still add control points back to make it curved again

- Control point detection takes priority over wall detection
  - This ensures clicks on control points always show the correct menu
  - Makes the UX more predictable and intuitive

- Menu items are mutually exclusive based on click location
  - Right-click on control point: Shows "Delete Spline Point"
  - Right-click on wall (not control point): Shows "Add Spline Point"
  - This prevents confusion about which action will be performed

---

**Session End**: 2025-12-10
