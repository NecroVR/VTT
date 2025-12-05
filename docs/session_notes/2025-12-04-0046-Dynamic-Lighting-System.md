# Dynamic Lighting System Implementation

**Date**: 2025-12-04
**Session ID**: 0046
**Type**: Feature Implementation
**Status**: Complete

---

## Session Summary

Successfully implemented the Dynamic Lighting System for the VTT SceneCanvas component. The system renders ambient lights with radial gradients, supports cone-shaped directional lights, includes darkness overlay with light source cutouts, and provides basic light animations (torch flicker and pulse effects).

---

## What Was Implemented

### 1. Lighting Canvas Layer

Added a new canvas layer to the SceneCanvas component positioned between the tokens and walls layers:

- **Canvas Reference**: `lightingCanvas: HTMLCanvasElement`
- **Context**: `lightingCtx: CanvasRenderingContext2D`
- **Layer Order**: Background → Grid → Tokens → **Lighting** → Walls → Controls

### 2. Core Lighting Functions

#### `hexToRgba(hex: string, alpha: number): string`
- Converts hex color codes to RGBA format
- Applies alpha transparency to light colors

#### `renderLight(ctx: CanvasRenderingContext2D, light: AmbientLight, time: number)`
- Renders individual light sources
- Creates radial gradients from bright to dim radius
- Supports cone-shaped lights with rotation
- Implements light animations (torch flicker, pulse)

**Features**:
- **Radial Gradient**: Smooth transition from bright (full intensity) to dim (transparent)
- **Cone Clipping**: For lights with angle < 360°, clips to cone shape using rotation
- **Animation Support**:
  - Torch: Multi-frequency sine waves for realistic flicker
  - Pulse: Smooth sine wave expansion/contraction

#### `renderLights()`
- Main rendering function for the lighting layer
- Handles two rendering modes:
  1. **With Darkness**: Creates darkness overlay with light cutouts
  2. **Without Darkness**: Renders lights with additive blending

**Darkness Mode Implementation**:
- Creates temporary canvas for light compositing
- Renders all lights with 'lighten' blend mode
- Draws darkness overlay on main canvas
- Uses 'destination-out' to cut out lit areas

### 3. Animation System

#### `startAnimationLoop()`
- Initiates requestAnimationFrame loop
- Updates animation time
- Only re-renders lights when animated lights exist
- Optimized to prevent unnecessary renders

#### `stopAnimationLoop()`
- Cleanup function to cancel animation frame
- Called on component destroy

### 4. Integration with Lights Store

- Subscribes to `lightsStore` from `$lib/stores/lights.ts`
- Filters lights by current scene ID
- Reactive updates when lights change
- Automatic re-rendering on light modifications

### 5. Scene Configuration Support

The system respects scene properties:

- **`scene.darkness`**: Controls darkness overlay opacity (0-1)
- **`scene.globalLight`**: When true, disables darkness overlay
- Lights always render but darkness only applies when configured

---

## Files Modified

### `apps/web/src/lib/components/SceneCanvas.svelte`

**Imports Added**:
```typescript
import type { AmbientLight } from '@vtt/shared';
import { lightsStore } from '$lib/stores/lights';
```

**New Canvas Layer**:
```svelte
<canvas class="canvas-layer" bind:this={lightingCanvas}></canvas>
```

**New State Variables**:
```typescript
let lightingCanvas: HTMLCanvasElement;
let lightingCtx: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;
let animationTime = 0;
```

**Reactive Statement**:
```typescript
$: lights = Array.from($lightsStore.lights.values()).filter(light => light.sceneId === scene.id);
```

**Functions Added**:
- `hexToRgba()`
- `renderLight()`
- `renderLights()`
- `startAnimationLoop()`
- `stopAnimationLoop()`

**Lifecycle Updates**:
- Added lighting canvas to initialization
- Added lighting canvas to resize handler
- Integrated `renderLights()` into main `render()` function
- Added animation loop start/stop to mount/destroy hooks

---

## Technical Details

### Light Rendering Algorithm

1. **Transform Setup**: Apply canvas transform (scale, translation)
2. **Animation Calculation**: Calculate animated radius based on animation type
3. **Cone Clipping**: If angle < 360°, create clipping path
4. **Gradient Creation**: Create radial gradient from center to dim radius
5. **Color Stops**:
   - 0% → bright radius: Full color with alpha
   - bright radius → dim radius: Fade to transparent
6. **Render**: Fill circle or cone with gradient

### Darkness Overlay Algorithm

1. **Create Temp Canvas**: For compositing all lights
2. **Render Lights**: Draw all lights with 'lighten' blend mode
3. **Draw Darkness**: Fill main canvas with black at darkness opacity
4. **Cut Out Lights**: Use 'destination-out' with temp canvas to remove darkness where lights shine

### Animation Implementation

**Torch Flicker**:
```typescript
const flicker = Math.sin(time * speed * 0.003) * 0.5 +
                Math.sin(time * speed * 0.005) * 0.3 +
                Math.sin(time * speed * 0.007) * 0.2;
const intensity = animationIntensity / 100;
animatedRadius = radius * (1 + flicker * intensity * 0.15);
```

**Pulse**:
```typescript
const pulse = Math.sin(time * speed * 0.002);
const intensity = animationIntensity / 100;
animatedRadius = radius * (1 + pulse * intensity * 0.3);
```

### Performance Optimizations

- **Conditional Re-rendering**: Only re-renders on animation frame if animated lights exist
- **Canvas Reuse**: Reuses existing canvas contexts
- **Efficient Blending**: Uses hardware-accelerated composite operations
- **Transform Efficiency**: Applies transform once per render cycle

---

## Testing Results

### Build Verification

```bash
pnpm build
```

**Result**: ✅ Build successful
- All TypeScript compilation passed
- Vite build completed without errors
- Only accessibility warnings (non-blocking)

### Integration Points Verified

✅ Imports from `@vtt/shared` package
✅ Integration with `lightsStore`
✅ Canvas layer ordering
✅ Transform application
✅ Animation loop management

---

## Light Properties Used

From `AmbientLight` interface:

| Property | Purpose |
|----------|---------|
| `x, y` | Light position in world coordinates |
| `bright` | Bright radius (full intensity) |
| `dim` | Dim radius (fades to transparent) |
| `color` | Hex color code for light |
| `alpha` | Base opacity (0-1) |
| `angle` | Cone angle (360 = full circle) |
| `rotation` | Direction for cone lights (degrees) |
| `animationType` | 'torch', 'pulse', or null |
| `animationSpeed` | Speed multiplier for animations |
| `animationIntensity` | Intensity of animation effect (0-100) |

---

## How to Use

### Adding Lights

Lights are managed through the `lightsStore`:

```typescript
import { lightsStore } from '$lib/stores/lights';

// Load lights for a scene
await lightsStore.loadLights(sceneId, token);

// Add a new light
lightsStore.addLight({
  id: 'light-1',
  sceneId: 'scene-1',
  x: 500,
  y: 500,
  bright: 100,
  dim: 200,
  angle: 360,
  color: '#ff9900',
  alpha: 0.8,
  animationType: 'torch',
  // ... other properties
});
```

### Scene Configuration

Control lighting behavior through scene properties:

```typescript
// Enable darkness with light sources
scene.darkness = 0.8; // 80% darkness
scene.globalLight = false;

// Disable darkness (full visibility)
scene.globalLight = true;
```

---

## Future Enhancements

Potential improvements for future iterations:

1. **Vision Blocking**: Integration with walls for light occlusion
2. **Advanced Animations**: Wave, strobe, rotating, color shift
3. **Light Templates**: Predefined light configurations
4. **Performance**: WebGL renderer for many lights
5. **Shadow Casting**: Realistic shadows from tokens and walls
6. **Color Temperature**: Warm/cool light presets
7. **Light Intensity**: Separate from alpha for HDR-like effects

---

## Deliverables Completed

✅ Modified SceneCanvas.svelte with lighting layer
✅ renderLights() function with gradient rendering
✅ Cone light support with rotation
✅ Darkness overlay system
✅ Integration with render loop
✅ Torch and pulse animations
✅ Build verification passed

---

## Next Steps

1. **Test with UI**: Create lights using the LightingConfig component
2. **Visual Verification**: Verify rendering in browser
3. **Performance Testing**: Test with multiple animated lights
4. **Wall Integration**: Plan light blocking by walls (Phase 3 feature)

---

## Technical Notes

### Canvas Composite Operations Used

- `lighten`: Additive light blending (lights combine)
- `destination-out`: Removes pixels (darkness cutout)
- `source-over`: Normal rendering (default)

### Coordinate System

- Light positions are in **world coordinates**
- Canvas transform handles view panning and zoom
- No manual coordinate conversion needed

### Animation Frame Rate

- Uses `requestAnimationFrame` (typically 60 FPS)
- Time-based animations (not frame-based)
- Smooth animations regardless of frame rate

---

**Implementation Complete** ✅
