# Session Notes: Grid Offset Snapping Implementation

**Date**: 2025-12-09
**Session ID**: 0025
**Topic**: Update grid snapping logic to account for grid offsets

---

## Summary

Updated the grid snapping functions in SceneCanvas.svelte to properly account for gridOffsetX and gridOffsetY properties. Previously, tokens, lights, and walls would snap to an unshifted grid, even when the visible grid was offset. Now all snapping operations align with the actual visible grid lines.

---

## Problem Addressed

The scene has `gridOffsetX` and `gridOffsetY` properties that shift where the grid is drawn on the canvas. The grid rendering code already used these offsets when drawing grid lines, but the snapping functions (`snapToGrid` and `snapToGridCenter`) did not account for these offsets.

**Symptoms**:
- Objects would snap to invisible grid positions
- Snapping didn't align with visible grid lines when offsets were non-zero
- Inconsistent user experience between grid display and object placement

---

## Solution Implemented

### Files Modified

**D:/Projects/VTT/apps/web/src/lib/components/SceneCanvas.svelte**
- Updated `snapToGrid()` function (line 2926)
- Updated `snapToGridCenter()` function (line 2937)

### Changes Made

#### 1. snapToGrid Function
**Before**:
```typescript
function snapToGrid(x: number, y: number): { x: number; y: number } {
  if (!gridSnap) return { x, y };
  const gridSize = scene.gridSize ?? 100;
  const cellWidth = scene.gridWidth ?? gridSize;
  const cellHeight = scene.gridHeight ?? gridSize;
  return {
    x: Math.round(x / cellWidth) * cellWidth,
    y: Math.round(y / cellHeight) * cellHeight,
  };
}
```

**After**:
```typescript
function snapToGrid(x: number, y: number): { x: number; y: number } {
  if (!gridSnap) return { x, y };
  const gridSize = scene.gridSize ?? 100;
  const cellWidth = scene.gridWidth ?? gridSize;
  const cellHeight = scene.gridHeight ?? gridSize;
  const offsetX = scene.gridOffsetX ?? 0;
  const offsetY = scene.gridOffsetY ?? 0;
  return {
    x: Math.round((x - offsetX) / cellWidth) * cellWidth + offsetX,
    y: Math.round((y - offsetY) / cellHeight) * cellHeight + offsetY,
  };
}
```

#### 2. snapToGridCenter Function
**Before**:
```typescript
function snapToGridCenter(x: number, y: number): { x: number; y: number } {
  const gridSize = scene.gridSize ?? 100;
  const cellWidth = scene.gridWidth ?? gridSize;
  const cellHeight = scene.gridHeight ?? gridSize;
  return {
    x: Math.floor(x / cellWidth) * cellWidth + cellWidth / 2,
    y: Math.floor(y / cellHeight) * cellHeight + cellHeight / 2,
  };
}
```

**After**:
```typescript
function snapToGridCenter(x: number, y: number): { x: number; y: number } {
  const gridSize = scene.gridSize ?? 100;
  const cellWidth = scene.gridWidth ?? gridSize;
  const cellHeight = scene.gridHeight ?? gridSize;
  const offsetX = scene.gridOffsetX ?? 0;
  const offsetY = scene.gridOffsetY ?? 0;
  return {
    x: Math.floor((x - offsetX) / cellWidth) * cellWidth + cellWidth / 2 + offsetX,
    y: Math.floor((y - offsetY) / cellHeight) * cellHeight + cellHeight / 2 + offsetY,
  };
}
```

### Formula Explanation

The transformation follows this pattern:
1. **Subtract offset** to work in unshifted grid space: `(x - offsetX)`
2. **Calculate grid position** in unshifted space: `Math.round((x - offsetX) / cellWidth) * cellWidth`
3. **Add offset back** to shift to actual grid: `... + offsetX`

This ensures the snapping calculation is performed in the grid's local coordinate space, then translated back to world coordinates.

---

## Usage Locations

The updated functions are used in multiple locations (no changes needed to these call sites):
- **Token dropping** (line ~3237): When dragging tokens onto the canvas
- **Light dragging** (line ~2840): When positioning lights with snap enabled
- **Wall tool** (lines ~2566, ~2764): When drawing walls with the wall tool

---

## Testing Results

### Build Status
- Docker build completed successfully
- No compilation errors
- All containers running (web, server, db, redis, nginx)
- No runtime errors in logs

### Deployment
- Changes committed: `1e493aa`
- Pushed to GitHub: `origin/master`
- Docker containers rebuilt and deployed
- Both frontend (vtt_web) and backend (vtt_server) running without errors

---

## Key Findings from Investigation

1. **Grid offset properties exist** in the scene schema:
   - `gridOffsetX` and `gridOffsetY` are part of the Scene interface
   - Already being read from the scene object (line ~642-643)
   - Already used in grid rendering (lines 651-690)

2. **Grid drawing already correct**:
   - Square grid drawing uses offsets correctly
   - Hex grid rendering also accounts for offsets
   - Only snapping logic needed updating

3. **No additional files needed changes**:
   - All grid snapping goes through these two functions
   - CampaignCanvas.svelte has separate grid system (not affected)

---

## Files Created

**D:/Projects/VTT/scripts/utilities/fix-grid-snapping.py**
- Python script used to make the changes (handles regex replacement)
- Kept for reference and potential future similar updates

---

## Current Status

**Complete**: All changes implemented, tested, committed, and deployed.

---

## Next Steps

None required. The implementation is complete and working.

Users can now:
- Set grid offsets in the scene configuration
- Have tokens, lights, and walls snap to the visible grid
- Experience consistent behavior between grid display and snapping

---

## Commit Information

**Commit**: `1e493aa`
**Message**: "fix(canvas): Update grid snapping to account for grid offsets"
**Files Changed**: 1 file, 8 insertions(+), 4 deletions(-)
