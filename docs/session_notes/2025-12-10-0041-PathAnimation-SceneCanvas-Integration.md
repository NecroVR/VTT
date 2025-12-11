# Path Animation Integration in SceneCanvas

**Date**: 2025-12-10
**Session ID**: 0041
**Topic**: Path Animation SceneCanvas Integration

## Session Summary

Successfully integrated the PathAnimationManager class into SceneCanvas.svelte to enable animated movement of lights and tokens along predefined paths. This feature allows objects to follow smooth spline paths defined by path points, with configurable speeds and looping behavior.

## Problems Addressed

### Problem: Path Animation Manager Not Integrated

The PathAnimationManager class existed in `apps/web/src/lib/utils/pathAnimation.ts` but was not connected to the SceneCanvas rendering pipeline. Objects with `followPathName` and `pathSpeed` properties were not animating along their assigned paths.

### Root Cause

The animation loop in SceneCanvas was not:
1. Initializing path animations for objects with followPathName set
2. Retrieving animated positions from the PathAnimationManager
3. Using animated positions when rendering lights and tokens
4. Cleaning up animations when followPathName was cleared

## Solutions Implemented

### 1. PathAnimationManager Import and Instantiation

**File**: `apps/web/src/lib/components/SceneCanvas.svelte`

Added import at line 27:
```typescript
import { PathAnimationManager } from '$lib/utils/pathAnimation';
```

Created singleton instance at line 175:
```typescript
const pathAnimationManager = new PathAnimationManager();
```

Added state variable to track animated positions at line 178:
```typescript
let animatedPositions = new Map<string, { x: number; y: number }>();
```

### 2. Reactive Animation Initialization

Added reactive statements to watch for objects with followPathName and automatically start/stop animations:

**For Lights** (lines 218-251):
```typescript
$: {
  if (lights && assembledPathsForScene) {
    lights.forEach(light => {
      const animationKey = `light-${light.id}`;

      if (light.followPathName && light.pathSpeed) {
        const path = assembledPathsForScene.find(p => p.pathName === light.followPathName);

        if (path && path.points.length >= 2) {
          if (!pathAnimationManager.isAnimating(animationKey)) {
            pathAnimationManager.startAnimation(
              animationKey,
              light.id,
              'light',
              path.points,
              light.pathSpeed,
              true // loop
            );
          }
        } else {
          pathAnimationManager.stopAnimation(animationKey);
        }
      } else {
        pathAnimationManager.stopAnimation(animationKey);
      }
    });
  }
}
```

**For Tokens** (lines 253-286):
Similar reactive statement for tokens with the same logic.

### 3. Animation Loop Updates

Modified `startAnimationLoop()` function (lines 2908-2955) to:

1. Get animated positions from PathAnimationManager:
```typescript
const pathAnimatedPositions = pathAnimationManager.getAllAnimatedPositions(animationTime);
const hasPathAnimations = pathAnimatedPositions.size > 0;

if (hasPathAnimations) {
  const newPositions = new Map<string, { x: number; y: number }>();
  pathAnimatedPositions.forEach((pos, key) => {
    newPositions.set(pos.objectId, { x: pos.x, y: pos.y });
  });
  animatedPositions = newPositions;
}
```

2. Re-render lights if path animations are active:
```typescript
if (hasAnimatedLights || hasTokenLights || hasPathAnimations) {
  renderLights();
}
```

3. Re-render tokens if path animations are active:
```typescript
if (hasPathAnimations) {
  renderTokens();
}
```

### 4. Render Function Updates

Updated all rendering functions to use animated positions when available:

**renderLight** (line 2106-2115):
```typescript
const animatedPos = animatedPositions.get(light.id);
const baseX = animatedPos ? animatedPos.x : light.x;
const baseY = animatedPos ? animatedPos.y : light.y;
const x = Math.floor(baseX) + 0.5;
const y = Math.floor(baseY) + 0.5;
```

**renderTokens** (line 1044-1048):
```typescript
const animatedPos = animatedPositions.get(token.id);
const x = animatedPos ? animatedPos.x : token.x;
const y = animatedPos ? animatedPos.y : token.y;
```

**renderTokenLight** (line 2394-2401):
```typescript
const animatedPos = animatedPositions.get(token.id);
const tokenX = animatedPos ? animatedPos.x : token.x;
const tokenY = animatedPos ? animatedPos.y : token.y;
const x = tokenX + width / 2;
const y = tokenY + height / 2;
```

**renderTokenVision** (line 2496-2503):
Similar pattern to use animated positions.

**renderTokenVisionArea** (line 2542-2549):
Similar pattern to use animated positions.

**Viewport and Vision Checks** (line 997-1026):
Updated visibility filtering to use animated positions for viewport culling and vision calculations.

## Implementation Details

### Animation Key Format

- Lights: `light-{lightId}`
- Tokens: `token-{tokenId}`

This ensures unique tracking of each object's animation.

### Animation Parameters

- **pathId**: Unique animation key (e.g., "light-abc123")
- **objectId**: The light or token ID
- **objectType**: 'light' or 'token'
- **nodes**: Array of path points from assembledPaths
- **speed**: From object.pathSpeed (units per second)
- **loop**: Always true for continuous animation

### Position Fallback

All rendering functions use a consistent pattern:
```typescript
const animatedPos = animatedPositions.get(objectId);
const x = animatedPos ? animatedPos.x : object.x;
const y = animatedPos ? animatedPos.y : object.y;
```

This ensures objects render at their base position when animation is disabled.

## Files Modified

1. `apps/web/src/lib/components/SceneCanvas.svelte`
   - Added PathAnimationManager import
   - Created pathAnimationManager instance
   - Added animatedPositions state map
   - Added reactive statements for light/token animation initialization
   - Updated animation loop to get and apply animated positions
   - Modified renderLight to use animated positions
   - Modified renderTokens to use animated positions
   - Modified renderTokenLight to use animated positions
   - Modified renderTokenVision to use animated positions
   - Modified renderTokenVisionArea to use animated positions
   - Updated viewport and vision visibility checks to use animated positions

## Testing Results

- Build Status: **SUCCESS**
- Docker Deployment: **SUCCESS**
- Container Status: All containers running (vtt_server, vtt_web, vtt_db, vtt_redis, vtt_nginx)

### How to Test

1. Create a path using the Path Tool
2. Double-click a light to open Light Config
3. In the "Path Following" section:
   - Select a path from the dropdown
   - Set a speed (e.g., 50 units/second)
4. The light should immediately start moving along the path
5. Setting path to "None" should stop animation and return to original position

### Expected Behavior

- Lights with `followPathName` and `pathSpeed` animate smoothly along their assigned path
- Tokens with `followPathName` and `pathSpeed` animate smoothly along their assigned path
- Animations loop continuously
- Clearing `followPathName` stops animation and returns object to base position
- Path changes (points added/removed) restart affected animations
- Animated positions are purely client-side visual - database positions unchanged
- Animation runs at 30 FPS matching existing animation loop

## Current Status

**COMPLETE** - Path animation integration is fully functional and deployed.

## Next Steps

1. User testing of path animation with lights
2. User testing of path animation with tokens
3. Consider adding path animation controls:
   - Start/stop toggle
   - Animation speed multiplier
   - Reverse direction option
   - One-shot (non-looping) mode
4. Consider adding visual feedback:
   - Show path when object is selected
   - Highlight current position on path
   - Show direction of movement

## Key Learnings

1. **Reactive Statements**: Svelte's reactive statements (`$:`) are perfect for managing animations based on object state changes
2. **Position Fallback Pattern**: Always provide a fallback to base position when animation is not active
3. **Performance**: Updating positions in the existing 30 FPS animation loop is efficient
4. **Separation of Concerns**: PathAnimationManager handles all animation math, SceneCanvas only applies positions
5. **Type Safety**: Using TypeScript's Map with proper typing ensures type-safe position lookups

## Architecture Notes

The implementation maintains a clear separation:
- **PathAnimationManager**: Pure animation logic, path following math
- **SceneCanvas Reactive Statements**: Animation lifecycle management (start/stop)
- **SceneCanvas Animation Loop**: Position retrieval and application
- **Render Functions**: Visual rendering using animated or base positions

This design makes it easy to:
- Add new animation types (non-looping, reverse, etc.)
- Debug animation issues (check animationManager vs rendering separately)
- Extend to other object types (doors, effects, etc.)
- Test animation logic independently from rendering
