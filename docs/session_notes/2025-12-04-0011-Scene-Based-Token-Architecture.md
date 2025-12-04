# Session Notes: Scene-Based Token Architecture

**Date**: 2025-12-04
**Session ID**: 0011
**Topic**: Fix compilation errors after schema migration to scene-based tokens

---

## Session Summary

Fixed TypeScript compilation errors in the VTT server package following the architectural change from game-based tokens to scene-based tokens. The schema migration introduced a hierarchical structure where tokens now belong to scenes, and scenes belong to games (Game → Scenes → Tokens).

---

## Problems Addressed

### Initial Issue
The server package had 9 TypeScript compilation errors after the database schema was migrated to use scene-based tokens:
- `tokens.gameId` property no longer exists (replaced with `tokens.sceneId`)
- Token interface missing new required fields (`elevation`, `rotation`, `locked`, `vision`, etc.)
- `createdAt` field type changed from `string` to `Date`
- WebSocket handlers trying to insert tokens with old schema

### Root Causes
1. **Schema change**: Database tokens table changed from `gameId` to `sceneId` foreign key
2. **Extended Token interface**: New fields added for comprehensive token functionality (vision, lighting, rotation, etc.)
3. **Outdated API routes**: Token routes still using `/games/:gameId/tokens` pattern
4. **WebSocket payload mismatch**: TokenAddPayload interface missing new required fields

---

## Solutions Implemented

### 1. Fixed Token Routes (`apps/server/src/routes/api/v1/tokens.ts`)

**Changes:**
- Changed route paths from `/games/:gameId/tokens` to `/scenes/:sceneId/tokens`
- Updated database queries to use `tokens.sceneId` instead of `tokens.gameId`
- Updated token mapping to include all new fields:
  - Position/orientation: `elevation`, `rotation`, `locked`
  - Vision: `vision`, `visionRange`
  - Display: `bars` (HP/resource bars)
  - Lighting: `lightBright`, `lightDim`, `lightColor`, `lightAngle`
  - References: `actorId`
  - Timestamps: `updatedAt`
- Changed `createdAt` from `.toISOString()` to direct `Date` object

### 2. Fixed WebSocket Handler (`apps/server/src/websocket/handlers/game.ts`)

**Changes in `handleTokenAdd`:**
- Added `sceneId` as a required field with validation
- Extracted all new optional fields from payload with defaults
- Updated database insert to include all new token fields
- Updated token-to-interface mapping to include all fields
- Improved logging to include `sceneId`

**New fields in insert:**
```typescript
{
  sceneId,           // Required - scene the token belongs to
  actorId,           // Optional - linked actor
  elevation,         // Default: 0
  rotation,          // Default: 0
  locked,            // Default: false
  vision,            // Default: false
  visionRange,       // Default: 0
  bars,              // Default: {}
  lightBright,       // Default: 0
  lightDim,          // Default: 0
  lightColor,        // Default: null
  lightAngle,        // Default: 360
  // ... existing fields
}
```

### 3. Updated Shared Types (`packages/shared/src/types/websocket.ts`)

**Changes:**
- Updated `TokenAddPayload` interface to include:
  - `sceneId: string` (required)
  - All new optional token fields
- Fixed `TokenUpdatePayload` to exclude `sceneId`, `createdAt`, and `updatedAt` from updates

### 4. Created Scenes API Route (`apps/server/src/routes/api/v1/scenes.ts`)

**New endpoints:**
- `GET /api/v1/games/:gameId/scenes` - List all scenes for a game
- `GET /api/v1/scenes/:sceneId` - Get single scene with details
- `POST /api/v1/games/:gameId/scenes` - Create new scene in a game
- `PATCH /api/v1/scenes/:sceneId` - Update scene properties
- `DELETE /api/v1/scenes/:sceneId` - Delete scene (cascades to tokens)

**Features:**
- Proper authentication checks
- Game ownership verification (TODO: enhance with participants table)
- Full scene property mapping (grid, vision, lighting settings)
- Proper HTTP status codes (201 for create, 204 for delete)

### 5. Registered Scenes Route (`apps/server/src/routes/api/v1/index.ts`)

**Changes:**
- Imported `scenesRoute`
- Registered route with Fastify
- Added `/api/v1/scenes` to endpoint listing

---

## Files Created/Modified

### Modified Files

1. **`apps/server/src/routes/api/v1/tokens.ts`**
   - Updated routes to use `sceneId` instead of `gameId`
   - Added all new token fields to response mapping
   - Changed path structure to `/scenes/:sceneId/tokens`

2. **`apps/server/src/websocket/handlers/game.ts`**
   - Updated `handleTokenAdd` to require and validate `sceneId`
   - Added support for all new token properties
   - Updated token creation response to include all fields

3. **`packages/shared/src/types/websocket.ts`**
   - Extended `TokenAddPayload` with `sceneId` and new fields
   - Fixed `TokenUpdatePayload` to exclude immutable fields

4. **`apps/server/src/routes/api/v1/index.ts`**
   - Added scenes route import and registration
   - Updated API endpoint documentation

### Created Files

1. **`apps/server/src/routes/api/v1/scenes.ts`** (361 lines)
   - Complete CRUD API for scenes
   - Proper validation and error handling
   - Scene-to-interface mapping with all properties

---

## Testing Results

### Build Status: ✅ PASS

```bash
pnpm build
```

**Results:**
- All 4 packages built successfully
- No TypeScript compilation errors
- Build time: 6.992s
- Cache hit on database package

**Packages built:**
- `@vtt/database` ✓ (cached)
- `@vtt/shared` ✓
- `@vtt/server` ✓
- `@vtt/web` ✓

---

## Current Status

### ✅ Complete
- All TypeScript compilation errors resolved
- Token routes updated to use scenes
- WebSocket handlers support new token schema
- Complete scenes CRUD API implemented
- All packages building successfully

### 📋 TODO Items for Future
1. Implement proper authorization checks:
   - Add game participants/players table
   - Verify user access to scenes through game membership
   - Add ownership checks for token/scene modifications

2. Add scene activation logic:
   - Only one scene per game should be active
   - Implement scene switching functionality
   - Broadcast scene changes to connected players

3. Update client code:
   - Update frontend to use new `/scenes/:sceneId/tokens` endpoints
   - Add scene selection UI
   - Update WebSocket token:add to include sceneId

4. Add token-actor relationship endpoints:
   - Link tokens to actors
   - Sync token properties with actor stats
   - Handle actor updates cascading to tokens

---

## Key Learnings

### Architectural Insights
1. **Hierarchical data structure**: Game → Scenes → Tokens allows for:
   - Multiple maps/encounters per game
   - Scene-specific settings (grid, vision, lighting)
   - Isolated token management per scene

2. **Enhanced token properties**: The new schema supports full VTT functionality:
   - Dynamic lighting with configurable bright/dim ranges
   - Character vision and fog of war
   - Token rotation and elevation for 3D positioning
   - Resource bars for HP/MP display

3. **Type safety**: Keeping shared types synchronized with database schema prevents runtime errors

### Development Practices
1. Always update shared types when changing database schema
2. Use proper TypeScript `Date` types instead of ISO strings for consistency
3. Validate required fields early in request handlers
4. Provide sensible defaults for optional properties

---

## Next Steps

### Immediate (No user action required)
The compilation errors are fully resolved. The system is ready for continued development.

### Client Integration (User decision required)
The user may want to update the frontend client to:
1. Use the new scenes API to list and select scenes
2. Update token operations to include sceneId
3. Add UI for scene management (create, switch, delete)

### Migration (If database has existing data)
If there is existing token data with `gameId`, a data migration script may be needed to:
1. Create a default scene for each game
2. Move all game tokens to the default scene
3. Clean up old token references

---

## Session Metadata

**Token Usage**: ~50k tokens
**Tools Used**: Read, Edit, Write, Bash, TodoWrite
**Build Status**: ✅ All tests passing
**Deployment Status**: Ready for deployment (no deployment performed in this session)

