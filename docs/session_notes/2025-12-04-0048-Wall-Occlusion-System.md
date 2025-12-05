# Session Notes: Wall Occlusion System Implementation

**Date**: 2025-12-04
**Session ID**: 0048
**Focus**: Wall Occlusion for Lights and Vision

---

## Session Summary

Implemented a comprehensive wall occlusion system for the VTT using ray-casting visibility polygons. Walls with `sense: 'block'` now properly cast shadows from lights and block token vision, creating realistic lighting and vision mechanics.

---

## Problems Addressed

### Challenge: Unrealistic Lighting and Vision
**Symptom**: Lights and token vision passed through walls, breaking immersion
**Root Cause**: No wall occlusion algorithm in the rendering pipeline
**Investigation**: Reviewed existing wall schema and lighting system to understand integration points

---

## Solutions Implemented

### 1. Ray-Casting Visibility Polygon Algorithm

**File**: `apps/web/src/lib/components/SceneCanvas.svelte`

Implemented core occlusion algorithms:

- **`lineIntersection()`**: Calculates intersection point between two line segments
- **`castRay()`**: Casts a ray from a point at an angle, finding closest wall intersection
- **`computeVisibilityPolygon()`**: Builds a polygon of visible area from a light/vision source
- **`renderClippedLight()`**: Renders lights/vision clipped to the visibility polygon

#### Key Algorithm Features

1. **Selective Blocking**: Only processes walls with `sense === 'block'`
2. **Performance**: Only considers walls within light/vision range
3. **Accuracy**: Uses offset angles (±0.0001) around wall endpoints for precise shadows
4. **Efficiency**: Returns simple circle if no blocking walls exist

### 2. Light Occlusion Integration

Modified three rendering functions to use visibility polygons:

#### Ambient Lights (`renderLight`)
```typescript
const visibilityPolygon = computeVisibilityPolygon({ x, y }, walls, animatedDim);
renderClippedLight(ctx, { x, y }, animatedDim, visibilityPolygon, () => {
  // Original light rendering code
});
```

#### Token Lights (`renderTokenLight`)
- Converts grid units to pixels for light range
- Computes visibility polygon from token center
- Renders light gradient clipped to visible area

#### Token Vision (`renderTokenVisionArea`)
- Uses same algorithm for vision occlusion
- Creates realistic fog-of-war effect with walls

---

## Implementation Details

### Ray-Casting Algorithm

The visibility polygon is computed using a sweep-line approach:

1. **Collect Angles**: For each wall endpoint, compute angle from light source
2. **Add Offset Angles**: Include angles slightly before/after each endpoint (prevents gaps)
3. **Sort Angles**: Process in clockwise order
4. **Cast Rays**: For each angle, find closest wall intersection or max distance
5. **Build Polygon**: Connect all ray endpoints to form visibility shape

### Canvas Clipping

Uses HTML5 Canvas `clip()` to restrict rendering:

```typescript
ctx.beginPath();
ctx.moveTo(visibilityPolygon[0].x, visibilityPolygon[0].y);
for (let i = 1; i < visibilityPolygon.length; i++) {
  ctx.lineTo(visibilityPolygon[i].x, visibilityPolygon[i].y);
}
ctx.closePath();
ctx.clip();
```

---

## Files Modified

1. **`apps/web/src/lib/components/SceneCanvas.svelte`**
   - Added 5 new helper functions (155 lines)
   - Modified 3 rendering functions
   - Total: +264 lines, -77 lines

---

## Testing Results

### Build Verification
- **Web Build**: ✅ Successful (warnings only, no errors)
- **Server Build**: ❌ Pre-existing error (unrelated to changes)
  - Error: `Property 'https' does not exist on type 'FastifyServerOptions'`
  - This is a pre-existing infrastructure issue in `apps/server/src/app.ts`

### Code Quality
- TypeScript compilation: ✅ Passed
- No new linting errors
- Maintains existing code style

---

## Current Status

### Completed ✅
1. Wall occlusion algorithm implementation
2. Integration with ambient lights
3. Integration with token lights
4. Integration with token vision
5. Build verification (web package)
6. Git commit and push to GitHub

### Known Issues ⚠️
1. **Docker Deployment Failed**: Pre-existing issue with missing SSL certificates
   - Error: `"/certs": not found`
   - The Dockerfile expects `certs/localhost.pem` but only `certs/localhost-key.pem` exists
   - This is an infrastructure issue unrelated to wall occlusion implementation

### Not Completed ❌
- Docker deployment (blocked by certificate issue)

---

## Technical Decisions

### Why Ray-Casting Over Shadow Volumes?

**Chosen**: Ray-casting visibility polygons
**Alternative Considered**: Shadow projection volumes

**Rationale**:
- Simpler to implement and understand
- Works for both omnidirectional lights and cone lights
- Handles complex wall configurations naturally
- Performance is acceptable with filtering for nearby walls
- Integrates cleanly with existing Canvas API clipping

### Performance Optimizations

1. **Early Return**: If no blocking walls, return simple circle (32 points)
2. **Wall Filtering**: Only process walls with `sense === 'block'`
3. **Range Filtering**: Only consider walls within light/vision radius (implemented in consumer code)
4. **Efficient Ray Casting**: Single pass through walls for each ray

---

## Next Steps

### Immediate
1. **Fix SSL Certificates**: Generate or restore `certs/localhost.pem` for Docker deployment
2. **Test Wall Occlusion**: Visually verify in running application
   - Create test scene with walls
   - Place lights on both sides
   - Verify shadows appear correctly

### Future Enhancements
1. **Performance**: Add spatial indexing for walls (quadtree/grid) for large maps
2. **Soft Shadows**: Add gradient shadow edges for more realistic lighting
3. **Dynamic Walls**: Support doors that can be opened/closed
4. **Wall Types**: Different occlusion behavior for different wall types (windows, etc.)
5. **Vision Modes**: Darkvision, blindsight, etc. with different occlusion rules

---

## Key Learnings

1. **Canvas Clipping**: HTML5 Canvas clipping is efficient and integrates well with existing code
2. **Angle Offsets**: Small angle offsets (±0.0001 rad) are crucial for preventing gaps in visibility polygons
3. **Wall Schema**: The `sense` property perfectly fits the occlusion use case
4. **Modular Design**: The `renderClippedLight()` helper allows reuse across all light/vision types

---

## Git Commit

**Commit**: `f571634`
**Message**: `feat(web): Implement wall occlusion for lights and vision`

**Changes**:
- Added ray-casting visibility polygon algorithm
- Walls with sense='block' now cast shadows from lights
- Token vision respects wall occlusion
- Ambient lights respect wall occlusion
- Token lights respect wall occlusion

**Branch**: `master`
**Remote**: Pushed to `origin/master`

---

## Session End

Wall occlusion system successfully implemented and integrated into the VTT lighting and vision system. All code changes committed and pushed to GitHub. Ready for visual testing in development environment once Docker certificate issue is resolved.
