# Session Notes: Foundry VTT Light System Alignment

**Date**: 2025-12-08
**Session ID**: 0008
**Topic**: Align VTT Light System with Foundry VTT Implementation

## Session Summary

Comprehensive update to align our light system with Foundry VTT's implementation patterns. Added 13 new light properties, darkness sources, advanced animations, and UI improvements.

## Changes Made

### 1. Database Schema (packages/database/src/schema/ambientLights.ts)

Added 13 new columns to `ambient_lights` table:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| negative | boolean | false | Darkness source (subtracts light) |
| priority | integer | 0 | Rendering priority |
| luminosity | real | 0.5 | Luminosity level [0-1] |
| saturation | real | 0 | Color saturation [-1 to 1] |
| contrast | real | 0 | Contrast adjustment [-1 to 1] |
| shadows | real | 0 | Shadow depth [0-1] |
| attenuation | real | 0.5 | Falloff between bright/dim [0-1] |
| coloration | integer | 1 | Shader technique (0-9 blend modes) |
| darknessMin | real | 0 | Min darkness for activation [0-1] |
| darknessMax | real | 1 | Max darkness for activation [0-1] |
| animationReverse | boolean | false | Reverse animation direction |
| hidden | boolean | false | Quick visibility toggle |
| elevation | real | 0 | Vertical position for layering |

### 2. Shared Types (packages/shared/src/types/ambientLight.ts)

Updated TypeScript interfaces:
- `AmbientLight` - Added all 13 new required fields
- `CreateAmbientLightRequest` - New fields as optional
- `UpdateAmbientLightRequest` - New fields as optional

### 3. API Routes (apps/server/src/routes/api/v1/lights.ts)

- Updated POST handler for all new fields with defaults
- Updated PATCH handler for all new fields
- GET handlers return all fields automatically

### 4. WebSocket Handlers (apps/server/src/websocket/handlers/campaign.ts)

- Updated light:add handler for new fields
- Updated light:update handler for new fields

### 5. SceneCanvas Rendering (apps/web/src/lib/components/SceneCanvas.svelte)

#### Darkness Sources (negative lights)
- Check `light.negative` property
- Use `destination-out` composite operation to cut through existing light
- Render black gradient that creates "darkness holes"

#### Attenuation/Falloff
- Three-tier system based on attenuation value:
  - Sharp falloff (attenuation < 0.3)
  - Medium falloff (0.3-0.7, default)
  - Smooth falloff (attenuation > 0.7)
- Multiple gradient stops for natural-looking transitions

#### New Animations
- **Chroma**: Color cycling using HSL conversion
  - Added helper functions: `hexToHSL`, `hslToRgb`, `shiftHue`
  - Cycles hue based on time and animation speed
- **Wave**: Ripple effect with expanding rings
  - Creates 3 concentric rings that pulse outward
  - Uses sine wave for smooth alpha modulation

#### Darkness Activation Range
- Check `darknessMin` and `darknessMax` against scene darkness
- Skip rendering if scene darkness is outside light's activation range

#### Hidden Lights
- Skip rendering lights with `hidden === true`

### 6. LightingConfig UI (apps/web/src/lib/components/LightingConfig.svelte)

Added new UI sections:
- **Light Type**: Darkness Source checkbox
- **Animation**: Added Reverse checkbox
- **Advanced Effects**: Sliders for attenuation, luminosity, saturation, contrast, shadows; Coloration Mode dropdown (10 blend modes)
- **Darkness Activation**: Min/Max darkness sliders
- **Settings**: Hidden checkbox, elevation input, priority input

Added CSS for range input sliders.

## Files Modified

1. `packages/database/src/schema/ambientLights.ts`
2. `packages/shared/src/types/ambientLight.ts`
3. `packages/shared/src/types/ambientLight.test.ts`
4. `packages/shared/src/index.test.ts`
5. `apps/server/src/routes/api/v1/lights.ts`
6. `apps/server/src/websocket/handlers/campaign.ts`
7. `apps/web/src/lib/components/SceneCanvas.svelte`
8. `apps/web/src/lib/components/LightingConfig.svelte`

## Testing

- Build passes successfully
- Schema pushed to database
- Docker containers rebuilt and running

## Commit

```
feat(lights): Align light system with Foundry VTT implementation
Commit: 9e4f18a
```

## Current Status

All features implemented and deployed:
- Database schema updated with 13 new columns
- Types and API fully support all new fields
- Rendering supports darkness sources, attenuation, chroma/wave animations
- UI provides access to all new settings
- Docker containers rebuilt and running

## Next Steps

1. Test darkness sources in UI
2. Test chroma and wave animations
3. Test darkness activation range with different scene darkness levels
4. Consider adding animation preview in config modal
5. Consider batch light operations for performance
