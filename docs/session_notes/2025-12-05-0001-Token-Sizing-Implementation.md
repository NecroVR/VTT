# Token Sizing Implementation

**Date:** 2025-12-05
**Session ID:** 0001
**Focus:** Implement grid-based token sizing system

---

## Summary

Implemented a comprehensive token sizing system that allows tokens to be displayed at the correct grid size based on the actor's configured size. This feature enables proper representation of creatures of different sizes (e.g., Medium, Large, Huge) on the virtual tabletop.

---

## Changes Made

### 1. Database Schema Updates

**File:** `packages/database/src/schema/actors.ts`
- Added `tokenSize` field to actors table
  - Type: `integer`
  - Default: `1` (represents 1x1 grid squares)
  - Not null constraint

**Migration:** `packages/database/migrations/add_token_size_to_actors.sql`
```sql
ALTER TABLE "actors" ADD COLUMN "token_size" integer DEFAULT 1 NOT NULL;
```

### 2. Type System Updates

**File:** `packages/shared/src/types/actor.ts`
- Added `tokenSize: number` to `Actor` interface
- Added `tokenSize?: number` to `CreateActorRequest` interface
- Added `tokenSize?: number` to `UpdateActorRequest` interface

**Test Files Updated:**
- `packages/shared/src/types/actor.test.ts` - Added tokenSize to all test Actor objects
- `packages/shared/src/index.test.ts` - Added tokenSize to Actor type test

### 3. Frontend Token Rendering

**File:** `apps/web/src/lib/components/SceneCanvas.svelte`

Updated all token size calculations to use grid units instead of hardcoded pixel values:

**Before:**
```typescript
const width = token.width || 50;  // Hardcoded pixels
const height = token.height || 50;
```

**After:**
```typescript
const width = (token.width || 1) * scene.gridSize;  // Grid units * pixels per grid
const height = (token.height || 1) * scene.gridSize;
```

**Functions updated:**
- `renderTokens()` - Main token rendering
- `renderTokenLight()` - Token light emission
- `renderTokenVision()` - Token vision indicators
- `renderTokenVisionArea()` - Token vision area rendering
- `updateExploredAreas()` - Fog of war exploration
- `handleMouseDown()` - Token click detection

### 4. Backend Token Creation

**File:** `apps/server/src/routes/api/v1/tokens.ts`
- Added import for `actors` table
- Updated POST `/api/v1/scenes/:sceneId/tokens` endpoint
- Fetches actor's `tokenSize` when creating token from actor
- Sets token's width/height to actor's tokenSize (defaults to 1)

**Logic:**
```typescript
// Fetch actor's tokenSize if actorId is provided
let tokenSize = 1;
if (tokenData.actorId) {
  const [actor] = await fastify.db
    .select()
    .from(actors)
    .where(eq(actors.id, tokenData.actorId))
    .limit(1);

  if (actor && actor.tokenSize) {
    tokenSize = actor.tokenSize;
  }
}

// Use tokenSize for width/height
width: tokenData.width ?? tokenSize,
height: tokenData.height ?? tokenSize,
```

### 5. Actor Configuration UI

**File:** `apps/web/src/lib/components/actor/StatsTab.svelte`
- Added "Token Size" input field to Core Attributes section
- Input constraints: min=1, max=10
- Added state management for `tokenSize` field
- Created `handleTokenSizeChange()` handler
- Field updates actor via `onUpdate()` callback

---

## Technical Details

### Token Size Calculation

Token sizes are now calculated using the formula:
```
pixel_size = grid_units * scene.gridSize
```

Where:
- `grid_units` = token.width or token.height (default: 1)
- `scene.gridSize` = pixels per grid square (e.g., 50 for 50px squares)

### Default Values

- **Database:** `token_size` defaults to 1 (1x1 grid square)
- **Token creation:** Uses actor's tokenSize, or 1 if not specified
- **Rendering:** Falls back to 1 grid unit if token width/height is missing

### Size Examples

| Token Size | Grid Squares | Pixel Size (50px grid) |
|-----------|--------------|------------------------|
| 1 | 1x1 (Medium) | 50x50 px |
| 2 | 2x2 (Large) | 100x100 px |
| 3 | 3x3 (Huge) | 150x150 px |
| 4 | 4x4 (Gargantuan) | 200x200 px |

---

## Files Modified

1. `packages/database/src/schema/actors.ts` - Schema definition
2. `packages/database/migrations/add_token_size_to_actors.sql` - Migration
3. `packages/shared/src/types/actor.ts` - Type definitions
4. `packages/shared/src/types/actor.test.ts` - Type tests
5. `packages/shared/src/index.test.ts` - Index exports test
6. `apps/server/src/routes/api/v1/tokens.ts` - Token creation API
7. `apps/web/src/lib/components/SceneCanvas.svelte` - Token rendering
8. `apps/web/src/lib/components/actor/StatsTab.svelte` - Actor configuration UI

---

## Testing & Deployment

### Build Status
- All TypeScript compilation successful
- No build errors
- Docker containers rebuilt and deployed

### Database Migration
```bash
docker exec vtt_db psql -U claude -d vtt -c "ALTER TABLE actors ADD COLUMN IF NOT EXISTS token_size integer DEFAULT 1 NOT NULL;"
```

Verified column exists:
```
token_size | integer | not null | 1
```

### Docker Deployment
All containers running successfully:
- `vtt_db` - PostgreSQL database (healthy)
- `vtt_server` - FastifyJS API server (up)
- `vtt_web` - SvelteKit frontend (up)
- `vtt_redis` - Redis cache (healthy)
- `vtt_nginx` - Nginx reverse proxy (up)

---

## Git Commits

1. `41bfd4f` - feat(tokens): Implement token sizing based on grid units
2. `66cf40b` - fix(tests): Add tokenSize field to Actor test objects
3. `876578e` - fix(tests): Add missing tokenSize to ActorResponse test

All changes pushed to `master` branch.

---

## Next Steps

### Suggested Enhancements

1. **Size Presets** - Add dropdown with D&D size categories:
   - Tiny (0.5), Small (1), Medium (1), Large (2), Huge (3), Gargantuan (4)

2. **Visual Preview** - Show token size preview in ActorSheet

3. **Bulk Update** - Add ability to update tokenSize for multiple actors

4. **Template Library** - Pre-configure tokenSize in actor templates

5. **Validation** - Add backend validation for reasonable tokenSize values

---

## Known Issues

None identified.

---

## Key Learnings

1. **Grid Unit Consistency** - Token dimensions in database are stored as grid units, not pixels
2. **Rendering Formula** - Always multiply grid units by scene.gridSize for pixel rendering
3. **Default Handling** - Proper fallback to 1 grid unit prevents rendering issues
4. **Test Coverage** - Type changes require updating all test fixtures

---

**Session completed successfully.**
