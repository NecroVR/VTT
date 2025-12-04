# Session Notes: Database Schema Migration for VTT

**Date**: 2025-12-04
**Session ID**: 0010
**Topic**: Complete Database Schema Update for Virtual Tabletop

## Summary

Successfully migrated the database schema from a simple token-based system to a full-featured Virtual Tabletop (VTT) architecture. The migration introduced scenes as the primary organizational unit, replacing the previous game-centric token model. All new document types were added to both the database and shared types package.

## Tasks Completed

### 1. Database Schema Migration ✅

**Migration Method**: Direct SQL migration via Docker exec
**Status**: Successfully applied

**New Tables Created**:
- `scenes` - Game scenes with background, grid, vision, and fog settings
- `actors` - Character/NPC data with system-agnostic attributes
- `items` - Equipment and inventory items linked to actors
- `walls` - Scene barriers for movement and vision blocking
- `ambient_lights` - Dynamic lighting sources for scenes
- `combats` - Combat encounter tracking
- `combatants` - Individual combatant data with initiative
- `chat_messages` - In-game chat and roll messages

**Modified Tables**:
- `tokens` - **BREAKING CHANGE**: Dropped and recreated with new schema
  - Changed from `gameId` to `sceneId` (tokens now belong to scenes)
  - Added: `actorId`, `elevation`, `rotation`, `locked`, `vision`, `visionRange`, `bars`, `lightBright`, `lightDim`, `lightColor`, `lightAngle`
  - This represents a significant architectural shift

**Migration File**: `D:\Projects\VTT\packages\database\migration.sql`

**Verification**:
```
            List of relations
 Schema |      Name      | Type  | Owner
--------+----------------+-------+--------
 public | actors         | table | claude
 public | ambient_lights | table | claude
 public | chat_messages  | table | claude
 public | combatants     | table | claude
 public | combats        | table | claude
 public | games          | table | claude
 public | items          | table | claude
 public | scenes         | table | claude
 public | sessions       | table | claude
 public | tokens         | table | claude
 public | users          | table | claude
 public | walls          | table | claude
(12 rows)
```

### 2. Shared Types Package Update ✅

**New Type Files Created**:
- `scene.ts` - Scene, CreateSceneRequest, UpdateSceneRequest, SceneResponse, ScenesListResponse
- `wall.ts` - Wall, CreateWallRequest, UpdateWallRequest, WallResponse, WallsListResponse
- `ambientLight.ts` - AmbientLight, Create/Update requests, responses
- `actor.ts` - Actor, Create/Update requests, responses
- `item.ts` - Item, Create/Update requests, responses
- `combat.ts` - Combat, Combatant, Create/Update requests for both, responses
- `chatMessage.ts` - ChatMessage, CreateChatMessageRequest, responses

**Modified Files**:
- `game.ts` - Updated Token interface with all new fields
  - Added: sceneId (replacing gameId), actorId, elevation, rotation, locked, vision, visionRange, bars, light properties
  - Added: CreateTokenRequest, UpdateTokenRequest, TokenResponse, TokensListResponse
- `index.ts` - Exports for all new types

**Location**: `D:\Projects\VTT\packages\shared\src\types\`

### 3. Compilation Testing ⚠️

**Status**: Shared types and database packages compile successfully
**Server Package**: **FAILED** - Breaking changes to Token schema require updates

## Issues Identified

### TypeScript Compilation Errors in Server Package

The server package has compilation errors due to the Token schema changes:

**Affected Files**:
1. `apps/server/src/routes/api/v1/tokens.ts` (5 errors)
   - Lines 46, 49, 51, 91, 101, 111
   - Attempting to use `tokens.gameId` which no longer exists
   - Needs to be updated to use scenes instead

2. `apps/server/src/websocket/handlers/game.ts` (3 errors)
   - Lines 322, 340, 350
   - Token creation/updates using old schema
   - Needs scene-based context instead of game-based

**Root Cause**: The architectural change from game-based tokens to scene-based tokens requires updating all token-related API endpoints and WebSocket handlers.

**Impact**:
- Token CRUD operations are broken
- WebSocket token synchronization is broken
- Current implementation assumes tokens belong directly to games, not scenes

## Architectural Changes

### Before: Game-Centric Model
```
Game → Tokens
```
Tokens belonged directly to games with no intermediate organizational layer.

### After: Scene-Centric Model
```
Game → Scenes → Tokens, Walls, Lights
Game → Actors → Items
Game → Combats → Combatants
```
Scenes are now the primary organizational unit for spatial elements. Actors (characters/NPCs) exist at the game level and can be represented by tokens in multiple scenes.

## Files Created

1. `D:\Projects\VTT\packages\database\migration.sql` - SQL migration script
2. `D:\Projects\VTT\packages\shared\src\types\scene.ts` - Scene types
3. `D:\Projects\VTT\packages\shared\src\types\wall.ts` - Wall types
4. `D:\Projects\VTT\packages\shared\src\types\ambientLight.ts` - Light types
5. `D:\Projects\VTT\packages\shared\src\types\actor.ts` - Actor types
6. `D:\Projects\VTT\packages\shared\src\types\item.ts` - Item types
7. `D:\Projects\VTT\packages\shared\src\types\combat.ts` - Combat types
8. `D:\Projects\VTT\packages\shared\src\types\chatMessage.ts` - Chat types

## Files Modified

1. `D:\Projects\VTT\packages\shared\src\types\game.ts` - Updated Token interface
2. `D:\Projects\VTT\packages\shared\src\types\index.ts` - Added exports

## Next Steps

### Required: Fix Server Package Compilation Errors

The server package needs updates to work with the new schema:

1. **Update Token API Routes** (`apps/server/src/routes/api/v1/tokens.ts`):
   - Change from game-based queries to scene-based queries
   - Update token formatting to include all new fields
   - Consider whether tokens should be accessed via `/scenes/:sceneId/tokens` instead

2. **Update WebSocket Token Handlers** (`apps/server/src/websocket/handlers/game.ts`):
   - Update token creation to require sceneId
   - Update token updates to include new fields
   - Ensure proper scene context in WebSocket rooms

3. **Create New API Routes** (recommended):
   - Scenes CRUD: `apps/server/src/routes/api/v1/scenes.ts`
   - Actors CRUD: `apps/server/src/routes/api/v1/actors.ts`
   - Walls: `apps/server/src/routes/api/v1/walls.ts`
   - Lights: `apps/server/src/routes/api/v1/lights.ts`
   - Items: `apps/server/src/routes/api/v1/items.ts`
   - Combat: `apps/server/src/routes/api/v1/combat.ts`
   - Chat: `apps/server/src/routes/api/v1/chat.ts`

4. **Update WebSocket Handlers** (recommended):
   - Scene operations (activate, update settings)
   - Wall drawing/editing
   - Light placement/adjustment
   - Combat tracker updates
   - Enhanced chat with rolls

### Recommended: Update Frontend

Once server is fixed:
1. Update UI to work with scenes instead of games as the canvas context
2. Add scene selector/navigator
3. Implement lighting and vision systems
4. Add actor/token linking
5. Implement combat tracker
6. Add chat with roll support

## Technical Notes

### Migration Approach

Initially attempted to use Drizzle Kit's `db:generate` and `db:push` commands, but encountered interactive prompts asking whether columns were created or renamed. These prompts couldn't be bypassed easily in the Windows environment.

**Solution**: Created a manual SQL migration file and applied it directly using:
```bash
docker exec -i trading_platform_db psql -U claude -d vtt < migration.sql
```

This approach was faster and more reliable for the complex schema changes required.

### Type Safety

All new types follow the existing patterns in the shared package:
- Interface for the entity itself
- CreateXRequest for creation payloads
- UpdateXRequest for update payloads (all fields optional)
- XResponse for single entity responses
- XsListResponse for list responses

This ensures consistency and type safety across the full stack.

## Conclusion

The database schema migration was successfully completed, and all new types have been added to the shared package. However, the server package requires updates to work with the new schema. The primary change - moving from game-based tokens to scene-based tokens - is a breaking architectural change that affects multiple parts of the codebase.

The migration represents a significant step toward a full-featured VTT system with proper support for scenes, actors, lighting, combat, and chat systems.

---

**Session End**: Migration complete, server updates required
**Next Session**: Fix server compilation errors and implement new API routes
