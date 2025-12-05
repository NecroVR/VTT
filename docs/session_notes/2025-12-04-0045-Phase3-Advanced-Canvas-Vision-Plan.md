# Phase 3: Advanced Canvas & Vision - Implementation Plan

**Date**: 2025-12-04
**Session ID**: 0045
**Topic**: Phase 3 Planning and Implementation Kickoff

---

## Executive Summary

Phase 3 focuses on implementing Advanced Canvas & Vision systems including dynamic lighting, fog of war, token vision, and advanced wall interactions. The codebase already has all necessary database schemas, REST APIs, and UI components - the work is primarily rendering algorithms and geometry calculations.

---

## Current State Analysis

### What Already Exists

1. **Database Schemas** (all properties ready)
   - `ambientLights`: bright, dim, angle, color, alpha, animationType, walls (blocking)
   - `walls`: move, sense, sound, door, doorState
   - `tokens`: vision, visionRange, lightBright, lightDim, lightColor, lightAngle
   - `scenes`: tokenVision, fogExploration, globalLight, darkness

2. **REST APIs** (full CRUD ready)
   - `/api/v1/scenes/:sceneId/lights` - Light management
   - `/api/v1/scenes/:sceneId/walls` - Wall management
   - `/api/v1/scenes/:sceneId/tokens` - Token management

3. **UI Components** (ready for integration)
   - `LightingConfig.svelte` - Complete light property editor
   - `TokenConfig.svelte` - Vision and light emission settings
   - `SceneControls.svelte` - Tool selection (wall, light, select, measure)

4. **Canvas Architecture**
   - Multi-layer canvas (5 layers)
   - View management (pan, zoom, scale)
   - Image caching
   - Wall/token rendering

### What Needs Implementation

1. **Light Rendering** - Radial gradients with color/alpha
2. **Wall Occlusion** - Shadow casting from walls
3. **Token Vision** - Line-of-sight calculation
4. **Fog of War** - Per-player exploration tracking
5. **Performance** - Layer caching, culling, potential WebGL

---

## Implementation Plan

### Phase 3.1: Dynamic Lighting System

**Goal**: Render ambient lights with proper bright/dim gradients

**Tasks**:
1. Add lighting layer to SceneCanvas (between walls and tokens)
2. Implement radial gradient rendering for lights
3. Handle bright radius (full color) and dim radius (fade)
4. Support light cone angles (directional lights)
5. Implement light color blending
6. Add animation effects (torch flicker, pulse)
7. Integrate with darkness level from scene

**Files to Modify**:
- `apps/web/src/lib/components/SceneCanvas.svelte`

**Key Algorithm**:
```typescript
function renderLight(light: AmbientLight) {
  // Create radial gradient from bright to dim
  const gradient = ctx.createRadialGradient(
    light.x, light.y, light.bright,
    light.x, light.y, light.dim
  );
  gradient.addColorStop(0, light.color with full alpha);
  gradient.addColorStop(0.5, light.color fading);
  gradient.addColorStop(1, transparent);

  // If angle < 360, clip to cone
  if (light.angle < 360) {
    clipToCone(light.x, light.y, light.rotation, light.angle);
  }

  ctx.fillStyle = gradient;
  ctx.fill();
}
```

### Phase 3.2: Wall Occlusion (Light Blocking)

**Goal**: Walls with `sense: 'block'` cast shadows from lights

**Tasks**:
1. Implement ray casting from light source
2. Calculate shadow polygons from walls
3. Subtract shadow areas from light rendering
4. Optimize with pre-calculated visibility

**Key Algorithm**: Shadow Volume / Ray Casting
```typescript
function calculateShadow(light: Point, wall: Wall) {
  // Cast rays from light to wall endpoints
  // Extend rays past wall to create shadow polygon
  // Return shadow polygon points
}
```

### Phase 3.3: Token Vision System

**Goal**: Tokens with `vision: true` reveal areas based on line-of-sight

**Tasks**:
1. Implement line-of-sight calculation from token position
2. Check wall intersections (walls with `sense: 'block'`)
3. Render vision area with gradual fade
4. Support vision range limits
5. Add darkvision modes (see in darkness)
6. Token light emission (acts as personal light source)

**Key Algorithm**: Visibility Polygon
```typescript
function calculateVisibility(token: Token, walls: Wall[]) {
  // Cast rays in all directions from token
  // Find intersections with walls
  // Build visibility polygon
  // Apply vision range limit
}
```

### Phase 3.4: Fog of War

**Goal**: Track explored areas per player, hide unexplored

**Tasks**:
1. Add fog exploration storage (per player, per scene)
2. Create fog rendering layer
3. Implement revealed vs unexplored states
4. Add GM reveal/hide tools
5. Persistent fog state across sessions
6. Integrate with token vision (auto-reveal)

**Database Addition**:
```sql
CREATE TABLE fog_exploration (
  id UUID PRIMARY KEY,
  sceneId UUID REFERENCES scenes(id),
  userId UUID REFERENCES users(id),
  exploredData JSONB, -- Bitmap or polygon of explored areas
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Phase 3.5: Advanced Wall Types

**Goal**: Doors open/close, windows show but block movement

**Tasks**:
1. Door interaction UI (click to open/close)
2. Door rendering states (open vs closed visual)
3. Locked door mechanics (GM unlock)
4. Window type (vision through, blocks movement)
5. Secret doors (GM-only visibility)
6. Wall endpoint editing

### Phase 3.6: Canvas Performance

**Goal**: Optimize for complex scenes with many lights/tokens

**Tasks**:
1. Layer caching (static background/grid)
2. Dirty rectangle optimization
3. Entity culling (skip off-screen)
4. Consider PixiJS/WebGL for lighting effects
5. Pre-calculate visibility on turn change (not every frame)

---

## Technical Approach

### Rendering Compositing

```
Layer Order (bottom to top):
1. Background (cached) - Scene background image
2. Darkness (conditional) - Global darkness overlay
3. Lighting (dynamic) - Light gradients
4. Grid (cached) - Square/hex grid
5. Fog (per-user) - Unexplored areas black
6. Tokens (dynamic) - Token images
7. Walls (GM only) - Wall geometry
8. UI (dynamic) - Selection, hover, controls
```

### Darkness System

```typescript
// Scene darkness level 0-1
// 0 = full daylight (no effect)
// 1 = pitch black (need light to see)

function applyDarkness(darkness: number) {
  if (darkness === 0 || scene.globalLight) return;

  // Draw darkness overlay
  ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
  ctx.fillRect(0, 0, width, height);

  // Cut out lit areas with destination-out
  ctx.globalCompositeOperation = 'destination-out';
  renderAllLights();
  ctx.globalCompositeOperation = 'source-over';
}
```

### Vision Algorithm Options

**Option 1: Ray Casting** (simple, moderate performance)
- Cast N rays from token (e.g., 360 rays)
- Find first wall intersection per ray
- Connect intersection points to form polygon

**Option 2: Visibility Polygon** (complex, better quality)
- Build segment list from all walls
- Sort by angle from token
- Sweep line algorithm to find visibility edges

**Recommendation**: Start with ray casting (simpler), optimize if needed

---

## Implementation Order

1. **Session 0045-0047**: Dynamic Lighting System
   - Basic light rendering (gradients)
   - Light cone angles
   - Animation effects

2. **Session 0048-0049**: Token Vision Basic
   - Vision range circles
   - Simple line-of-sight (no wall blocking yet)

3. **Session 0050-0052**: Wall Occlusion
   - Wall-light shadow casting
   - Wall-vision blocking
   - Integration tests

4. **Session 0053-0055**: Fog of War
   - Database schema
   - Fog rendering
   - GM controls

5. **Session 0056-0057**: Advanced Walls
   - Door mechanics
   - Window type
   - Secret doors

6. **Session 0058-0059**: Performance
   - Layer caching
   - Culling
   - Optimization

---

## Dependencies

### NPM Packages (potential additions)
- None required for basic implementation
- Consider `pixi.js` if WebGL needed for performance
- Consider `poly2tri` for triangulation if complex polygons needed

### Database Migrations
- `fog_exploration` table (Phase 3.4)

---

## Success Criteria

### Phase 3 Complete When:
1. Lights render with proper bright/dim gradients
2. Light cones render correctly
3. Walls block light/vision appropriately
4. Token vision reveals fog of war
5. Fog persists between sessions
6. Doors can be opened/closed
7. Performance acceptable with 10+ lights, 20+ tokens, 50+ walls

---

## Risk Assessment

### High Risk
- **Performance**: Complex lighting + vision can be CPU intensive
  - Mitigation: Cache calculations, pre-compute on turn change

### Medium Risk
- **Algorithm Complexity**: Visibility polygons are non-trivial
  - Mitigation: Start with simpler ray casting approach

### Low Risk
- **Integration**: APIs and schemas already exist
  - Just connecting rendering to existing data

---

## Next Steps

1. Begin with Dynamic Lighting System implementation
2. Add `lightingCanvas` layer to SceneCanvas
3. Implement `renderLights()` function with radial gradients
4. Test with existing lights data

---

**Session Status**: Planning Complete, Ready for Implementation
**Next Session**: 0046 - Dynamic Lighting Implementation
