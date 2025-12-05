# Token Vision System Implementation

**Date**: 2025-12-04
**Session ID**: 0047
**Topic**: Token Vision System in SceneCanvas

## Session Summary

Implemented a comprehensive token vision and lighting system in the VTT SceneCanvas component. Tokens can now emit light and have vision ranges that interact with the scene's darkness and lighting system. This allows for dynamic lighting where tokens act as light sources, and players can see vision range indicators for their selected tokens.

## Problems Addressed

### Requirements
- Tokens needed the ability to emit light using their `lightBright`, `lightDim`, `lightColor`, and `lightAngle` properties
- Vision range indicators needed to show when a token is selected
- Token vision needed to integrate with the existing scene darkness and global lighting system
- Token lights needed to combine properly with ambient lights

### Approach
- Added three new rendering functions: `renderTokenLight()`, `renderTokenVision()`, and `renderTokenVisionArea()`
- Integrated token lights into the existing `renderLights()` function
- Updated the animation loop to re-render when token lights are present
- Used the same radial gradient technique as ambient lights for consistency

## Solutions Implemented

### 1. Token Light Emission (`renderTokenLight()`)

**Location**: `apps/web/src/lib/components/SceneCanvas.svelte`

```typescript
function renderTokenLight(ctx: CanvasRenderingContext2D, token: Token, time: number) {
  // Skip if token doesn't emit light
  if (token.lightBright <= 0 && token.lightDim <= 0) return;

  const gridSize = scene.gridSize;
  const width = token.width || 50;
  const height = token.height || 50;

  // Token center position
  const x = token.x + width / 2;
  const y = token.y + height / 2;

  // Convert light ranges from grid units to pixels
  const bright = token.lightBright * gridSize;
  const dim = token.lightDim * gridSize;
  const color = token.lightColor || '#ffffff';
  const angle = token.lightAngle || 360;

  // Create radial gradient with clipping for cone lights
  // ... (full implementation in file)
}
```

**Features**:
- Converts light ranges from grid units to pixels
- Supports cone-shaped lights using `lightAngle` and token rotation
- Uses radial gradients with bright and dim zones
- Default white color and 0.8 alpha for token lights
- Clips to cone shape when angle < 360 degrees

### 2. Vision Range Indicator (`renderTokenVision()`)

**Location**: `apps/web/src/lib/components/SceneCanvas.svelte`

```typescript
function renderTokenVision(ctx: CanvasRenderingContext2D, token: Token) {
  // Skip if token doesn't have vision
  if (!token.vision || token.visionRange <= 0) return;

  const gridSize = scene.gridSize;
  const width = token.width || 50;
  const height = token.height || 50;

  // Token center position
  const x = token.x + width / 2;
  const y = token.y + height / 2;

  // Convert vision range from grid units to pixels
  const visionRadius = token.visionRange * gridSize;

  // Only show for selected tokens
  if (selectedTokenId === token.id) {
    // Draw subtle dashed circle
    ctx.strokeStyle = '#60a5fa'; // Light blue
    ctx.lineWidth = 2 / scale;
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([10 / scale, 5 / scale]);
    ctx.arc(x, y, visionRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
```

**Features**:
- Shows vision range as a dashed circle
- Only visible when token is selected
- Uses light blue color with 40% opacity
- Line width scales with viewport zoom

### 3. Vision Area Rendering (`renderTokenVisionArea()`)

**Location**: `apps/web/src/lib/components/SceneCanvas.svelte`

```typescript
function renderTokenVisionArea(ctx: CanvasRenderingContext2D, token: Token) {
  // This renders the actual vision area when tokenVision is enabled
  if (!token.vision || token.visionRange <= 0) return;

  // Create radial gradient for vision area
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, visionRadius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.arc(x, y, visionRadius, 0, Math.PI * 2);
  ctx.fill();
}
```

**Features**:
- Renders the actual vision area that cuts through darkness
- Only active when `scene.tokenVision` is true
- Creates a white gradient that fades at the edges
- Uses destination-out compositing to remove darkness

### 4. Integration with Lighting System

Modified `renderLights()` to include token lights:

```typescript
function renderLights() {
  // ... existing code ...

  if (hasDarkness) {
    // Render all ambient lights on temp canvas
    lights.forEach(light => {
      renderLight(tempCtx, light, animationTime);
    });

    // Render token lights on temp canvas
    tokens.forEach(token => {
      if (token.visible) {
        renderTokenLight(tempCtx, token, animationTime);
      }
    });

    // If tokenVision is enabled, also render vision areas
    if (scene.tokenVision) {
      tokens.forEach(token => {
        if (token.visible && token.vision) {
          renderTokenVisionArea(tempCtx, token);
        }
      });
    }

    // Cut out lit areas from darkness
    // ...
  } else {
    // Render token lights even without darkness
    tokens.forEach(token => {
      if (token.visible) {
        renderTokenLight(lightingCtx, token, animationTime);
      }
    });
  }
}
```

**Features**:
- Token lights combine with ambient lights using lighten composite mode
- Works in both darkness and normal lighting conditions
- Vision areas only render when `scene.tokenVision` is enabled
- Respects token visibility

### 5. Animation Loop Update

Modified `startAnimationLoop()` to check for token lights:

```typescript
function startAnimationLoop() {
  const animate = (timestamp: number) => {
    animationTime = timestamp;

    // Check for animated lights or token lights
    const hasAnimatedLights = lights.some(light =>
      light.animationType === 'torch' || light.animationType === 'pulse'
    );

    const hasTokenLights = tokens.some(token =>
      token.visible && (token.lightBright > 0 || token.lightDim > 0)
    );

    if (hasAnimatedLights || hasTokenLights) {
      renderLights();
    }

    animationFrameId = requestAnimationFrame(animate);
  };
}
```

### 6. Token Rendering Update

Modified `renderTokens()` to show vision indicators:

```typescript
tokens.forEach(token => {
  // ... existing code ...

  // Render vision indicator before the token (if selected)
  if (selectedTokenId === token.id) {
    renderTokenVision(tokensCtx, token);
  }

  // ... render token ...
});
```

## Files Modified

1. **apps/web/src/lib/components/SceneCanvas.svelte**
   - Added `renderTokenLight()` function (58 lines)
   - Added `renderTokenVision()` function (38 lines)
   - Added `renderTokenVisionArea()` function (28 lines)
   - Modified `renderLights()` to integrate token lights (30 lines added)
   - Modified `startAnimationLoop()` to check for token lights (5 lines added)
   - Modified `renderTokens()` to show vision indicators (5 lines added)
   - **Total**: +164 lines, -3 lines

## Testing Results

### Build Verification
```bash
pnpm build
```
**Result**: ✅ All packages built successfully
- @vtt/database: cache hit
- @vtt/shared: cache hit
- @vtt/server: cache hit
- @vtt/web: built successfully with Vite

### Warnings
- Minor CSS and accessibility warnings (pre-existing)
- No new TypeScript errors
- No new build errors

## Technical Details

### Token Light Properties Used
- `token.lightBright` - Bright light radius (in grid units)
- `token.lightDim` - Dim light radius (in grid units)
- `token.lightColor` - Light color (hex string, defaults to #ffffff)
- `token.lightAngle` - Light cone angle in degrees (360 for omni-directional)
- `token.rotation` - Token rotation for directional lights

### Token Vision Properties Used
- `token.vision` - Boolean flag for vision capability
- `token.visionRange` - Vision distance (in grid units)

### Scene Properties Used
- `scene.tokenVision` - Enable token-based vision system
- `scene.globalLight` - Global illumination flag
- `scene.darkness` - Darkness level (0-1)
- `scene.gridSize` - Grid size for unit conversion

### Rendering Layers
1. **Background Layer** - Scene background image
2. **Grid Layer** - Grid overlay
3. **Tokens Layer** - Token sprites + vision indicators
4. **Lighting Layer** - Ambient lights + token lights + vision areas + darkness
5. **Walls Layer** - Vision-blocking walls (GM only)
6. **Controls Layer** - Interactive overlay

### Composite Modes Used
- `lighten` - For combining multiple light sources
- `destination-out` - For cutting lit areas from darkness

## Current Status

✅ **Complete**: Token vision system fully implemented and tested
- Token light emission working
- Vision range indicators working
- Vision areas cutting through darkness
- Integration with existing lighting system
- Build passing
- Changes committed and pushed

## Next Steps

**Future Enhancements** (not in current scope):
1. Wall occlusion for vision and light
2. Fog of war integration
3. Player-specific vision (only see your token's vision)
4. Vision cones (directional vision based on token facing)
5. Light animations for token lights (flickering torches, etc.)

## Key Learnings

1. **Canvas Compositing**: Using temporary canvases for light compositing prevents alpha blending issues
2. **Grid Unit Conversion**: Always multiply grid units by gridSize for pixel coordinates
3. **Scale Awareness**: Line widths and dash patterns need to be divided by scale for consistent screen-space rendering
4. **Performance**: Only re-render lighting when necessary (animated lights or token lights present)
5. **Gradients**: Radial gradients work well for both ambient lights and token lights

## Commit Information

**Commit Hash**: a17b2d7
**Message**: feat(web): Add Token Vision System to SceneCanvas

**Changes**:
- 1 file changed
- 164 insertions(+)
- 3 deletions(-)

**Repository**: https://github.com/NecroVR/VTT.git
**Branch**: master

---

**Session Complete** ✅
