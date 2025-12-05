# Session Notes: Shared Types Game to Campaign Rename

**Date**: 2025-12-05
**Session ID**: 0002
**Topic**: Rename Game/Games to Campaign/Campaigns in Shared Types Package

---

## Session Summary

Successfully renamed all "Game/Games" references to "Campaign/Campaigns" in the shared types package (`packages/shared`). This includes renaming interfaces, properties, and updating all related test files and WebSocket message types.

---

## Changes Implemented

### 1. File Renames

- `packages/shared/src/types/game.ts` → `campaign.ts`
- `packages/shared/src/types/game.test.ts` → `campaign.test.ts`

### 2. Interface Renames in campaign.ts

- `Game` → `Campaign`
- `GameSettings` → `CampaignSettings`
- `GameResponse` → `CampaignResponse`
- `GamesListResponse` → `CampaignsListResponse`
- `CreateGameRequest` → `CreateCampaignRequest`
- `UpdateGameRequest` → `UpdateCampaignRequest`
- `MapLayer.gameId` → `MapLayer.campaignId`

### 3. WebSocket Type Updates in websocket.ts

#### Payload Interface Renames:
- `GameJoinPayload` → `CampaignJoinPayload`
- `GameLeavePayload` → `CampaignLeavePayload`
- `GamePlayersPayload` → `CampaignPlayersPayload`
- `GamePlayerJoinedPayload` → `CampaignPlayerJoinedPayload`
- `GamePlayerLeftPayload` → `CampaignPlayerLeftPayload`

#### Property Renames (gameId → campaignId):
Updated all interfaces that had `gameId` properties:
- Actor payloads: `ActorCreatePayload`, `ActorCreatedPayload`, `ActorUpdatedPayload`
- Combat payloads: `CombatStartPayload`, `CombatStartedPayload`, `CombatUpdatedPayload`, `CombatTurnChangedPayload`
- Effect payloads: `EffectAddPayload`
- Journal payloads: `JournalCreatePayload`, `JournalCreatedPayload`, `JournalUpdatedPayload`, `JournalShownPayload`
- Folder payloads: `FolderCreatePayload`, `FolderCreatedPayload`, `FolderUpdatedPayload`

#### WSMessageType Updates:
- `'game:join'` → `'campaign:join'`
- `'game:leave'` → `'campaign:leave'`
- `'game:state'` → `'campaign:state'`
- `'game:players'` → `'campaign:players'`
- `'game:player-joined'` → `'campaign:player-joined'`
- `'game:player-left'` → `'campaign:player-left'`

### 4. Test File Updates

- Updated `packages/shared/src/index.test.ts` to test `Campaign` type instead of `Game`
- Updated `packages/shared/src/types/websocket.test.ts`:
  - Changed imports to use new Campaign payload types
  - Updated describe blocks from "Game Room Payloads" to "Campaign Room Payloads"
  - Updated all test cases to use `campaignId` instead of `gameId`
  - Updated message type validations to use `campaign:` prefix

### 5. Export Updates

- `packages/shared/src/types/index.ts`: Changed export from `'./game.js'` to `'./campaign.js'`

---

## Testing Results

### Unit Tests
- **Status**: All passing ✓
- **Test Count**: 390 tests passed
- **Duration**: ~1.2 seconds
- **Coverage**: All renamed types properly tested in `campaign.test.ts`

### Build
- **Status**: Successful ✓
- **Package**: `@vtt/shared`
- **TypeScript Compilation**: No errors

---

## Files Modified

### Shared Package
1. `packages/shared/src/types/campaign.ts` (created, renamed from game.ts)
2. `packages/shared/src/types/campaign.test.ts` (created, renamed from game.test.ts)
3. `packages/shared/src/types/index.ts` (modified)
4. `packages/shared/src/types/websocket.ts` (modified)
5. `packages/shared/src/types/websocket.test.ts` (modified)
6. `packages/shared/src/index.test.ts` (modified)

### Deleted Files
1. `packages/shared/src/types/game.ts`
2. `packages/shared/src/types/game.test.ts`

---

## Git Commit

**Commit Hash**: `deadb3b`
**Message**: `refactor(shared): Rename Game/Games to Campaign/Campaigns`

**Commit Details**:
- 6 files changed
- 135 insertions(+)
- 135 deletions(-)
- Successfully pushed to GitHub

---

## Current Status

### Completed
- ✓ Renamed all Game/Games references to Campaign/Campaigns in shared types package
- ✓ Updated all WebSocket message types and payloads
- ✓ Updated all test files with new terminology
- ✓ All tests passing (390 tests)
- ✓ Build successful
- ✓ Changes committed and pushed to GitHub

### Known Issues

The database and server packages still reference the old `gameId` and `games` naming:
- Database schema files need to be updated (campaigns.ts exists but not all references updated)
- Server API routes and WebSocket handlers need to be updated
- Docker build currently fails due to these inconsistencies

These issues are expected as the task scope was limited to the shared types package only.

---

## Next Steps

To complete the full Game → Campaign rename across the entire codebase, the following additional work is needed:

1. **Database Package** (`packages/database`):
   - Complete the rename of `games.ts` to `campaigns.ts` (already partially done)
   - Update all database queries and schema references
   - Update all test files in the database package
   - Ensure database migrations are created/updated

2. **Server Package** (`apps/server`):
   - Update API routes (e.g., `apps/server/src/routes/api/v1/actors.ts`)
   - Update WebSocket handlers (e.g., `apps/server/src/websocket/handlers/*.ts`)
   - Update all references from `gameId` to `campaignId`
   - Update imports from `games` to `campaigns`

3. **Web Package** (`apps/web`):
   - Update all frontend components and stores
   - Update API client calls
   - Update WebSocket message handling
   - Update UI text and labels

4. **Database Migrations**:
   - Create SQL migration to rename `games` table to `campaigns`
   - Rename `game_id` columns to `campaign_id` across all related tables
   - Update foreign key constraints

5. **Integration Testing**:
   - Run full test suite after all changes
   - Verify Docker build succeeds
   - Test end-to-end functionality

---

## Key Learnings

1. **Scope Management**: Starting with the shared types package was a good approach, as it establishes the type system that the rest of the codebase depends on.

2. **Test-Driven Refactoring**: Having comprehensive tests for the types allowed us to verify all changes were correct before moving forward.

3. **Incremental Approach**: Attempting to rename everything at once would have been error-prone. This phased approach is more manageable.

4. **Breaking Changes**: This type of rename is a breaking change that requires coordinated updates across all packages. The current state (shared types updated, but database and server not updated) means the system won't build until the other packages are updated.

---

## Session Metadata

- **Token Usage**: ~69,000 / 200,000 tokens
- **Duration**: ~10 minutes
- **Approach**: Direct implementation (no agent delegation due to environment constraints)
- **Outcome**: Successfully completed shared types package refactoring

---
