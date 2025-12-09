# Session Notes: Light Rendering Pixel Precision Fix

**Date:** 2025-12-08
**Session ID:** 0011
**Topic:** Fixing Light Rendering Issues with Pixel-Centered Coordinates

## Summary

Continued investigation and fix for the light rendering bug where lights would intermittently fail to display their gradients. The issue was traced to floating-point coordinate precision problems in the Canvas 2D API, particularly at grid boundaries.

## Problem Analysis

### Initial Symptoms
1. "Last light not rendering" - initially appeared to be order-dependent
2. Lights would flicker when moved
3. Lights would fail to render at certain positions

### Key Discovery by User
The user identified a critical pattern:
- Lights work correctly when interacting with walls (visibility polygon clipping)
- Lights fail when placed near grid cell corners (where 4 cells meet)
- Lights fail when placed between grid cells (on grid edges)
- Enabling snap-to-grid made lights work consistently

### Root Cause
The Canvas 2D API has sub-pixel precision issues when:
1. Coordinates fall exactly on pixel/grid boundaries
2. There's a mismatch between clipping path vertices and gradient centers
3. Radii use floating-point values

## Solution: Pixel-Centered Coordinates

The fix uses `Math.floor(x) + 0.5` to center all coordinates on pixels, avoiding exact grid boundaries.

### Changes Made

#### 1. renderLight() - Light Source Position
**File:** `apps/web/src/lib/components/SceneCanvas.svelte` (lines 1121-1124)
```typescript
function renderLight(ctx: CanvasRenderingContext2D, light: AmbientLight, time: number) {
  // Use floor + 0.5 to center on pixel and avoid exact grid boundaries
  // This prevents edge cases when light is at grid cell corners
  const x = Math.floor(light.x) + 0.5;
  const y = Math.floor(light.y) + 0.5;
```

#### 2. getVisibilityPolygon() - Visibility Source Position
**File:** `apps/web/src/lib/components/SceneCanvas.svelte` (lines 543-550)
```typescript
function getVisibilityPolygon(sourceId: string, x: number, y: number, radius: number): Point[] {
  // Use floor + 0.5 to center on pixel and avoid exact grid boundaries
  const adjustedX = Math.floor(x) + 0.5;
  const adjustedY = Math.floor(y) + 0.5;
  const roundedRadius = Math.round(radius);

  // Use floor values for cache key (stable across 0.5 offset)
  const cacheKey = `${sourceId}-${Math.floor(x)}-${Math.floor(y)}-${roundedRadius}`;
```

#### 3. renderClippedLight() - Clipping Path Vertices
**File:** `apps/web/src/lib/components/SceneCanvas.svelte` (lines 1099-1105)
```typescript
// Create clipping path from visibility polygon
// Use floor + 0.5 to center on pixels (consistent with light source positioning)
ctx.beginPath();
ctx.moveTo(Math.floor(visibilityPolygon[0].x) + 0.5, Math.floor(visibilityPolygon[0].y) + 0.5);
for (let i = 1; i < visibilityPolygon.length; i++) {
  ctx.lineTo(Math.floor(visibilityPolygon[i].x) + 0.5, Math.floor(visibilityPolygon[i].y) + 0.5);
}
```

#### 4. Animated Radii Rounding
**File:** `apps/web/src/lib/components/SceneCanvas.svelte` (lines 1172-1174)
```typescript
// Round animated radii to fix canvas rendering issues with sub-pixel precision
animatedBright = Math.round(animatedBright);
animatedDim = Math.round(animatedDim);
```

## Why floor + 0.5 Works

1. **Avoids exact boundaries**: Grid lines fall at integer positions (0, 100, 200, etc.). Using floor + 0.5 ensures coordinates are always at x.5 positions (0.5, 100.5, 200.5), never exactly on grid lines.

2. **Consistent pixel centering**: All coordinates (source, polygon vertices, gradient center) use the same transformation, ensuring alignment.

3. **Stable caching**: The cache key uses `Math.floor(x)` which remains stable as coordinates get the 0.5 offset.

## Previous Attempts That Didn't Fully Work

1. **Math.round()** - Fixed grid corners but not grid edges
2. **Position-based cache keys** - Helped with cache but didn't fix rendering
3. **Removed cache invalidation** - Reduced thrashing but didn't fix the visual bug

## Testing Status

Changes deployed to Docker containers. User testing in progress for:
1. Grid corner positions (where 4 cells meet) - Fixed
2. Grid edge positions (between 2 cells) - Testing
3. Moving lights freely - Testing
4. Wall occlusion still working - Testing

## Debug Markers Still Present

The following debug markers are still in the code for verification:
- **Blue marker**: Drawn outside clip in `renderClippedLight()` at (source.x, source.y - 30)
- **Red marker**: Drawn inside clip in `renderLightGradient()` at light center

These should be removed once the fix is fully verified.

## Files Modified

- `apps/web/src/lib/components/SceneCanvas.svelte`
  - Lines 543-550: getVisibilityPolygon() coordinate adjustment
  - Lines 556-557: computeVisibilityPolygon() uses adjusted coordinates
  - Lines 1099-1105: renderClippedLight() polygon vertex adjustment
  - Lines 1121-1124: renderLight() coordinate adjustment
  - Lines 1172-1174: animatedBright/animatedDim rounding

## Next Steps

1. User verifies all light positions render correctly
2. Remove debug markers (red/blue circles)
3. Commit and push the fix
4. Rebuild Docker containers with clean code
5. Create session notes for final fix

## Key Technical Insights

### Canvas 2D API Clipping Behavior
The Canvas 2D `clip()` method can behave unexpectedly when:
- Path vertices are at sub-pixel positions
- Gradient centers don't align with clip path vertices
- Coordinates fall exactly on integer boundaries

### The floor + 0.5 Pattern
This is a common technique in graphics programming to ensure pixel-perfect rendering:
```javascript
const pixelCenteredX = Math.floor(x) + 0.5;
```
It ensures coordinates are always at the center of a pixel, avoiding anti-aliasing artifacts and boundary edge cases.

## Related Files

- Previous session notes: `2025-12-08-0010-Light-Rendering-Cache-Fix.md`
- Console log capture: `docs/tmp/console.txt`
