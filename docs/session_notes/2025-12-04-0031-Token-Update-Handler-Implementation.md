# Session Notes: Token Update WebSocket Handler Implementation

**Date**: 2025-12-04
**Session ID**: 0031
**Topic**: Implement missing token:update WebSocket handler and REST endpoints

---

## Session Summary

Implemented the missing `token:update` WebSocket handler and corresponding REST API endpoints to enable full token property updates, including actor-token linking via actorId. This completes the token management system by providing both real-time and REST-based update capabilities.

---

## Problem Statement

The VTT token system had handlers for:
- `token:move` - Updates only x, y position
- `token:add` - Creates new tokens with full properties
- `token:remove` - Deletes tokens

However, it was missing `token:update` functionality needed to:
- Update token properties beyond just position (name, actorId, imageUrl, visible, etc.)
- Link tokens to actors via actorId
- Support comprehensive token editing in the frontend

---

## Implementation Details

### 1. WebSocket Handler: token:update

**File**: `apps/server/src/websocket/handlers/game.ts`

Added `handleTokenUpdate()` function following existing patterns:
- Accepts `TokenUpdatePayload` with tokenId and partial updates
- Updates token in database using Drizzle ORM
- Broadcasts `token:updated` event to all clients in game room
- Includes proper error handling and logging
- Follows same pattern as `handleWallUpdate()`

Key implementation:
```typescript
case 'token:update':
  await handleTokenUpdate(socket, message as WSMessage<TokenUpdatePayload>, request);
  break;
```

The handler:
- Validates game room membership
- Updates token with partial properties
- Sets `updatedAt` timestamp
- Converts database response to Token interface
- Broadcasts full updated token to all players

### 2. REST API Endpoints

**File**: `apps/server/src/routes/api/v1/tokens.ts`

Added two new endpoints:

#### POST /api/v1/scenes/:sceneId/tokens
- Creates a new token in a specific scene
- Requires authentication
- Validates required fields (name, x, y)
- Sets default values for optional properties
- Sets ownerId to current user
- Returns 201 with created token

#### PATCH /api/v1/tokens/:tokenId
- Updates an existing token
- Requires authentication
- Accepts partial token updates
- Validates token exists
- Only updates provided fields
- Returns 200 with updated token

Both endpoints follow patterns from `actors.ts` route with:
- Authentication middleware
- Request validation
- Proper error handling
- Type-safe responses
- Drizzle ORM for database operations

### 3. Frontend Integration

**File**: `apps/web/src/lib/stores/websocket.ts`

Frontend WebSocket store already had:
- `sendTokenUpdate(payload: TokenUpdatePayload)` - Sends update message
- `onTokenUpdated(handler)` - Listens for update events

No frontend changes were needed as the methods were already implemented.

### 4. Type Definitions

**File**: `packages/shared/src/types/websocket.ts`

Type definitions already existed:
```typescript
export interface TokenUpdatePayload {
  tokenId: string;
  updates: Partial<Omit<Token, 'id' | 'sceneId' | 'createdAt' | 'updatedAt'>>;
}

export interface TokenUpdatedPayload {
  token: Token;
}
```

---

## Files Modified

1. **apps/server/src/websocket/handlers/game.ts** (+80 lines)
   - Added case handler for 'token:update'
   - Implemented handleTokenUpdate() function

2. **apps/server/src/routes/api/v1/tokens.ts** (+296 lines)
   - Added POST /scenes/:sceneId/tokens endpoint
   - Added PATCH /tokens/:tokenId endpoint

---

## Testing & Verification

1. **TypeScript Compilation**: Verified build succeeds with no errors
   ```bash
   npm run build
   # All packages built successfully
   ```

2. **Database Infrastructure**: Verified PostgreSQL and Redis containers running
   ```bash
   docker ps --filter "name=trading_platform"
   # trading_platform_db: Running
   # trading_platform_redis: Running
   ```

3. **Code Quality**:
   - Follows existing code patterns exactly
   - Uses Drizzle ORM for database operations
   - Includes proper TypeScript types throughout
   - Consistent error handling and logging

---

## Key Decisions

1. **Pattern Consistency**: Followed `handleWallUpdate()` pattern exactly for WebSocket handler
2. **REST Endpoint Patterns**: Followed `actors.ts` route patterns for authentication and validation
3. **Error Handling**: Maintained consistent error messages and HTTP status codes
4. **Owner Assignment**: POST endpoint sets ownerId to `request.user.id` (fixed from initial `request.user.userId`)
5. **Property Updates**: PATCH endpoint conditionally updates only provided fields

---

## Git Commit

**Commit**: `3ffcf78`
**Message**: feat(server): Add token:update WebSocket handler and REST endpoints

Changes:
- Add token:update WebSocket handler for real-time token updates
- Implement POST /api/v1/scenes/:sceneId/tokens endpoint for token creation
- Implement PATCH /api/v1/tokens/:tokenId endpoint for token updates
- Support updating all token properties including actorId for actor-token linking
- Follow existing patterns from wall:update and actor routes
- Broadcast token:updated events to all clients in game room

**Pushed to**: `origin/master`

---

## Current Status

**COMPLETE**: All implementation and deployment tasks finished successfully.

The token system now has complete CRUD operations:
- ✅ CREATE: POST /scenes/:sceneId/tokens + token:add WebSocket
- ✅ READ: GET /scenes/:sceneId/tokens
- ✅ UPDATE: PATCH /tokens/:tokenId + token:update WebSocket
- ✅ DELETE: token:remove WebSocket
- ✅ MOVE: token:move WebSocket (specialized update)

---

## Next Steps

1. Frontend can now implement token editing UI using:
   - `websocket.sendTokenUpdate()` for real-time updates
   - PATCH endpoint for REST-based updates

2. Actor-token linking is now fully supported via actorId property

3. Consider adding:
   - Permission checks (TODO comments in code)
   - Token ownership validation
   - Scene access validation for game participants

---

## Notes

- Application runs directly (not containerized)
- Database/Redis run in Docker containers from trading_platform project
- No Docker deployment needed for VTT application itself
- Frontend WebSocket store methods were already implemented
- Types were already defined in shared package
- Build completed successfully with no TypeScript errors
