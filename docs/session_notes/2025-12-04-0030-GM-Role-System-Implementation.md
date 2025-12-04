# GM Role System Implementation

**Date**: 2025-12-04
**Session ID**: 0030
**Status**: Complete

## Overview

Implemented a comprehensive GM role system for the VTT application where game owners are automatically GMs and can delegate GM privileges to other players.

## Problems Addressed

### Initial State
- `isGM` was hardcoded to `false` in the game page
- No mechanism to track which users have GM privileges
- No way for game owners to delegate GM responsibilities

### Requirements
1. Game owner (creator) should automatically be GM
2. Owner should be able to assign GM role to other players
3. Owner should be able to remove GM role from players
4. Frontend should properly detect and display GM status

## Solutions Implemented

### 1. Database Schema Changes

**File**: `packages/database/src/schema/games.ts`

- Added `gmUserIds` field to games table
  - Type: `text[]` (PostgreSQL array)
  - Default: empty array `[]`
  - Stores user IDs who have been granted GM role
  - Owner is NOT in this list (they're always GM via `ownerId` check)

**Migration**: Applied schema change using `drizzle-kit push`

### 2. Shared Type Updates

**Files Modified**:
- `packages/shared/src/types/game.ts`
- `packages/shared/src/index.test.ts`
- `packages/shared/src/types/game.test.ts`

**Changes**:
- Added `gmUserIds: string[]` to `Game` interface
- Added new types for GM management:
  - `AddGMRequest` - Request to add a GM
  - `RemoveGMRequest` - Request to remove a GM
  - `GMsListResponse` - Response listing GM user IDs
- Updated all test fixtures to include `gmUserIds` field
- All 390 shared package tests passing

### 3. API Endpoints

**File**: `apps/server/src/routes/api/v1/games.ts`

#### Updated Existing Endpoints
- All game CRUD endpoints now include `gmUserIds` in responses
- `GET /api/v1/games` - Lists games with gmUserIds
- `GET /api/v1/games/:id` - Single game with gmUserIds
- `POST /api/v1/games` - Creates game with empty gmUserIds array
- `PATCH /api/v1/games/:id` - Updates game, preserves gmUserIds
- `DELETE /api/v1/games/:id` - Deletes game

#### New GM Management Endpoints

**POST /api/v1/games/:id/gms**
- Adds a user as GM for the game
- Only game owner can add GMs
- Validates user exists
- Prevents adding owner to list
- Prevents duplicate GM assignments
- Returns updated gmUserIds array

**DELETE /api/v1/games/:id/gms/:userId**
- Removes a user's GM role
- Only game owner can remove GMs
- Prevents removing owner
- Returns updated gmUserIds array

**GET /api/v1/games/:id/gms**
- Lists all GM user IDs for a game
- Accessible to owner and current GMs
- Returns gmUserIds array

### 4. Frontend Integration

**File**: `apps/web/src/routes/game/[id]/+page.svelte`

**Changes**:
- Import `gamesStore` for fetching game data
- Fetch game data on mount: `await gamesStore.fetchGame(gameId)`
- Subscribe to current game and user: `$gamesStore.currentGame`, `$authStore.user`
- Calculate `isGM` reactively:
  ```typescript
  $: isGM = currentGame && currentUser
    ? currentGame.ownerId === currentUser.id ||
      (currentGame.gmUserIds || []).includes(currentUser.id)
    : false;
  ```
- Clean up game store on component unmount: `gamesStore.clearCurrentGame()`

**GM Detection Logic**:
- User is GM if they are the **owner** OR in the **gmUserIds list**
- Reactive - updates automatically when game data changes

## Files Created/Modified

### Created
- `docs/session_notes/2025-12-04-0030-GM-Role-System-Implementation.md`

### Modified
1. **Database**:
   - `packages/database/src/schema/games.ts` - Added gmUserIds field

2. **Shared Types**:
   - `packages/shared/src/types/game.ts` - Added gmUserIds to Game interface, added GM management types
   - `packages/shared/src/index.test.ts` - Updated Game test fixture
   - `packages/shared/src/types/game.test.ts` - Updated all Game instances in tests

3. **API**:
   - `apps/server/src/routes/api/v1/games.ts` - Updated all endpoints, added 3 new GM management endpoints

4. **Frontend**:
   - `apps/web/src/routes/game/[id]/+page.svelte` - Fetch game, calculate isGM reactively

## Testing Results

### Unit Tests
- **Shared Package**: All 390 tests passing
- **Database Package**: All 153 tests passing
- **Total**: 543 tests passing

### Build Verification
- Database package builds successfully
- Shared package builds successfully
- Server package builds successfully
- Web package builds successfully

### Git Integration
- All changes committed successfully
- Pre-commit hooks passed
- Pushed to GitHub: commit `f626f20`

## Current Status

### Complete
- Database schema with gmUserIds field
- API endpoints for GM management
- Frontend isGM detection based on owner + gmUserIds
- All tests passing
- Code committed and pushed

### Not Implemented (Future Work)
- **GM Management UI**: No UI component for owners to add/remove GMs
  - Reason: Requires player/user listing functionality not yet in the system
  - User can add GM management UI later when player management exists
  - API endpoints are ready and can be used via direct API calls

## API Usage Examples

### Add a user as GM
```bash
POST /api/v1/games/{gameId}/gms
Authorization: Bearer {sessionToken}
Content-Type: application/json

{
  "userId": "uuid-of-user-to-make-gm"
}
```

### Remove GM role
```bash
DELETE /api/v1/games/{gameId}/gms/{userId}
Authorization: Bearer {sessionToken}
```

### List GMs
```bash
GET /api/v1/games/{gameId}/gms
Authorization: Bearer {sessionToken}
```

## How It Works

### GM Status Determination
1. **Owner Check**: `game.ownerId === currentUser.id`
2. **GM List Check**: `game.gmUserIds.includes(currentUser.id)`
3. **Result**: isGM = owner OR in GM list

### Design Decisions

**Why use an array instead of a junction table?**
- Simpler implementation for this use case
- Fewer database queries needed
- PostgreSQL array operations are efficient
- Easy to serialize in JSON responses
- Owner is never in the array (they're always GM)

**Why not store owner in gmUserIds?**
- Redundant with ownerId field
- Owner is always GM, no need to track separately
- Cleaner separation of ownership vs delegated GM role

## Next Steps

To add GM management UI:
1. Create a player/user listing system
2. Add a GM management component showing current GMs
3. Add buttons for owner to promote/demote players
4. Call the GM management API endpoints from the UI

## Key Learnings

1. PostgreSQL array columns work well for simple many-to-many relationships
2. Reactive Svelte statements make GM status calculation clean and automatic
3. Drizzle ORM's `push` command is useful for applying schema changes quickly
4. Separating owner from GM list simplifies the logic
