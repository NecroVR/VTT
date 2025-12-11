# Window WebSocket Handlers Implementation

**Date**: 2025-12-10
**Session ID**: 0046
**Focus**: Add WebSocket handlers for window real-time updates

## Summary

Created WebSocket handlers for window objects to enable real-time synchronization across connected clients when windows are created, updated, or deleted. Followed the existing pattern used for walls to maintain consistency with the codebase.

## Work Completed

### 1. Added Window WebSocket Message Types

**File Modified**: `packages/shared/src/types/websocket.ts`

- Added `Window` type import from `./window.js`
- Added window message types to `WSMessageType`:
  - `'window:add'` | `'window:added'`
  - `'window:update'` | `'window:updated'`
  - `'window:remove'` | `'window:removed'`
- Created window payload interfaces (placed between wall and light payloads for consistency):
  - `WindowAddPayload` - Request payload for creating a window
  - `WindowAddedPayload` - Broadcast payload with full window data
  - `WindowUpdatePayload` - Request payload for updating a window
  - `WindowUpdatedPayload` - Broadcast payload with updated window data
  - `WindowRemovePayload` - Request payload for deleting a window
  - `WindowRemovedPayload` - Broadcast payload with deleted window ID

### 2. Created Window WebSocket Handlers

**File Created**: `apps/server/src/websocket/handlers/windows.ts`

Implemented three handler functions following the wall pattern:

- **`handleWindowAdd`**:
  - Validates campaign room membership
  - Inserts window into database
  - Broadcasts `window:added` message to all clients in the campaign
  - Includes default values for optional fields (wallShape, opacity, tint, etc.)

- **`handleWindowUpdate`**:
  - Validates campaign room membership
  - Updates window in database
  - Broadcasts `window:updated` message with full window data
  - Returns error if window not found

- **`handleWindowRemove`**:
  - Validates campaign room membership
  - Deletes window from database
  - Broadcasts `window:removed` message with window ID
  - Returns error if window not found

Each handler includes proper error handling and logging.

### 3. Registered Window Handlers in Campaign WebSocket

**File Modified**: `apps/server/src/websocket/handlers/campaign.ts`

- Added window payload type imports (6 types)
- Added `Window` type import
- Added `windows` table import from database
- Imported window handler functions from `./windows.js`
- Added three case statements in the message switch:
  - `case 'window:add'` - calls `handleWindowAdd`
  - `case 'window:update'` - calls `handleWindowUpdate`
  - `case 'window:remove'` - calls `handleWindowRemove`

### 4. Fixed Type Inconsistencies

**File Modified**: `packages/shared/src/types/window.ts`

- Ensured Window interface matches database schema (no `updatedAt` field)
- Kept consistent with Wall interface which also lacks `updatedAt`

**File Modified**: `apps/server/src/routes/api/v1/windows.ts`

- Removed all `updatedAt` field references (4 occurrences)
- Fixed TypeScript compilation errors

### 5. Build and Deployment

- Successfully compiled all TypeScript packages
- Deployed to Docker with `docker-compose up -d --build`
- Verified containers are running correctly
- Confirmed WebSocket handlers registered at `/ws`

## Files Created/Modified

### Created
- `apps/server/src/websocket/handlers/windows.ts` - Window WebSocket handler implementations

### Modified
- `packages/shared/src/types/websocket.ts` - Added window message types and payloads
- `apps/server/src/websocket/handlers/campaign.ts` - Registered window handlers
- `packages/shared/src/types/window.ts` - Ensured type consistency
- `apps/server/src/routes/api/v1/windows.ts` - Removed invalid updatedAt references

## WebSocket Message Patterns

### Window Add
**Client → Server** (`window:add`):
```typescript
{
  type: 'window:add',
  payload: {
    sceneId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    wallShape?: 'straight' | 'curved';
    controlPoints?: Array<{ x: number; y: number }>;
    opacity?: number;
    tint?: string;
    tintIntensity?: number;
    snapToGrid?: boolean;
    data?: Record<string, unknown>;
  }
}
```

**Server → All Clients** (`window:added`):
```typescript
{
  type: 'window:added',
  payload: {
    window: {
      id: string;
      sceneId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      wallShape: 'straight' | 'curved';
      controlPoints: Array<{ x: number; y: number }>;
      opacity: number;
      tint: string;
      tintIntensity: number;
      snapToGrid: boolean;
      data: Record<string, unknown>;
      createdAt: Date;
    }
  }
}
```

### Window Update
**Client → Server** (`window:update`):
```typescript
{
  type: 'window:update',
  payload: {
    windowId: string;
    updates: Partial<Omit<Window, 'id' | 'sceneId' | 'createdAt'>>;
  }
}
```

**Server → All Clients** (`window:updated`):
```typescript
{
  type: 'window:updated',
  payload: {
    window: Window; // Full window object
  }
}
```

### Window Remove
**Client → Server** (`window:remove`):
```typescript
{
  type: 'window:remove',
  payload: {
    windowId: string;
  }
}
```

**Server → All Clients** (`window:removed`):
```typescript
{
  type: 'window:removed',
  payload: {
    windowId: string;
  }
}
```

## Technical Details

### Room-Based Broadcasting
- All window operations check campaign room membership
- Messages broadcast to all clients in the same campaign
- Uses `roomManager.broadcast()` for efficient distribution

### Database Integration
- Uses `windows` table from `@vtt/database`
- All operations use Drizzle ORM
- Cascade deletes when parent scene is deleted

### Error Handling
- Validates campaign room membership before operations
- Returns error messages for not found/unauthorized operations
- Logs errors with context for debugging

## Current Status

All tasks completed successfully:
- Window WebSocket message types added
- Window handlers implemented
- Handlers registered in campaign WebSocket
- Type inconsistencies fixed
- Build successful
- Docker deployment verified

## Next Steps

The window WebSocket handlers are now ready for frontend integration. The frontend can:
1. Send `window:add` messages to create windows
2. Send `window:update` messages to modify windows
3. Send `window:remove` messages to delete windows
4. Listen for `window:added`, `window:updated`, `window:removed` to update UI in real-time

All changes follow established patterns and maintain consistency with existing wall/light/token handlers.
