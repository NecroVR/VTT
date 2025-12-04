# Session Notes: Real-Time Token Management Implementation

**Date**: 2025-12-04
**Session ID**: 0008
**Focus**: Implement real-time token management via WebSocket

---

## Summary

Successfully implemented a complete real-time token management system for the VTT project. The system allows players to add, move, and remove tokens on a shared game canvas with instant synchronization across all connected players via WebSocket.

---

## Problems Addressed

### Initial State
- WebSocket handlers existed for token messages but didn't persist to database
- No visual token rendering on frontend
- Token types were incomplete in shared package
- No interactive canvas for token manipulation

### Requirements
1. Server-side token persistence with database operations
2. REST API endpoints for initial token loading
3. Real-time WebSocket broadcasting for token operations
4. Frontend token store for state management
5. Interactive canvas component with drag-and-drop
6. Complete game page integration

---

## Solutions Implemented

### 1. Shared Types Enhancement

**File**: `packages/shared/src/types/game.ts`, `packages/shared/src/types/websocket.ts`

- Updated `Token` interface with complete database schema:
  - Added `data: Record<string, unknown>` for custom token properties
  - Added `createdAt: string` timestamp
  - Changed optional fields to nullable (`imageUrl`, `ownerId`)

- Added comprehensive WebSocket payload types:
  - `TokenAddPayload` - Client sends token data (no ID)
  - `TokenAddedPayload` - Server responds with full token (with ID)
  - `TokenUpdatePayload` - Partial token updates
  - `TokenUpdatedPayload` - Server confirms update
  - `TokenRemovedPayload` - Confirms token deletion

- Added new message types: `token:added`, `token:updated`, `token:removed`

### 2. Server-Side Token Persistence

**File**: `apps/server/src/websocket/handlers/game.ts`

Implemented database operations in WebSocket handlers:

**Token Add**:
```typescript
- Receives TokenAddPayload from client
- Inserts token into database with generated UUID
- Broadcasts TokenAddedPayload with full token to all players in room
```

**Token Move**:
```typescript
- Receives TokenMovePayload with tokenId, x, y
- Updates token position in database
- Broadcasts move to all players for real-time sync
```

**Token Remove**:
```typescript
- Receives TokenRemovePayload with tokenId
- Deletes token from database
- Broadcasts TokenRemovedPayload to all players
```

Key implementation details:
- Made handlers async to support database operations
- Added proper error handling with database validation
- Broadcast to entire room including sender for confirmation
- Auto-generated token IDs on server side

### 3. REST API Endpoints

**File**: `apps/server/src/routes/api/v1/tokens.ts` (NEW)

Created two endpoints:

**GET /api/v1/games/:gameId/tokens**:
- Fetches all tokens for a game
- Used for initial load when joining game
- Returns array of Token objects

**GET /api/v1/games/:gameId/tokens/:tokenId**:
- Fetches single token by ID
- Available for future features (token details, etc.)

Both endpoints:
- Require authentication
- Verify game exists
- Return properly formatted Token objects with ISO timestamp

### 4. Frontend Token Store

**File**: `apps/web/src/lib/stores/tokens.ts` (NEW)

Created Svelte store for token state management:

**State**:
- `tokens: Map<string, Token>` - Efficient token lookup by ID
- `selectedTokenId: string | null` - Currently selected token
- `loading: boolean` - Loading state indicator
- `error: string | null` - Error message display

**Methods**:
- `loadTokens(gameId)` - Fetch tokens from REST API
- `addToken(token)` - Add token to local state
- `moveToken(tokenId, x, y)` - Update token position locally
- `updateToken(tokenId, updates)` - Partial token updates
- `removeToken(tokenId)` - Remove token from state
- `selectToken(tokenId)` - Select/deselect tokens
- `clear()` - Reset store (on game leave)

### 5. GameCanvas Component

**File**: `apps/web/src/lib/components/GameCanvas.svelte` (NEW)

Created interactive HTML5 canvas component:

**Features**:
- Grid rendering (configurable size, toggle visibility)
- Token rendering with colored rectangles
- Token name labels
- Selection highlighting (yellow border)
- Visibility indicators for hidden tokens
- Drag-and-drop token movement
- Click-to-select functionality
- Snap-to-grid positioning

**Props**:
- `tokens` - Map of tokens to render
- `selectedTokenId` - Currently selected token
- `onTokenClick` - Click handler callback
- `onTokenMove` - Move complete callback
- `gridSize` - Grid cell size in pixels (default: 50)
- `showGrid` - Toggle grid visibility

**Interaction Flow**:
1. User clicks token → `onTokenClick` fires with tokenId
2. User drags token → Position updates in real-time
3. User releases → `onTokenMove` fires with final grid position
4. Component auto-resizes to container dimensions

### 6. WebSocket Store Enhancement

**File**: `apps/web/src/lib/stores/websocket.ts`

Added token-specific methods:

**Send Methods**:
- `sendTokenAdd(payload)` - Create new token
- `sendTokenMove(payload)` - Move token
- `sendTokenUpdate(payload)` - Update token properties
- `sendTokenRemove(payload)` - Delete token

**Event Handlers**:
- `onTokenAdded(handler)` - Listen for new tokens
- `onTokenMove(handler)` - Listen for token movements
- `onTokenUpdated(handler)` - Listen for token updates
- `onTokenRemoved(handler)` - Listen for token deletions

### 7. Game Page Integration

**File**: `apps/web/src/routes/games/[id]/+page.svelte`

Integrated complete token management UI:

**On Mount**:
1. Load tokens from REST API
2. Connect to WebSocket
3. Join game room
4. Setup token event listeners

**Token Controls**:
- "Add Token" button with form (name, x, y position)
- "Delete Token" button (when token selected)
- Selected token indicator
- Loading/error state display

**Add Token Form**:
- Token name input (required)
- X/Y position inputs (number)
- Create/Cancel buttons
- Form validation

**Canvas Integration**:
- Renders GameCanvas component
- Handles token click selection
- Sends WebSocket move events
- Syncs with token store state

**Event Flow**:
```
User adds token → sendTokenAdd → Server saves → Broadcast token:added → All clients add to store
User moves token → sendTokenMove → Server updates → Broadcast token:move → All clients update position
User deletes token → sendTokenRemove → Server deletes → Broadcast token:removed → All clients remove
```

---

## Files Created

1. `apps/server/src/routes/api/v1/tokens.ts` - Token REST API endpoints
2. `apps/web/src/lib/stores/tokens.ts` - Token state management store
3. `apps/web/src/lib/components/GameCanvas.svelte` - Interactive canvas component

---

## Files Modified

1. `packages/shared/src/types/game.ts` - Updated Token interface
2. `packages/shared/src/types/websocket.ts` - Added token payload types
3. `apps/server/src/websocket/handlers/game.ts` - Database persistence
4. `apps/server/src/routes/api/v1/index.ts` - Registered tokens route
5. `apps/web/src/lib/stores/websocket.ts` - Added token methods
6. `apps/web/src/routes/games/[id]/+page.svelte` - Token UI integration

---

## WebSocket Message Flow

### Add Token
```
Client → token:add → Server
  ↓ Insert to DB
Server → token:added → All Clients
  ↓ Add to local store
UI updates automatically
```

### Move Token
```
Client → token:move → Server
  ↓ Update DB position
Server → token:move → All Clients
  ↓ Update local position
Canvas re-renders
```

### Remove Token
```
Client → token:remove → Server
  ↓ Delete from DB
Server → token:removed → All Clients
  ↓ Remove from local store
Token disappears from canvas
```

---

## Token Interface Structure

```typescript
interface Token {
  id: string;              // UUID generated by server
  gameId: string;          // Parent game reference
  name: string;            // Display name
  imageUrl: string | null; // Optional image URL
  x: number;               // Grid X position
  y: number;               // Grid Y position
  width: number;           // Size in grid cells (default: 1)
  height: number;          // Size in grid cells (default: 1)
  ownerId: string | null;  // Creator user ID
  visible: boolean;        // Visibility toggle
  data: Record<string, unknown>; // Custom properties
  createdAt: string;       // ISO timestamp
}
```

---

## Testing Results

### Build Status
- All packages built successfully
- No TypeScript errors
- No linting issues
- Bundle size: ~146KB server, ~33KB client chunks

### Type Safety
- Resolved duplicate Token interface conflict
- Proper type imports across packages
- Full IntelliSense support

### Code Quality
- Async/await properly implemented
- Error handling in all database operations
- Proper WebSocket event cleanup on unmount
- Canvas resizing and responsive design

---

## Current Status

### Completed
- Server-side token persistence with database
- REST API for token fetching
- WebSocket handlers for real-time sync
- Frontend token store
- Interactive GameCanvas component
- Complete game page integration
- All builds passing

### Ready for Testing
The token management system is fully implemented and ready for:
1. Manual testing with multiple connected clients
2. Testing token creation, movement, deletion
3. Verifying real-time synchronization
4. Testing canvas interaction and drag-drop
5. Edge case testing (disconnects, errors, etc.)

### Not Implemented (Future Enhancements)
- Image loading for tokens (currently shows colored rectangles)
- Token rotation
- Multiple token selection
- Token layers/z-index
- Token ownership permissions
- Undo/redo functionality
- Token copy/paste

---

## Known Issues

### Minor
1. **Canvas self-closing tag warning** - Svelte warns about `<canvas />`, should use `<canvas></canvas>`. This is a warning only and doesn't affect functionality.
2. **No Docker setup** - Project doesn't have docker-compose.yml yet, so Docker deployment step was skipped.

### To Be Tested
1. Multi-user token interaction conflicts
2. Network latency effects on drag-and-drop
3. Large numbers of tokens (performance)
4. WebSocket reconnection token state sync

---

## Architecture Decisions

### Why Map Instead of Array for Tokens?
- O(1) lookup by ID instead of O(n)
- Efficient updates and deletions
- Natural key-value structure for entities

### Why Canvas Instead of SVG?
- Better performance for many tokens
- More control over rendering
- Easier to implement custom interactions

### Why REST + WebSocket Hybrid?
- REST for initial load (reliable, cacheable)
- WebSocket for real-time updates (fast, bidirectional)
- Best of both worlds

### Why Grid-Based Positioning?
- Matches tabletop RPG conventions
- Simplifies collision detection
- Makes alignment natural
- Easy to snap to grid

---

## Next Steps

### Immediate
1. Manual testing with multiple browser windows
2. Verify database persistence across sessions
3. Test WebSocket reconnection scenarios

### Future Features
1. Token image upload/URLs
2. Token attributes panel (HP, AC, etc.)
3. Token ownership and permissions
4. Fog of war system
5. Map/background layer
6. Measurement tools
7. Drawing tools
8. Token animations

---

## Commit

**Commit Hash**: 9f6c430
**Message**: feat(tokens): Implement real-time token management via WebSocket

**Files Changed**: 9 files, 1016 insertions(+), 49 deletions(-)

---

## Session Learnings

1. **Type conflicts** - Having Token defined in multiple files caused build errors. Consolidated to single source of truth.
2. **Async handlers** - WebSocket message handlers need to be async when doing database operations.
3. **Broadcast pattern** - Broadcasting to entire room including sender provides confirmation feedback.
4. **State synchronization** - Combining REST for initial load with WebSocket for updates is effective pattern.
5. **Canvas events** - Proper mouse event handling requires tracking drag state carefully.

---

**Session completed successfully at 2025-12-04 08:25 AM**
