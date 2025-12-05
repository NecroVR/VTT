# Session Notes: Schema Rename - Games to Campaigns

**Date**: 2025-12-05
**Session ID**: 0002
**Topic**: Renaming Games to Campaigns in Database Schema Layer

---

## Session Summary

Successfully renamed all "Game/Games" references to "Campaign/Campaigns" in the database schema layer. This included renaming the main table, updating all foreign key references, updating tests, and creating a migration file. All 164 database schema tests are passing.

---

## Problems Addressed

### Initial State
- Database schema used "games" table and "gameId" foreign keys
- This naming was inconsistent with the desired "campaigns" terminology
- Need to rename at the schema layer while maintaining database consistency

---

## Solutions Implemented

### 1. Renamed Main Schema File
**File**: `packages/database/src/schema/games.ts` → `campaigns.ts`
- Renamed table from `games` to `campaigns`
- Renamed export from `games` to `campaigns`

### 2. Updated All Dependent Schema Files
Updated imports and foreign key references in:
- `scenes.ts` - Changed `gameId` to `campaignId`
- `actors.ts` - Changed `gameId` to `campaignId`
- `combats.ts` - Changed `gameId` to `campaignId`
- `chatMessages.ts` - Changed `gameId` to `campaignId`
- `activeEffects.ts` - Changed `gameId` to `campaignId`
- `items.ts` - Changed `gameId` to `campaignId`
- `assets.ts` - Changed `gameId` to `campaignId`
- `compendiums.ts` - Changed `gameId` to `campaignId`, updated comment
- `journals.ts` - Changed `gameId` to `campaignId` in both `folders` and `journals` tables
- `tokens.ts` - Updated import to use `campaigns`

### 3. Updated Schema Index
**File**: `packages/database/src/schema/index.ts`
- Changed export from `./games.js` to `./campaigns.js`

### 4. Updated All Test Files
Renamed and updated:
- `games.test.ts` → `campaigns.test.ts`
  - Updated all references from `games` to `campaigns`
  - Updated table name assertion from 'games' to 'campaigns'
- `actors.test.ts` - Changed `gameId` to `campaignId`, updated column name assertion
- `chatMessages.test.ts` - Changed `gameId` to `campaignId`, updated column name assertion
- `combats.test.ts` - Changed `gameId` to `campaignId`, updated column name assertion
- `items.test.ts` - Changed `gameId` to `campaignId`, updated column name assertion
- `scenes.test.ts` - Changed `gameId` to `campaignId`, updated column name assertion
- `index.test.ts` - Updated schema export test from `games` to `campaigns`
- `src/index.test.ts` - Updated module export test from `games` to `campaigns`

### 5. Created Database Migration
**File**: `packages/database/migrations/rename_games_to_campaigns.sql`

```sql
-- Rename the main table
ALTER TABLE "games" RENAME TO "campaigns";

-- Rename foreign key columns in dependent tables
ALTER TABLE "scenes" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "actors" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "combats" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "chat_messages" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "active_effects" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "items" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "assets" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "compendiums" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "folders" RENAME COLUMN "game_id" TO "campaign_id";
ALTER TABLE "journals" RENAME COLUMN "game_id" TO "campaign_id";
```

---

## Testing Results

### Database Schema Tests
- **Status**: All tests passing
- **Test Count**: 164 tests passed
- **Test Files**: 14 files
- **Duration**: ~1.5 seconds

All schema tests verify:
- Correct table names
- Correct column names (including snake_case database names)
- Correct data types
- Correct constraints (NOT NULL, defaults, etc.)
- Correct foreign key references

---

## Files Created/Modified

### Created
1. `packages/database/src/schema/campaigns.ts` (renamed from games.ts)
2. `packages/database/src/schema/campaigns.test.ts` (renamed from games.test.ts)
3. `packages/database/migrations/rename_games_to_campaigns.sql`

### Modified
1. `packages/database/src/index.test.ts`
2. `packages/database/src/schema/activeEffects.ts`
3. `packages/database/src/schema/actors.test.ts`
4. `packages/database/src/schema/actors.ts`
5. `packages/database/src/schema/assets.ts`
6. `packages/database/src/schema/chatMessages.test.ts`
7. `packages/database/src/schema/chatMessages.ts`
8. `packages/database/src/schema/combats.test.ts`
9. `packages/database/src/schema/combats.ts`
10. `packages/database/src/schema/compendiums.ts`
11. `packages/database/src/schema/index.test.ts`
12. `packages/database/src/schema/index.ts`
13. `packages/database/src/schema/items.test.ts`
14. `packages/database/src/schema/items.ts`
15. `packages/database/src/schema/journals.ts`
16. `packages/database/src/schema/scenes.test.ts`
17. `packages/database/src/schema/scenes.ts`
18. `packages/database/src/schema/tokens.ts`

### Deleted
1. `packages/database/src/schema/games.test.ts`
2. `packages/database/src/schema/games.ts`

---

## Important Naming Conventions Followed

- **TypeScript Properties**: camelCase (`campaignId`)
- **Database Columns**: snake_case (`campaign_id`)
- **Table Names**: snake_case (`campaigns`)
- **File Names**: camelCase (`campaigns.ts`)

---

## Current Status

### Completed
- Database schema layer fully renamed from games to campaigns
- All schema tests passing (164/164)
- Migration file created
- Changes committed and pushed to GitHub

### Known Issues - Next Steps Required

**Docker Build Failure**: The server application code still references `gameId` and needs to be updated to use `campaignId`. This was intentional as the user requested only schema layer changes, but means the application cannot be built until the server code is also updated.

**Files that need updating** (found via grep):
- 33 server files reference `gameId` including:
  - `apps/server/src/routes/api/v1/games.ts` (needs renaming to campaigns.ts)
  - `apps/server/src/routes/api/v1/*.ts` (API route handlers)
  - `apps/server/src/websocket/handlers/*.ts` (WebSocket handlers)
  - All related test files

---

## Next Steps

To complete the full migration from "games" to "campaigns":

1. **Update Server Layer**:
   - Rename `apps/server/src/routes/api/v1/games.ts` to `campaigns.ts`
   - Update all API route handlers to use `campaignId` instead of `gameId`
   - Update all WebSocket handlers to use `campaignId` instead of `gameId`
   - Update all related test files

2. **Run Database Migration**:
   ```bash
   # Apply the migration to rename tables and columns
   psql -U claude -d vtt -f packages/database/migrations/rename_games_to_campaigns.sql
   ```

3. **Update Web Client** (if applicable):
   - Search for any `gameId` references in the web client
   - Update to use `campaignId`

4. **Verify Docker Deployment**:
   - After updating server code, rebuild and deploy with `docker-compose up -d --build`
   - Verify all services start correctly
   - Test basic functionality

---

## Key Learnings

1. **Schema Changes Require Full Stack Updates**: While the schema layer can be updated independently, the application layer must also be updated for the system to build and function.

2. **Naming Consistency**: Maintaining consistent naming between TypeScript (camelCase) and database (snake_case) requires careful attention in both schema definitions and tests.

3. **Drizzle ORM Naming**: Drizzle automatically handles the mapping between camelCase TypeScript properties and snake_case database columns when defined correctly in the schema.

4. **Test Coverage**: Having comprehensive tests at the schema layer (164 tests) provided confidence that the renaming was done correctly.

---

## Git Commit

**Commit**: `ddb7bde`
**Message**: `refactor(database): Rename games to campaigns in schema layer`
**Branch**: `master`
**Status**: Committed and pushed to GitHub

---

**Session End Time**: 2025-12-05 10:31 AM
