# Session Notes: Token SnapToGrid Fix

**Date**: 2025-12-11
**Session ID**: 0062
**Topic**: Fix Token Grid Snapping Bug After First Move

## Summary

Fixed a bug where token snapping to grid worked on the first move but stopped working on subsequent moves until page refresh. The root cause was that tokens were missing the `snapToGrid` property that walls, doors, windows, and lights all have.

## Problem

- Token snapping worked on first drag but not on subsequent drags
- Token properties panel no longer showed grid snap toggle option
- The code in SceneCanvas.svelte checked `token.snapToGrid` but this property didn't exist on the Token type - it was always `undefined`
- `undefined === true` evaluated to `false`, causing snapping to fail after the first move

### Why First Move Worked, Second Didn't

1. **First click**: Token NOT in `selectedTokenIds` → uses Path 1 (single token drag with global `gridSnap` setting)
2. **Second click**: Token IS in `selectedTokenIds` (persists after first drag) → uses Path 2 (body drag checking `token.snapToGrid` which was `undefined`)

## Solution

Implemented proper per-token `snapToGrid` property consistent with other object types:

1. **TypeScript Types** (`packages/shared/src/types/campaign.ts`)
   - Added `snapToGrid: boolean;` to Token interface
   - Added `snapToGrid?: boolean;` to CreateTokenRequest and UpdateTokenRequest

2. **Database** (`packages/database/`)
   - Added `"snap_to_grid" boolean DEFAULT true NOT NULL` to migration.sql
   - Added `snapToGrid: boolean('snap_to_grid').notNull().default(true)` to Drizzle schema

3. **Server API** (`apps/server/src/routes/api/v1/tokens.ts`)
   - Updated all token response mappings to include `snapToGrid`
   - Added `snapToGrid` to POST body type and insert values
   - Added `snapToGrid` to PATCH body type and updateData handling

4. **WebSocket** (`apps/server/src/websocket/handlers/campaign.ts`)
   - Added `snapToGrid` to token:add and token:update handlers
   - Added `snapToGrid` to TokenAddPayload type

5. **UI** (`apps/web/src/lib/components/scene/properties/TokenProperties.svelte`)
   - Added "Snap to grid" checkbox toggle in token properties panel

6. **Canvas Logic** (`apps/web/src/lib/components/SceneCanvas.svelte`)
   - Body drag calculations now use `tokens.filter(t => selectedTokenIds.has(t.id)).some(t => t.snapToGrid === true)`
   - Single-token drag mouseUp handler uses `token.snapToGrid` instead of global `gridSnap`

7. **Tests**
   - Updated all test files with `snapToGrid: true` in Token objects

## Files Modified

- `packages/shared/src/types/campaign.ts` - Token type definitions
- `packages/shared/src/types/websocket.ts` - TokenAddPayload type
- `packages/shared/src/types/campaign.test.ts` - Test fixtures
- `packages/shared/src/types/websocket.test.ts` - Test fixtures
- `packages/shared/src/index.test.ts` - Test fixtures
- `packages/database/migration.sql` - Database schema
- `packages/database/src/schema/tokens.ts` - Drizzle schema
- `apps/server/src/routes/api/v1/tokens.ts` - Token API routes
- `apps/server/src/websocket/handlers/campaign.ts` - WebSocket handlers
- `apps/web/src/lib/components/scene/properties/TokenProperties.svelte` - UI toggle
- `apps/web/src/lib/components/SceneCanvas.svelte` - Canvas drag logic

## Database Migration

```bash
docker exec -i vtt_db psql -U claude -d vtt -c "ALTER TABLE tokens ADD COLUMN IF NOT EXISTS snap_to_grid BOOLEAN DEFAULT true NOT NULL;"
```

## Testing

1. Deployed to Docker with `docker-compose up -d --build`
2. Selected a token in the canvas
3. Verified "Snap to grid" checkbox appears in token properties panel
4. Tested dragging tokens - snapping now works consistently on every move
5. Toggling snap to grid on/off works per-token

## Key Learnings

- Listen to user requirements on first mention - when user says "tokens should have X like other objects", implement that directly instead of workarounds
- Use `replace_all=true` in Edit tool to update multiple identical patterns efficiently
- Always check for test files that may need updates when adding new required properties

## Status

COMPLETE - Token grid snapping now works correctly with per-token control.
